import React from "react";
import { NavLink } from "react-router-dom";
import {
  BusFront,
  KeyRound,
  LayoutDashboard,
  PlaneTakeoff,
  UserRound,
  Users,
} from "lucide-react";

const MAIN_LINKS = [
  { id: "nav-2", to: "/dashboard/traveler-list", label: "Traveler List", icon: Users },
  { id: "nav-3", to: "/dashboard/flight-bookings", label: "Flight Bookings", icon: PlaneTakeoff },
  { id: "nav-4", to: "/dashboard/bus-bookings", label: "Bus Bookings", icon: BusFront },

];


const PROFILE_LINKS = [
  { id: "profile-2", to: "/change-password", label: "Change Password", icon: KeyRound },
];

function navItemClassName({ isActive }) {
  return `sidebar-item ${isActive ? "active" : ""}`;
}

export default function DashboardSidebar() {
  return (
    <aside className="dashboard-sidebar">
      <nav className="sidebar-nav" aria-label="Dashboard navigation">
        <NavLink to="/dashboard" end className={navItemClassName} title="Dashboard">
          <LayoutDashboard size={16} />
          <span>Dashboard</span>
        </NavLink>

        {MAIN_LINKS.map((item) => (
          <NavLink key={item.id} to={item.to} className={navItemClassName} title={item.label}>
            <item.icon size={16} />
            <span>{item.label}</span>
          </NavLink>
        ))}

        <div className="sidebar-divider" />

        {PROFILE_LINKS.map((item) => (
          <NavLink key={item.id} to={item.to} className={navItemClassName} title={item.label}>
            <item.icon size={16} />
            <span>{item.label}</span>
          </NavLink>
        ))}

        <NavLink to="my-account" className={navItemClassName} title="My Account">
          <UserRound size={16} />
          <span>My Account</span>
        </NavLink>
      </nav>
    </aside >
  );
}
