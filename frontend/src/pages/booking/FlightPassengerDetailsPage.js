import React, { useMemo, useState } from "react";
import { Info } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../STYLES/FlightBookingFlow.css";
import {
  readFlightBookingFlowState,
  writeFlightBookingFlowState,
} from "./flightBookingFlowStore";

function formatCurrency(amount) {
  return `INR ${new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(Math.round(Number(amount) || 0))}`;
}

function parseTravellerSummary(summary) {
  const text = String(summary || "");
  const adults = Number((text.match(/(\d+)\s*Adult/i) || [])[1] || 1);
  const children = Number((text.match(/(\d+)\s*Child/i) || [])[1] || 0);
  const infants = Number((text.match(/(\d+)\s*Infant/i) || [])[1] || 0);

  return {
    adults,
    children,
    infants,
  };
}

function buildPassengerSeed(selectedSeats, travellerCounts, existingPassengers) {
  if (Array.isArray(existingPassengers) && existingPassengers.length > 0) {
    return existingPassengers;
  }

  const seatLabels = Array.isArray(selectedSeats)
    ? selectedSeats.map((seat) => seat?.label || "")
    : [];

  const passengers = [];
  let seatIndex = 0;

  for (let index = 0; index < travellerCounts.adults; index += 1) {
    passengers.push({
      id: `adult-${index + 1}`,
      passengerType: "Adult",
      title: "Mr",
      firstName: "",
      lastName: "",
      gender: "Male",
      dob: "",
      seatLabel: seatLabels[seatIndex] || "",
      frequentFlyer: "",
    });
    seatIndex += 1;
  }

  for (let index = 0; index < travellerCounts.children; index += 1) {
    passengers.push({
      id: `child-${index + 1}`,
      passengerType: "Child",
      title: "Ms",
      firstName: "",
      lastName: "",
      gender: "Female",
      dob: "",
      seatLabel: seatLabels[seatIndex] || "",
      frequentFlyer: "",
    });
    seatIndex += 1;
  }

  for (let index = 0; index < travellerCounts.infants; index += 1) {
    passengers.push({
      id: `infant-${index + 1}`,
      passengerType: "Infant",
      title: "Ms",
      firstName: "",
      lastName: "",
      gender: "Female",
      dob: "",
      seatLabel: "",
      frequentFlyer: "",
    });
  }

  return passengers;
}

function isValidEmail(email) {
  return /^\S+@\S+\.\S+$/.test(String(email || "").trim());
}

function isValidMobile(mobile) {
  const digits = String(mobile || "").replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 13;
}

function isPassengerValid(passenger) {
  return (
    passenger.title &&
    String(passenger.firstName || "").trim() &&
    String(passenger.lastName || "").trim() &&
    passenger.gender &&
    String(passenger.dob || "").trim()
  );
}

