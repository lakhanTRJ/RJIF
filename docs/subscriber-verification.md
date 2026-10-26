# Five-year magazine subscriber benefit

## Configuration

Apply migrations through `018_magazine_subscribers.sql` before starting this release. Back up the database first.

Existing SMTP configuration is used for email OTPs. WhatsApp is enabled only when these server environment variables are configured:

```dotenv
DOUBLETICK_API_KEY=<set privately on the server>
DOUBLETICK_SENDER=+917718898960
DOUBLETICK_OTP_TEMPLATE=code23
DOUBLETICK_OTP_LANGUAGE=en
```

Never place the API key in frontend variables, public code, screenshots or Git. Restart the backend after updating its environment. Confirm the exact template language code in DoubleTick if it rejects `en`.

The adapter uses DoubleTick's documented template-message endpoint, with the OTP in the body placeholder and URL-button parameter for the authentication copy-code button. This needs a live acceptance/delivery check with `code23` after credentials are entered. Automated tests mock delivery and do not prove provider delivery.

## Admin

Only administrators can open `/admin/magazine-subscribers`. Add eligible five-year subscribers with name, company, registered mobile and optional email. Ten-digit Indian mobiles are normalized to `+91`; international numbers require a country code. Mobile/email must be unique. Optional eligibility expiry is inclusive through that calendar date in India. Disable a record to stop new verification and discounted checkout.

The subscriber list is separate from public articles, event staff, and ordinary registrations. Publishers/editors cannot administer it. Admin changes are audited without copying subscriber contact details into audit metadata.

## Applicant flow

1. Choose the subscriber benefit on Business Excellence Awards.
2. Request a code on the registered email or WhatsApp number. Requesting a code constitutes consent to that one-time verification message; no marketing opt-in is implied.
3. Codes expire after five minutes, allow five attempts, are bound to the browser session, and can only be consumed once. Wait 60 seconds before a resend; at most five requests per contact per hour plus IP limits. Codes are stored only as keyed hashes and are not stored in email jobs.
4. Submit the application within 30 minutes using the same verified email/mobile in the application contact details. Billing email may be a different contact. Email is optional in the subscriber list, not in the existing application/receipt form.
5. Checkout rechecks active status, expiry and the verified contact against the current subscriber record. Discount is fixed at 50% on the one registration fee, before GST, regardless of the number of categories. The browser cannot set a discount percentage. Stored order amounts, Razorpay amount and captured-payment checks use the discounted total.

Example with a ₹50,000 registration fee and 18% GST: ₹25,000 discount + ₹4,500 GST = ₹29,500 payable. Non-subscribers pay the normal fee. This does not stack with manual discounts or create delegate QR passes.

No per-subscriber redemption cap is imposed; the requested rule is eligibility-based. Separate nominations by a subscriber can each qualify after verification.

Disabling a subscriber does not change an already-created gateway order or an already-paid registration. Discount eligibility is checked when a new order is created. Do not change or refund historical payments automatically.

## Release checks

- Verify code delivery once to an authorised test subscriber on email and WhatsApp, then verify the checkout breakdown.
- Test an unknown contact: the response should not disclose subscriber membership and no code is sent.
- Test wrong/expired codes, disabled records, and a non-subscriber normal-price registration.
- Check the stored discount fields and Razorpay amount before accepting production payments.
- On rollback, do not drop subscriber or award columns containing business records; use a compatible previous application release and preserve the database backup.
