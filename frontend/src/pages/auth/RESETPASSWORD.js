import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlaneDeparture, FaSyncAlt, FaBus, FaLock, FaTags, FaShieldAlt, FaCar, FaHeadset, FaUserFriends, FaTicketAlt, FaMapMarkerAlt, FaStar } from "react-icons/fa";
import "../../STYLES/Login.css";
import "../../STYLES/RESETPASSWORD.css";
import "../../STYLES/Register.css";
import { readApiMessage, requestAuth } from "../../services/authService";
import { validateLowercaseEmail } from "../../utils/authValidation";
import { generateMixedCaptcha, validateCaptcha } from "../../utils/captcha";
// import flightCarImage from "../../assets/images/flightcar.png";
import flightCarImage from "../../assets/images/new-landscape-bg.jpg";
import brandLogo from "../../assets/images/brand/pick-n-book-logo.svg";

const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [generatedCaptcha, setGeneratedCaptcha] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiMessage, setApiMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();
  const authPageStyle = {
    backgroundImage: `url(${flightCarImage})`
  };

  const generateCaptcha = () => {
    setGeneratedCaptcha(generateMixedCaptcha());
    setCaptchaInput("");
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const showEmailSpaceError = () => {
    setErrors((prev) => ({
      ...prev,
      email: "Email cannot contain spaces",
    }));
    setApiMessage("");
    setIsSuccess(false);
  };

  const handleEmailKeyDown = (event) => {
    if (event.key === " ") {
      event.preventDefault();
      showEmailSpaceError();
    }
  };

  const handleEmailPaste = (event) => {
    if (/\s/.test(event.clipboardData.getData("text"))) {
      event.preventDefault();
      showEmailSpaceError();
    }
  };

  const validate = () => {
    const newErrors = {};
    const emailError = validateLowercaseEmail(email);

    if (emailError) {
      newErrors.email = emailError;
    }

    const captchaError = validateCaptcha(captchaInput, generatedCaptcha);

    if (captchaError) {
      newErrors.captcha = captchaError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setApiMessage("");
    setIsSuccess(false);

    try {
      const resetEmail = email.trim();
      const payload = await requestAuth(
        "/api/Auth/forgot-password/send-otp",
        {
          method: "POST",
          body: JSON.stringify({ email: resetEmail })
        },
        "Failed to send OTP."
      );
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("passwordResetEmail", resetEmail);
      }
      setIsSuccess(true);
      setApiMessage(
        readApiMessage(payload, "If the email is registered, an OTP has been sent.")
      );
      setTimeout(() => {
        navigate("/verify", { state: { email: resetEmail } });
      }, 1200);
    } catch (error) {
      setIsSuccess(false);
      setApiMessage(error?.message || "Something went wrong. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div
      className="travel-auth-page travel-auth-forgot"
      style={authPageStyle}
    >
      <div className="travel-auth-left-content">
        <h1 className="travel-hero-title">Travel More, Worry Less</h1>
        <p className="travel-hero-subtitle">Join millions of happy travelers and book your next journey with ease.</p>

        <ul className="travel-benefits-list">
          <li>
            <span className="travel-benefit-icon"><FaTags /></span>
            <div className="travel-benefit-text">
              <strong>Best Prices Guaranteed</strong>
              <span>Get the best deals on flights, buses and more.</span>
            </div>
          </li>
          <li>
            <span className="travel-benefit-icon"><FaShieldAlt /></span>
            <div className="travel-benefit-text">
              <strong>Safe & Secure Payments</strong>
              <span>Your payments and personal details are 100% secure.</span>
            </div>
          </li>
          <li>
            <span className="travel-benefit-icon"><FaCar /></span>
            <div className="travel-benefit-text">
              <strong>Wide Choices</strong>
              <span>Choose from thousands of routes, buses and schedules.</span>
            </div>
          </li>
          <li>
            <span className="travel-benefit-icon"><FaHeadset /></span>
            <div className="travel-benefit-text">
              <strong>24/7 Customer Support</strong>
              <span>Our support team is always here to help you anytime.</span>
            </div>
          </li>
        </ul>

        <div className="travel-stats-bar">
          <div className="travel-stat-item">
            <div className="travel-stat-icon text-orange"><FaUserFriends /></div>
            <div className="travel-stat-text"><strong>10M+</strong><br /><span>Happy Users</span></div>
          </div>
          <div className="travel-stat-item">
            <div className="travel-stat-icon text-blue"><FaTicketAlt /></div>
            <div className="travel-stat-text"><strong>200K+</strong><br /><span>Daily Bookings</span></div>
          </div>
          <div className="travel-stat-item">
            <div className="travel-stat-icon text-green"><FaMapMarkerAlt /></div>
            <div className="travel-stat-text"><strong>5000+</strong><br /><span>Routes Covered</span></div>
          </div>
          <div className="travel-stat-item">
            <div className="travel-stat-icon text-purple"><FaStar /></div>
            <div className="travel-stat-text"><strong>4.8 <FaStar className="small-star" /></strong><br /><span>Average Rating</span></div>
          </div>
        </div>
      </div>

      <div className="travel-auth-card">

        <div className="travel-auth-lock-wrapper">
          <div className="travel-auth-lock-icon">
            <FaLock />
          </div>
        </div>

        <section className="travel-auth-form-panel">
          <img
            src={brandLogo}
            alt="Pick N Book"
            className="auth-brand-logo auth-brand-logo-form"
          />
          <h2 className="travel-auth-heading">Forgot password</h2>
          <p className="travel-auth-subheading">
            Enter your registered email and we will send an OTP.
          </p>

          {apiMessage && (
            <p
              className={`travel-auth-status ${isSuccess ? "is-success" : "is-error"}`}
            >
              {apiMessage}
            </p>
          )}

          <form className="travel-auth-form" onSubmit={handleSubmit} noValidate>
            <div className="travel-field">
              <label htmlFor="forgot-email">E-mail Address</label>
              <div className="travel-field-line">
                <input
                  id="forgot-email"
                  type="email"
                  placeholder="Enter your registered e-mail"
                  value={email}
                  autoCapitalize="none"
                  spellCheck={false}
                  onKeyDown={handleEmailKeyDown}
                  onPaste={handleEmailPaste}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors((prev) => ({
                      ...prev,
                      email: validateLowercaseEmail(e.target.value) || "",
                    }));
                    setApiMessage("");
                    setIsSuccess(false);
                  }}
                />
              </div>
              <p className="travel-field-error">{errors.email || "\u00A0"}</p>
            </div>

            <div className="travel-field">
              <label htmlFor="forgot-captcha">Captcha</label>
              <div className="travel-captcha-row">
                <div className="travel-captcha-display" aria-label="Captcha code">
                  {generatedCaptcha.split("").map((char, index) => (
                    <span key={`${char}-${index}`}>{char}</span>
                  ))}
                </div>
                <button
                  type="button"
                  className="travel-captcha-refresh"
                  onClick={generateCaptcha}
                >
                  <FaSyncAlt />
                  <span>Refresh</span>
                </button>
              </div>
              <div className="travel-field-line">
                <input
                  id="forgot-captcha"
                  type="text"
                  placeholder="Enter captcha code"
                  value={captchaInput}
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  maxLength={generatedCaptcha.length || 5}
                  onChange={(e) => {
                    const nextCaptcha = e.target.value;
                    setCaptchaInput(nextCaptcha);
                    setErrors((prev) => ({
                      ...prev,
                      captcha: /\s/.test(nextCaptcha)
                        ? "Captcha cannot contain spaces"
                        : "",
                    }));
                    setApiMessage("");
                    setIsSuccess(false);
                  }}
                />
              </div>
              <p className="travel-field-error">{errors.captcha || "\u00A0"}</p>
            </div>

            <div className="travel-auth-links">
              <button type="button" onClick={() => navigate("/login")}>
                Back to Login
              </button>
              <button type="button" onClick={() => navigate("/register")}>
                Create Account
              </button>
            </div>

            <div className="travel-auth-actions">
              <button
                type="submit"
                className="travel-btn travel-btn-primary"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send OTP"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};

export default ResetPassword;
