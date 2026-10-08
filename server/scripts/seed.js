import { pool } from '../src/db.js';
import fs from 'node:fs/promises';

const reference = JSON.parse(
  await fs.readFile(new URL('../../client/src/data/reference.generated.json', import.meta.url), 'utf8'),
);
const awardsContent = JSON.parse(
  await fs.readFile(new URL('../../client/src/data/awards.content.json', import.meta.url), 'utf8'),
);

const pages = [
  {
    path: '/',
    title: 'Retail Jeweller India Forum',
    template: 'home',
    seoDescription: 'A Knowledge and Networking Platform where Forward-Thinking Jewellers Meet!',
    sections: [
      {
        type: 'hero',
        kicker: 'Retail Jeweller India Forum',
        heading: 'Where strategy is as precious as the stones',
        body: 'A Knowledge and Networking Platform where Forward-Thinking Jewellers Meet!',
        items: [
          { title: 'Register', url: '#contact' },
          { title: 'Exhibit', url: '/exhibition/' },
        ],
      },
      {
        type: 'stats',
        items: [
          { value: '—', title: 'Years Sharing Knowledge' },
          { value: '—', title: 'Speakers' },
          { value: '—', title: 'Attendees' },
          { value: '—', title: 'Exhibitors' },
          { value: '—', title: 'Minutes of Learning' },
        ],
      },
      {
        type: 'cards',
        kicker: 'Speakers 2026',
        heading: 'Industry leaders',
        body: 'Portrait assets are pending an approved WordPress media export.',
        items: [
          ['Aayush Khurana', 'Executive Director, Khurana Jewellery House'],
          ['Abhishek Raniwala', 'Creative Director and Co-founder, Raniwala 1881'],
          ['Ajay Maurya', 'Head - Product and Marketing, Mia by Tanishq'],
          ['Aviral Prakash', 'Director, Abhushan Gold and Diamonds'],
          ['Manish Gulechha', 'CEO, Kushals'],
          ['Saurabh Gadgil', 'Chairman & Managing Director, PNG'],
        ].map(([title, subtitle]) => ({ title, subtitle, image_alt: title })),
      },
      {
        type: 'cards',
        kicker: 'Agenda',
        heading: 'India Forum',
        items: [
          [
            '01',
            'The Digital Race',
            'Making Online the First Stop for Discovery and Measuring its ROI and Impact',
          ],
          ['02', 'Building Big', "Scaling India's Luxury Jewellery Retail"],
          ['03', 'The Way Ahead', 'Reinventing retail pricing methods amidst rising gold prices'],
          [
            '04',
            'Global Jewellery Brands Forays into India',
            'Decoding strategies, consumer impact, and market disruption',
          ],
          ['05', 'Debate', 'Recalibrating the Gold Game or A Reset Moment for Gold'],
          ['06', 'Fireside Chat with Soma Bhatta', 'Founder and Editor, The Retail Jeweller'],
        ].map(([number, title, subtitle]) => ({ number, title, subtitle })),
      },
      {
        type: 'pricing',
        heading: 'Delegate Pass',
        items: [
          { title: 'Single Pass', old_price: '₹10,000', price: '₹7,500' },
          { title: 'Corporate Pass', old_price: '₹30,000', price: '₹18,000', subtitle: '3 members only' },
          { title: 'Leadership Pass', old_price: '₹50,000', price: '₹25,000', subtitle: '5 members only' },
          { title: 'Non-Retailer', old_price: '₹25,000', price: '₹10,000' },
        ],
      },
    ],
  },
  {
    path: '/conference-south/',
    title: 'Conference – Retail Jeweller South Forum',
    template: 'conference-south',
    sections: [
      {
        type: 'hero',
        kicker: 'Retail Jeweller South Forum',
        heading: 'Where the jewellery capital of India shapes its next capital idea',
        body: 'Join The Discussion.',
        items: [
          { title: 'Register', url: '#contact' },
          { title: 'Exhibit', url: '/exhibition-south/' },
        ],
      },
      {
        type: 'cards',
        kicker: 'Speakers 2026',
        heading: 'South Forum speakers',
        items: [
          ['Abilash Chettiar', 'Managing Director, Dhamu Chettiar Nagai Maaligai Jewelers'],
          ['Arjun Varadaraj', 'Director, NAC Jewellers'],
          ['Priyanka Vemuluri', 'Founder and CEO, Goyaz Silver Jewellery'],
          ['Varghese Alukkas', 'Managing Director, Jos Alukkas'],
          ['Vinod Hayagriv', 'Managing Director & Director, C. Krishniah Chetty Group of Jewellers'],
        ].map(([title, subtitle]) => ({ title, subtitle, image_alt: title })),
      },
      {
        type: 'cards',
        kicker: 'Agenda',
        heading: 'South Forum',
        items: [
          [
            '01',
            'Young Turks',
            'Reinventions, Strategic Shifts, Disruptions to Adapt to Changing Market Conditions and Grow the Business',
          ],
          [
            '02',
            'Conversions from clicks',
            'Engaging the Always-Online shoppers and Analysing Jewellery Retail’s Digital Pulse',
          ],
          [
            '03',
            'Unlocking the potential of digital gold apps',
            'How retailers are digitising gold investments and expanding their customer base',
          ],
          ['04', 'The Global South', 'Tapping into the diasporic market opportunities'],
          ['05', 'The Buyer Reset', 'Decoding the new jewellery purchase pattern in South India'],
        ].map(([number, title, subtitle]) => ({ number, title, subtitle })),
      },
      {
        type: 'pricing',
        heading: 'Delegate Pass',
        items: [
          { title: 'Group Pass', old_price: '₹15,000', price: '₹9,000', subtitle: '3 Members' },
          { title: 'Non-Retailer Pass', old_price: '₹10,000', price: '₹7,500' },
          { title: 'Retailer Individual Pass', old_price: '₹5,000', price: '₹3,750' },
        ],
      },
    ],
  },
  ...['/exhibition/', '/exhibition-south/'].map((path) => ({
    path,
    title: path.includes('south')
      ? 'Exhibition – Retail Jeweller South Forum'
      : 'Exhibition – Retail Jeweller India Forum',
    template: 'exhibition',
    sections: [
      {
        type: 'hero',
        kicker: 'Retail Service Providers',
        heading: 'Network. Collaborate. Grow.',
        body: 'Exhibit at the Retail Jeweller Forum',
        items: [{ title: 'Exhibit Now', url: '#contact' }],
      },
      {
        type: 'richtext',
        heading: 'Exhibit at the Retail Jeweller Forum',
        body_html:
          '<p>Connect with top jewellery retailers seeking innovative solutions for their business. Showcase your products and services, build partnerships, and grow your brand in India’s premier B2B jewellery networking platform.</p>',
      },
      {
        type: 'cards',
        kicker: 'Testimonials',
        heading: 'What exhibitors say',
        items: [
          ['Kinnari Sanghvi', 'Jeetu and Kinnari Photography and Films'],
          ['Chetan Kumar Mehta', 'CMD, Lakshmi Diamonds'],
          ['Karan Jagani', 'Founder, Jwero.ai'],
          ['Rohit Karnik', 'Iris RFID'],
          ['Saket Shrikant', 'Studio 369'],
          ['Nilesh Rathod', 'Founder & CEO, Atmosphere'],
        ].map(([title, subtitle]) => ({ title, subtitle, image_alt: title })),
      },
      {
        type: 'cards',
        kicker: 'Gallery',
        heading: 'Previous editions',
        body: 'Approved event photographs are pending.',
        items: Array.from({ length: 6 }, (_, i) => ({
          title: `Event photograph ${i + 1}`,
          image_alt: 'Previous edition event photograph',
        })),
      },
    ],
  })),
  {
    path: '/speakers/',
    title: 'Speakers – Retail Jeweller India Forum',
    template: 'speakers',
    sections: [
      {
        type: 'hero',
        kicker: 'Retail Jeweller India Forum',
        heading: 'Speakers',
        body: 'Since 2014, RJIF has been the epicentre for jewellery retail, service providers and learning enthusiasts.',
      },
      {
        type: 'cards',
        heading: 'Speakers',
        items: [
          ['Arti Saxena', 'Head of Marketing - India, World Gold Council'],
          ['Ashish Pethe', 'Partner, Waman Hari Pethe Jewellers'],
          ['Bijou Kurien', 'Chairman, Retailers Association of India'],
          ['Dipu Mehta', 'Managing Director, ORRA Fine Jewellery'],
          ['Ganesh Subramanian', 'Founder & CEO, Stylumia'],
          ['Soma Bhatta', 'Editor, The Retail Jeweller'],
        ].map(([title, subtitle]) => ({ title, subtitle, image_alt: title })),
      },
    ],
  },
  {
    path: '/south-forum-speakers/',
    title: 'South Forum Speakers – Retail Jeweller India Forum',
    template: 'speakers',
    sections: [
      {
        type: 'hero',
        kicker: 'Retail Jeweller South Forum',
        heading: 'Speakers',
        body: 'Since 2014, RJIF has been the epicentre for jewellery retail, service providers and learning enthusiasts.',
      },
      {
        type: 'cards',
        heading: 'South Forum speakers',
        items: [
          ['A. Shivaram', 'Founder, Retail Gurukal'],
          ['Abhijeet Lalgondar', 'Business Head, SalesWizz'],
          ['Amit Pratihari', 'Managing Director, De Beers India'],
          ['Chetan Mehta', 'Chairman & Managing Director, Laxmi Diamonds'],
          ['Ganesh Subramanian', 'Founder & CEO, Stylumia'],
          ['Meethi Surana', 'Marketing Director, Raj Diamonds'],
        ].map(([title, subtitle]) => ({ title, subtitle, image_alt: title })),
      },
    ],
  },
  {
    path: '/partner/',
    title: 'Partner – Retail Jeweller India Forum',
    template: 'partner',
    sections: [
      {
        type: 'hero',
        kicker: 'Partnership',
        heading: 'Partner with India’s Premier Jewellery Leadership Platform',
        body: 'Since 2005, the Retail Jeweller India Forum has united 300+ top retailers, manufacturers, and industry leaders to spark strategic dialogue and drive progress.',
        items: [{ title: 'Partner with us', url: '#contact' }],
      },
      {
        type: 'cards',
        heading: 'Why Sponsor RJIF 2027?',
        items: [
          '300+ curated decision-makers from across India’s retail and manufacturing landscape',
          'Branding before, during and after the event — digital + on-ground + media integration',
          'Prime access to CEOs, MDs, Retail Heads, and Design Leaders',
          'Association with MD & CEO Awards, India’s most prestigious industry honour',
          'Curated formats for deeper brand engagement',
        ].map((title, index) => ({ number: String(index + 1).padStart(2, '0'), title })),
      },
    ],
  },
  {
    path: '/business-excellence-awards/',
    title: 'Business Excellence Awards – Retail Jeweller India Forum',
    template: 'awards',
    sections: [
      {
        type: 'hero',
        kicker: 'Awards',
        heading: 'Retail Jeweller India Business Excellence Awards',
        body: 'The Retail Jeweller Business Excellence Awards recognises the achievements and initiatives of businesses and individuals that are setting new benchmarks and advancing jewellery retail.',
        items: [{ title: 'Apply', url: '/awards/' }],
      },
      {
        type: 'cards',
        heading: 'Timeline',
        items: [
          { number: '01', title: 'Registration', subtitle: '9th Sept - 31st Oct 2026' },
          { number: '02', title: 'Excellence Evaluation', subtitle: '15th Nov 2026' },
          { number: '03', title: 'Awards Night', subtitle: '6th Jan 2027' },
        ],
      },
    ],
  },
  {
    path: '/previous-edition-highlights/',
    title: 'Previous Edition Highlights – Retail Jeweller India Forum',
    template: 'highlights',
    sections: [
      {
        type: 'hero',
        kicker: 'Retail Jeweller India Forum',
        heading: 'Previous Edition Highlights',
        body: 'Session highlights and event highlights from the Retail Jeweller India Forum.',
      },
      {
        type: 'cards',
        heading: 'Session Highlights',
        body: 'Video thumbnails and destinations are imported from the authorized Elementor export.',
        items: [],
      },
    ],
  },
  {
    path: '/previous-edition-highlights-south/',
    title: 'Previous Edition Highlights – Retail Jeweller South Forum',
    template: 'highlights',
    sections: [
      {
        type: 'hero',
        kicker: 'Retail Jeweller South Forum',
        heading: 'Previous Edition Highlights',
        body: 'Session highlights and event highlights from the Retail Jeweller South Forum.',
      },
    ],
  },
  {
    path: '/privacy-policy/',
    title: 'Policy – Retail Jeweller India Forum',
    template: 'legal',
    sections: [
      {
        type: 'richtext',
        heading: 'Privacy Policy',
        body_html:
          '<p>Retail Jeweller India is committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your data when you visit retailjewellerindiaforum.com or interact with our services.</p><h3>Information We Collect</h3><ul><li>Name, email address, phone number, company/organization name</li><li>Billing and payment information when purchasing event tickets or services</li><li>Information submitted through forms, registrations, or inquiries</li><li>Technical data such as IP address, browser type, device information, and pages visited</li></ul><h3>Sharing of Information</h3><p>We do not sell or trade your personal information. Data may be shared with payment gateways such as Razorpay, event partners or service providers, and legal authorities when required by law.</p><h3>Contact Us</h3><p>For policy questions, contact Retail Jeweller India.</p>',
      },
    ],
  },
  {
    path: '/felicitation/',
    title: 'Circle of Excellence – Retail Jeweller South Forum',
    template: 'felicitation',
    sections: [
      {
        type: 'hero',
        heading: 'Circle of Excellence',
        body: 'Retail Jeweller Circle of Excellence - South recognises excellence in jewellery design, craftsmanship, marketing, and leadership.',
      },
    ],
  },
  { path: '/blog/', title: 'Blog – Retail Jeweller India Forum', template: 'articles', sections: [] },
  { path: '/cart/', title: 'Cart – Retail Jeweller India Forum', template: 'commerce', sections: [] },
  { path: '/checkout/', title: 'Checkout – Retail Jeweller India Forum', template: 'commerce', sections: [] },
  {
    path: '/my-account/',
    title: 'Account – Retail Jeweller India Forum',
    template: 'commerce',
    sections: [],
  },
];

