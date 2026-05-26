import React, { useMemo, useState } from "react";
import { List } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./PendingAirlinesEditList.css";

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

const AIRLINE_CODE_SUGGESTIONS = ["UK", "AI", "6E", "SG", "QP", "IX", "G8", "I5"];
const FARE_TYPE_SUGGESTIONS = [
  "SpecialReturn",
  "SpecialOneWay",
  "Published",
  "Corporate",
  "Student",
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

const resolveNextPendingAirlineId = (records) => {
  const numericIds = records
    .map((record) => Number(record?.id))
    .filter((value) => Number.isFinite(value));

  if (numericIds.length === 0) {
    return String(Date.now());
  }

  return String(Math.max(...numericIds) + 1);
};

const listFlightPendingAirlines = () => {
  const records = readPendingAirlines();
  writePendingAirlines(records);
  return records;
};

const getFlightPendingAirlineById = (recordId) => {
  const normalizedId = normalizeText(recordId, "");
  if (!normalizedId) {
    return null;
  }

  return (
    listFlightPendingAirlines().find((record) => normalizeText(record.id, "") === normalizedId) ||
    null
  );
};

const createFlightPendingAirline = ({ airlineCode, fareType, remark, updatedBy } = {}) => {
  const nowIso = new Date().toISOString();
  const records = listFlightPendingAirlines();
  const id = resolveNextPendingAirlineId(records);

  const nextRecord = normalizePendingAirlineRecord(
    {
      id,
      airlineCode,
      fareType,
      remark,
      updatedBy,
      updatedAtUtc: nowIso,
    },
    records.length
  );

  const nextRecords = [nextRecord, ...records];
  writePendingAirlines(nextRecords);
  return nextRecord;
};

const updateFlightPendingAirlineById = (recordId, updates) => {
  const normalizedId = normalizeText(recordId, "");
  if (!normalizedId) {
    return null;
  }

  const nowIso = new Date().toISOString();
  const currentRecords = listFlightPendingAirlines();
  let updatedRecord = null;

  const nextRecords = currentRecords.map((record, index) => {
    if (normalizeText(record.id, "") !== normalizedId) {
      return record;
    }

    updatedRecord = normalizePendingAirlineRecord(
      {
        ...record,
        ...updates,
        updatedAtUtc: nowIso,
      },
      index
    );

    return updatedRecord;
  });

  writePendingAirlines(nextRecords);
  return updatedRecord;
};

function resolveHeading(isEditing) {
  return isEditing ? "Edit B2C Pending Airline" : "Add B2C Pending Airline";
}

export default function AdminFlightPendingAirlineEditPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refId = normalizeText(searchParams.get("ref_id"), "");
  const isEditing = Boolean(refId);

  const record = useMemo(() => getFlightPendingAirlineById(refId), [refId]);

  const [airlineCode, setAirlineCode] = useState(() => normalizeText(record?.airlineCode, ""));
  const [fareType, setFareType] = useState(() => normalizeText(record?.fareType, ""));
  const [remark, setRemark] = useState(() => normalizeText(record?.remark, ""));
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = () => {
    setStatusMessage("");
    setErrorMessage("");

    const cleanedAirlineCode = normalizeText(airlineCode, "");
    const cleanedFareType = normalizeText(fareType, "");

    if (!cleanedAirlineCode) {
      setErrorMessage("Select an airline code.");
      return;
    }

    if (!cleanedFareType) {
      setErrorMessage("Select a fare type.");
      return;
    }

    const updatedBy = "Travel Admin";

    const saved = isEditing
      ? updateFlightPendingAirlineById(refId, {
          airlineCode: cleanedAirlineCode,
          fareType: cleanedFareType,
          remark: normalizeText(remark, ""),
          updatedBy,
        })
      : createFlightPendingAirline({
          airlineCode: cleanedAirlineCode,
          fareType: cleanedFareType,
          remark: normalizeText(remark, ""),
          updatedBy,
        });

    if (!saved) {
      setErrorMessage("Unable to save pending airline.");
      return;
    }

    setStatusMessage(isEditing ? "Pending airline updated successfully." : "Pending airline added.");
  };

  if (isEditing && !record) {
    return (
      <section className="admin-b2c-page admin-flight-pending-edit-page">
        <div className="admin-flight-pending-edit-head-row">
          <header className="admin-b2c-header admin-flight-pending-edit-header">
            <h1>{resolveHeading(true)}</h1>
          </header>

          <button
            type="button"
            className="admin-flight-pending-edit-list-btn"
            onClick={() => navigate("/admin/b2c-flight/pending-airlines")}
          >
            <List size={14} />
            Pending Airline List
          </button>
        </div>

        <div className="admin-data-error">Pending airline record not found.</div>
      </section>
    );
  }

  return (
    <section className="admin-b2c-page admin-flight-pending-edit-page">
      <div className="admin-flight-pending-edit-head-row">
        <header className="admin-b2c-header admin-flight-pending-edit-header">
          <h1>{resolveHeading(isEditing)}</h1>
        </header>

        <button
          type="button"
          className="admin-flight-pending-edit-list-btn"
          onClick={() => navigate("/admin/b2c-flight/pending-airlines")}
        >
          <List size={14} />
          Pending Airline List
        </button>
      </div>

      <section className="admin-flight-pending-edit-shell">
        <div className="admin-flight-pending-edit-grid">
          <div className="admin-flight-pending-edit-label">Airline Code</div>
          <div className="admin-flight-pending-edit-field">
            <input
              list="pending-airline-codes"
              value={airlineCode}
              onChange={(event) => setAirlineCode(event.target.value)}
              placeholder="Select Some Options"
            />
            <datalist id="pending-airline-codes">
              {AIRLINE_CODE_SUGGESTIONS.map((value) => (
                <option key={value} value={value} />
              ))}
            </datalist>
          </div>

          <div className="admin-flight-pending-edit-label">Source Type</div>
          <div className="admin-flight-pending-edit-field">
            <input
              list="pending-fare-types"
              value={fareType}
              onChange={(event) => setFareType(event.target.value)}
              placeholder="Select Some Options"
            />
            <datalist id="pending-fare-types">
              {FARE_TYPE_SUGGESTIONS.map((value) => (
                <option key={value} value={value} />
              ))}
            </datalist>
          </div>

          <div className="admin-flight-pending-edit-label">Remark</div>
          <div className="admin-flight-pending-edit-field admin-flight-pending-edit-field-wide">
            <input
              type="text"
              value={remark}
              onChange={(event) => setRemark(event.target.value)}
              placeholder="Remark"
            />
          </div>
        </div>

        <div className="admin-flight-pending-edit-actions">
          <button type="button" className="admin-flight-pending-submit-btn" onClick={handleSubmit}>
            Submit
          </button>
        </div>
      </section>

      {errorMessage ? <div className="admin-data-error">{errorMessage}</div> : null}
      {statusMessage ? <div className="admin-data-info">{statusMessage}</div> : null}
    </section>
  );
}


