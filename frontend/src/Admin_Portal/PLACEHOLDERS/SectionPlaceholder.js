import React, { useMemo, useState } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import { getNextNumericId, useAdminList } from "../../utils/adminPortalStorage";

function SectionPlaceholder({ title, description, kicker = "Admin Portal" }) {
  const location = useLocation();
  const storageKey = useMemo(() => {
    const slug = String(location?.pathname || title || "admin-module")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    return `placeholder-${slug}`;
  }, [location?.pathname, title]);

  const [items, setItems] = useAdminList(storageKey, []);
  const [formValues, setFormValues] = useState({
    label: "",
    status: "active",
    note: "",
  });
  const [editItem, setEditItem] = useState(null);
  const [error, setError] = useState("");

  const handleChange = (field) => (event) => {
    setFormValues((previous) => ({ ...previous, [field]: event.target.value }));
  };

  const handleAdd = () => {
    const label = String(formValues.label || "").trim();
    if (!label) {
      setError("Title is required.");
      return;
    }

    setItems((previous) => [
      {
        id: getNextNumericId(previous),
        label,
        status: formValues.status === "inactive" ? "inactive" : "active",
        note: String(formValues.note || "").trim(),
        updatedAt: new Date().toISOString(),
      },
      ...previous,
    ]);
    setFormValues({ label: "", status: "active", note: "" });
    setError("");
  };

  const handleDelete = (id) => {
    setItems((previous) => previous.filter((item) => item.id !== id));
  };

  const openEdit = (item) => {
    setEditItem({ ...item });
    setError("");
  };

  const handleEditSave = () => {
    if (!editItem) {
      return;
    }

    const label = String(editItem.label || "").trim();
    if (!label) {
      setError("Title is required.");
      return;
    }

    setItems((previous) =>
      previous.map((item) =>
        item.id === editItem.id
          ? {
              ...item,
              label,
              status: editItem.status === "inactive" ? "inactive" : "active",
              note: String(editItem.note || "").trim(),
              updatedAt: new Date().toISOString(),
            }
          : item
      )
    );
    setEditItem(null);
    setError("");
  };

  const handleEditChange = (field) => (event) => {
    setEditItem((previous) => ({ ...previous, [field]: event.target.value }));
  };

  return (
    <section className="admin-placeholder">
      <p className="admin-placeholder-kicker">{kicker}</p>
      <h1 className="admin-placeholder-title">{title}</h1>
      <p className="admin-placeholder-subtitle">{description}</p>

      <div className="admin-placeholder-manager">
        <div className="admin-placeholder-toolbar">
          <label>
            <span>Title</span>
            <input
              type="text"
              placeholder="Add a new record"
              value={formValues.label}
              onChange={handleChange("label")}
            />
          </label>
          <label>
            <span>Status</span>
            <select value={formValues.status} onChange={handleChange("status")}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
          <label className="wide">
            <span>Note</span>
            <input
              type="text"
              placeholder="Optional note"
              value={formValues.note}
              onChange={handleChange("note")}
            />
          </label>
          <button type="button" className="primary" onClick={handleAdd}>
            <Check size={16} />
            Add Entry
          </button>
        </div>

        {error ? <p className="admin-placeholder-error">{error}</p> : null}

        <div className="admin-placeholder-table">
          <div className="admin-placeholder-table-head">
            <span>ID</span>
            <span>Title</span>
            <span>Status</span>
            <span>Updated</span>
            <span className="action-col">Action</span>
          </div>

          {items.length === 0 ? (
            <div className="admin-placeholder-empty">No entries yet. Add one to get started.</div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="admin-placeholder-row">
                <span>{item.id}</span>
                <span>{item.label}</span>
                <span className={`status ${item.status}`}>{item.status}</span>
                <span>{new Date(item.updatedAt).toLocaleString()}</span>
                <span className="action-col">
                  <button type="button" onClick={() => openEdit(item)} aria-label="Edit entry">
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    className="danger"
                    onClick={() => handleDelete(item.id)}
                    aria-label="Delete entry"
                  >
                    <Trash2 size={14} />
                  </button>
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {editItem && (
        <div className="admin-placeholder-modal-backdrop" onClick={() => setEditItem(null)}>
          <section
            className="admin-placeholder-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Edit entry"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <h2>Edit Entry</h2>
              <button type="button" onClick={() => setEditItem(null)} aria-label="Close edit dialog">
                <X size={16} />
              </button>
            </header>

            <div className="admin-placeholder-modal-grid">
              <label>
                <span>Title</span>
                <input type="text" value={editItem.label} onChange={handleEditChange("label")} />
              </label>
              <label>
                <span>Status</span>
                <select value={editItem.status} onChange={handleEditChange("status")}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
              <label className="wide">
                <span>Note</span>
                <input type="text" value={editItem.note} onChange={handleEditChange("note")} />
              </label>
            </div>

            <div className="admin-placeholder-modal-actions">
              <button type="button" className="secondary" onClick={() => setEditItem(null)}>
                Cancel
              </button>
              <button type="button" className="primary" onClick={handleEditSave}>
                Save
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

export default SectionPlaceholder;