async function upsertPage(connection, page) {
  const [result] = await connection.execute(
    'INSERT INTO pages (path,title,template,seo_title,seo_description,is_published) VALUES (?,?,?,?,?,1) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id),title=VALUES(title),template=VALUES(template),seo_title=VALUES(seo_title),seo_description=VALUES(seo_description)',
    [
      page.path,
      page.title,
      page.template,
      page.title,
      page.seoDescription || 'A Knowledge and Networking Platform where Forward-Thinking Jewellers Meet!',
    ],
  );
  const pageId = result.insertId;
  await connection.execute('DELETE FROM page_sections WHERE page_id=?', [pageId]);
  for (let s = 0; s < page.sections.length; s++) {
    const section = page.sections[s];
    const [sectionResult] = await connection.execute(
      'INSERT INTO page_sections (page_id,type,kicker,heading,body,body_html,settings,sort_order) VALUES (?,?,?,?,?,?,?,?)',
      [
        pageId,
        section.type,
        section.kicker || null,
        section.heading || null,
        section.body || null,
        section.body_html || null,
        JSON.stringify(section.settings || {}),
        s,
      ],
    );
    for (let i = 0; i < (section.items || []).length; i++) {
      const item = section.items[i];
      await connection.execute(
        'INSERT INTO section_items (section_id,number,title,subtitle,value,price,old_price,image_url,image_alt,url,data,sort_order) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
        [
          sectionResult.insertId,
          item.number || null,
          item.title || null,
          item.subtitle || null,
          item.value || null,
          item.price || null,
          item.old_price || null,
          item.image_url || null,
          item.image_alt || null,
          item.url || null,
          JSON.stringify(item.data || {}),
          i,
        ],
      );
    }
  }
}

