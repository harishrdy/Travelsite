import React, { useEffect, useState } from "react";
import { CheckCircle2, XCircle, PencilLine } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./BusConvenienceFee.css";
import { getConvenienceFee } from "../../../services/adminBusService";

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const formatDateTime = (value) => {
  const parsed = new Date(value || "");
  if (Number.isNaN(parsed.getTime())) {
    return "--";
  }

  return parsed.toLocaleString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

function normalizeFeeResponse(data) {
  if (!data || typeof data !== "object") {
    return null;
  }

  // Handle "No convenience fee configured." empty response
  if (data.message && !data.id && data.feeInr === undefined) {
    return null;
  }

  return {
    id: data.id ?? data.Id ?? null,
    feeInr: Number(data.feeInr ?? data.FeeInr ?? data.value ?? 0) || 0,
    isActive: data.isActive ?? data.IsActive ?? (String(data.status || "").toLowerCase() === "active"),
    createdAt: data.createdAt ?? data.CreatedAt ?? data.entryDateUtc ?? null,
    updatedAt: data.updatedAt ?? data.UpdatedAt ?? data.updatedAtUtc ?? null,
  };
}

export default function AdminConvenienceFeePage() {
  const navigate = useNavigate();
  const [fee, setFee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadFee = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getConvenienceFee();
        const normalized = normalizeFeeResponse(data);
        setFee(normalized);
      } catch (err) {
        setError(err.message || "Unable to load convenience fee settings.");
      } finally {
        setLoading(false);
      }
    };

    loadFee();
  }, []);

  return (
    <section className="admin-b2c-page admin-convenience-page">
      <header className="admin-b2c-header admin-convenience-header">
        <h1>B2C Bus Convenience Fee</h1>
      </header>

      {loading ? (
        <div className="admin-data-info">Loading convenience fee settings...</div>
      ) : error ? (
        <div className="admin-data-error">{error}</div>
      ) : !fee ? (
        <section className="admin-convenience-empty">
          <p>No convenience fee configured yet.</p>
          <button
            type="button"
            className="admin-convenience-icon-btn edit"
            onClick={() => navigate("/admin/b2c-bus/convenience-fee/edit")}
          >
            <PencilLine size={15} />
            Configure Now
          </button>
        </section>
      ) : (
        <>
          <section className="admin-convenience-table-shell">
            <header className="admin-convenience-table-head">
              <span>ID</span>
              <span>Fee (INR)</span>
              <span>Status</span>
              <span>Created</span>
              <span>Updated</span>
              <span>Action</span>
            </header>

            <div className="admin-convenience-table-body">
              <article className="admin-convenience-table-row">
                <div className="admin-convenience-cell">
                  <strong>{fee.id ?? "--"}</strong>
                </div>

                <div className="admin-convenience-cell">
                  <strong>{inrFormatter.format(fee.feeInr)}</strong>
                </div>

                <div className="admin-convenience-cell admin-convenience-status-cell">
                  {fee.isActive ? (
                    <span className="admin-convenience-status active">
                      <CheckCircle2 size={14} />
                      Active
                    </span>
                  ) : (
                    <span className="admin-convenience-status inactive">
                      <XCircle size={14} />
                      Inactive
                    </span>
                  )}
                </div>

                <div className="admin-convenience-cell">
                  <strong>{formatDateTime(fee.createdAt)}</strong>
                </div>

                <div className="admin-convenience-cell">
                  <strong>{formatDateTime(fee.updatedAt)}</strong>
                </div>

                <div className="admin-convenience-cell admin-convenience-action-cell">
                  <button
                    type="button"
                    className="admin-convenience-icon-btn edit"
                    aria-label="Edit convenience fee"
                    onClick={() => navigate("/admin/b2c-bus/convenience-fee/edit")}
                  >
                    <PencilLine size={15} />
                  </button>
                </div>
              </article>
            </div>
          </section>
        </>
      )}
    </section>
  );
}
