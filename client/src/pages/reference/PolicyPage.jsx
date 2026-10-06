import { SiteHeader, Footer } from '../../components/reference/ReferenceShared.jsx';

function Policy({ path }) {
  return (
    <div className="reference-site policy-page">
      <SiteHeader path={path} />
      <main>
        <h1>Policy</h1>
        <section>
          <h2>1. Privacy Policy</h2>
          <p>
            Retail Jeweller India is committed to protecting your personal information and your right to
            privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your data when
            you visit retailjewellerindiaforum.com or interact with our services.
          </p>
          <h3>Information We Collect</h3>
          <p>We may collect the following information:</p>
          <ul>
            <li>Name, email address, phone number, company/organization name</li>
            <li>Billing and payment information when purchasing event tickets or services</li>
            <li>Any information submitted through forms, registrations, or inquiries</li>
            <li>Technical data such as IP address, browser type, device information, and pages visited</li>
          </ul>
          <h3>How We Use Your Information</h3>
          <ul>
            <li>Event registration and ticket processing</li>
            <li>Sending confirmations, updates, and support messages</li>
            <li>Improving website performance and user experience</li>
            <li>Marketing or promotional communication (only with your consent)</li>
            <li>Compliance with legal requirements</li>
          </ul>
          <h3>Sharing of Information</h3>
          <p>
            We do not sell or trade your personal information. We may share your data with payment gateways
            such as Razorpay, event partners or service providers, and legal authorities when required by law.
          </p>
          <h3>Cookies &amp; Tracking</h3>
          <p>
            We use cookies to personalise user experience, improve website functionality, and track analytics.
            You may disable cookies through your browser settings.
          </p>
          <h3>Data Security</h3>
          <p>
            We implement strict security measures to protect your data. However, no online platform is 100%
            secure; users share information at their own risk.
          </p>
          <h3>Your Rights</h3>
          <ul>
            <li>Access to your data</li>
            <li>Correction or deletion of your data</li>
            <li>Removal from marketing communication</li>
          </ul>
        </section>
        <section>
          <h2>2. Terms &amp; Conditions</h2>
          <p>
            By accessing or using retailjewellerindiaforum.com, you agree to these Terms &amp; Conditions.
          </p>
          <h3>Use of Website</h3>
          <ul>
            <li>
              Content is for general information regarding our events, conferences, exhibitions, and awards.
            </li>
            <li>You may not reproduce, distribute, or modify website content without written permission.</li>
          </ul>
          <h3>Event Registrations &amp; Payments</h3>
          <ul>
            <li>All event registrations are processed through secure payment gateways.</li>
            <li>Prices are subject to change without prior notice.</li>
            <li>Your registration is confirmed only after successful payment.</li>
          </ul>
          <h3>Third-Party Links</h3>
          <p>
            Our website may contain links to external websites. We are not responsible for their content or
            policies.
          </p>
        </section>
        <section>
          <h2>3. Refund &amp; Cancellation Policy</h2>
          <h3>Event Tickets / Registrations</h3>
          <ul>
            <li>
              All purchases made on Retail Jeweller India Forum are non-refundable unless the event is
              cancelled by us.
            </li>
            <li>If an event is postponed, tickets will automatically be valid for the new dates.</li>
            <li>
              In case of cancellation by the organizer, a full refund will be issued to the original payment
              method.
            </li>
          </ul>
          <h3>User-Requested Cancellations</h3>
          <ul>
            <li>No refund is provided for voluntary cancellations or no-shows.</li>
          </ul>
          <h3>Payment Gateway Charges</h3>
          <ul>
            <li>Any convenience or payment gateway fees are non-refundable.</li>
          </ul>
        </section>
        <section>
          <h2>4. Shipping &amp; Delivery Policy</h2>
          <p>(For digital passes, event badges, or documents)</p>
          <ul>
            <li>
              Most event communications, passes, or QR codes are delivered digitally via email or WhatsApp.
            </li>
            <li>Physical items (if applicable) will be provided on-site at the event venue.</li>
            <li>Delivery timelines depend on the event schedule and communication process.</li>
          </ul>
        </section>
        <section>
          <h2>5. Contact Us</h2>
          <p>For questions regarding this Policy, please contact:</p>
          <p>
            <b>Retail Jeweller India</b>
            <br />
            Email:{' '}
            <a href="mailto:laxmi.gupta@retailjewellerindia.com">laxmi.gupta@retailjewellerindia.com</a>
            <br />
            Phone: <a href="tel:+917738352502">+91 77383 52502</a>
            <br />
            Website: <a href="https://retailjewellerindiaforum.com/">https://retailjewellerindiaforum.com/</a>
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default Policy;
