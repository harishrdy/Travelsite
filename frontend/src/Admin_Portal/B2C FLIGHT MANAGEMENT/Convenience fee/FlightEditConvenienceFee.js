import React, { useMemo, useState } from "react";
import { List } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./FlightEditConvenienceFee.css";

const FLIGHT_CONVENIENCE_FEE_STORAGE_KEY = "admin_flight_convenience_fee_records";

const normalizeText = (value, fallback = "") => {
  const text = String(value ?? "").trim();
  return text || fallback;
};

const toSafeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeAmountType = (value, fallback = "Fix") => {
  const text = normalizeText(value, fallback);
  const key = text.toLowerCase();
  if (key === "percentage" || key === "percent") {
    return "Percentage";
  }
  return "Fix";
};

const normalizeStatus = (value, fallback = "Active") => {
  const text = normalizeText(value, fallback);
  const key = text.toLowerCase();
  if (key.includes("inactive") || key.includes("disabled") || key.includes("deactive")) {
    return "Inactive";
  }
  return "Active";
};

const normalizeFeeRecord = (record, index = 0) => {
  return {
    id: normalizeText(record?.id, `${index + 1}`),
    amountType: normalizeAmountType(record?.amountType, "Fix"),
    value: toSafeNumber(record?.value, 0),
    entryDateUtc: normalizeText(record?.entryDateUtc, ""),
    updatedAtUtc: normalizeText(record?.updatedAtUtc, ""),
    updatedBy: normalizeText(record?.updatedBy, "Travel Admin"),
    status: normalizeStatus(record?.status, "Active"),
  };
};

const readFeeRecords = () => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(FLIGHT_CONVENIENCE_FEE_STORAGE_KEY) || "";
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((record, index) => normalizeFeeRecord(record, index));
  } catch {
    return [];
  }
};

const writeFeeRecords = (records) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      FLIGHT_CONVENIENCE_FEE_STORAGE_KEY,
      JSON.stringify(records.map((record, index) => normalizeFeeRecord(record, index)))
    );
  } catch {
    // Ignore localStorage write failures.
  }
};

const resolveNextFeeId = (records) => {
  const numericIds = records
    .map((record) => Number(record?.id))
    .filter((value) => Number.isFinite(value));

  if (numericIds.length === 0) {
    return String(Date.now());
  }

  return String(Math.max(...numericIds) + 1);
};

const listFlightConvenienceFees = () => {
  const records = readFeeRecords();
  writeFeeRecords(records);
  return records;
};

const getFlightConvenienceFeeById = (feeId) => {
  const normalizedId = normalizeText(feeId, "");
  if (!normalizedId) {
    return null;
  }

  return (
    listFlightConvenienceFees().find((record) => normalizeText(record.id, "") === normalizedId) ||
    null
  );
};

const createFlightConvenienceFee = ({ amountType, value, updatedBy, status } = {}) => {
  const nowIso = new Date().toISOString();
  const records = listFlightConvenienceFees();
  const id = resolveNextFeeId(records);

  const nextRecord = normalizeFeeRecord(
    {
      id,
      amountType,
      value,
      updatedBy,
      status: status || "Active",
      entryDateUtc: nowIso,
      updatedAtUtc: nowIso,
    },
    records.length
  );

  const nextRecords = [nextRecord, ...records];
  writeFeeRecords(nextRecords);
  return nextRecord;
};

const updateFlightConvenienceFeeById = (feeId, updates) => {
  const normalizedId = normalizeText(feeId, "");
  if (!normalizedId) {
    return null;
  }

  const nowIso = new Date().toISOString();
  const currentRecords = listFlightConvenienceFees();
  let updatedRecord = null;

  const nextRecords = currentRecords.map((record, index) => {
    if (normalizeText(record.id, "") !== normalizedId) {
      return record;
    }

    updatedRecord = normalizeFeeRecord(
      {
        ...record,
        ...updates,
        updatedAtUtc: nowIso,
      },
      index
    );

    return updatedRecord;
  });

  writeFeeRecords(nextRecords);
  return updatedRecord;
};

