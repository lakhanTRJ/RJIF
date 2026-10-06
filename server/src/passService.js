import crypto from 'node:crypto';
import QRCode from 'qrcode';
import PDFDocument from 'pdfkit';
import nodemailer from 'nodemailer';
import { config } from './config.js';
import { pool, query } from './db.js';

const sign = (value,key) => crypto.createHmac('sha256', key).update(value).digest('base64url');
const safeEqual = (a,b) => a.length===b.length && crypto.timingSafeEqual(Buffer.from(a),Buffer.from(b));
export const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
function signedToken(id,kind){const version=config.activePassSigningKey,key=config.passSigningKeys[version];if(!key)throw new Error('Active pass signing key is unavailable');return `${version}.${id}.${sign(`${kind}:${id}`,key)}`}
export const orderToken = publicId => signedToken(publicId,'order');
export const passToken = passNumber => signedToken(passNumber,'pass');

function verifySigned(token,kind){
  const value=String(token||''),parts=value.split('.');
  if(parts.length===3){const [version,id,signature]=parts,key=config.passSigningKeys[version];if(!key)return null;const expected=sign(`${kind}:${id}`,key);return safeEqual(signature,expected)?id:null}
  // Transitional validation for links issued before dedicated signing keys.
  const split=value.lastIndexOf('.');if(split<1)return null;const id=value.slice(0,split),signature=value.slice(split+1),expected=sign(`${kind}:${id}`,config.sessionSecret);return safeEqual(signature,expected)?id:null;
}
export const verifyOrderToken = token => verifySigned(token,'order');
export const verifyPassToken = token => verifySigned(token,'pass');
export function tokenFromScan(value){
  const raw=String(value||'').trim();
  try { const url=new URL(raw); return url.searchParams.get('token')||url.pathname.split('/').filter(Boolean).at(-1)||raw; } catch { return raw; }
}
export const publicPassUrl = token => `${config.clientOrigin.replace(/\/$/,'')}/delegate-pass/?token=${encodeURIComponent(token)}`;

