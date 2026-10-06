# Production launch checklist

The codebase is hardened for deployment, but a live launch still depends on external credentials and operational sign-off. Do not route public traffic until every required item below is complete.

## Required before launch

- Use Node.js 22 LTS and MySQL 8.4; run `npm ci`, `npm run lint`, `npm test`, and `npm run build` in CI.
- Take a database backup, run `npm run migrate -w server` once per release, and confirm `GET /api/ready` returns HTTP 200.
- Populate every value in `server/.env.production.example`. Generate independent high-entropy values for `SESSION_SECRET`, the active `PASS_SIGNING_KEYS` key, database password, and Razorpay webhook secret.
- Keep old entries in `PASS_SIGNING_KEYS` during QR-key rotation so already issued passes remain valid. Change only `ACTIVE_PASS_SIGNING_KEY` to issue with the new key.
- Configure a restricted MySQL user, HTTPS, `TRUST_PROXY=1`, secure environment-file permissions, and a persistent media directory outside the release directory.
- Configure Razorpay live keys and its webhook URL as `/api/public/payments/razorpay/webhook`. Test successful, failed, abandoned, and repeated webhook/payment flows using a low-value test product before enabling live prices.
- Configure SMTP and `FORM_NOTIFICATION_TO`. Confirm a paid registration receives all PDF/QR passes and an enquiry reaches the notification mailbox. Monitor failed `email_jobs`.
- Create named administrator and event-staff accounts; do not share credentials. Verify editor, administrator, and event-staff permissions on staging.
- Test India and South Forum on current Chrome, Safari, Firefox, Android, and iOS at mobile/tablet/desktop widths. Include navigation, YouTube embeds, forms, checkout, QR display/PDF, check-in, blog, and admin uploads.
- Confirm event date, venue, pass prices, tax treatment, refund terms, privacy wording, contact details, legal business identity, invoice requirements, and the production domain with the business owner/accountant.
- Set `STAGING_NOINDEX=false` only on production. Confirm `robots.txt`, sitemap URLs, canonical tags, redirects, analytics/consent requirements, and a representative social-sharing preview.

## Operations and recovery

- Use versioned releases and an atomic rollback. Never deploy over the running directory.
- Back up MySQL and the media directory nightly with encrypted daily/weekly/monthly retention. Perform and record a test restore before launch and at least quarterly.
- Alert on readiness failures, HTTP 5xx, elevated latency, disk pressure, process restarts, failed payment events, failed email jobs, and certificate-renewal failures.
- Document who can refund, manually mark payments, re-send passes, reset event staff, rotate secrets, restore backups, and contact Razorpay/SMTP support.
- Run a full gate rehearsal: purchase a pass, receive it, scan it once successfully, verify the second scan reports already checked in, and confirm the audit trail.

## Release decision

Code checks passing is necessary but not sufficient. The release owner should record staging acceptance, backup verification, payment/email live-mode tests, legal/content approval, DNS/TLS change window, rollback owner, and monitoring owner before launch.