function resolveHeading(isEditing) {
  return isEditing ? "Edit B2C Flight Convenience Fee" : "Add B2C Flight Convenience Fee";
}

export default function AdminFlightEditConvenienceFeePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refId = normalizeText(searchParams.get("ref_id"), "");
  const isEditing = Boolean(refId);

  const feeRecord = useMemo(() => getFlightConvenienceFeeById(refId), [refId]);
  const [amountType, setAmountType] = useState(() =>
    normalizeText(feeRecord?.amountType, "Fix")
  );
  const [value, setValue] = useState(() => {
    const initial = Number(feeRecord?.value);
    return Number.isFinite(initial) && initial > 0 ? String(initial) : "";
  });
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleUpdate = () => {
    setStatusMessage("");
    setErrorMessage("");

    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      setErrorMessage("Enter a valid value greater than 0.");
      return;
    }

    if (String(amountType || "").toLowerCase() === "percentage" && numericValue > 100) {
      setErrorMessage("Percentage value must be between 0 and 100.");
      return;
    }

    const updatedBy = "Travel Admin";

    const updated = isEditing
      ? updateFlightConvenienceFeeById(refId, {
          amountType,
          value: numericValue,
          updatedBy,
        })
      : createFlightConvenienceFee({
          amountType,
          value: numericValue,
          updatedBy,
          status: "Active",
        });

    if (!updated) {
      setErrorMessage("Unable to save convenience fee.");
      return;
    }

    setStatusMessage(
      isEditing ? "Convenience fee updated successfully." : "Convenience fee added successfully."
    );
  };

  if (isEditing && !feeRecord) {
    return (
      <section className="admin-b2c-page admin-flight-fee-edit-page">
        <div className="admin-flight-fee-edit-head-row">
          <header className="admin-b2c-header admin-flight-fee-edit-header">
            <h1>{resolveHeading(true)}</h1>
          </header>

          <button
            type="button"
            className="admin-flight-fee-list-btn"
            onClick={() => navigate("/admin/b2c-flight/convenience-fee")}
          >
            <List size={14} />
            B2C Flight Convenience Fee
          </button>
        </div>

        <div className="admin-data-error">Convenience fee record not found.</div>
      </section>
    );
  }

  return (
    <section className="admin-b2c-page admin-flight-fee-edit-page">
      <div className="admin-flight-fee-edit-head-row">
        <header className="admin-b2c-header admin-flight-fee-edit-header">
          <h1>{resolveHeading(isEditing)}</h1>
        </header>

        <button
          type="button"
          className="admin-flight-fee-list-btn"
          onClick={() => navigate("/admin/b2c-flight/convenience-fee")}
        >
          <List size={14} />
          B2C Flight Convenience Fee
        </button>
      </div>

      <section className="admin-flight-fee-edit-shell">
        <div className="admin-flight-fee-edit-row">
          <div className="admin-flight-fee-edit-label">Amount Type</div>
          <div className="admin-flight-fee-edit-field">
            <select value={amountType} onChange={(event) => setAmountType(event.target.value)}>
              <option value="Fix">Fix</option>
              <option value="Percentage">Percentage</option>
            </select>
          </div>

          <div className="admin-flight-fee-edit-label">Value</div>
          <div className="admin-flight-fee-edit-field">
            <input
              type="number"
              min="0"
              step={String(amountType || "").toLowerCase() === "percentage" ? "0.01" : "1"}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder={amountType === "Percentage" ? "Enter percentage" : "Enter fixed value"}
            />
          </div>
        </div>

        <div className="admin-flight-fee-edit-actions">
          <button type="button" className="admin-flight-fee-update-btn" onClick={handleUpdate}>
            Update
          </button>
        </div>
      </section>

      {errorMessage ? <div className="admin-data-error">{errorMessage}</div> : null}
      {statusMessage ? <div className="admin-data-info">{statusMessage}</div> : null}
    </section>
  );
}


