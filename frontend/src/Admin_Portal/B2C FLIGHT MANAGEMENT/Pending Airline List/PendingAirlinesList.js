import React, { useMemo, useState } from "react";
import { Download, PencilLine, PlusCircle, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./PendingAirlinesList.css";

const safeValue = (value, fallback = "--") => {
  const text = String(value ?? "").trim();
  return text || fallback;
};

const FLIGHT_PENDING_AIRLINE_STORAGE_KEY = "admin_flight_pending_airlines_records";

const DEFAULT_PENDING_AIRLINES = [
  {
    id: "35",
    airlineCode: "UK",
    fareType: "SpecialReturn",
    remark: "",
    updatedBy: "Pick N Book",
    updatedAtUtc: "2026-03-18T10:21:00+05:30",
  },
];

const normalizeText = (value, fallback = "") => {
  const text = String(value ?? "").trim();
  return text || fallback;
};

const normalizePendingAirlineRecord = (record, index = 0) => {
  const fallback = DEFAULT_PENDING_AIRLINES[index] || DEFAULT_PENDING_AIRLINES[0];

  return {
    id: normalizeText(record?.id, normalizeText(fallback?.id, `${index + 1}`)),
    airlineCode: normalizeText(
      record?.airlineCode || record?.AirlineCode || record?.airline_code,
      normalizeText(fallback?.airlineCode, "")
    ),
    fareType: normalizeText(
      record?.fareType || record?.sourceType || record?.FareType || record?.SourceType,
      normalizeText(fallback?.fareType, "")
    ),
    remark: normalizeText(record?.remark || record?.Remark, normalizeText(fallback?.remark, "")),
    updatedBy: normalizeText(
      record?.updatedBy || record?.UpdatedBy,
      normalizeText(fallback?.updatedBy, "Travel Admin")
    ),
    updatedAtUtc: normalizeText(
      record?.updatedAtUtc || record?.updatedOn || record?.UpdatedOn,
      normalizeText(fallback?.updatedAtUtc, "")
    ),
  };
};

const readPendingAirlines = () => {
  if (typeof window === "undefined") {
    return DEFAULT_PENDING_AIRLINES;
  }

  try {
    const raw = window.localStorage.getItem(FLIGHT_PENDING_AIRLINE_STORAGE_KEY) || "";
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return DEFAULT_PENDING_AIRLINES;
    }

    return parsed.map((record, index) => normalizePendingAirlineRecord(record, index));
  } catch {
    return DEFAULT_PENDING_AIRLINES;
  }
};

const writePendingAirlines = (records) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      FLIGHT_PENDING_AIRLINE_STORAGE_KEY,
      JSON.stringify(records.map((record, index) => normalizePendingAirlineRecord(record, index)))
    );
  } catch {
    // Ignore localStorage write failures.
  }
};

const listFlightPendingAirlines = () => {
  const records = readPendingAirlines();
  writePendingAirlines(records);
  return records;
};

const deleteFlightPendingAirlineById = (recordId) => {
  const normalizedId = normalizeText(recordId, "");
  if (!normalizedId) {
    return false;
  }

  const current = listFlightPendingAirlines();
  const next = current.filter((record) => normalizeText(record.id, "") !== normalizedId);
  writePendingAirlines(next);
  return next.length !== current.length;
};

const formatPendingAirlineDateTime = (value) => {
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

export default function AdminFlightPendingAirlineListPage() {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);

  const records = useMemo(() => {
    // `refreshKey` forces re-read after add/edit/delete
    void refreshKey;
    return listFlightPendingAirlines();
  }, [refreshKey]);

  const escapeCsv = (value) => {
    const text = String(value ?? "");
    const escaped = text.replace(/"/g, '""');
    return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
  };

  const handleExport = () => {
    const headers = [
      "sn",
      "id",
      "airlineCode",
      "fareType",
      "updatedBy",
      "updatedOn",
      "remark",
    ];

    const lines = [
      headers.join(","),
      ...records.map((record, index) =>
        [
          index + 1,
          record.id,
          record.airlineCode,
          record.fareType,
          record.updatedBy,
          record.updatedAtUtc,
          record.remark,
        ]
          .map(escapeCsv)
          .join(",")
      ),
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const downloadUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = downloadUrl;
    anchor.download = `pending-airlines-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(downloadUrl);
  };

  const handleDelete = (record) => {
    const ok = window.confirm(`Delete pending airline ${safeValue(record?.airlineCode)}?`);
    if (!ok) {
      return;
    }

    deleteFlightPendingAirlineById(record?.id);
    setRefreshKey((value) => value + 1);
  };

  return (
    <section className="admin-b2c-page admin-flight-pending-page">
      <div className="admin-flight-pending-toolbar">
        <header className="admin-b2c-header admin-flight-pending-header">
          <h1>
            <strong>B2C Pending</strong> Airline List
          </h1>
        </header>

        <div className="admin-actions-row admin-flight-pending-actions-row">
          <button
            type="button"
            className="admin-flight-pending-btn"
            onClick={() => navigate("/admin/b2c-flight/pending-airlines/add")}
          >
            <PlusCircle size={15} />
            Add Pending Airline
          </button>
          <button type="button" className="admin-flight-pending-btn secondary" onClick={handleExport}>
            <Download size={15} />
            Export
          </button>
        </div>
      </div>

      <section className="admin-cancel-table-shell admin-flight-pending-table-shell">
        <header className="admin-cancel-table-head admin-flight-pending-table-head">
          <span>SN</span>
          <span>ID</span>
          <span>Airline Code</span>
          <span>Fare Type</span>
          <span>Updated by</span>
          <span>Updated On</span>
          <span>Remark</span>
          <span>Action</span>
        </header>

        {records.length ? (
          <div className="admin-cancel-table-body">
            {records.map((record, index) => (
              <article
                key={`pending-airline-${record.id}-${record.updatedAtUtc}`}
                className="admin-cancel-table-row admin-flight-pending-table-row"
              >
                <div className="admin-cancel-cell admin-cell-centered">
                  <strong>{index + 1}</strong>
                </div>

                <div className="admin-cancel-cell admin-cell-centered">
                  <strong>{safeValue(record.id)}</strong>
                </div>

                <div className="admin-cancel-cell">
                  <strong>{safeValue(record.airlineCode)}</strong>
                </div>

                <div className="admin-cancel-cell">
                  <strong>{safeValue(record.fareType)}</strong>
                </div>

                <div className="admin-cancel-cell">
                  <strong>{safeValue(record.updatedBy)}</strong>
                </div>

                <div className="admin-cancel-cell">
                  <strong>{formatPendingAirlineDateTime(record.updatedAtUtc)}</strong>
                </div>

                <div className="admin-cancel-cell">
                  <strong>{safeValue(record.remark, "--")}</strong>
                </div>

                <div className="admin-cancel-cell admin-cell-centered admin-flight-pending-action-cell">
                  <button
                    type="button"
                    className="admin-flight-pending-icon-btn edit"
                    aria-label={`Edit pending airline ${record.id}`}
                    onClick={() =>
                      navigate(
                        `/admin/b2c-flight/pending-airlines/edit?ref_id=${encodeURIComponent(
                          String(record.id)
                        )}`
                      )
                    }
                  >
                    <PencilLine size={15} />
                  </button>
                  <button
                    type="button"
                    className="admin-flight-pending-icon-btn delete"
                    aria-label={`Delete pending airline ${record.id}`}
                    onClick={() => handleDelete(record)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="admin-cancel-empty">not found any record.</div>
        )}
      </section>
    </section>
  );
}



