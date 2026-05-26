import React, { useMemo, useState } from "react";
import { Download, PencilLine, PlusCircle, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./FlightRemarkList.css";

const safeValue = (value, fallback = "--") => {
  const text = String(value ?? "").trim();
  return text || fallback;
};

const normalizeStatusKey = (status) => {
  const key = String(status || "").trim().toLowerCase();
  return key.includes("inactive") ? "inactive" : "active";
};

const FLIGHT_REMARKS_STORAGE_KEY = "admin_flight_remarks_records";

const normalizeText = (value, fallback = "") => {
  const text = String(value ?? "").trim();
  return text || fallback;
};

const normalizeStatus = (value, fallback = "Active") => {
  const text = normalizeText(value, fallback);
  const key = text.toLowerCase();
  if (key.includes("inactive") || key.includes("disable") || key.includes("deactive")) {
    return "Inactive";
  }
  return "Active";
};

const normalizeRemarkRecord = (record, index = 0) => {
  const entryDateUtc = normalizeText(
    record?.entryDateUtc || record?.entryDate || record?.EntryDate,
    ""
  );
  const updatedAtUtc = normalizeText(
    record?.updatedAtUtc || record?.updateDate || record?.updatedOn || record?.UpdateDate,
    entryDateUtc
  );

  return {
    id: normalizeText(record?.id, `${index + 1}`),
    sourceType: normalizeText(record?.sourceType || record?.SourceType, ""),
    remark: normalizeText(record?.remark || record?.Remark, ""),
    status: normalizeStatus(record?.status || record?.Status, "Active"),
    entryDateUtc,
    updatedAtUtc,
    updatedBy: normalizeText(record?.updatedBy || record?.UpdatedBy, "Travel Admin"),
  };
};

const readRemarkRecords = () => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(FLIGHT_REMARKS_STORAGE_KEY) || "";
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((record, index) => normalizeRemarkRecord(record, index));
  } catch {
    return [];
  }
};

const writeRemarkRecords = (records) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      FLIGHT_REMARKS_STORAGE_KEY,
      JSON.stringify(records.map((record, index) => normalizeRemarkRecord(record, index)))
    );
  } catch {
    // Ignore localStorage write failures.
  }
};

const listFlightRemarks = () => {
  const records = readRemarkRecords();
  writeRemarkRecords(records);
  return records;
};

const deleteFlightRemarkById = (remarkId) => {
  const normalizedId = normalizeText(remarkId, "");
  if (!normalizedId) {
    return false;
  }

  const current = listFlightRemarks();
  const next = current.filter((record) => normalizeText(record.id, "") !== normalizedId);
  writeRemarkRecords(next);
  return next.length !== current.length;
};

const formatRemarkDateTime = (value) => {
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

export default function AdminFlightRemarkListPage() {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);

  const records = useMemo(() => {
    void refreshKey;
    return listFlightRemarks();
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
      "entryDateUtc",
      "updatedAtUtc",
      "sourceType",
      "updatedBy",
      "remark",
      "status",
    ];

    const lines = [
      headers.join(","),
      ...records.map((record, index) =>
        [
          index + 1,
          record.id,
          record.entryDateUtc,
          record.updatedAtUtc,
          record.sourceType,
          record.updatedBy,
          record.remark,
          record.status,
        ]
          .map(escapeCsv)
          .join(",")
      ),
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const downloadUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = downloadUrl;
    anchor.download = `flight-remarks-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(downloadUrl);
  };

  const handleDelete = (record) => {
    const ok = window.confirm(`Delete remark ${safeValue(record?.id)}?`);
    if (!ok) {
      return;
    }

    deleteFlightRemarkById(record?.id);
    setRefreshKey((value) => value + 1);
  };

  return (
    <section className="admin-b2c-page admin-flight-remark-page">
      <div className="admin-flight-remark-toolbar">
        <header className="admin-b2c-header admin-flight-remark-header">
          <h1>
            <strong>B2C</strong> Remark List
          </h1>
        </header>

        <div className="admin-actions-row admin-flight-remark-actions-row">
          <button
            type="button"
            className="admin-flight-remark-btn"
            onClick={() => navigate("/admin/b2c-flight/remark-list/add")}
          >
            <PlusCircle size={15} />
            Add Remark
          </button>
          <button type="button" className="admin-flight-remark-btn secondary" onClick={handleExport}>
            <Download size={15} />
            Export
          </button>
        </div>
      </div>

      <section className="admin-cancel-table-shell admin-flight-remark-table-shell">
        <header className="admin-cancel-table-head admin-flight-remark-table-head">
          <span>SN</span>
          <span>ID</span>
          <span>Entry Date</span>
          <span>Update Date</span>
          <span>Source Type</span>
          <span>Updated By</span>
          <span>Remark</span>
          <span>Status</span>
          <span>Action</span>
        </header>

        {records.length ? (
          <div className="admin-cancel-table-body">
            {records.map((record, index) => (
              <article
                key={`flight-remark-${record.id}-${record.updatedAtUtc}`}
                className="admin-cancel-table-row admin-flight-remark-table-row"
              >
                <div className="admin-cancel-cell admin-cell-centered">
                  <strong>{index + 1}</strong>
                </div>
                <div className="admin-cancel-cell admin-cell-centered">
                  <strong>{safeValue(record.id)}</strong>
                </div>
                <div className="admin-cancel-cell">
                  <strong>{formatRemarkDateTime(record.entryDateUtc)}</strong>
                </div>
                <div className="admin-cancel-cell">
                  <strong>{formatRemarkDateTime(record.updatedAtUtc)}</strong>
                </div>
                <div className="admin-cancel-cell">
                  <strong>{safeValue(record.sourceType, "--")}</strong>
                </div>
                <div className="admin-cancel-cell">
                  <strong>{safeValue(record.updatedBy)}</strong>
                </div>
                <div className="admin-cancel-cell">
                  <strong>{safeValue(record.remark, "--")}</strong>
                </div>
                <div className="admin-cancel-cell admin-cell-centered">
                  <span className={`admin-flight-remark-status ${normalizeStatusKey(record.status)}`}>
                    {safeValue(record.status, "Active")}
                  </span>
                </div>
                <div className="admin-cancel-cell admin-cell-centered admin-flight-remark-action-cell">
                  <button
                    type="button"
                    className="admin-flight-remark-icon-btn edit"
                    aria-label={`Edit remark ${record.id}`}
                    onClick={() =>
                      navigate(
                        `/admin/b2c-flight/remark-list/edit?ref_id=${encodeURIComponent(
                          String(record.id)
                        )}`
                      )
                    }
                  >
                    <PencilLine size={15} />
                  </button>
                  <button
                    type="button"
                    className="admin-flight-remark-icon-btn delete"
                    aria-label={`Delete remark ${record.id}`}
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


