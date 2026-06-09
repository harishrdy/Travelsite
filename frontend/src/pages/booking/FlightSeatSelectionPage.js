import React, { useEffect, useMemo, useState } from "react";
import { Info, Loader2, Luggage, Plane, Utensils } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../STYLES/FlightBookingFlow.css";
import { getFlightSeatMap } from "../../services/flightBookingService";
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
    seatRequired: Math.max(1, adults + children),
  };
}

function hashFromText(value) {
  let hash = 0;
  const text = String(value || "");

  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  }

  return hash || 1;
}

function createRandom(seedStart) {
  let seed = seedStart >>> 0;

  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function getZoneName(travelClass) {
  const normalized = String(travelClass || "Economy").toLowerCase();

  if (normalized.includes("first")) {
    return "First Suite";
  }

  if (normalized.includes("business")) {
    return "Business Cabin";
  }

  if (normalized.includes("premium economy")) {
    return "Premium Economy";
  }

  return "Economy Cabin";
}

function getCabinTemplate(travelClass) {
  const normalized = String(travelClass || "Economy").toLowerCase();

  if (normalized.includes("first")) {
    return {
      rows: [1, 2],
      seatLetters: ["A", "C", "D", "F"],
      extraLegroomRows: new Set([1]),
      zoneName: getZoneName(travelClass),
    };
  }

  if (normalized.includes("business")) {
    return {
      rows: [3, 4, 5, 6],
      seatLetters: ["A", "C", "D", "F"],
      extraLegroomRows: new Set([3]),
      zoneName: getZoneName(travelClass),
    };
  }

  if (normalized.includes("premium economy")) {
    return {
      rows: [7, 8, 9, 10],
      seatLetters: ["A", "B", "C", "D", "E", "F"],
      extraLegroomRows: new Set([7]),
      zoneName: getZoneName(travelClass),
    };
  }

  return {
    rows: [11, 12, 13, 14, 15, 16, 17, 18],
    seatLetters: ["A", "B", "C", "D", "E", "F"],
    extraLegroomRows: new Set([11, 15]),
    zoneName: getZoneName(travelClass),
  };
}

function parseSeatCode(seatCode) {
  const match = String(seatCode || "")
    .trim()
    .toUpperCase()
    .match(/^(\d+)([A-Z]+)$/);

  if (!match) {
    return null;
  }

  return {
    rowNumber: Number(match[1]),
    seatLetter: match[2],
    label: `${match[1]}${match[2]}`,
  };
}

function buildCabinFromSeatMap(seatMap, travelClass) {
  if (!seatMap || !Array.isArray(seatMap.seats)) {
    return null;
  }

  const parsedSeats = seatMap.seats
    .map((seat) => {
      const parsed = parseSeatCode(seat?.seatCode || seat?.seatNumber);
      if (!parsed) {
        return null;
      }

      return {
        ...parsed,
        isBooked: Boolean(seat?.isBooked),
      };
    })
    .filter(Boolean);

  if (parsedSeats.length === 0) {
    return null;
  }

  const rows = Array.from(
    new Set(parsedSeats.map((seat) => seat.rowNumber).filter(Number.isFinite))
  ).sort((a, b) => a - b);
  const seatLetters = Array.from(
    new Set(parsedSeats.map((seat) => seat.seatLetter).filter(Boolean))
  ).sort();

  const extraLegroomRows = new Set(rows.length > 0 ? [rows[0]] : []);

  const seats = parsedSeats.map((seat) => {
    const isExtraLegroom = extraLegroomRows.has(seat.rowNumber);
    let status = "available";

    if (seat.isBooked) {
      status = "booked";
    } else if (isExtraLegroom) {
      status = "extra";
    }

    return {
      id: seat.label,
      label: seat.label,
      rowNumber: seat.rowNumber,
      seatLetter: seat.seatLetter,
      status,
      isExtraLegroom,
    };
  });

  return {
    rows,
    seatLetters,
    extraLegroomRows,
    zoneName: getZoneName(travelClass || seatMap.travelClass),
    seats,
    meta: {
      totalSeats: Number(seatMap.totalSeats || 0) || seats.length,
      availableSeats: Number(seatMap.availableSeats || 0),
      bookedSeats: Number(seatMap.bookedSeats || 0),
    },
  };
}

function createCabinSeats(flightId, travelClass, availableSeats) {
  const template = getCabinTemplate(travelClass);
  const random = createRandom(hashFromText(`${flightId}-${travelClass}`));

  const seats = template.rows.flatMap((rowNumber) =>
    template.seatLetters.map((seatLetter) => ({
      id: `${rowNumber}${seatLetter}`,
      label: `${rowNumber}${seatLetter}`,
      rowNumber,
      seatLetter,
      status: "available",
      isExtraLegroom: template.extraLegroomRows.has(rowNumber),
    }))
  );

  const totalSeats = seats.length;
  const normalizedAvailable = Math.max(1, Math.min(totalSeats, Number(availableSeats) || totalSeats));
  const bookedTarget = Math.max(0, totalSeats - normalizedAvailable);

  const indexes = Array.from({ length: totalSeats }, (_, index) => index);
  const bookedSet = new Set();

  while (bookedSet.size < Math.min(bookedTarget, totalSeats - 1)) {
    const picked = indexes[Math.floor(random() * indexes.length)];
    bookedSet.add(picked);
  }

  const normalizedSeats = seats.map((seat, index) => {
    if (bookedSet.has(index)) {
      return { ...seat, status: "booked" };
    }

    if (seat.isExtraLegroom) {
      return { ...seat, status: "extra" };
    }

    return seat;
  });

  return {
    ...template,
    seats: normalizedSeats,
  };
}

function getSeatSurcharge(seat) {
  if (!seat) {
    return 0;
  }

  if (seat.status === "extra") {
    return 720;
  }

  return 0;
}

export default function FlightSeatSelectionPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const persistedState = readFlightBookingFlowState();
  const incomingState = location.state || {};
  const flowState = incomingState.flight ? incomingState : persistedState || {};

  const flight = flowState.flight || null;
  const searchContext = flowState.searchContext || null;
  const travellers = parseTravellerSummary(searchContext?.travellers);
  const travelClass =
    flight?.className || searchContext?.cabinClass || "Economy";

  const [selectedSeatLabels, setSelectedSeatLabels] = useState(
    flowState.selectedSeatLabels || []
  );
  const [mealPreference, setMealPreference] = useState(
    flowState.mealPreference || "standard"
  );
  const [baggagePlan, setBaggagePlan] = useState(flowState.baggagePlan || "20kg");
  const [selectionError, setSelectionError] = useState("");
  const [seatMapCabin, setSeatMapCabin] = useState(null);
  const [seatMapError, setSeatMapError] = useState("");
  const [isSeatMapLoading, setIsSeatMapLoading] = useState(false);

  useEffect(() => {
    if (!flight) {
      return;
    }

    writeFlightBookingFlowState({
      flight,
      searchContext,
    });
  }, [flight, searchContext]);

  useEffect(() => {
    let isCurrent = true;

    if (!flight?.id) {
      setSeatMapCabin(null);
      setSeatMapError("");
      setIsSeatMapLoading(false);
      return () => {
        isCurrent = false;
      };
    }

    const flightId = String(flight.id);
    const shouldFetch =
      flightId &&
      !flightId.toLowerCase().includes("fallback-flight") &&
      !flightId.toLowerCase().includes("demo");

    if (!shouldFetch) {
      setSeatMapCabin(null);
      setSeatMapError("");
      setIsSeatMapLoading(false);
      return () => {
        isCurrent = false;
      };
    }

    setIsSeatMapLoading(true);
    setSeatMapError("");

    (async () => {
      try {
        const seatMap = await getFlightSeatMap(flight.id, travelClass);
        if (!isCurrent) {
          return;
        }

        const cabin = buildCabinFromSeatMap(seatMap, travelClass);
        if (!cabin) {
          setSeatMapCabin(null);
          setSeatMapError("Seat map unavailable. Showing a generated layout instead.");
          return;
        }

        setSeatMapCabin(cabin);
      } catch (error) {
        if (!isCurrent) {
          return;
        }
        setSeatMapCabin(null);
        setSeatMapError(
          error?.message || "Seat map unavailable. Showing a generated layout instead."
        );
      } finally {
        if (isCurrent) {
          setIsSeatMapLoading(false);
        }
      }
    })();

    return () => {
      isCurrent = false;
    };
  }, [flight?.id, travelClass]);

  const cabinData = useMemo(() => {
    if (seatMapCabin) {
      return seatMapCabin;
    }

    const fallbackSeats =
      flight?.availableSeats ||
      flight?.totalAvailableSeats ||
      flight?.totalSeats ||
      undefined;

    return createCabinSeats(flight?.id || "flight", travelClass, fallbackSeats);
  }, [flight, seatMapCabin, travelClass]);

  const seatsByLabel = useMemo(() => {
    const map = new Map();

    cabinData.seats.forEach((seat) => {
      map.set(seat.label, seat);
    });

    return map;
  }, [cabinData]);

  useEffect(() => {
    if (!seatMapCabin) {
      return;
    }

    const seatLookup = new Map();
    seatMapCabin.seats.forEach((seat) => {
      seatLookup.set(seat.label, seat);
    });

    setSelectedSeatLabels((previous) =>
      previous.filter((label) => {
        const seat = seatLookup.get(label);
        return seat && seat.status !== "booked";
      })
    );
  }, [seatMapCabin]);

  const selectedSeats = useMemo(
    () => selectedSeatLabels.map((label) => seatsByLabel.get(label)).filter(Boolean),
    [selectedSeatLabels, seatsByLabel]
  );

  const baseFareTotal = (Number(flight?.fare) || 0) * travellers.seatRequired;
  const seatSurcharge = selectedSeats.reduce(
    (sum, seat) => sum + getSeatSurcharge(seat),
    0
  );
  const mealFee = mealPreference === "premium" ? 450 : mealPreference === "lite" ? 180 : 0;
  const baggageFee = baggagePlan === "30kg" ? 950 : baggagePlan === "40kg" ? 1850 : 0;
  const subtotal = baseFareTotal + seatSurcharge + mealFee + baggageFee;
  const tax = Math.round(subtotal * 0.12);
  const convenienceFee = 329;
  const totalFare = subtotal + tax + convenienceFee;

  if (!flight) {
    return (
      <main className="flight-flow-page">
        <div className="flight-flow-shell">
          <section className="flight-flow-empty">
            <h2>Select a flight first</h2>
            <p>Open flight results and click Book Now to start the booking flow.</p>
            <button type="button" onClick={() => navigate("/search/flights")}>Go to Flight Search</button>
          </section>
        </div>
      </main>
    );
  }

  const toggleSeat = (seat) => {
    if (!seat || seat.status === "booked") {
      return;
    }

    setSelectionError("");

    setSelectedSeatLabels((previous) => {
      if (previous.includes(seat.label)) {
        return previous.filter((label) => label !== seat.label);
      }

      if (previous.length >= travellers.seatRequired) {
        setSelectionError(
          `You can select up to ${travellers.seatRequired} seat(s) for this booking.`
        );
        return previous;
      }

      return [...previous, seat.label];
    });
  };

  const handleContinue = () => {
    if (selectedSeats.length !== travellers.seatRequired) {
      setSelectionError(
        `Select exactly ${travellers.seatRequired} seat(s) to continue to passenger details.`
      );
      return;
    }

    const flowPayload = {
      flight,
      searchContext,
      selectedSeatLabels,
      selectedSeats,
      mealPreference,
      baggagePlan,
      fareSummary: {
        baseFare: baseFareTotal,
        seatSurcharge,
        mealFee,
        baggageFee,
        tax,
        convenienceFee,
        totalFare,
      },
    };

    writeFlightBookingFlowState(flowPayload);
    navigate("/flight/passenger-details", { state: flowPayload });
  };

  return (
    <main className="flight-flow-page">
      <div className="flight-flow-shell">
        <section className="flight-flow-summary">
          <div className="flight-summary-route">
            <article>
              <small>From</small>
              <strong>{flight.sourceCode || searchContext?.source || "--"}</strong>
              <span>{searchContext?.source || "--"}</span>
            </article>
            <article>
              <small>To</small>
              <strong>{flight.destinationCode || searchContext?.destination || "--"}</strong>
              <span>{searchContext?.destination || "--"}</span>
            </article>
          </div>

          <div className="flight-summary-meta">
            <div>
              <span>Flight</span>
              <strong>{flight.airlineName} ({flight.flightNumber})</strong>
            </div>
            <div>
              <span>Cabin</span>
              <strong>{travelClass}</strong>
            </div>
            <div>
              <span>Seats Required</span>
              <strong>{travellers.seatRequired}</strong>
            </div>
          </div>
        </section>

        <section className="flight-seat-layout">
          <article className="flight-cabin-card">
            <header className="flight-card-head">
              <div>
                <h2>{cabinData.zoneName} Seat Map</h2>
                <span>Choose your preferred seat positions</span>
              </div>
              <Plane size={18} />
            </header>

            <div className="flight-cabin-body">
              {isSeatMapLoading && (
                <p className="flight-seat-hint">
                  <Loader2 size={14} className="spin" /> Loading seat map...
                </p>
              )}

              {seatMapError && (
                <p className="flight-flow-error">
                  <Info size={14} />
                  {seatMapError}
                </p>
              )}

              <div className="flight-seat-legend">
                <span>Available</span>
                <span className="booked">Booked</span>
                <span className="extra">Extra Legroom</span>
                <span className="selected">Selected</span>
              </div>

              <div className="flight-seat-grid">
                {cabinData.rows.map((rowNumber) => {
                  const rowLayoutClass =
                    cabinData.seatLetters.length === 6 ? "layout-6" : "layout-4";
                  const rowElements = [];

                  rowElements.push(
                    <span key={`row-${rowNumber}`} className="row-label">
                      {rowNumber}
                    </span>
                  );

                    cabinData.seatLetters.forEach((seatLetter, index) => {
                      if (index === Math.ceil(cabinData.seatLetters.length / 2)) {
                        rowElements.push(
                          <span key={`aisle-${rowNumber}`} className="seat-aisle" />
                        );
                      }

                      const seat = seatsByLabel.get(`${rowNumber}${seatLetter}`);
                      const isDisabled = !seat || seat?.status === "booked";
                      const isSelected = selectedSeatLabels.includes(seat?.label);

                      rowElements.push(
                        <button
                          key={seat?.id || `${rowNumber}-${seatLetter}`}
                          type="button"
                          className={`flight-seat status-${seat?.status || "available"} ${
                            isSelected ? "status-selected" : ""
                          }`}
                          disabled={isDisabled}
                          onClick={() => toggleSeat(seat)}
                        >
                          {seatLetter}
                        </button>
                      );
                    });

                  return (
                    <div className={`flight-seat-row ${rowLayoutClass}`} key={`row-wrap-${rowNumber}`}>
                      {rowElements}
                    </div>
                  );
                })}
              </div>

              <p className="flight-seat-hint">
                Select {travellers.seatRequired} seat(s). Extra-legroom seats have added charges.
              </p>

              {selectionError && (
                <p className="flight-flow-error">
                  <Info size={14} />
                  {selectionError}
                </p>
              )}
            </div>
          </article>

          <aside className="flight-side-card">
            <h3>Seat Selection Summary</h3>

            <div className="flight-selected-seats">
              <p>Selected Seats</p>
              <strong>{selectedSeats.length > 0 ? selectedSeats.map((seat) => seat.label).join(", ") : "No seat selected"}</strong>
            </div>

            <div className="flight-options-group">
              <label>
                <span>
                  <Utensils size={14} /> Meal Preference
                </span>
                <select
                  value={mealPreference}
                  onChange={(event) => setMealPreference(event.target.value)}
                >
                  <option value="standard">Standard Meal (Included)</option>
                  <option value="lite">Lite Meal (+INR 180)</option>
                  <option value="premium">Premium Meal (+INR 450)</option>
                </select>
              </label>

              <label>
                <span>
                  <Luggage size={14} /> Checked Baggage
                </span>
                <select
                  value={baggagePlan}
                  onChange={(event) => setBaggagePlan(event.target.value)}
                >
                  <option value="20kg">20kg (Included)</option>
                  <option value="30kg">30kg (+INR 950)</option>
                  <option value="40kg">40kg (+INR 1850)</option>
                </select>
              </label>
            </div>

            <div className="flight-fare-list">
              <div>
                <span>Base Fare</span>
                <strong>{formatCurrency(baseFareTotal)}</strong>
              </div>
              <div>
                <span>Seat Charges</span>
                <strong>{formatCurrency(seatSurcharge)}</strong>
              </div>
              <div>
                <span>Meal + Baggage</span>
                <strong>{formatCurrency(mealFee + baggageFee)}</strong>
              </div>
              <div>
                <span>Tax</span>
                <strong>{formatCurrency(tax)}</strong>
              </div>
              <div>
                <span>Convenience Fee</span>
                <strong>{formatCurrency(convenienceFee)}</strong>
              </div>
              <div className="total">
                <span>Total</span>
                <strong>{formatCurrency(totalFare)}</strong>
              </div>
            </div>

            <button
              type="button"
              className="flight-primary-btn"
              onClick={handleContinue}
              disabled={selectedSeats.length !== travellers.seatRequired}
            >
              Continue to Passenger Details
            </button>
          </aside>
        </section>
      </div>
    </main>
  );
}
