import React, { useState } from "react";
import "./adminpin.css";
import Adminlogo from "../adminlogo.png";
import TravelBusImg from "../travel_bus.png";
import { useNavigate } from "react-router-dom";
import { requestAuth } from "../../../services/authService";

export default function AdminPin() {
  const navigate = useNavigate();
  const [captcha, setCaptcha] = useState("3714");
  const [pin, setPin] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const challengeId = localStorage.getItem("adminChallengeId") || localStorage.getItem("challengeId");

  const refreshCaptcha = () => {
    const num = Math.floor(1000 + Math.random() * 9000);
    setCaptcha(num.toString());
  };

  const handleVerify = async (e) => {
    e.preventDefault();

    if (!pin) {
      setError("Enter OTP");
      return;
    }

    if (captchaInput !== captcha) {
      setError("Captcha incorrect");
      return;
    }

    try {
      setLoading(true);

      const data = await requestAuth(
        "/api/Auth/admin/login/verify-otp",
        {
          method: "POST",
          body: JSON.stringify({
            challengeId: challengeId,
            otp: pin,
          }),
        },
        "Invalid OTP"
      );

      const rawToken = data?.token || data?.Token || data?.tokenString || data?.data?.token || "";
      const rawRole = data?.role || data?.Role || data?.data?.role || "admin";
      const rawId = data?.adminId || data?.userId || data?.id || data?.AdminId || data?.UserId || data?.Id || data?.data?.adminId || data?.data?.userId || data?.data?.id || "";
      const rawName = data?.name || data?.fullName || data?.email || data?.data?.name || "Admin";
      const rawEmail = data?.email || data?.data?.email || localStorage.getItem("adminLoginEmail") || "";

      const sanitize = (val) => {
        const text = String(val ?? "").trim();
        return (text === "undefined" || text === "null") ? "" : text;
      };

      localStorage.setItem("adminToken", sanitize(rawToken));
      localStorage.setItem("adminRole", sanitize(rawRole) || "admin");
      localStorage.setItem("adminId", sanitize(rawId));
      localStorage.setItem("adminName", sanitize(rawName) || "Admin");
      localStorage.setItem("adminEmail", sanitize(rawEmail));
      localStorage.removeItem("adminChallengeId");
      localStorage.removeItem("challengeId");

      navigate("/admin");
    } catch (err) {
      setError(err?.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pin-wrapper">

      {/* ── LEFT SIDE (Logo) ── */}
      <div className="pin-left">
        <span className="pin-plane" aria-hidden="true">✈</span>
        <div className="pin-logo-box">
          <img src={Adminlogo} alt="Travel Adventures Logo" className="pin-logo-img" />
        </div>
      </div>

      {/* ── RIGHT SIDE (Verify Card) ── */}
      <div className="pin-right">
        <img src={TravelBusImg} alt="" className="pin-bus-img" aria-hidden="true" />

        <div className="pin-box">
          <h2 className="pin-title">Verify OTP</h2>

          <div className="info">Please enter the PIN sent to your email</div>

          <form onSubmit={handleVerify}>
            <input
              placeholder="Enter OTP"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError("");
              }}
            />

            <div className="captcha-row">
              <div className="captcha-code">{captcha}</div>
              <button
                type="button"
                className="refresh-btn"
                onClick={refreshCaptcha}
              >
                Refresh
              </button>
            </div>

            <input
              placeholder="Enter Captcha"
              value={captchaInput}
              onChange={(e) => {
                setCaptchaInput(e.target.value);
                setError("");
              }}
            />

            {error && <div className="error">{error}</div>}

            <button className="verify-btn" disabled={loading}>
              {loading ? "Verifying..." : "Verify"}
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}
