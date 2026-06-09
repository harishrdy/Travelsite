import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Check, Mail, MapPin, Phone, X } from "lucide-react";
import "../../STYLES/SiteFooter.css";
import pickNBookLogo from "../../assets/images/brand/pick-n-book-logo.png";
import {
  TERMS_CONDITIONS_TEXT,
  PRIVACY_POLICY_TEXT,
  REFUND_CANCELLATION_POLICY_TEXT,
} from "../../data/legalPages";

const SERVICES_LINKS = [
  { label: "Flights", tab: "flights" },
  { label: "Buses", tab: "buses" },
  { label: "Hotels", tab: "hotels" },
];

const FOOTER_POLICY_LINKS = [
  { slug: "terms-conditions", label: "Terms & Conditions" },
  { slug: "privacy-policy", label: "Privacy Policy" },
  { slug: "refund-cancellation-policy", label: "Refund & Cancellation Policy" },
];

export default function SiteFooter() {
  const [copiedContact, setCopiedContact] = useState(null);
  const [activePolicy, setActivePolicy] = useState(null); // null, 'terms-conditions', 'privacy-policy', 'refund-cancellation-policy'
  
  const location = useLocation();
  const navigate = useNavigate();
  const bodyRef = useRef(null);

  // Reset scroll to top of modal body whenever the opened policy changes
  useEffect(() => {
    if (activePolicy && bodyRef.current) {
      bodyRef.current.scrollTop = 0;
    }
  }, [activePolicy]);

  // Support closing modal with Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setActivePolicy(null);
      }
    };
    if (activePolicy) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activePolicy]);

  const handleStartBookingClick = (e) => {
    e.preventDefault();

    const bookingPaths = [
      "/",
      "/search/flights",
      "/search/buses",
      "/search/hotels",
      "/flight/seats",
      "/flight/passenger-details",
      "/flight/payment",
      "/bus/seats",
      "/bus/passenger-details",
      "/bus/payment",
      "/booking/confirmation",
      "/ticket/confirmation",
    ];

    const isBookingPath = bookingPaths.includes(location.pathname);

    if (isBookingPath) {
      const rootEl = document.getElementById("root");
      if (rootEl) {
        rootEl.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else {
      navigate("/");
      window.setTimeout(() => {
        const rootEl = document.getElementById("root");
        if (rootEl) {
          rootEl.scrollTo({ top: 0, behavior: "smooth" });
        }
      }, 100);
    }
  };

  const handleServiceClick = (tab, e) => {
    e.preventDefault();
    navigate(`/?tab=${tab}`);
    window.setTimeout(() => {
      const rootEl = document.getElementById("root");
      if (rootEl) {
        rootEl.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 100);
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

  const getPolicyData = () => {
    switch (activePolicy) {
      case "terms-conditions":
        return {
          title: "Terms & Conditions",
          kicker: "Legal Information",
          text: TERMS_CONDITIONS_TEXT,
        };
      case "privacy-policy":
        return {
          title: "Privacy Policy",
          kicker: "Privacy & Data Protection",
          text: PRIVACY_POLICY_TEXT,
        };
      case "refund-cancellation-policy":
        return {
          title: "Refund & Cancellation Policy",
          kicker: "Refund & Cancellation",
          text: REFUND_CANCELLATION_POLICY_TEXT,
        };
      default:
        return null;
    }
  };

  const formatPolicyText = (text) => {
    if (!text) return null;
    return text
      .split("\n")
      .map((p) => p.trim())
      .filter((p) => p !== "")
      .map((trimmed, index) => {
        const isHeading =
          /^\d+\.\s+[A-Za-z]/.test(trimmed) || /^[a-z]\.\s+[A-Za-z]/.test(trimmed);

        return (
          <p
            key={index}
            className={isHeading ? "policy-heading" : "policy-paragraph"}
            style={
              isHeading
                ? {
                    fontWeight: "700",
                    marginTop: "12px",
                    marginBottom: "4px",
                    fontSize: "14px",
                    color: "#10233d",
                  }
                : { 
                    marginTop: "0px",
                    marginBottom: "6px", 
                    lineHeight: "1.4", 
                    color: "#4c627e",
                    fontSize: "13px"
                  }
            }
          >
            {trimmed}
          </p>
        );
      });
  };

  const policyData = getPolicyData();

  return (
    <footer className="travel-footer">
      <div className="footer-shell">
        <div className="footer-topline">
          <div className="footer-branding">
            <img className="footer-brand-logo" src={pickNBookLogo} alt="Pick N Book" />
            <p>Bus booking with fast, transparent workflows.</p>
          </div>

          <button
            type="button"
            className="footer-top-btn"
            onClick={handleStartBookingClick}
            style={{ cursor: "pointer" }}
          >
            Start Booking
          </button>
        </div>

        <nav className="footer-quick-links" aria-label="Footer quick links">
          {SERVICES_LINKS.map((item) => (
            <button
              key={item.label}
              type="button"
              className="footer-link-item"
              onClick={(e) => handleServiceClick(item.tab, e)}
              style={{
                cursor: "pointer",
                outline: "none",
                fontFamily: "inherit",
              }}
            >
              {item.label}
            </button>
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
                <button
                  type="button"
                  className="footer-policy-btn"
                  onClick={() => setActivePolicy(policy.slug)}
                  style={{
                    cursor: "pointer",
                    outline: "none",
                    fontFamily: "inherit",
                  }}
                >
                  {policy.label}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Modern Glassmorphic Policy Modal Overlay */}
      {activePolicy && policyData && (
        <div
          className="footer-policy-backdrop"
          onClick={() => setActivePolicy(null)}
          style={{ display: "grid", placeItems: "center" }}
        >
          <div
            className="footer-policy-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="footer-policy-modal-head">
              <div>
                <span>{policyData.kicker}</span>
                <h2>{policyData.title}</h2>
              </div>
              <button
                type="button"
                className="footer-policy-close"
                onClick={() => setActivePolicy(null)}
                aria-label="Close policy modal"
              >
                <X size={18} />
              </button>
            </div>
            <div
              className="footer-policy-modal-body"
              ref={bodyRef}
              style={{
                overflowY: "auto",
                flex: "1",
                marginTop: "16px",
                paddingRight: "8px",
              }}
            >
              {formatPolicyText(policyData.text)}
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
