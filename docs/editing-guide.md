# Website editing guide

Most routine changes should be made in the admin panel, not in source code. Open `/admin/`; administrators now land on **Homepage** and the left navigation is grouped by task.

## Where to make common changes

| Change                                             | Admin section         |
| -------------------------------------------------- | --------------------- |
| Homepage video, date, venue, counters or banners   | Homepage              |
| Current/past speaker name, title, year or image    | Speakers              |
| Agenda headings and descriptions                   | Agenda                |
| Pass prices, capacity or complimentary allocations | Passes & fees         |
| Previous-edition images                            | Event gallery         |
| Previous-edition YouTube covers and links          | Video highlights      |
| Exhibition testimonials                            | Testimonials          |
| Business Excellence Awards content                 | Business awards       |
| Blog stories                                       | Blog articles         |
| Footer wording and social links                    | Footer & social links |
| Page title, SEO description or publishing status   | SEO & publishing      |
| Reusable images                                    | Media library         |
| Contact, exhibition and partnership enquiries      | Enquiries             |
| Payments, attendees and issued QR passes           | Registrations         |
| Gate scanning accounts                             | Event staff           |

The India/South switch appears at the top of sections that have separate forum content. Always check the selected forum before saving.

## Source-code map

The public UI uses page components and shared components under `client/src`:

- `pages/BlogPage.jsx` — blog list and article page.
- `pages/reference/HomePage.jsx` — India and South Forum homepages, including delegate-pass cards.
- `pages/reference/ExhibitionPage.jsx` — India and South exhibition pages.
- `pages/reference/SpeakersPage.jsx` — current and past speaker directories.
- `pages/reference/HighlightsPage.jsx` — previous-edition highlights.
- `pages/reference/PartnerPage.jsx` — partnership page.
- `pages/reference/PolicyPage.jsx` — privacy, terms, refunds and delivery.
- `pages/reference/CheckoutPage.jsx` — checkout form and payment hand-off.
- `pages/reference/DelegatePassPage.jsx` — individual QR pass.
- `pages/reference/RegistrationPage.jsx` — registration status and attendee assignment.
- `pages/reference/AccountPage.jsx` — customer registration access.
- `pages/reference/BusinessExcellencePage.jsx` — Business Excellence Awards.
- `pages/reference/FelicitationPage.jsx` — South Forum felicitation.
- `components/reference/ReferenceShared.jsx` — shared header, footer, contact, gallery and video components.
- `components/ReferencePage.jsx` — short URL router only; page content no longer lives here.
- `components/reference.css` — main public layout.
- `components/reference-home-updates.css` — homepage and newer responsive sections.
- `components/reference-extended.css` — checkout, highlights, exhibition and other secondary pages.
- `pages/reference/styles/passes.css` — clearly named colour variables for homepage pass cards, checkout summary and digital QR pass.
- `pages/AdminPanel.jsx` — admin data forms and API actions.
- `components/admin/AdminNavigation.jsx` — admin menu groups, labels and descriptions.
- `components/admin/AdminCheckIn.jsx` — event entrance scanner.
- `components/admin/ImageUploadField.jsx` — reusable image uploader.
- `admin-interface.css` — admin visual design.

Run `npm run format` after editing JSX/CSS, followed by `npm run lint`, `npm test`, and `npm run build`.

### Changing pass colours

Edit only the variables at the top of `client/src/pages/reference/styles/passes.css`. Separate variables control the section background, ticket card, ticket cut-outs, booking button, checkout summary and digital QR pass. If you use a light ticket background, also change `--pass-card-text` to a dark colour.

For live editing, run `npm run dev` and open `http://localhost:5173`. Port `3000` serves the last production build and will not reflect source changes until `npm run build` is run.

## Safety notes

- Never put Razorpay, SMTP, database or signing secrets into client files.
- Do not edit pass prices directly in JSX; use **Passes & fees** so checkout and payment calculations use the same database value.
- Do not replace an active QR signing key. Add a new version and retain old keys so issued passes remain valid.
- Test changes on `dev.retailjewellerindiaforum.com` before deploying the same release to production.
