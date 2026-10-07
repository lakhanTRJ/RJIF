# Exact staging inputs still required

## MySQL 8

The application needs a dedicated empty database and one restricted runtime user. Please provide these values through a secure channel, not in Git:

```text
DB_HOST=private database hostname or 127.0.0.1
DB_PORT=3306
DB_NAME=rjif_staging
DB_USER=rjif_staging_app
DB_PASSWORD=a unique strong password
```

The database administrator can create them with equivalent commands, replacing the password and host restriction:

```sql
CREATE DATABASE rjif_staging CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'rjif_staging_app'@'127.0.0.1' IDENTIFIED BY 'GENERATE-A-STRONG-UNIQUE-PASSWORD';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES ON rjif_staging.* TO 'rjif_staging_app'@'127.0.0.1';
FLUSH PRIVILEGES;
```

For a remote database, replace `127.0.0.1` with the application server's private host/IP and require TLS. Do not grant global privileges, `DROP`, `FILE`, `PROCESS`, `SUPER`, or user-management privileges to the runtime account. A temporary migration account may be used if your policy does not allow `CREATE` and `ALTER` for the runtime user.

## Razorpay test mode

Create or use a Razorpay **Test Mode** key pair and webhook. Supply:

```text
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=a separate random webhook secret
```

The key ID is safe to expose to the browser during checkout; the key secret and webhook secret must remain server-only. The staging webhook URL will be:

```text
https://STAGING_HOST/api/public/payments/razorpay/webhook
```

The webhook should initially subscribe to `payment.captured`, `payment.failed`, `order.paid`, and refund events if refunds will be managed through Razorpay. Test credentials must not be reused in production.

## Transactional email sandbox

Any SMTP-compatible provider is sufficient for staging: Amazon SES sandbox, Postmark sandbox/server, Mailgun sandbox, SendGrid, or an existing SMTP relay. Supply:

```text
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=Retail Jeweller India Forum <verified-sender@example.com>
FORM_NOTIFICATION_TO=internal-recipient@example.com
```

The sender address or domain must be verified with the provider. For staging, use a restricted recipient list so no real attendee receives test messages.

## Defaults currently used pending approval

- Consent: “I agree to the privacy policy and consent to being contacted.”
- Enquiry success: “Thank you. Your enquiry has been received and our team will contact you.”
- Payment success: show an order confirmation and email a receipt/pass.
- Payment failure: preserve the pending order and allow a safe retry; never mark it paid from browser state alone.
- Uploads: images only in the media library; awards attachments will be capped at 8 MB when activated.
- Form retention: 24 months, subject to final legal approval.
- Seven delegate products are seeded with 18% GST added separately. The awards registration fee is ₹50,000 plus 18% GST.
- Group, corporate, and leadership purchases collect each included attendee's details during checkout.
- Successful purchasers will receive both a downloadable invoice and QR pass once payment/email services are connected.
