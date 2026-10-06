# Reference audit

Audit date: 1 October 2026 (Asia/Calcutta)

## Access status

Direct browser access to `https://retailjewellerindiaforum.com/` returned a Cloudflare **“Performing security verification”** page. No bypass was attempted. The owner subsequently supplied authorized WordPress/Elementor exports, the complete uploads archive, and desktop/mobile full-page screenshots. These materials are now the primary reference.

The route and content clues below come only from search-engine index results. Indexed evidence is useful for preserving wording, but is insufficient to verify visual layout, asset files, interaction behavior, metadata, canonical tags, structured data, mobile navigation, or payment flows.

## Minimum reference package needed

Received: WordPress WXR, Elementor website kit, `wp-content/uploads`, and desktop/mobile screenshots for the homepage, exhibition, Business Excellence Awards, speakers, and previous-edition highlights.

Alternative minimum: XML sitemap, full-page screenshots at 1440px and 390px widths, all approved assets, and a route-by-route content document.

Backups must remain outside Git. Unknown PHP or backup code will not be executed.

## Route inventory

| Path | Evidence | Status | Observed template/sections |
| --- | --- | --- | --- |
| `/` | Export + desktop/mobile screenshots | Inspected | Hero/video; counters; video; Speakers 2026; CTA; agenda; delegate passes; previous event gallery; contacts; footer |
| `/conference-south/` | Export + desktop/mobile screenshots | Inspected | South hero; four counters; video; speaker grid with approved portraits; South CTA; editable agenda; three passes; gallery; contacts |
| `/exhibition/` | Export + desktop/mobile screenshots | Inspected | Hero; “Network. Colaborate. Grow.”; exhibit introduction; testimonials; CTA; previous editions gallery; contacts; footer |
| `/exhibition-south/` | Export + desktop/mobile screenshots | Inspected | South navigation; exhibition content; testimonials; South CTA; gallery; contacts |
| `/speakers/` | Export + desktop/mobile screenshots | Inspected | Hero; introduction; 132-person speaker grid; contacts/footer |
| `/south-forum-speakers/` | Elementor export | Export inspected / visual pending | Same speaker-directory template with 46 South Forum speakers |
| `/partner/` | Export + desktop/mobile screenshots | Inspected | Hero; introduction; numbered benefits; sponsorship table/accordion; partnership CTA; contacts; footer |
| `/business-excellence-awards/` | Export + desktop/mobile screenshots | Inspected | Awards hero/about; timeline; accordions; two-step application form; awards banner/gallery; contacts/footer |
| `/previous-edition-highlights/` | Export + desktop/mobile screenshots | Inspected | Hero; session video carousel; event video cards; contacts/footer |
| `/privacy-policy/` | Export + desktop screenshot | Inspected desktop / mobile pending | Privacy; terms; cancellations; payment gateway charges; shipping/delivery; contact; footer |
| `/felicitation/` | Export + desktop/mobile screenshots | Inspected | Nomination hero; Circle of Excellence content; event banner; gallery; contacts; footer |
| `/awards/` | Mentioned by awards page | Pending | Application form or external flow not inspected |
| `/mastering-kachingo-for-your-jewelry-business-a-strategic-blueprint-for-artisans/` | Indexed result + owner decision | Removed | Returns HTTP 410; not migrated |
| `/kachingo-a-practical-guide-for-modern-jewelry-businesses/` | Indexed result + owner decision | Removed | Returns HTTP 410; not migrated |
| `/how-to-use-unique-handmade-gold-jewelry-to-create-a-personal-style-statement/` | Indexed result + owner decision | Removed | Returns HTTP 410; not migrated |

## Verified wording/content clues

- Site description appears as “A Knowledge and Networking Platform where Forward-Thinking Jewellers Meet!” (one indexed title contains the typo “Foward-Thinking”).
- Homepage includes counters for years/sharing knowledge, speakers, attendees, exhibitors, and minutes of learning.
- Homepage agenda includes the verified indexed titles “The Digital Race”, “Building Big”, “The Way Ahead”, “Global Jewellery Brands Forays into India”, “Debate”, and the Soma Bhatta fireside chat.
- Homepage indexed ticket cards: Single Pass ₹7,500 (struck ₹10,000), Corporate Pass ₹18,000 for 3 members (struck ₹30,000), Leadership Pass ₹25,000 for 5 members (struck ₹50,000), Non-Retailer ₹10,000 (struck ₹25,000).
- South indexed passes: Group Pass ₹9,000/3 members, Non-Retailer ₹7,500, Retailer Individual ₹3,750.
- Razorpay is named in the indexed privacy policy. No payment link, fields, redirect behavior, or webhook contract has been verified.
- Contact names, email addresses, and phone numbers appear in search results, but the final approved contact set must come from the export because indexed pages conflict between India and South variants.

## Still not verified

Exact carousel timing/easing; real registration checkout and Razorpay behavior; production email delivery; live SEO title/description/canonical/JSON-LD output; analytics/cookie tools. The awards form fields are verified from Elementor, but payment submission is not activated or tested. Policy and new commerce/account mobile layouts follow the established responsive system because legacy mobile captures were not supplied.

## Verified design system

- Font: Zain, weights 400 and 700.
- Primary red: `#CF181D`; dark: `#282222`; text gray: `#595959`; light gray: `#E8E8E8`.
- Desktop navigation: centered white primary row and red sectional row.
- Mobile navigation: dark compact primary row, two clickable India/South forum logo tiles, hamburger, and fixed social rail.
- India/South logo selection maps to parallel conference, exhibition, and speaker page families.

## Audit state definitions

- **Inspected**: directly opened and checked at desktop and mobile widths.
- **Blocked / indexed only**: direct access blocked; only indexed evidence recorded.
- **Pending**: discovered indirectly and not sufficiently evidenced.
