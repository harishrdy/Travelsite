import React, { useState } from "react";
import { Download, Pencil, Plus, Trash2, X } from "lucide-react";
import "./FlightUsedCoupon.css";
import { csvCell, formatCouponDateTime, formatCurrency } from "../../../utils/adminPortalUtils";
import { getNextNumericId, useAdminList } from "../../../utils/adminPortalStorage";

export default function AdminFlightUsedCouponListPage() {
  const [usedCoupons, setUsedCoupons] = useAdminList("flight-used-coupons", []);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    bookingId: "",
    couponCode: "",
    usedDate: "",
    totalFare: "",
    cpnType: "Fix",
    cpnValue: "",
    cpnAmount: "",
    bookingStatus: "Confirmed",
  });
  const [editRecord, setEditRecord] = useState(null);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [formError, setFormError] = useState("");
  const colWidths = ["5%", "14%", "13%", "14%", "10%", "9%", "10%", "10%", "10%", "5%"];
  const headers = [
    "SN",
    "Booking ID",
    "Coupon Code",
    "Used Date",
    "Total Fare",
    "CPN Type",
    "CPN Value",
    "CPN Amount",
    "Booking Status",
    "Action",
  ];

  const handleExport = () => {
    if (usedCoupons.length === 0) {
      return;
    }

    const header = [
      "Booking ID",
      "Coupon Code",
      "Used Date",
      "Total Fare",
      "CPN Type",
      "CPN Value",
      "CPN Amount",
      "Booking Status",
    ];

    const csvRows = usedCoupons.map((record) => {
      const isPercent = String(record.cpnType || "").toLowerCase().includes("percent");
      const cpnValueLabel = isPercent ? `${Number(record.cpnValue) || 0}%` : formatCurrency(record.cpnValue);

      return [
        record.bookingId,
        record.couponCode,
        formatCouponDateTime(record.usedDate),
        formatCurrency(record.totalFare),
        record.cpnType,
        cpnValueLabel,
        formatCurrency(record.cpnAmount),
        record.bookingStatus,
      ];
    });

    const csv = [header, ...csvRows]
      .map((line) => line.map((cell) => csvCell(cell)).join(","))
      .join("\n");

    const fileBlob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8;",
    });
    const fileUrl = URL.createObjectURL(fileBlob);
    const link = document.createElement("a");

    link.href = fileUrl;
    link.download = `flight-used-coupon-list-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();

    URL.revokeObjectURL(fileUrl);
  };

  const openAddModal = () => {
    setFormError("");
    setAddForm({
      bookingId: "",
      couponCode: "",
      usedDate: "",
      totalFare: "",
      cpnType: "Fix",
      cpnValue: "",
      cpnAmount: "",
      bookingStatus: "Confirmed",
    });
    setIsAddOpen(true);
  };

  const handleSaveNew = () => {
    const bookingId = String(addForm.bookingId || "").trim();
    const couponCode = String(addForm.couponCode || "").trim();
    const usedDate = addForm.usedDate ? new Date(addForm.usedDate).toISOString() : new Date().toISOString();
    const totalFare = Number(addForm.totalFare);
    const cpnValue = Number(addForm.cpnValue);
    const cpnAmount = Number(addForm.cpnAmount);

    if (!bookingId || !couponCode) {
      setFormError("Booking ID and Coupon Code are required.");
      return;
    }

    if (!Number.isFinite(totalFare) || totalFare <= 0) {
      setFormError("Enter a valid total fare.");
      return;
    }

    if (!Number.isFinite(cpnValue) || cpnValue <= 0) {
      setFormError("Enter a valid coupon value.");
      return;
    }

    const newRecord = {
      id: getNextNumericId(usedCoupons, 1),
      bookingId,
      couponCode,
      usedDate,
      totalFare,
      cpnType: addForm.cpnType,
      cpnValue,
      cpnAmount: Number.isFinite(cpnAmount) ? cpnAmount : cpnValue,
      bookingStatus: addForm.bookingStatus,
    };

    setUsedCoupons((previous) => [newRecord, ...previous]);
    setIsAddOpen(false);
    setFormError("");
  };

  const openEditModal = (record) => {
    setFormError("");
    setEditRecord({
      ...record,
      totalFare: String(record.totalFare ?? ""),
      cpnValue: String(record.cpnValue ?? ""),
      cpnAmount: String(record.cpnAmount ?? ""),
      usedDate: record.usedDate ? record.usedDate.slice(0, 16) : "",
    });
  };

  const handleSaveEdit = () => {
    if (!editRecord) {
      return;
    }

    const bookingId = String(editRecord.bookingId || "").trim();
    const couponCode = String(editRecord.couponCode || "").trim();
    const totalFare = Number(editRecord.totalFare);
    const cpnValue = Number(editRecord.cpnValue);
    const cpnAmount = Number(editRecord.cpnAmount);

    if (!bookingId || !couponCode) {
      setFormError("Booking ID and Coupon Code are required.");
      return;
    }

    if (!Number.isFinite(totalFare) || totalFare <= 0) {
      setFormError("Enter a valid total fare.");
      return;
    }

    if (!Number.isFinite(cpnValue) || cpnValue <= 0) {
      setFormError("Enter a valid coupon value.");
      return;
    }

    setUsedCoupons((previous) =>
      previous.map((record) =>
        record.id === editRecord.id
          ? {
              ...record,
              bookingId,
              couponCode,
              usedDate: editRecord.usedDate ? new Date(editRecord.usedDate).toISOString() : record.usedDate,
              totalFare,
              cpnType: editRecord.cpnType,
              cpnValue,
              cpnAmount: Number.isFinite(cpnAmount) ? cpnAmount : cpnValue,
              bookingStatus: editRecord.bookingStatus,
            }
          : record
      )
    );

    setEditRecord(null);
    setFormError("");
  };

  const handleDelete = () => {
    if (!deleteRecord) {
      return;
    }

    setUsedCoupons((previous) => previous.filter((record) => record.id !== deleteRecord.id));
    setDeleteRecord(null);
  };

  return (
    <>
      <section className="flight-markup-panel">
      <header className="flight-markup-toolbar">
        <div className="flight-markup-title">
          <h1>
            <strong>B2C Flight</strong> Used Coupon List
          </h1>
          <div className="flight-markup-title-underline" aria-hidden="true" />
        </div>

        <div className="flight-markup-actions">
          <button type="button" className="flight-markup-action-btn primary" onClick={openAddModal}>
            <Plus size={16} />
            <span>Add Used Coupon</span>
          </button>
          <button type="button" className="flight-markup-action-btn primary" onClick={handleExport}>
            <Download size={16} />
            <span>Export</span>
          </button>
        </div>
      </header>

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
                {headers.map((headerLabel) => (
                  <th key={headerLabel}>
                    <div className="flight-markup-th-pill">
                      <span>{headerLabel}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usedCoupons.length === 0 ? (
                <tr>
                  <td colSpan={headers.length} className="flight-markup-empty-cell">
                    <span className="flight-markup-empty">No Record Found...</span>
                  </td>
                </tr>
              ) : (
                usedCoupons.map((record, index) => {
                  const isPercent = String(record.cpnType || "").toLowerCase().includes("percent");
                  const cpnValueLabel = isPercent
                    ? `${Number(record.cpnValue) || 0}%`
                    : formatCurrency(record.cpnValue);

                  return (
                    <tr key={`${record.bookingId}-${record.usedDate}`}>
                      <td>{index + 1}</td>
                      <td>{record.bookingId}</td>
                      <td>
                        <span className="flight-coupon-code">{record.couponCode}</span>
                      </td>
                      <td>{formatCouponDateTime(record.usedDate)}</td>
                      <td>{formatCurrency(record.totalFare)}</td>
                      <td>{record.cpnType}</td>
                      <td>{cpnValueLabel}</td>
                      <td>{formatCurrency(record.cpnAmount)}</td>
                      <td>
                        <span className="flight-booking-status">{record.bookingStatus || "--"}</span>
                      </td>
                      <td className="action-col">
                        <div className="markup-action-group">
                          <button
                            type="button"
                            title="Edit"
                            aria-label={`Edit used coupon ${record.bookingId}`}
                            onClick={() => openEditModal(record)}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            title="Delete"
                            aria-label={`Delete used coupon ${record.bookingId}`}
                            className="danger"
                            onClick={() => setDeleteRecord(record)}
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
    </section>

      {isAddOpen && (
        <div className="admin-markup-modal-backdrop" onClick={() => setIsAddOpen(false)}>
          <section
            className="admin-markup-modal fullscreen"
            role="dialog"
            aria-modal="true"
            aria-label="Add used coupon"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <h2>Add Used Coupon</h2>
              <button type="button" onClick={() => setIsAddOpen(false)} aria-label="Close add used coupon">
                <X size={16} />
              </button>
            </header>

            <div className="admin-markup-form-grid">
              <label>
                <span>Booking ID</span>
                <input
                  type="text"
                  value={addForm.bookingId}
                  onChange={(event) =>
                    setAddForm((previous) => ({ ...previous, bookingId: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>Coupon Code</span>
                <input
                  type="text"
                  value={addForm.couponCode}
                  onChange={(event) =>
                    setAddForm((previous) => ({ ...previous, couponCode: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>Used Date</span>
                <input
                  type="datetime-local"
                  value={addForm.usedDate}
                  onChange={(event) =>
                    setAddForm((previous) => ({ ...previous, usedDate: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>Total Fare</span>
                <input
                  type="number"
                  min="1"
                  value={addForm.totalFare}
                  onChange={(event) =>
                    setAddForm((previous) => ({ ...previous, totalFare: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>CPN Type</span>
                <select
                  value={addForm.cpnType}
                  onChange={(event) =>
                    setAddForm((previous) => ({ ...previous, cpnType: event.target.value }))
                  }
                >
                  <option value="Fix">Fix</option>
                  <option value="Percent">Percent</option>
                </select>
              </label>
              <label>
                <span>CPN Value</span>
                <input
                  type="number"
                  min="1"
                  value={addForm.cpnValue}
                  onChange={(event) =>
                    setAddForm((previous) => ({ ...previous, cpnValue: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>CPN Amount</span>
                <input
                  type="number"
                  min="0"
                  value={addForm.cpnAmount}
                  onChange={(event) =>
                    setAddForm((previous) => ({ ...previous, cpnAmount: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>Booking Status</span>
                <select
                  value={addForm.bookingStatus}
                  onChange={(event) =>
                    setAddForm((previous) => ({ ...previous, bookingStatus: event.target.value }))
                  }
                >
                  <option value="Confirmed">Confirmed</option>
                  <option value="Processed">Processed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </label>
            </div>

            {formError && <p className="admin-markup-form-error">{formError}</p>}

            <div className="admin-markup-modal-actions">
              <button type="button" className="secondary" onClick={() => setIsAddOpen(false)}>
                Cancel
              </button>
              <button type="button" className="primary" onClick={handleSaveNew}>
                Save
              </button>
            </div>
          </section>
        </div>
      )}

      {editRecord && (
        <div className="admin-markup-modal-backdrop" onClick={() => setEditRecord(null)}>
          <section
            className="admin-markup-modal fullscreen"
            role="dialog"
            aria-modal="true"
            aria-label="Edit used coupon"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <h2>Edit Used Coupon</h2>
              <button type="button" onClick={() => setEditRecord(null)} aria-label="Close edit used coupon">
                <X size={16} />
              </button>
            </header>

            <div className="admin-markup-form-grid">
              <label>
                <span>ID</span>
                <input type="text" value={editRecord.id} disabled />
              </label>
              <label>
                <span>Booking ID</span>
                <input
                  type="text"
                  value={editRecord.bookingId}
                  onChange={(event) =>
                    setEditRecord((previous) => ({ ...previous, bookingId: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>Coupon Code</span>
                <input
                  type="text"
                  value={editRecord.couponCode}
                  onChange={(event) =>
                    setEditRecord((previous) => ({ ...previous, couponCode: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>Used Date</span>
                <input
                  type="datetime-local"
                  value={editRecord.usedDate}
                  onChange={(event) =>
                    setEditRecord((previous) => ({ ...previous, usedDate: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>Total Fare</span>
                <input
                  type="number"
                  min="1"
                  value={editRecord.totalFare}
                  onChange={(event) =>
                    setEditRecord((previous) => ({ ...previous, totalFare: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>CPN Type</span>
                <select
                  value={editRecord.cpnType}
                  onChange={(event) =>
                    setEditRecord((previous) => ({ ...previous, cpnType: event.target.value }))
                  }
                >
                  <option value="Fix">Fix</option>
                  <option value="Percent">Percent</option>
                </select>
              </label>
              <label>
                <span>CPN Value</span>
                <input
                  type="number"
                  min="1"
                  value={editRecord.cpnValue}
                  onChange={(event) =>
                    setEditRecord((previous) => ({ ...previous, cpnValue: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>CPN Amount</span>
                <input
                  type="number"
                  min="0"
                  value={editRecord.cpnAmount}
                  onChange={(event) =>
                    setEditRecord((previous) => ({ ...previous, cpnAmount: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>Booking Status</span>
                <select
                  value={editRecord.bookingStatus}
                  onChange={(event) =>
                    setEditRecord((previous) => ({ ...previous, bookingStatus: event.target.value }))
                  }
                >
                  <option value="Confirmed">Confirmed</option>
                  <option value="Processed">Processed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </label>
            </div>

            {formError && <p className="admin-markup-form-error">{formError}</p>}

            <div className="admin-markup-modal-actions">
              <button type="button" className="secondary" onClick={() => setEditRecord(null)}>
                Cancel
              </button>
              <button type="button" className="primary" onClick={handleSaveEdit}>
                Save Changes
              </button>
            </div>
          </section>
        </div>
      )}

      {deleteRecord && (
        <div className="admin-markup-modal-backdrop" onClick={() => setDeleteRecord(null)}>
          <section
            className="admin-markup-modal small"
            role="dialog"
            aria-modal="true"
            aria-label="Delete used coupon"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <h2>Delete Used Coupon</h2>
              <button type="button" onClick={() => setDeleteRecord(null)} aria-label="Close delete dialog">
                <X size={16} />
              </button>
            </header>

            <p className="admin-markup-delete-copy">
              Are you sure you want to delete coupon <strong>{deleteRecord.couponCode}</strong>?
            </p>

            <div className="admin-markup-modal-actions">
              <button type="button" className="secondary" onClick={() => setDeleteRecord(null)}>
                Cancel
              </button>
              <button type="button" className="danger" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}