export default function FlightPassengerDetailsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const persistedState = readFlightBookingFlowState();
  const incomingState = location.state || {};
  const flowState = incomingState.flight ? incomingState : persistedState || {};

  const flight = flowState.flight || null;
  const selectedSeats = flowState.selectedSeats || [];
  const searchContext = flowState.searchContext || null;
  const fareSummary = flowState.fareSummary || {
    baseFare: 0,
    seatSurcharge: 0,
    mealFee: 0,
    baggageFee: 0,
    tax: 0,
    convenienceFee: 0,
    totalFare: 0,
  };

  const travellers = parseTravellerSummary(searchContext?.travellers);

  const [passengers, setPassengers] = useState(() =>
    buildPassengerSeed(selectedSeats, travellers, flowState.passengers)
  );
  const [contact, setContact] = useState(() => ({
    email: flowState.contact?.email || "",
    mobile: flowState.contact?.mobile || "",
    whatsappUpdates: Boolean(flowState.contact?.whatsappUpdates),
    whatsappNumber: flowState.contact?.whatsappNumber || "",
  }));
  const [couponCode, setCouponCode] = useState(flowState.couponCode || "");
  const [couponDiscount, setCouponDiscount] = useState(Number(flowState.couponDiscount) || 0);
  const [specialAssistance, setSpecialAssistance] = useState(
    flowState.specialAssistance || ""
  );
  const [agreedToTerms, setAgreedToTerms] = useState(Boolean(flowState.agreedToTerms));
  const [formError, setFormError] = useState("");

  const totalAfterDiscount = Math.max(0, Number(fareSummary.totalFare || 0) - couponDiscount);

  const allPassengersValid = useMemo(
    () => passengers.every((passenger) => isPassengerValid(passenger)),
    [passengers]
  );

  if (!flight || selectedSeats.length === 0) {
    return (
      <main className="flight-flow-page">
        <div className="flight-flow-shell">
          <section className="flight-flow-empty">
            <h2>Seat selection data missing</h2>
            <p>Select flight seats before filling passenger details.</p>
            <button type="button" onClick={() => navigate("/flight/seats")}>Back to Seat Selection</button>
          </section>
        </div>
      </main>
    );
  }

  const updatePassenger = (index, field, value) => {
    setPassengers((previous) =>
      previous.map((passenger, passengerIndex) =>
        passengerIndex === index ? { ...passenger, [field]: value } : passenger
      )
    );
  };

  const handleApplyCoupon = () => {
    const normalized = couponCode.trim().toUpperCase();

    if (normalized === "FLY250") {
      setCouponDiscount(250);
      return;
    }

    if (normalized === "JET500") {
      setCouponDiscount(500);
      return;
    }

    setCouponDiscount(0);
  };

  const handleContinue = () => {
    if (!allPassengersValid) {
      setFormError("Fill all mandatory passenger fields.");
      return;
    }

    if (!isValidEmail(contact.email)) {
      setFormError("Enter a valid email address.");
      return;
    }

    if (!isValidMobile(contact.mobile)) {
      setFormError("Enter a valid mobile number.");
      return;
    }

    if (contact.whatsappUpdates) {
      const whatsappValue = contact.whatsappNumber || contact.mobile;

      if (!isValidMobile(whatsappValue)) {
        setFormError("Enter a valid WhatsApp number or disable WhatsApp updates.");
        return;
      }
    }

    if (!agreedToTerms) {
      setFormError("Please accept fare rules and terms before continuing.");
      return;
    }

    setFormError("");

    const payload = {
      ...flowState,
      passengers,
      contact,
      specialAssistance,
      couponCode: couponCode.trim().toUpperCase(),
      couponDiscount,
      agreedToTerms,
      payableAmount: totalAfterDiscount,
      fareSummary: {
        ...fareSummary,
        discount: couponDiscount,
        totalFare: totalAfterDiscount,
      },
    };

    writeFlightBookingFlowState(payload);
    navigate("/flight/payment", { state: payload });
  };

  return (
    <main className="flight-flow-page">
      <div className="flight-flow-shell">
        <section className="flight-passenger-layout">
          <div className="flight-section-card">
            <header className="flight-card-head">
              <div>
                <h2>Passenger Details</h2>
                <span>{flight.airlineName} {flight.flightNumber}</span>
              </div>
              <span>{searchContext?.source} to {searchContext?.destination}</span>
            </header>

            <div className="flight-form-grid">
              {passengers.map((passenger, index) => (
                <article className="flight-passenger-row" key={passenger.id}>
                  <header>
                    <h4>
                      Passenger {index + 1} - {passenger.passengerType}
                    </h4>
                    <span>{passenger.seatLabel ? `Seat ${passenger.seatLabel}` : "No Seat"}</span>
                  </header>

                  <div className="flight-passenger-fields">
                    <select
                      value={passenger.title}
                      onChange={(event) => updatePassenger(index, "title", event.target.value)}
                    >
                      <option value="Mr">Mr</option>
                      <option value="Mrs">Mrs</option>
                      <option value="Ms">Ms</option>
                    </select>

                    <input
                      type="text"
                      placeholder="First Name"
                      value={passenger.firstName}
                      onChange={(event) =>
                        updatePassenger(index, "firstName", event.target.value)
                      }
                    />

                    <input
                      type="text"
                      placeholder="Last Name"
                      value={passenger.lastName}
                      onChange={(event) =>
                        updatePassenger(index, "lastName", event.target.value)
                      }
                    />

                    <select
                      value={passenger.gender}
                      onChange={(event) => updatePassenger(index, "gender", event.target.value)}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>

                    <input
                      type="date"
                      value={passenger.dob}
                      onChange={(event) => updatePassenger(index, "dob", event.target.value)}
                    />

                    <input
                      type="text"
                      placeholder="Frequent Flyer (Optional)"
                      value={passenger.frequentFlyer}
                      onChange={(event) =>
                        updatePassenger(index, "frequentFlyer", event.target.value)
                      }
                    />
                  </div>
                </article>
              ))}
            </div>

            <div className="flight-contact-grid">
              <label>
                <span>Email</span>
                <input
                  type="email"
                  value={contact.email}
                  onChange={(event) =>
                    setContact((previous) => ({ ...previous, email: event.target.value }))
                  }
                  placeholder="name@example.com"
                />
              </label>

              <label>
                <span>Mobile</span>
                <input
                  type="text"
                  value={contact.mobile}
                  onChange={(event) =>
                    setContact((previous) => ({
                      ...previous,
                      mobile: event.target.value,
                      whatsappNumber:
                        previous.whatsappUpdates && !previous.whatsappNumber
                          ? event.target.value
                          : previous.whatsappNumber,
                    }))
                  }
                  placeholder="+91XXXXXXXXXX"
                />
              </label>

              <label style={{ gridColumn: "1 / -1" }}>
                <span>WhatsApp Updates</span>
                <div className="flight-whatsapp-row">
                  <input
                    type="checkbox"
                    checked={contact.whatsappUpdates}
                    onChange={(event) =>
                      setContact((previous) => ({
                        ...previous,
                        whatsappUpdates: event.target.checked,
                        whatsappNumber:
                          event.target.checked && !previous.whatsappNumber
                            ? previous.mobile
                            : previous.whatsappNumber,
                      }))
                    }
                    style={{ width: 16, height: 16, alignSelf: "center" }}
                  />
                  <input
                    type="text"
                    value={contact.whatsappNumber}
                    onChange={(event) =>
                      setContact((previous) => ({
                        ...previous,
                        whatsappNumber: event.target.value,
                      }))
                    }
                    disabled={!contact.whatsappUpdates}
                    placeholder="WhatsApp no. (defaults to mobile)"
                  />
                </div>
              </label>

              <label style={{ gridColumn: "1 / -1" }}>
                <span>Special Assistance / Requests</span>
                <input
                  type="text"
                  value={specialAssistance}
                  onChange={(event) => setSpecialAssistance(event.target.value)}
                  placeholder="Wheelchair, diabetic meal, etc. (optional)"
                />
              </label>
            </div>
          </div>

          <aside className="flight-side-card">
            <h3>Fare Summary</h3>
            <div className="flight-fare-list">
              <div>
                <span>Base Fare</span>
                <strong>{formatCurrency(fareSummary.baseFare)}</strong>
              </div>
              <div>
                <span>Seat Charges</span>
                <strong>{formatCurrency(fareSummary.seatSurcharge)}</strong>
              </div>
              <div>
                <span>Meal + Baggage</span>
                <strong>{formatCurrency((fareSummary.mealFee || 0) + (fareSummary.baggageFee || 0))}</strong>
              </div>
              <div>
                <span>Tax + Fee</span>
                <strong>{formatCurrency((fareSummary.tax || 0) + (fareSummary.convenienceFee || 0))}</strong>
              </div>
              {couponDiscount > 0 && (
                <div>
                  <span>Coupon Discount</span>
                  <strong>{formatCurrency(couponDiscount)}</strong>
                </div>
              )}
              <div className="total">
                <span>Payable</span>
                <strong>{formatCurrency(totalAfterDiscount)}</strong>
              </div>
            </div>

            <div className="flight-options-group">
              <label>
                <span>Apply Coupon</span>
                <div className="flight-coupon-row">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(event) => setCouponCode(event.target.value)}
                    placeholder="Use FLY250 or JET500"
                  />
                  <button type="button" onClick={handleApplyCoupon}>Apply</button>
                </div>
              </label>
            </div>

            <label className="flight-check-row">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(event) => setAgreedToTerms(event.target.checked)}
              />
              <span>I accept fare rules, cancellation policy, and passenger details are correct.</span>
            </label>

            {formError && (
              <p className="flight-flow-error">
                <Info size={14} />
                {formError}
              </p>
            )}

            <button type="button" className="flight-primary-btn" onClick={handleContinue}>
              Continue to Payment
            </button>
          </aside>
        </section>
      </div>
    </main>
  );
}

