import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import sanitizeHtml from 'sanitize-html';
import crypto from 'node:crypto';
import { pool, query } from '../db.js';
import { config } from '../config.js';
import { getPassByToken, issuePassesForOrder, orderToken, passPdf, passToken, qrSvg, queuePassEmail, sha256, verifyOrderToken } from '../passService.js';

export const publicRouter = Router();

export async function getPublishedPage(path) {
  const pages = await query('SELECT id, path, title, seo_title, seo_description, canonical_url FROM pages WHERE path = ? AND is_published = 1 LIMIT 1', [path]);
  if (!pages[0]) return null;
  const sections = await query('SELECT id, type, kicker, heading, body, body_html, settings FROM page_sections WHERE page_id = ? AND is_published = 1 ORDER BY sort_order, id', [pages[0].id]);
  for (const section of sections) {
    section.body_html = section.body_html ? sanitizeHtml(section.body_html, { allowedTags: ['p','h2','h3','h4','ul','ol','li','strong','em','a','br'], allowedAttributes: { a: ['href','target','rel'] }, allowedSchemes: ['http','https','mailto','tel'] }) : null;
    section.settings = parseJson(section.settings, {});
    section.items = await query('SELECT id, number, title, subtitle, value, price, old_price, image_url, image_alt, url FROM section_items WHERE section_id = ? AND is_published = 1 ORDER BY sort_order, id', [section.id]);
  }
  return { ...pages[0], sections };
}

export async function getPublishedArticle(slug) {
  const rows = await query("SELECT id,slug,title,excerpt,body_html,featured_image_url,seo_title,seo_description,publish_at AS published_at FROM articles WHERE slug=? AND status='published' AND (publish_at IS NULL OR publish_at<=NOW()) LIMIT 1", [slug]);
  if (!rows[0]) return null;
  rows[0].body_html = sanitizeHtml(rows[0].body_html, { allowedTags: ['p','h2','h3','h4','ul','ol','li','strong','em','a','blockquote','br'], allowedAttributes: { a:['href','target','rel'] }, allowedSchemes:['http','https','mailto','tel'] });
  return rows[0];
}

function parseJson(value, fallback) { try { return typeof value === 'string' ? JSON.parse(value) : (value || fallback); } catch { return fallback; } }

publicRouter.get('/page', async (req, res, next) => {
  try {
    const page = await getPublishedPage(String(req.query.path || '/'));
    if (!page) return res.status(404).json({ error: 'Page not found' });
    res.json(page);
  } catch (error) { next(error); }
});

publicRouter.get('/products', async (req, res, next) => {
  try {
    const forum = String(req.query.forum || ''),code=clean(req.query.code,100),complimentary=String(req.query.complimentary||'');
    const params = []; let where = 'is_active = 1 AND sale_price_paise > 0';
    if(code){where='is_active=1 AND code=?';params.push(code)}
    if (['india','south','awards'].includes(forum)) {
      where += ' AND forum = ?'; params.push(forum);
    }
    const rows = await query(`SELECT code,kind,forum,name,description,regular_price_paise,sale_price_paise,currency,tax_rate,member_count,complimentary_token_hash,redemption_limit,redemption_count,expires_at FROM commerce_products WHERE ${where} ORDER BY forum,sort_order,id`, params);
    const visible=rows.filter(row=>Number(row.sale_price_paise)>0||(complimentary&&row.complimentary_token_hash===sha256(complimentary)&&(!row.expires_at||new Date(row.expires_at)>new Date())&&(row.redemption_limit===null||row.redemption_count<row.redemption_limit))).map(({complimentary_token_hash,redemption_limit,redemption_count,expires_at,...row})=>row);
    res.json(visible);
  } catch (error) { next(error); }
});

const checkoutLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 12, standardHeaders: true, legacyHeaders: false });
const clean = (value,max=255) => String(value||'').trim().slice(0,max);
const validEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
async function createRazorpayOrder(order){
  if(!config.razorpay.keyId||!config.razorpay.keySecret)return null;
  const auth=Buffer.from(`${config.razorpay.keyId}:${config.razorpay.keySecret}`).toString('base64');
  const response=await fetch('https://api.razorpay.com/v1/orders',{method:'POST',headers:{Authorization:`Basic ${auth}`,'Content-Type':'application/json'},body:JSON.stringify({amount:order.total,currency:order.currency,receipt:order.publicId,notes:{registration_id:order.publicId}})});
  if(!response.ok)throw new Error('Payment provider could not create the order'); return response.json();
}
async function fetchRazorpayPayment(paymentId){const auth=Buffer.from(`${config.razorpay.keyId}:${config.razorpay.keySecret}`).toString('base64');const response=await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`,{headers:{Authorization:`Basic ${auth}`}});if(!response.ok)throw new Error('Unable to verify payment with Razorpay');return response.json()}
async function finalizePaidOrder(order,payment){
  if(payment.order_id!==order.provider_order_id||Number(payment.amount)!==Number(order.total_paise)||payment.currency!==order.currency)throw new Error('Payment details do not match the registration');
  if(payment.status!=='captured')throw Object.assign(new Error('Payment has not been captured yet'),{status:409});
  await query("UPDATE commerce_orders SET status='paid',provider_payment_id=?,paid_at=COALESCE(paid_at,NOW()) WHERE id=?",[payment.id,order.id]);
  if(order.award_application_id)await query("UPDATE award_applications SET status='paid' WHERE id=?",[order.award_application_id]);
  await issuePassesForOrder(order.id);await queuePassEmail(order.id);
}
async function addAttendees(executor,orderId,attendees,limit){
  const list=Array.isArray(attendees)?attendees.slice(0,limit):[];
  for(let index=0;index<list.length;index++){
    const attendee=list[index],name=clean(attendee.full_name,255),email=clean(attendee.email,255).toLowerCase(),phone=clean(attendee.phone,40);
    if(!name||!validEmail(email)||!phone)throw Object.assign(new Error(`Complete attendee ${index+1} details`),{status:422});
    await executor.execute('INSERT INTO order_attendees (order_id,attendee_number,full_name,email,phone) VALUES (?,?,?,?,?)',[orderId,index+1,name,email,phone]);
  }
}

function checkoutPayload(order,product,gateway=null){const token=orderToken(order.public_id);return {orderId:order.public_id,status:Number(order.total_paise)===0?'confirmed':gateway?'payment_created':order.status,paymentRequired:Number(order.total_paise)>0,manageUrl:`/registration/?token=${encodeURIComponent(token)}`,gateway:gateway?{keyId:config.razorpay.keyId,orderId:gateway.id,amount:Number(order.total_paise),currency:order.currency,name:product.name,prefill:{name:order.customer_name,email:order.email,contact:order.phone}}:null,message:Number(order.total_paise)===0?'Your complimentary registration is confirmed.':'Complete the secure payment to issue your passes.'}}

publicRouter.post('/checkout', checkoutLimiter, async (req,res,next)=>{
  const connection=await pool.getConnection();
  try{
    const code=clean(req.body.product_code,100),quantity=Math.min(20,Math.max(1,Number(req.body.quantity)||1)),idempotencyValue=clean(req.body.idempotency_key,120);
    if(idempotencyValue.length<16)return res.status(422).json({error:'Checkout session is invalid. Refresh and try again.'});const idempotencyHash=sha256(idempotencyValue);
    const existing=(await query('SELECT o.*,p.name FROM commerce_orders o JOIN commerce_products p ON p.id=o.product_id WHERE o.idempotency_key=? LIMIT 1',[idempotencyHash]))[0];
    if(existing){const gateway=existing.provider_order_id?{id:existing.provider_order_id}:null;return res.json(checkoutPayload(existing,{name:existing.name},gateway))}
    const customerName=clean(req.body.customer_name),company=clean(req.body.company),email=clean(req.body.email).toLowerCase(),phone=clean(req.body.phone,40),address=clean(req.body.billing_address,2000);
    if(!customerName||!company||!validEmail(email)||!phone||!address||!req.body.consent)return res.status(422).json({error:'Complete the billing details and accept the policies'});
    await connection.beginTransaction();
    const [[product]]=await connection.execute('SELECT * FROM commerce_products WHERE code=? AND is_active=1 FOR UPDATE',[code]);if(!product){await connection.rollback();return res.status(404).json({error:'This pass is not available'})}
    if(Number(product.sale_price_paise)===0){const complimentary=String(req.body.complimentary_token||'');if(!complimentary||product.complimentary_token_hash!==sha256(complimentary)){await connection.rollback();return res.status(404).json({error:'This complimentary link is invalid'})}if(product.expires_at&&new Date(product.expires_at)<=new Date()){await connection.rollback();return res.status(410).json({error:'This complimentary link has expired'})}if(product.redemption_limit!==null&&product.redemption_count+quantity>product.redemption_limit){await connection.rollback();return res.status(409).json({error:'This complimentary pass allocation has been fully redeemed'})}}
    if(product.inventory_limit!==null){const [[sold]]=await connection.execute("SELECT COALESCE(SUM(quantity),0) AS total FROM commerce_orders WHERE product_id=? AND status IN ('payment_created','paid')",[product.id]);if(Number(sold.total)+quantity>product.inventory_limit){await connection.rollback();return res.status(409).json({error:'The requested quantity is no longer available'})}}
    let awardApplicationId=null;const awardPublicId=clean(req.body.award_application_id,36);if(product.kind==='award_fee'){const [[application]]=await connection.execute("SELECT id FROM award_applications WHERE public_id=? AND status='payment_pending' FOR UPDATE",[awardPublicId]);if(!application){await connection.rollback();return res.status(422).json({error:'A valid award application is required'})}awardApplicationId=application.id}
    const subtotal=Number(product.sale_price_paise)*quantity,tax=Math.round(subtotal*Number(product.tax_rate)/100),total=subtotal+tax,publicId=crypto.randomUUID();
    const [result]=await connection.execute(`INSERT INTO commerce_orders (public_id,idempotency_key,product_id,award_application_id,quantity,subtotal_paise,tax_paise,total_paise,currency,customer_name,company,email,phone,gstin,billing_address,status,consented_at,policy_version,paid_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),?,?)`,[publicId,idempotencyHash,product.id,awardApplicationId,quantity,subtotal,tax,total,product.currency,customerName,company,email,phone,clean(req.body.gstin,40)||null,address,total===0?'paid':'pending',clean(req.body.policy_version,40)||'2026-10-06',total===0?new Date():null]);
    let attendees=Array.isArray(req.body.attendees)?req.body.attendees:[]; const capacity=product.member_count*quantity;
    if(!attendees.length&&capacity===1)attendees=[{full_name:customerName,email,phone}];
    await addAttendees(connection,result.insertId,attendees,capacity);if(total===0)await connection.execute('UPDATE commerce_products SET redemption_count=redemption_count+? WHERE id=?',[quantity,product.id]);await connection.commit();
    let gateway=null;if(total===0){await issuePassesForOrder(result.insertId);await queuePassEmail(result.insertId);}else{gateway=await createRazorpayOrder({total,currency:product.currency,publicId});if(!gateway)return res.status(503).json({error:'Payment service is temporarily unavailable',manageUrl:`/registration/?token=${encodeURIComponent(orderToken(publicId))}`});await query("UPDATE commerce_orders SET status='payment_created',provider_order_id=? WHERE id=?",[gateway.id,result.insertId]);}
    res.status(201).json(checkoutPayload({public_id:publicId,total_paise:total,currency:product.currency,customer_name:customerName,email,phone,status:total===0?'paid':'payment_created'},product,gateway));
  }catch(error){try{await connection.rollback()}catch{}if(error.code==='ER_DUP_ENTRY')return res.status(409).json({error:'This checkout request has already been processed'});if(error.status)return res.status(error.status).json({error:error.message});next(error)}finally{connection.release()}
});

publicRouter.post('/payments/razorpay/verify',checkoutLimiter,async(req,res,next)=>{try{const orderId=clean(req.body.razorpay_order_id),paymentId=clean(req.body.razorpay_payment_id),signature=clean(req.body.razorpay_signature,500);if(!config.razorpay.keySecret||!orderId||!paymentId||!signature)return res.status(422).json({error:'Incomplete payment confirmation'});const expected=crypto.createHmac('sha256',config.razorpay.keySecret).update(`${orderId}|${paymentId}`).digest('hex');if(signature.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(signature),Buffer.from(expected)))return res.status(400).json({error:'Payment signature verification failed'});const order=(await query('SELECT * FROM commerce_orders WHERE provider_order_id=? LIMIT 1',[orderId]))[0];if(!order)return res.status(404).json({error:'Registration not found'});const payment=await fetchRazorpayPayment(paymentId);await finalizePaidOrder(order,payment);res.json({ok:true,manageUrl:`/registration/?token=${encodeURIComponent(orderToken(order.public_id))}`});}catch(error){if(error.status)return res.status(error.status).json({error:error.message});next(error)}});
publicRouter.post('/payments/razorpay/webhook',async(req,res,next)=>{let eventId='';try{const signature=String(req.get('x-razorpay-signature')||''),secret=config.razorpay.webhookSecret;if(!secret||!req.rawBody)return res.status(400).json({error:'Webhook unavailable'});const expected=crypto.createHmac('sha256',secret).update(req.rawBody).digest('hex');if(signature.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(signature),Buffer.from(expected)))return res.status(400).json({error:'Invalid signature'});const event=req.body;eventId=String(req.get('x-razorpay-event-id')||sha256(req.rawBody));await query("INSERT INTO payment_events (provider,provider_event_id,event_type,signature_valid,payload,processing_status) VALUES (?,?,?,?,?,'received') ON DUPLICATE KEY UPDATE attempt_count=attempt_count+1",['razorpay',eventId,String(event.event||'unknown'),1,JSON.stringify(event)]);const stored=(await query('SELECT processing_status FROM payment_events WHERE provider_event_id=?',[eventId]))[0];if(stored?.processing_status==='processed')return res.json({ok:true,duplicate:true});const payment=event?.payload?.payment?.entity;if(['payment.captured','order.paid'].includes(event.event)&&payment?.order_id){const order=(await query('SELECT * FROM commerce_orders WHERE provider_order_id=? LIMIT 1',[payment.order_id]))[0];if(!order)throw new Error('Payment order was not found');await finalizePaidOrder(order,payment)}await query("UPDATE payment_events SET processing_status='processed',processed_at=NOW(),last_error=NULL WHERE provider_event_id=?",[eventId]);res.json({ok:true});}catch(error){if(eventId)await query("UPDATE payment_events SET processing_status='failed',last_error=? WHERE provider_event_id=?",[String(error.message||error).slice(0,1000),eventId]).catch(()=>{});next(error)}});

publicRouter.get('/orders/:token',async(req,res,next)=>{try{const publicId=verifyOrderToken(req.params.token);if(!publicId)return res.status(404).json({error:'Registration not found'});const order=(await query(`SELECT o.id,o.public_id,o.quantity,o.total_paise,o.currency,o.status,o.customer_name,o.company,o.email,p.code AS product_code,p.name AS product_name,p.member_count,p.forum FROM commerce_orders o JOIN commerce_products p ON p.id=o.product_id WHERE o.public_id=? LIMIT 1`,[publicId]))[0];if(!order)return res.status(404).json({error:'Registration not found'});const attendees=await query('SELECT id,attendee_number,full_name,email,phone FROM order_attendees WHERE order_id=? ORDER BY attendee_number',[order.id]);const passes=await query('SELECT pass_number,status,checked_in_at FROM digital_passes WHERE order_id=? ORDER BY id',[order.id]);res.json({...order,capacity:order.member_count*order.quantity,attendees,passes:passes.map(p=>({...p,token:passToken(p.pass_number),viewUrl:`/delegate-pass/?token=${encodeURIComponent(passToken(p.pass_number))}`}))});}catch(error){next(error)}});
publicRouter.post('/orders/:token/payment',checkoutLimiter,async(req,res,next)=>{try{const publicId=verifyOrderToken(req.params.token);if(!publicId)return res.status(404).json({error:'Registration not found'});const order=(await query(`SELECT o.*,p.name FROM commerce_orders o JOIN commerce_products p ON p.id=o.product_id WHERE o.public_id=? LIMIT 1`,[publicId]))[0];if(!order)return res.status(404).json({error:'Registration not found'});if(order.status==='paid')return res.status(409).json({error:'This registration is already paid'});if(Number(order.total_paise)<=0)return res.status(409).json({error:'This registration does not require payment'});let gateway=order.provider_order_id?{id:order.provider_order_id}:null;if(!gateway){gateway=await createRazorpayOrder({total:Number(order.total_paise),currency:order.currency,publicId:order.public_id});if(!gateway)return res.status(503).json({error:'Payment service is temporarily unavailable'});await query("UPDATE commerce_orders SET status='payment_created',provider_order_id=? WHERE id=? AND provider_order_id IS NULL",[gateway.id,order.id]);}res.json(checkoutPayload(order,{name:order.name},gateway));}catch(error){next(error)}});
publicRouter.post('/orders/:token/attendees',checkoutLimiter,async(req,res,next)=>{const connection=await pool.getConnection();try{const publicId=verifyOrderToken(req.params.token);if(!publicId)return res.status(404).json({error:'Registration not found'});await connection.beginTransaction();const [[order]]=await connection.execute(`SELECT o.id,o.status,o.quantity,p.member_count FROM commerce_orders o JOIN commerce_products p ON p.id=o.product_id WHERE o.public_id=? FOR UPDATE`,[publicId]);if(!order){await connection.rollback();return res.status(404).json({error:'Registration not found'})}if(order.status!=='paid'){await connection.rollback();return res.status(409).json({error:'Attendees can be added after payment is confirmed'})}const [[count]]=await connection.execute('SELECT COUNT(*) AS total FROM order_attendees WHERE order_id=?',[order.id]),capacity=order.quantity*order.member_count;if(count.total){await connection.rollback();return res.status(409).json({error:'Attendees have already been submitted. Contact the organiser to make changes.'})}if(!Array.isArray(req.body.attendees)||req.body.attendees.length!==capacity){await connection.rollback();return res.status(422).json({error:`Enter exactly ${capacity} attendee${capacity===1?'':'s'}`})}await addAttendees(connection,order.id,req.body.attendees,capacity);await connection.commit();await issuePassesForOrder(order.id);await queuePassEmail(order.id,{force:true});res.json({ok:true});}catch(error){try{await connection.rollback()}catch{}if(error.status)return res.status(error.status).json({error:error.message});next(error)}finally{connection.release()}});
publicRouter.get('/passes/:token',async(req,res,next)=>{try{const pass=await getPassByToken(req.params.token);if(!pass)return res.status(404).json({error:'Pass not found'});res.json({...pass,token:req.params.token});}catch(error){next(error)}});
publicRouter.get('/passes/:token/qr.svg',async(req,res,next)=>{try{const pass=await getPassByToken(req.params.token);if(!pass)return res.status(404).send('Pass not found');res.type('image/svg+xml').send(await qrSvg(req.params.token));}catch(error){next(error)}});
publicRouter.get('/passes/:token/pdf',async(req,res,next)=>{try{const pass=await getPassByToken(req.params.token);if(!pass)return res.status(404).send('Pass not found');res.set({'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="${pass.pass_number}.pdf"`}).send(await passPdf(pass));}catch(error){next(error)}});

