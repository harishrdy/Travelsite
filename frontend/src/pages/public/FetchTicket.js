import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/images/printticket.png";
import "../../STYLES/FetchTicket.css";
import { fetchTicketByContact } from "../../services/ticketService";

const FetchTicket = () => {
  const navigate = useNavigate();
  const bookingType = "bus";
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleScrollLock = () => {
      const rootEl = document.getElementById("root");
      if (window.innerWidth > 920) {
        document.body.style.setProperty("overflow", "hidden", "important");
        document.documentElement.style.setProperty("overflow", "hidden", "important");
        if (rootEl) {
          rootEl.style.setProperty("overflow", "hidden", "important");
        }
      } else {
        document.body.style.removeProperty("overflow");
        document.documentElement.style.removeProperty("overflow");
        if (rootEl) {
          rootEl.style.removeProperty("overflow");
        }
      }
    };

    handleScrollLock();
    window.addEventListener("resize", handleScrollLock);

    return () => {
      window.removeEventListener("resize", handleScrollLock);
      document.body.style.removeProperty("overflow");
      document.documentElement.style.removeProperty("overflow");
      const rootEl = document.getElementById("root");
      if (rootEl) {
        rootEl.style.removeProperty("overflow");
      }
    };
  }, []);

  const validateForm = () => {
    let nextError = "";
    const mobileDigits = mobile.replace(/\D/g, "");

    if (!mobileDigits) {
      nextError = "Mobile number is required";
    } else if (mobileDigits.length < 10 || mobileDigits.length > 15) {
      nextError = "Enter a valid mobile number";
    }

    if (!email.trim()) {
      nextError = nextError || "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextError = nextError || "Please enter a valid email";
    }

    setError(nextError);
    return !nextError;
  };

  const handleFetchBooking = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    const trimmedMobile = mobile.replace(/\D/g, "");
    const trimmedEmail = email.trim();

    try {
      // fetchTicketByContact now returns an array of tickets
      const resolvedTickets = await fetchTicketByContact({
        mobile: trimmedMobile,
        email: trimmedEmail,
        bookingType,
        activeOnly: true,
      });

      // resolvedTickets is always an array now
      const tickets = Array.isArray(resolvedTickets) ? resolvedTickets : [resolvedTickets];

      if (tickets.length === 0) {
        setError("No active booking found.");
        return;
      }

      // Validate at least the first ticket has a reference
      const firstRef = String(
        tickets[0].bookingReference || tickets[0].pnr || tickets[0].reference || ""
      ).trim();

      if (!firstRef) {
        setError("Booking found, but the ticket reference is missing.");
        return;
      }

      setError("");
      navigate("/print-ticket", {
        state: {
          pnr: tickets.length === 1 ? firstRef : "",
          mobile: trimmedMobile,
          email: trimmedEmail,
          bookingType: tickets[0].ticketType || bookingType,
          ticket: tickets[0],       // first ticket (for backwards compat)
          tickets: tickets,          // ALL tickets
        },
      });
    } catch (fetchError) {
      setError(fetchError.message || "No active booking found");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fetch-ticket-page">
      <section className="fetch-ticket-card">
        <div className="fetch-ticket-visual">
          <img src={logo} alt="Fetch ticket" />
        </div>

        <div className="fetch-ticket-form-wrap">
          <span className="fetch-ticket-kicker">Ticket Access</span>
          <h1>Fetch Ticket</h1>
          <p>Enter your mobile number and email to open an active bus ticket.</p>

          <form onSubmit={handleFetchBooking} className="fetch-ticket-form">
            <label htmlFor="fetch-ticket-mobile">Mobile Number</label>
            <input
              id="fetch-ticket-mobile"
              type="tel"
              value={mobile}
              onChange={(event) => {
                setMobile(event.target.value.replace(/\D/g, "").slice(0, 15));
                if (error) setError("");
              }}
              inputMode="numeric"
              maxLength={15}
              placeholder="Enter mobile number"
              className={error.toLowerCase().includes("mobile") ? "input-error" : ""}
              disabled={loading}
            />

            <label htmlFor="fetch-ticket-email">Email</label>
            <input
              id="fetch-ticket-email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (error) setError("");
              }}
              placeholder="Enter booking email"
              className={error.toLowerCase().includes("email") ? "input-error" : ""}
              disabled={loading}
            />

            {error && <div className="fetch-ticket-error">{error}</div>}

            <button type="submit" className="fetch-ticket-submit" disabled={loading}>
              {loading ? "Fetching..." : "Fetch Booking"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default FetchTicket;
