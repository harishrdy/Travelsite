import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Mail, MapPin, Phone, X } from "lucide-react";
import "../../STYLES/SiteFooter.css";

const QUICK_LINKS = [
  { label: "Buses", to: "/?tab=buses" },
  { label: "Print Ticket", to: "/print-ticket" },
  { label: "Login", to: "/login" },
  { label: "Dashboard", to: "/dashboard" },
];

const FOOTER_POLICIES = {
  terms: {
    label: "Terms & Conditions",
    title: "Terms & Conditions",
    intro:
      "PickNBook helps users search, compare, and book travel services through partner inventory and secure booking flows.",
    points: [
      "Fares, seats, timings, and availability are confirmed at the time of booking and may change before payment is completed.",
      "Passengers are responsible for entering correct traveller, contact, pickup, and journey details before confirming a ticket.",
      "Booking confirmations, ticket details, and support updates are shared through the contact information provided during checkout.",
    ],
  },
  privacy: {
    label: "Privacy Policy",
    title: "Privacy Policy",
    intro:
      "We collect only the information needed to complete bookings, manage support, and improve the travel experience.",
    points: [
      "Contact details are used for ticket delivery, booking alerts, cancellation updates, and support communication.",
      "Passenger and journey information is shared only with relevant travel partners or service providers needed to process the booking.",
      "Payment information is handled through secure payment partners; PickNBook does not ask users to share sensitive payment credentials over calls or chat.",
    ],
  },
  refund: {
    label: "Refund & Cancellation Policy",
    title: "Refund & Cancellation Policy",
    intro:
      "Refunds and cancellation eligibility depend on the operator, fare rules, departure time, and the status of the booking.",
    points: [
      "Cancellation charges, if applicable, are shown according to the selected operator or service rule.",
      "Approved refunds are returned to the original payment method or eligible wallet/balance after partner confirmation.",
      "Non-refundable fares, missed departures, incorrect passenger details, or late cancellation requests may not qualify for a refund.",
    ],
  },
};

export default function SiteFooter() {
  const [activePolicyKey, setActivePolicyKey] = useState(null);
  const [copiedContact, setCopiedContact] = useState(null);
  const activePolicy = activePolicyKey ? FOOTER_POLICIES[activePolicyKey] : null;

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
            <h4>PickNBook Travel Desk</h4>
            <p>Bus booking with fast, transparent workflows.</p>
          </div>

          <Link className="footer-top-btn" to="/?tab=buses">
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
            {Object.entries(FOOTER_POLICIES).map(([key, policy], index) => (
              <React.Fragment key={key}>
                {index > 0 ? <span className="footer-policy-divider">|</span> : null}
                <button
                  className="footer-policy-btn"
                  type="button"
                  onClick={() => setActivePolicyKey(key)}
                >
                  {policy.label}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {activePolicy ? (
        <div
          className="footer-policy-backdrop"
          role="presentation"
          onClick={() => setActivePolicyKey(null)}
        >
          <section
            className="footer-policy-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="footer-policy-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="footer-policy-modal-head">
              <div>
                <span>PickNBook Travel Desk</span>
                <h2 id="footer-policy-title">{activePolicy.title}</h2>
              </div>
              <button
                className="footer-policy-close"
                type="button"
                aria-label="Close policy"
                onClick={() => setActivePolicyKey(null)}
              >
                <X size={18} />
              </button>
            </div>

            <p>{activePolicy.intro}</p>
            <ul>
              {activePolicy.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}
    </footer>
  );
}
