import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  BusFront,
  ChevronDown,
  CircleUserRound,
  Compass,
  LayoutDashboard,
  LogIn,
  LogOut,
  PlaneTakeoff,
  Ticket,
  User,
} from "lucide-react";
import '../../STYLES/Topbar.css';

function decodeJwtPayload(token) {
  if (!token || typeof token !== "string") {
    return {};
  }

  const parts = token.split(".");
  if (parts.length < 2) {
    return {};
  }

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const payload = atob(padded);
    return JSON.parse(payload);
  } catch {
    return {};
  }
}

function pickFirst(values, fallback = "") {
  for (const value of values) {
    if (value !== undefined && value !== null) {
      const text = String(value).trim();
      if (text) {
        return text;
      }
    }
  }

  return fallback;
}

function getAuthProfile() {
  const rawUser = localStorage.getItem("user");
  const token = localStorage.getItem("token");
  const tokenPayload = decodeJwtPayload(token);
  let parsedUser = {};

  if (rawUser) {
    try {
      parsedUser = JSON.parse(rawUser) || {};
    } catch {
      parsedUser = { name: rawUser };
    }
  }

  const email = pickFirst(
    [
      parsedUser.email,
      parsedUser.Email,
      tokenPayload.email,
      tokenPayload.upn,
      tokenPayload.unique_name,
    ],
    ""
  );
  const displayName = pickFirst(
    [
      parsedUser.firstName,
      parsedUser.FirstName,
      parsedUser.name,
      parsedUser.Name,
      tokenPayload.given_name,
      tokenPayload.name,
      email.split("@")[0],
    ],
    "User"
  );

  return {
    isLoggedIn: Boolean(rawUser || token),
    displayName: displayName.charAt(0).toUpperCase() + displayName.slice(1),
    email,
  };
}

export default function Topbar() {
  const [open, setOpen] = useState(false);
  const [authProfile, setAuthProfile] = useState(() => getAuthProfile());
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const isDashboard = location.pathname.startsWith("/dashboard");
  const currentHomeTab =
    new URLSearchParams(location.search).get("tab") === "buses"
      ? "buses"
      : "flights";
  const isHome = location.pathname === "/";

  const syncAuthState = () => {
    setAuthProfile(getAuthProfile());
  };

  useEffect(() => {
    syncAuthState();
    setOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handleStorage = () => syncAuthState();

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    localStorage.removeItem("challengeId");
    setAuthProfile({ isLoggedIn: false, displayName: "User", email: "" });
    setOpen(false);
    navigate("/login");
  };

  const handleLogin = () => {
    setOpen(false);
    navigate("/login");
  };

  return (
    <header className="topbar">
      <button type="button" className="brand" onClick={() => navigate("/?tab=flights")}>
        <span className="brand-icon">
          <Compass size={18} />
        </span>
        <span className="brand-copy">
          <span className="brand-title">
            Travel<span className="brand-title-accent">....</span>
          </span>
          <span className="brand-subtitle">Flights and Buses</span>
        </span>
      </button>

      <div className="right-section">
        <div className="menu">
          <Link
            to="/?tab=flights"
            className={`menu-item ${isHome && currentHomeTab === "flights" ? "active" : ""}`}
          >
            <PlaneTakeoff size={16} />
            <span>Flights</span>
          </Link>
          <Link
            to="/?tab=buses"
            className={`menu-item ${isHome && currentHomeTab === "buses" ? "active" : ""}`}
          >
            <BusFront size={16} />
            <span>Buses</span>
          </Link>
          <NavLink
            to="/web-checkin"
            className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}
          >
            <Ticket size={16} />
            <span>Web Check-in</span>
          </NavLink>
          <NavLink
            to="/fetch-ticket"
            className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}
          >
            <Ticket size={16} />
            <span>Print Ticket</span>
          </NavLink>
        </div>

        <div className="user-section" ref={dropdownRef}>
          <button
            type="button"
            className={`user-name ${authProfile.isLoggedIn ? "authenticated" : "guest"}`}
            onClick={() => setOpen((previous) => !previous)}
            aria-haspopup="menu"
            aria-expanded={open}
            aria-label={authProfile.isLoggedIn ? `${authProfile.displayName} menu` : "Account menu"}
          >
            {!authProfile.isLoggedIn && <CircleUserRound size={18} />}
            {authProfile.isLoggedIn && (
              <span className="user-trigger-name">{authProfile.displayName}</span>
            )}
            <ChevronDown size={16} className={`dropdown-caret ${open ? "open" : ""}`} />
          </button>

          {open && (
            <div className="dropdown" role="menu">
              {!authProfile.isLoggedIn && (
                <button type="button" className="dropdown-item" onClick={handleLogin}>
                  <LogIn size={15} />
                  Login
                </button>
              )}

              {authProfile.isLoggedIn && !isDashboard && (
                <>
                  <Link to="/dashboard" className="dropdown-item" onClick={() => setOpen(false)}>
                    <LayoutDashboard size={15} />
                    Dashboard
                  </Link>

                  <button type="button" className="dropdown-item logout" onClick={handleLogout}>
                    <LogOut size={15} />
                    Logout
                  </button>
                </>
              )}

              {authProfile.isLoggedIn && isDashboard && (
                <>
                  <Link to="/dashboard/my-account" className="dropdown-item" onClick={() => setOpen(false)}>
                    <User size={15} />
                    My Account
                  </Link>

                  <button type="button" className="dropdown-item logout" onClick={handleLogout}>
                    <LogOut size={15} />
                    Logout
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
