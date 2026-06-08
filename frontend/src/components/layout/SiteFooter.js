import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Mail, MapPin, Phone } from "lucide-react";
import "../../STYLES/SiteFooter.css";
import pickNBookLogo from "../../assets/images/brand/pick-n-book-logo.svg";

const QUICK_LINKS = [
  { label: "Buses", to: "/?tab=buses" },
  { label: "Print Ticket", to: "/print-ticket" },
  { label: "Login", to: "/login" },
  { label: "Dashboard", to: "/dashboard" },
];

const FOOTER_POLICY_LINKS = [
  { to: "/online/terms-conditions", label: "Terms & Conditions" },
  { to: "/online/privacy-policy", label: "Privacy Policy" },
  { to: "/online/refund-cancellation-policy", label: "Refund & Cancellation Policy" },
];

export default function SiteFooter() {
  const [copiedContact, setCopiedContact] = useState(null);

  const scrollToBookingTabs = () => {
    window.setTimeout(() => {
      document
        .getElementById("booking-tabs")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  const copyContact = async (value, type) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = value;
        textArea.setAttribute("readonly", "");
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }

      setCopiedContact(type);
      window.setTimeout(() => setCopiedContact(null), 1800);
    } catch (error) {
      setCopiedContact(null);
    }
  };

  return (
    <footer className="travel-footer">
      <div className="footer-shell">
        <div className="footer-topline">
          <div className="footer-branding">
            <img className="footer-brand-logo" src={pickNBookLogo} alt="Pick N Book" />
            <p>Bus booking with fast, transparent workflows.</p>
          </div>

          <Link
            className="footer-top-btn"
            to="/#booking-tabs"
            onClick={scrollToBookingTabs}
          >
            Start Booking
          </Link>
        </div>

        <nav className="footer-quick-links" aria-label="Footer quick links">
          {QUICK_LINKS.map((item) => (
            <Link key={item.label} to={item.to} className="footer-link-item">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="footer-contact-inline">
          <span>
            <MapPin size={14} />
            Madhapur, Hyderabad, Telangana
          </span>
          <button
            className="footer-contact-link footer-copy-btn"
            type="button"
            onClick={() => copyContact("+91 999-999-9999", "phone")}
          >
            <Phone size={14} />
            +91 999-999-9999
            {copiedContact === "phone" ? (
              <span className="footer-copy-popover" role="status">
                <Check size={12} />
                Copied
              </span>
            ) : null}
          </button>
          <a className="footer-contact-link" href="mailto:contact@picknbook.in">
            <Mail size={14} />
            contact@picknbook.in
          </a>
        </div>

        <div className="footer-bottomline">
          <span>Copyright 2026 All Rights Reserved</span>
          <div className="footer-policy-actions" aria-label="Footer policies">
            {FOOTER_POLICY_LINKS.map((policy, index) => (
              <React.Fragment key={policy.label}>
                {index > 0 ? <span className="footer-policy-divider">|</span> : null}
                <Link className="footer-policy-btn" to={policy.to}>
                  {policy.label}
                </Link>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
