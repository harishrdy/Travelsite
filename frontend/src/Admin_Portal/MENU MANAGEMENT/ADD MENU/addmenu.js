import React, { useState } from "react";
import { Check, List, RotateCcw } from "lucide-react";
import "./addmenu.css";
import { getNextNumericId, useAdminList } from "../../../utils/adminPortalStorage";

const DEFAULT_FORM = {
  name: "",
  slug: "",
  displayTitle: "",
  order: "",
  module: "B2C",
  location: "header",
  status: "active",
};

export default function AdminMenuAddPage({ onBack }) {
  const [formValues, setFormValues] = useState(DEFAULT_FORM);
  const [formError, setFormError] = useState("");
  const [saved, setSaved] = useState(false);
  const [menuItems, setMenuItems] = useAdminList("menu-items", []);

  const handleChange = (field) => (event) => {
    setFormValues((previous) => ({ ...previous, [field]: event.target.value }));
  };

  const handleReset = () => {
    setFormValues(DEFAULT_FORM);
    setFormError("");
    setSaved(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSaved(false);

    const name = String(formValues.name || "").trim();
    const slug = String(formValues.slug || "").trim();
    const displayTitle = String(formValues.displayTitle || "").trim();
    const orderValue = Number(formValues.order);
    const moduleValue = String(formValues.module || "").trim();
    const location = String(formValues.location || "").trim();

    if (!name || !slug || !displayTitle) {
      setFormError("Name, slug, and display title are required.");
      return;
    }

    if (!Number.isFinite(orderValue) || orderValue < 0) {
      setFormError("Enter a valid order number.");
      return;
    }

    if (!moduleValue || !location) {
      setFormError("Module and menu location are required.");
      return;
    }

    setMenuItems((previous) => [
      {
        id: getNextNumericId(previous),
        name,
        slug,
        displayTitle,
        order: orderValue,
        module: moduleValue,
        location,
        status: formValues.status === "inactive" ? "inactive" : "active",
      },
      ...previous,
    ]);
    setFormError("");
    setSaved(true);
  };

  return (
    <section className="flight-markup-panel menu-management-panel">
      <header className="flight-markup-toolbar">
        <div className="flight-markup-title">
          <h1>Add Menu</h1>
          <div className="flight-markup-title-underline" aria-hidden="true" />
        </div>

        {onBack && (
          <div className="flight-markup-actions">
            <button type="button" className="flight-markup-action-btn secondary" onClick={onBack}>
              <List size={16} />
              <span>Menu List</span>
            </button>
          </div>
        )}
      </header>

      <section className="menu-form-shell">
        <form onSubmit={handleSubmit}>
          <div className="admin-markup-form-grid menu-form-grid">
            <label>
              <span>Name</span>
              <input type="text" value={formValues.name} onChange={handleChange("name")} />
            </label>
            <label>
              <span>Slug</span>
              <input type="text" value={formValues.slug} onChange={handleChange("slug")} />
            </label>
            <label>
              <span>Display Title</span>
              <input
                type="text"
                value={formValues.displayTitle}
                onChange={handleChange("displayTitle")}
              />
            </label>
            <label>
              <span>Order</span>
              <input
                type="number"
                min="0"
                value={formValues.order}
                onChange={handleChange("order")}
              />
            </label>
            <label>
              <span>Module</span>
              <select value={formValues.module} onChange={handleChange("module")}>
                <option value="B2C">B2C</option>
                <option value="B2B">B2B</option>
                <option value="Admin">Admin</option>
              </select>
            </label>
            <label>
              <span>Menu Location</span>
              <select value={formValues.location} onChange={handleChange("location")}>
                <option value="header">Header</option>
                <option value="footer">Footer</option>
                <option value="sidebar">Sidebar</option>
              </select>
            </label>
            <label className="wide">
              <span>Status</span>
              <select value={formValues.status} onChange={handleChange("status")}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
          </div>

          {formError && <p className="admin-markup-form-error">{formError}</p>}
          {saved && <p className="menu-form-success">Menu saved locally.</p>}

          <div className="admin-markup-modal-actions menu-form-actions">
            <button type="button" className="secondary" onClick={handleReset}>
              <RotateCcw size={14} />
              Reset
            </button>
            <button type="submit" className="primary">
              <Check size={14} />
              Save Menu
            </button>
          </div>
        </form>
      </section>
    </section>
  );
}