publicRouter.get('/awards', async (req, res, next) => {
  try {
    const row = (await query('SELECT content FROM award_settings WHERE id=1 LIMIT 1'))[0];
    res.json(parseJson(row?.content, {}));
  } catch (error) { next(error); }
});

const awardLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false });
publicRouter.post('/award-applications', awardLimiter, async (req, res, next) => {
  try {
    const categories = Array.isArray(req.body.categories) ? [...new Set(req.body.categories.map(value => String(value).trim()).filter(Boolean))] : [];
    const text = (key, max = 255) => String(req.body[key] || '').trim().slice(0, max);
    const fullName=text('full_name',200), company=text('company',200), mobile=text('mobile',50), email=text('email',255).toLowerCase();
    const coordinatorName=text('coordinator_name',200), coordinatorNumber=text('coordinator_number',50), city=text('city',120), state=text('state',120);
    if (!categories.length || categories.length > 20) return res.status(422).json({ error: 'Select at least one award category' });
    if (!fullName || !company || !mobile || !email || !coordinatorName || !coordinatorNumber || !city || !state) return res.status(422).json({ error: 'Complete all required contact fields' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(422).json({ error: 'Enter a valid email address' });
    const publicId=crypto.randomUUID();
    await query('INSERT INTO award_applications (public_id,categories,full_name,company,mobile,email,coordinator_name,coordinator_number,gstin,city,state,billing_address) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',[publicId,JSON.stringify(categories),fullName,company,mobile,email,coordinatorName,coordinatorNumber,text('gstin',30)||null,city,state,text('billing_address',2000)||null]);
    res.status(201).json({ applicationId:publicId, status:'payment_pending', checkoutUrl:`/checkout/?pass=awards-registration&application=${encodeURIComponent(publicId)}` });
  } catch (error) { next(error); }
});

publicRouter.get('/forum/:forum', async (req, res, next) => {
  try {
    const forum = String(req.params.forum);
    if (!['india','south'].includes(forum)) return res.status(404).json({ error: 'Forum not found' });
    const settings = (await query('SELECT * FROM forum_settings WHERE forum=? LIMIT 1',[forum]))[0] || {};
    settings.overview_stats = parseJson(settings.overview_stats, []);
    const speakers = await query('SELECT id,name,role,image_url AS image,event_year,is_featured,sort_order FROM speakers WHERE forum=? AND is_published=1 ORDER BY is_featured DESC,sort_order,id',[forum]);
    const agenda = await query('SELECT id,number,title,subtitle,body,sort_order FROM agenda_items WHERE forum=? AND is_visible=1 ORDER BY sort_order,id',[forum]);
    const gallery = await query('SELECT id,image_url AS image,image_alt AS alt,target_url,sort_order FROM gallery_items WHERE forum=? AND is_visible=1 ORDER BY sort_order,id',[forum]);
    res.json({ settings, speakers, featuredSpeakers:speakers.filter(item=>item.is_featured), agenda, gallery });
  } catch (error) { next(error); }
});

publicRouter.get('/highlights', async (req, res, next) => {
  try {
    res.json(await query('SELECT id,section,title,cover_image_url AS image,youtube_url AS url,sort_order FROM highlight_videos WHERE is_visible=1 ORDER BY FIELD(section,\'session\',\'event\'),sort_order,id'));
  } catch (error) { next(error); }
});

publicRouter.get('/testimonials', async (req, res, next) => {
  try {
    const forum = ['india','south'].includes(String(req.query.forum)) ? String(req.query.forum) : 'india';
    res.json(await query('SELECT id,quote,name,role,image_url AS image,sort_order FROM exhibition_testimonials WHERE forum=? AND is_visible=1 ORDER BY sort_order,id',[forum]));
  } catch (error) { next(error); }
});

publicRouter.get('/articles', async (req, res, next) => {
  try { res.json(await query("SELECT slug,title,excerpt,featured_image_url,publish_at AS published_at FROM articles WHERE status='published' AND (publish_at IS NULL OR publish_at<=NOW()) ORDER BY COALESCE(publish_at,created_at) DESC LIMIT 100")); }
  catch (error) { next(error); }
});

publicRouter.get('/articles/:slug', async (req, res, next) => {
  try { const article=await getPublishedArticle(req.params.slug); if(!article)return res.status(404).json({error:'Article not found'}); res.json(article); }
  catch (error) { next(error); }
});

const submissionLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false });
publicRouter.post('/forms/:key/submit', submissionLimiter, async (req, res, next) => {
  try {
    const forms = await query('SELECT id, fields, success_message FROM forms WHERE form_key = ? AND is_active = 1 LIMIT 1', [req.params.key]);
    if (!forms[0]) return res.status(404).json({ error: 'This form is not available' });
    const fields = parseJson(forms[0].fields, []); const payload = {}; const errors = {};
    for (const field of fields) {
      const value = typeof req.body[field.name] === 'string' ? req.body[field.name].trim() : '';
      if (field.required && !value) errors[field.name] = 'This field is required';
      if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors[field.name] = 'Enter a valid email';
      payload[field.name] = value.slice(0, field.maxLength || 2000);
    }
    if (Object.keys(errors).length) return res.status(422).json({ error: 'Please correct the highlighted fields', fields: errors });
    await query('INSERT INTO form_submissions (form_id, payload, ip_hash, user_agent) VALUES (?, ?, SHA2(?, 256), ?)', [forms[0].id, JSON.stringify(payload), req.ip, String(req.get('user-agent') || '').slice(0, 500)]);
    res.status(201).json({ message: forms[0].success_message });
  } catch (error) { next(error); }
});