export async function issuePassesForOrder(orderId){
  const connection=await pool.getConnection(); const issued=[];
  try {
    await connection.beginTransaction();
    const [[order]]=await connection.execute("SELECT o.*,p.forum,p.member_count,fs.event_date FROM commerce_orders o JOIN commerce_products p ON p.id=o.product_id LEFT JOIN forum_settings fs ON fs.forum=p.forum WHERE o.id=? AND o.status='paid' FOR UPDATE",[orderId]);
    if(!order){await connection.rollback();return []}
    const [attendees]=await connection.execute('SELECT * FROM order_attendees WHERE order_id=? ORDER BY attendee_number',[orderId]);
    for(const attendee of attendees){
      const [[existing]]=await connection.execute('SELECT pass_number FROM digital_passes WHERE attendee_id=? LIMIT 1',[attendee.id]);
      if(existing){issued.push(existing.pass_number);continue}
      const prefix=order.forum==='south'?'RJSF':'RJIF',year=String(order.event_date||'').match(/20\d{2}/)?.[0]||new Date().getFullYear();
      const number=`${prefix}-${year}-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
      const token=passToken(number);
      await connection.execute('INSERT INTO digital_passes (order_id,attendee_id,pass_number,qr_token_hash) VALUES (?,?,?,?)',[orderId,attendee.id,number,sha256(token)]);
      issued.push(number);
    }
    await connection.commit(); return issued;
  } catch(error){await connection.rollback();throw error} finally {connection.release()}
}

export async function getPassByToken(rawToken){
  const token=tokenFromScan(rawToken),number=verifyPassToken(token); if(!number)return null;
  const rows=await query(`SELECT dp.*,oa.full_name,oa.email,oa.phone,o.company,o.public_id,p.name AS product_name,p.forum,fs.event_date,fs.event_location
    FROM digital_passes dp JOIN commerce_orders o ON o.id=dp.order_id JOIN commerce_products p ON p.id=o.product_id
    LEFT JOIN order_attendees oa ON oa.id=dp.attendee_id LEFT JOIN forum_settings fs ON fs.forum=p.forum
    WHERE dp.pass_number=? AND dp.qr_token_hash=? LIMIT 1`,[number,sha256(token)]);
  return rows[0]||null;
}

export async function qrBuffer(token){return QRCode.toBuffer(publicPassUrl(token),{type:'png',width:420,margin:2,errorCorrectionLevel:'H'});}
export async function qrSvg(token){return QRCode.toString(publicPassUrl(token),{type:'svg',width:420,margin:2,errorCorrectionLevel:'H'});}
export async function passPdf(pass){
  const token=passToken(pass.pass_number),qr=await qrBuffer(token);
  return new Promise((resolve,reject)=>{const chunks=[];const doc=new PDFDocument({size:'A5',margin:40});doc.on('data',c=>chunks.push(c));doc.on('end',()=>resolve(Buffer.concat(chunks)));doc.on('error',reject);
    doc.rect(0,0,doc.page.width,120).fill('#c91622');doc.fillColor('#fff').fontSize(22).text(pass.forum==='south'?'Retail Jeweller South Forum':'Retail Jeweller India Forum',40,38,{align:'center'});
    doc.fillColor('#171717').fontSize(12).text('DELEGATE PASS',40,150,{align:'center',characterSpacing:2});doc.fontSize(23).text(pass.full_name||'Delegate',40,180,{align:'center'});doc.fontSize(12).fillColor('#555').text(pass.company||'',40,215,{align:'center'});
    doc.image(qr,(doc.page.width-210)/2,245,{width:210});doc.fillColor('#171717').fontSize(11).text(pass.pass_number,40,465,{align:'center'});doc.fontSize(10).fillColor('#555').text(`${pass.event_date||''}${pass.event_location?`  •  ${pass.event_location}`:''}`,40,490,{align:'center'});doc.end();});
}

export async function emailOrderPasses(orderId){
  if(!config.smtp.host||!config.smtp.from)return {sent:false,reason:'SMTP is not configured'};
  const orders=await query('SELECT * FROM commerce_orders WHERE id=? LIMIT 1',[orderId]); if(!orders[0])return {sent:false,reason:'Order not found'};
  const passes=await query(`SELECT dp.pass_number,oa.full_name,oa.email,oa.phone,o.company,p.name AS product_name,p.forum,fs.event_date,fs.event_location FROM digital_passes dp JOIN commerce_orders o ON o.id=dp.order_id JOIN commerce_products p ON p.id=o.product_id LEFT JOIN order_attendees oa ON oa.id=dp.attendee_id LEFT JOIN forum_settings fs ON fs.forum=p.forum WHERE dp.order_id=?`,[orderId]);
  if(!passes.length)return {sent:false,reason:'Attendee details are still required'};
  const transport=nodemailer.createTransport({host:config.smtp.host,port:config.smtp.port,secure:config.smtp.secure,auth:config.smtp.user?{user:config.smtp.user,pass:config.smtp.password}:undefined});
  const attachments=[]; for(const pass of passes)attachments.push({filename:`${pass.pass_number}.pdf`,content:await passPdf(pass)});
  const escape=value=>String(value||'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const links=passes.map(p=>`<li><a href="${publicPassUrl(passToken(p.pass_number))}">${escape(p.full_name||p.pass_number)}</a></li>`).join('');
  await transport.sendMail({from:config.smtp.from,to:orders[0].email,subject:'Your Retail Jeweller Forum delegate pass',html:`<p>Your registration is confirmed.</p><p>Open or download each pass below. Please present its QR code at entry.</p><ul>${links}</ul>`,attachments});
  return {sent:true};
}

export async function queuePassEmail(orderId,{force=false}={}){
  const order=(await query('SELECT email FROM commerce_orders WHERE id=? LIMIT 1',[orderId]))[0];if(!order)return {queued:false,reason:'Order not found'};
  const dedupe=force?`delegate:${orderId}:${crypto.randomUUID()}`:`delegate:${orderId}:issued`;
  try{await query("INSERT INTO email_jobs (kind,dedupe_key,order_id,recipient,payload) VALUES ('delegate_passes',?,?,?,JSON_OBJECT())",[dedupe,orderId,order.email]);return {queued:true}}
  catch(error){if(error.code==='ER_DUP_ENTRY')return {queued:true,duplicate:true};throw error}
}
