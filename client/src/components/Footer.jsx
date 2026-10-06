import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="site-footer" id="contact">
      <div className="container footer-grid">
        <div>
          <div className="brand inverse">
            <span className="brand-mark">RJ</span>
            <span>
              RETAIL JEWELLER
              <br />
              <b>INDIA FORUM</b>
            </span>
          </div>
          <p>A Knowledge and Networking Platform where Forward-Thinking Jewellers Meet!</p>
        </div>
        <div>
          <h3>Explore</h3>
          <Link to="/speakers/">Speakers</Link>
          <Link to="/exhibition/">Exhibition</Link>
          <Link to="/partner/">Partner</Link>
        </div>
        <div>
          <h3>Information</h3>
          <Link to="/privacy-policy/">Policy</Link>
          <a href="mailto:info@retailjewellerindiaforum.com">Contact</a>
        </div>
      </div>
      <div className="container copyright">Copyright © 2025 Retail Jeweller. All Rights Reserved.</div>
    </footer>
  );
}