const connection = await pool.getConnection();
try {
  await connection.beginTransaction();
  for (const page of pages) await upsertPage(connection, page);
  await connection.execute(
    "INSERT INTO forms (form_key,title,fields,success_message,is_active) VALUES ('contact','Contact',JSON_ARRAY(),'Thank you. We will be in touch.',0) ON DUPLICATE KEY UPDATE is_active=0",
  );
  const products = [
    ['india-single', 'delegate_pass', 'india', 'Single Pass', '', 1000000, 750000, 18, 1, 0],
    [
      'india-corporate',
      'delegate_pass',
      'india',
      'Corporate Pass',
      '3 members only',
      3000000,
      1800000,
      18,
      3,
      1,
    ],
    [
      'india-leadership',
      'delegate_pass',
      'india',
      'Leadership Pass',
      '5 members only',
      5000000,
      2500000,
      18,
      5,
      2,
    ],
    ['india-non-retailer', 'delegate_pass', 'india', 'Non-Retailer Pass', '', 2500000, 1000000, 18, 1, 3],
    ['south-group', 'delegate_pass', 'south', 'Group Pass', '3 members', 1500000, 900000, 18, 3, 0],
    ['south-non-retailer', 'delegate_pass', 'south', 'Non-Retailer Pass', '', 1000000, 750000, 18, 1, 1],
    ['south-retailer', 'delegate_pass', 'south', 'Retailer Individual Pass', '', 500000, 375000, 18, 1, 2],
    [
      'awards-registration',
      'award_fee',
      'awards',
      'Business Excellence Awards Registration',
      '₹50,000 plus 18% GST',
      null,
      5000000,
      18,
      1,
      0,
    ],
  ];
  for (const product of products)
    await connection.execute(
      'INSERT INTO commerce_products (code,kind,forum,name,description,regular_price_paise,sale_price_paise,tax_rate,member_count,sort_order) VALUES (?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE kind=VALUES(kind),forum=VALUES(forum),name=VALUES(name),description=VALUES(description),regular_price_paise=VALUES(regular_price_paise),sale_price_paise=VALUES(sale_price_paise),tax_rate=VALUES(tax_rate),member_count=VALUES(member_count),sort_order=VALUES(sort_order)',
      product,
    );
  await connection.execute(
    'INSERT INTO award_settings (id,content) VALUES (1,?) ON DUPLICATE KEY UPDATE content=IF(JSON_LENGTH(content)=0,VALUES(content),content)',
    [JSON.stringify(awardsContent)],
  );

  const featuredNames = {
    india: new Set(reference.home.speakers.map((item) => item.name)),
    south: new Set(reference.southConference.speakers.map((item) => item.name)),
  };
  for (const [forum, directory, featured] of [
    ['india', reference.speakers, reference.home.speakers],
    ['south', reference.southSpeakers, reference.southConference.speakers],
  ]) {
    const merged = new Map(directory.map((item) => [item.name, item]));
    for (const item of featured) merged.set(item.name, item);
    let sort = 0;
    for (const item of merged.values()) {
      await connection.execute(
        'INSERT INTO speakers (forum,name,role,image_url,event_year,is_featured,is_published,sort_order) VALUES (?,?,?,?,2026,?,1,?) ON DUPLICATE KEY UPDATE role=VALUES(role),image_url=COALESCE(VALUES(image_url),image_url),is_featured=VALUES(is_featured),sort_order=VALUES(sort_order)',
        [
          forum,
          item.name,
          item.role || '',
          item.image || null,
          featuredNames[forum].has(item.name) ? 1 : 0,
          sort++,
        ],
      );
    }
  }

  const agendas = {
    india: [
      [
        '01',
        'Crystal gazing 2030',
        'New Possibilities, Reinventions and Opportunities in Indian Jewellery',
        'How will the rules of jewellery retail and consumption be rewritten as the Indian retail sector almost doubles to approx. $1.93 trillion, with GDP reaching approx. $6.5 trillion.',
      ],
      [
        '02',
        'Two Diamonds, One Market',
        'Coexistence, Competition, and Consumer Choice',
        "What will the diamond market landscape look like amid government seed grants, millions of dollars in funding for lab-grown diamonds, and De Beers' renewed marketing efforts to revive natural diamonds?",
      ],
      [
        '03',
        'New Age Brands',
        'The Next Wave of Jewellery Retail',
        'In a legacy and trust-based category, why are consumers falling for young brands that are writing a new code for jewellery retail?',
      ],
      [
        '04',
        'Gold Demand Reset',
        'Same gold, New Calculations',
        'How are consumers recalibrating their gold purchases, and what structural shifts will change the way India sells gold?',
      ],
      [
        '05',
        'Breaking the Mould',
        'Retail transformations Beyond Metros',
        "What does it take to succeed in India's hinterlands?",
      ],
    ],
    south: [
      [
        '01',
        'Young Turks',
        'Reinventions, Strategic Shifts and Disruptions',
        'Adapting to changing market conditions and growing the business.',
      ],
      [
        '02',
        'Conversions from clicks',
        'Engaging the Always-Online shopper',
        'Analysing jewellery retail’s digital pulse.',
      ],
      [
        '03',
        'Unlocking digital gold apps',
        'Expanding the customer base',
        'How retailers are digitising gold investments.',
      ],
      [
        '04',
        'The Global South',
        'Diasporic market opportunities',
        'Tapping into new opportunities across global southern markets.',
      ],
      [
        '05',
        'The Buyer Reset',
        'New purchase patterns',
        'Decoding the new jewellery purchase pattern in South India.',
      ],
    ],
  };
  for (const [forum, rows] of Object.entries(agendas)) {
    const [existing] = await connection.execute('SELECT COUNT(*) count FROM agenda_items WHERE forum=?', [
      forum,
    ]);
    if (!existing[0].count)
      for (let i = 0; i < rows.length; i++)
        await connection.execute(
          'INSERT INTO agenda_items (forum,number,title,subtitle,body,sort_order) VALUES (?,?,?,?,?,?)',
          [forum, ...rows[i], i],
        );
  }
  for (const [forum, rows] of [
    ['india', reference.home.gallery],
    ['south', reference.southConference.gallery],
  ]) {
    const [existing] = await connection.execute('SELECT COUNT(*) count FROM gallery_items WHERE forum=?', [
      forum,
    ]);
    if (!existing[0].count)
      for (let i = 0; i < rows.length; i++)
        await connection.execute(
          'INSERT INTO gallery_items (forum,event_year,image_url,image_alt,target_url,sort_order) VALUES (?,?,?,?,?,?)',
          [
            forum,
            2026,
            rows[i].image,
            rows[i].alt || 'Previous event glimpse',
            forum === 'south' ? '/previous-edition-highlights-south/' : '/previous-edition-highlights/',
            i,
          ],
        );
  }
  await connection.commit();
  console.log(
    `Seeded ${pages.length} verified/indexed routes and ${products.length} administrator-managed products.`,
  );
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();
  await pool.end();
}
