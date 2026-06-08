import React, { useState } from "react";
import { Download, Eye, Pencil, PlaneTakeoff, Plus, Trash2, X } from "lucide-react";
import "./FlightMarkupList.css";
import { formatCurrency, formatDateTime } from "../../../utils/adminPortalUtils";
import { getNextNumericId, useAdminList } from "../../../utils/adminPortalStorage";

const INITIAL_FLIGHT_MARKUP_ROWS = [
  {
    id: "F102",
    domInt: "DOM",
    markupType: "fix",
    value: 250,
    airlineType: "LCC",
    airlineName: "IndiGo",
    code: "6E",
    fareType: "Regular",
    updatedBy: "Admin",
    updatedOn: "2026-03-15T09:12:00.000Z",
  },
  {
    id: "F103",
    domInt: "INT",
    markupType: "percent",
    value: 3,
    airlineType: "GDS",
    airlineName: "Emirates",
    code: "EK",
    fareType: "Special",
    updatedBy: "Pick N Book",
    updatedOn: "2026-03-14T16:40:00.000Z",
  },
];

const DEFAULT_MARKUP_FORM = {
  domInt: "Domestic",
  markupType: "Fix",
  value: "",
  airlineType: "ALL",
  sourceType: "All",
};

const getNextFlightMarkupId = (rows) => {
  const numericRows = rows.map((row) => ({
    id: Number(String(row.id || "").replace(/\D/g, "")) || 0,
  }));
  const nextValue = getNextNumericId(numericRows, 100);
  return `F${nextValue}`;
};

