import React, { useEffect, useState } from "react";
import { List } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./FlightEditConvenienceFee.css";
import {
  createConvenienceFeeRule,
  updateConvenienceFeeRule,
  listConvenienceFeeRules,
} from "../../../services/flightBookingService";

const normalizeText = (value, fallback = "") => {
  const text = String(value ?? "").trim();
  return text || fallback;
};

function resolveHeading(isEditing) {
  return isEditing ? "Edit B2C Flight Convenience Fee" : "Add B2C Flight Convenience Fee";
}

export default function AdminFlightEditConvenienceFeePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refId = normalizeText(searchParams.get("ref_id"), "");
  const isEditing = Boolean(refId);

  const [isLoading, setIsLoading] = useState(isEditing);
  const [recordNotFound, setRecordNotFound] = useState(false);
  const [tripType, setTripType] = useState("OneWay");
  const [amountType, setAmountType] = useState("Fix");
  const [value, setValue] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!isEditing) return;

    const fetchRecord = async () => {
      try {
        setIsLoading(true);
        const rules = await listConvenienceFeeRules();
        const found = rules.find((r) => String(r.id) === refId);
        if (found) {
          setTripType(found.tripType || "OneWay");
          setAmountType(found.feeType === "Percentage" ? "Percentage" : "Fix");
          setValue(String(found.feeValue || ""));
          setIsActive(found.isActive !== false);
        } else {
          setRecordNotFound(true);
        }
      } catch (err) {
        setErrorMessage(err.message || "Failed to load convenience fee rule.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecord();
  }, [isEditing, refId]);

  const handleUpdate = async () => {
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

    const payload = {
      tripType,
      feeType: amountType === "Percentage" ? "Percentage" : "Flat",
      feeValue: numericValue,
      isActive: isActive,
    };

    try {
      if (isEditing) {
        await updateConvenienceFeeRule(refId, payload);
        setStatusMessage("Convenience fee updated successfully.");
      } else {
        await createConvenienceFeeRule(payload);
        setStatusMessage("Convenience fee added successfully.");
        // Clear form after successful addition
        setTripType("OneWay");
        setAmountType("Fix");
        setValue("");
      }
    } catch (err) {
      setErrorMessage(err.message || "Failed to save convenience fee.");
    }
  };

  if (isEditing && isLoading) {
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

        <div className="admin-table-empty">Loading rule details...</div>
      </section>
    );
  }

  if (isEditing && recordNotFound) {
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
          <div className="admin-flight-fee-edit-label">Trip Type</div>
          <div className="admin-flight-fee-edit-field">
            <select value={tripType} onChange={(event) => setTripType(event.target.value)}>
              <option value="OneWay">OneWay</option>
              <option value="RoundTrip">RoundTrip</option>
            </select>
          </div>

          <div className="admin-flight-fee-edit-label">Amount Type</div>
          <div className="admin-flight-fee-edit-field">
            <select value={amountType} onChange={(event) => setAmountType(event.target.value)}>
              <option value="Fix">Fix</option>
              <option value="Percentage">Percentage</option>
            </select>
          </div>
        </div>

        <div className="admin-flight-fee-edit-row">
          <div className="admin-flight-fee-edit-label">Value</div>
          <div className="admin-flight-fee-edit-field" style={{ gridColumn: "span 3" }}>
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
            {isEditing ? "Update" : "Add"}
          </button>
        </div>
      </section>

      {errorMessage ? <div className="admin-data-error">{errorMessage}</div> : null}
      {statusMessage ? <div className="admin-data-info">{statusMessage}</div> : null}
    </section>
  );
}