export default function AdminFlightMarkupListPage() {
  const [flightRows, setFlightRows] = useAdminList("flight-markup", INITIAL_FLIGHT_MARKUP_ROWS);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formValues, setFormValues] = useState(DEFAULT_MARKUP_FORM);
  const [addError, setAddError] = useState("");
  const [viewRow, setViewRow] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);
  const [editError, setEditError] = useState("");
  const colWidths = [
    "4%",
    "6%",
    "6%",
    "8%",
    "7%",
    "8%",
    "14%",
    "6%",
    "8%",
    "10%",
    "13%",
    "10%",
  ];
  const headers = [
    "SN",
    "ID",
    "Dom/Int",
    "Markup Type",
    "Value",
    "Airline Type",
    "Airline Name",
    "Code",
    "Fare Type",
    "Updated By",
    "Updated On",
    "Action",
  ];

  const handleOpenAdd = () => {
    setAddError("");
    setFormValues(DEFAULT_MARKUP_FORM);
    setIsAddOpen(true);
  };

  const handleCloseAdd = () => {
    setIsAddOpen(false);
  };

  const handleFormChange = (field) => (event) => {
    setFormValues((previous) => ({ ...previous, [field]: event.target.value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const amount = Number(formValues.value);
    if (!Number.isFinite(amount) || amount < 0) {
      setAddError("Enter a valid markup value.");
      return;
    }

    const domIntCode = formValues.domInt === "International" ? "INT" : "DOM";
    const markupType = String(formValues.markupType || "Fix").toLowerCase();
    const airlineType = formValues.airlineType || "ALL";
    const sourceType = formValues.sourceType || "All";

    const newRow = {
      id: getNextFlightMarkupId(flightRows),
      domInt: domIntCode,
      markupType,
      value: amount,
      airlineType,
      airlineName: airlineType === "ALL" ? "All Airlines" : "Generic Airline",
      code: airlineType === "ALL" ? "ALL" : "NA",
      fareType: sourceType === "Manual" ? "Manual" : "Regular",
      updatedBy: "Admin",
      updatedOn: new Date().toISOString(),
    };

    setFlightRows((previous) => [newRow, ...previous]);
    setIsAddOpen(false);
    setAddError("");
  };

  const handleReset = () => {
    setAddError("");
    setFormValues(DEFAULT_MARKUP_FORM);
  };

  const openEditModal = (row) => {
    setEditError("");
    setEditRow({
      ...row,
      domInt: row.domInt || "DOM",
      markupType: String(row.markupType || "fix").toLowerCase(),
      value: String(row.value ?? ""),
      airlineType: row.airlineType || "ALL",
      airlineName: row.airlineName || "",
      code: row.code || "",
      fareType: row.fareType || "",
      updatedBy: row.updatedBy || "",
    });
  };

  const handleEditSave = () => {
    if (!editRow) {
      return;
    }

    const amount = Number(editRow.value);
    if (!Number.isFinite(amount) || amount < 0) {
      setEditError("Enter a valid markup value.");
      return;
    }

    if (!String(editRow.updatedBy).trim()) {
      setEditError("Updated by is required.");
      return;
    }

    setFlightRows((previous) =>
      previous.map((row) =>
        row.id === editRow.id
          ? {
              ...row,
              domInt: editRow.domInt,
              markupType: editRow.markupType,
              value: amount,
              airlineType: editRow.airlineType,
              airlineName: editRow.airlineName.trim(),
              code: editRow.code.trim(),
              fareType: editRow.fareType.trim(),
              updatedBy: editRow.updatedBy.trim(),
              updatedOn: new Date().toISOString(),
            }
          : row
      )
    );
    setEditRow(null);
    setEditError("");
  };

  const handleDeleteConfirm = () => {
    if (!deleteRow) {
      return;
    }

    setFlightRows((previous) => previous.filter((row) => row.id !== deleteRow.id));
    setDeleteRow(null);
    setViewRow((previous) => (previous?.id === deleteRow.id ? null : previous));
    setEditRow((previous) => (previous?.id === deleteRow.id ? null : previous));
  };

  return (
    <section className="admin-b2c-page flight-markup-panel">
      <header className="flight-markup-toolbar">
        <div className="flight-markup-title">
          <h1>B2C Flight Markup List</h1>
          <div className="flight-markup-title-underline" aria-hidden="true" />
        </div>

        <div className="flight-markup-actions">
          <button type="button" className="flight-markup-action-btn primary" onClick={handleOpenAdd}>
            <Plus size={16} />
            <span>Add Flight Markup</span>
          </button>
          <button type="button" className="flight-markup-action-btn secondary">
            <Download size={16} />
            <span>Export</span>
          </button>
        </div>
      </header>

      {isAddOpen && (
        <div className="flight-markup-modal-backdrop" onClick={handleCloseAdd}>
          <section
            className="flight-markup-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Add B2C Flight Markup"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flight-markup-modal-header">
              <h2>Add B2C Flight Markup</h2>
              <button
                type="button"
                className="flight-markup-modal-close"
                onClick={handleCloseAdd}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </header>

            <form className="flight-markup-modal-form" onSubmit={handleSubmit}>
              <div className="flight-markup-modal-grid">
                <label className="flight-markup-modal-field">
                  <span>Domestic/International</span>
                  <select value={formValues.domInt} onChange={handleFormChange("domInt")}>
                    <option value="Domestic">Domestic</option>
                    <option value="International">International</option>
                  </select>
                </label>

                <label className="flight-markup-modal-field">
                  <span>Markup Type</span>
                  <select value={formValues.markupType} onChange={handleFormChange("markupType")}>
                    <option value="Fix">Fix</option>
                    <option value="Percent">Percent</option>
                  </select>
                </label>

                <label className="flight-markup-modal-field">
                  <span>Value</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formValues.value}
                    onChange={handleFormChange("value")}
                    placeholder="Enter value"
                  />
                </label>

                <label className="flight-markup-modal-field">
                  <span>Airline Type</span>
                  <select value={formValues.airlineType} onChange={handleFormChange("airlineType")}>
                    <option value="ALL">ALL</option>
                    <option value="LCC">LCC</option>
                    <option value="GDS">GDS</option>
                  </select>
                </label>

                <label className="flight-markup-modal-field wide">
                  <span>Source Type</span>
                  <select value={formValues.sourceType} onChange={handleFormChange("sourceType")}>
                    <option value="All">All</option>
                    <option value="API">API</option>
                    <option value="Manual">Manual</option>
                  </select>
                </label>
              </div>

              {addError && <p className="admin-markup-form-error">{addError}</p>}

              <div className="flight-markup-modal-actions">
                <button type="submit" className="primary">
                  Submit
                </button>
                <button type="button" className="secondary" onClick={handleReset}>
                  Reset
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      <section className="flight-markup-table-wrap">
        <div className="flight-markup-table-scroll">
          <table className="flight-markup-table">
            <colgroup>
              {colWidths.map((width, index) => (
                <col key={`${width}-${index}`} style={{ width }} />
              ))}
            </colgroup>
            <thead>
              <tr>
                {headers.map((header) => (
                  <th key={header}>
                    <div className="flight-markup-th-pill">
                      {header === "Code" ? (
                        <>
                          <PlaneTakeoff size={14} />
                          <span>{header}</span>
                        </>
                      ) : (
                        <span>{header}</span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {flightRows.length === 0 ? (
                <tr>
                  <td colSpan={headers.length} className="flight-markup-empty-cell">
                    <span className="flight-markup-empty">No Record Found...</span>
                  </td>
                </tr>
              ) : (
                flightRows.map((row, index) => {
                  const valueLabel =
                    String(row.markupType || "").toLowerCase() === "percent"
                      ? `${Number(row.value) || 0}%`
                      : formatCurrency(row.value);

                  return (
                    <tr key={row.id}>
                      <td>{index + 1}</td>
                      <td>{row.id}</td>
                      <td>{row.domInt}</td>
                      <td>{row.markupType}</td>
                      <td>{valueLabel}</td>
                      <td>{row.airlineType}</td>
                      <td>{row.airlineName}</td>
                      <td>{row.code}</td>
                      <td>{row.fareType}</td>
                      <td>{row.updatedBy}</td>
                      <td>{formatDateTime(row.updatedOn)}</td>
                      <td>
                        <div className="flight-markup-row-actions" aria-label="Row actions">
                          <button
                            type="button"
                            title="View"
                            aria-label={`View ${row.id}`}
                            onClick={() => setViewRow(row)}
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            type="button"
                            title="Edit"
                            aria-label={`Edit ${row.id}`}
                            onClick={() => openEditModal(row)}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            title="Delete"
                            aria-label={`Delete ${row.id}`}
                            className="danger"
                            onClick={() => setDeleteRow(row)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {viewRow && (
        <div className="admin-markup-modal-backdrop" onClick={() => setViewRow(null)}>
          <section
            className="admin-markup-modal"
            role="dialog"
            aria-modal="true"
            aria-label="View flight markup details"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <h2>View Flight Markup</h2>
              <button type="button" onClick={() => setViewRow(null)} aria-label="Close view dialog">
                <X size={16} />
              </button>
            </header>

            <div className="admin-markup-modal-grid">
              <div>
                <span>ID</span>
                <strong>{viewRow.id}</strong>
              </div>
              <div>
                <span>Domestic/International</span>
                <strong>{viewRow.domInt}</strong>
              </div>
              <div>
                <span>Markup Type</span>
                <strong>{viewRow.markupType}</strong>
              </div>
              <div>
                <span>Value</span>
                <strong>
                  {String(viewRow.markupType || "").toLowerCase() === "percent"
                    ? `${Number(viewRow.value) || 0}%`
                    : formatCurrency(viewRow.value)}
                </strong>
              </div>
              <div>
                <span>Airline Type</span>
                <strong>{viewRow.airlineType}</strong>
              </div>
              <div>
                <span>Airline Name</span>
                <strong>{viewRow.airlineName}</strong>
              </div>
              <div>
                <span>Code</span>
                <strong>{viewRow.code}</strong>
              </div>
              <div>
                <span>Fare Type</span>
                <strong>{viewRow.fareType}</strong>
              </div>
              <div>
                <span>Updated By</span>
                <strong>{viewRow.updatedBy}</strong>
              </div>
              <div>
                <span>Updated On</span>
                <strong>{formatDateTime(viewRow.updatedOn)}</strong>
              </div>
            </div>

            <div className="admin-markup-modal-actions">
              <button type="button" className="secondary" onClick={() => setViewRow(null)}>
                Close
              </button>
              <button
                type="button"
                className="primary"
                onClick={() => {
                  openEditModal(viewRow);
                  setViewRow(null);
                }}
              >
                Edit
              </button>
            </div>
          </section>
        </div>
      )}

      {editRow && (
        <div className="admin-markup-modal-backdrop" onClick={() => setEditRow(null)}>
          <section
            className="admin-markup-modal fullscreen"
            role="dialog"
            aria-modal="true"
            aria-label="Edit flight markup"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <h2>Edit Flight Markup</h2>
              <button type="button" onClick={() => setEditRow(null)} aria-label="Close edit dialog">
                <X size={16} />
              </button>
            </header>

            <div className="admin-markup-form-grid">
              <label>
                <span>ID</span>
                <input type="text" value={editRow.id} disabled />
              </label>
              <label>
                <span>Domestic/International</span>
                <select
                  value={editRow.domInt}
                  onChange={(event) =>
                    setEditRow((previous) => ({ ...previous, domInt: event.target.value }))
                  }
                >
                  <option value="DOM">DOM</option>
                  <option value="INT">INT</option>
                </select>
              </label>
              <label>
                <span>Markup Type</span>
                <select
                  value={editRow.markupType}
                  onChange={(event) =>
                    setEditRow((previous) => ({ ...previous, markupType: event.target.value }))
                  }
                >
                  <option value="fix">fix</option>
                  <option value="percent">percent</option>
                </select>
              </label>
              <label>
                <span>Value</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editRow.value}
                  onChange={(event) =>
                    setEditRow((previous) => ({ ...previous, value: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>Airline Type</span>
                <select
                  value={editRow.airlineType}
                  onChange={(event) =>
                    setEditRow((previous) => ({ ...previous, airlineType: event.target.value }))
                  }
                >
                  <option value="ALL">ALL</option>
                  <option value="LCC">LCC</option>
                  <option value="GDS">GDS</option>
                </select>
              </label>
              <label>
                <span>Airline Name</span>
                <input
                  type="text"
                  value={editRow.airlineName}
                  onChange={(event) =>
                    setEditRow((previous) => ({ ...previous, airlineName: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>Code</span>
                <input
                  type="text"
                  value={editRow.code}
                  onChange={(event) =>
                    setEditRow((previous) => ({ ...previous, code: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>Fare Type</span>
                <input
                  type="text"
                  value={editRow.fareType}
                  onChange={(event) =>
                    setEditRow((previous) => ({ ...previous, fareType: event.target.value }))
                  }
                />
              </label>
              <label className="wide">
                <span>Updated By</span>
                <input
                  type="text"
                  value={editRow.updatedBy}
                  onChange={(event) =>
                    setEditRow((previous) => ({ ...previous, updatedBy: event.target.value }))
                  }
                />
              </label>
            </div>

            {editError && <p className="admin-markup-form-error">{editError}</p>}

            <div className="admin-markup-modal-actions">
              <button type="button" className="secondary" onClick={() => setEditRow(null)}>
                Cancel
              </button>
              <button type="button" className="primary" onClick={handleEditSave}>
                Save Changes
              </button>
            </div>
          </section>
        </div>
      )}

      {deleteRow && (
        <div className="admin-markup-modal-backdrop" onClick={() => setDeleteRow(null)}>
          <section
            className="admin-markup-modal small"
            role="dialog"
            aria-modal="true"
            aria-label="Delete flight markup"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <h2>Delete Flight Markup</h2>
              <button type="button" onClick={() => setDeleteRow(null)} aria-label="Close delete dialog">
                <X size={16} />
              </button>
            </header>

            <p className="admin-markup-delete-copy">
              Are you sure you want to delete <strong>{deleteRow.id}</strong>?
            </p>

            <div className="admin-markup-modal-actions">
              <button type="button" className="secondary" onClick={() => setDeleteRow(null)}>
                Cancel
              </button>
              <button type="button" className="danger" onClick={handleDeleteConfirm}>
                Delete
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}


