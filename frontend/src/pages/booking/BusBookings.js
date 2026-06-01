import React, { useEffect, useMemo, useState } from "react";
import {
  Eye,
  Loader2,
  RefreshCw,
  Search,
  ShieldX,
  SlidersHorizontal,
  X,
  XCircle,
} from "lucide-react";
import {
  cancelBusBooking,
  getBusBookingById,
  listBusBookings,
} from "../../services/busBookingService";
import "../../STYLES/BusOpsDashboard.css";
import { formatDateTime } from "../../utils/apiDateFormat";

function formatCurrency(value) {
  return `INR ${new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(Math.round(Number(value) || 0))}`;
}

function getStatusClassName(status) {
  if (status === "Cancelled") {
    return "danger";
  }

  if (status === "Completed") {
    return "completed";
  }

  if (status === "Booked") {
    return "success";
  }

  return "default";
}

function hasJourneyCompleted(booking) {
  const departureTime = booking?.departureTimeUtc
    ? new Date(booking.departureTimeUtc)
    : null;

  return Boolean(
    departureTime &&
      !Number.isNaN(departureTime.getTime()) &&
      departureTime.getTime() < Date.now()
  );
}

function getDisplayStatus(booking) {
  const status = String(booking?.status || "").trim();

  if (status === "Cancelled") {
    return "Cancelled";
  }

  if (hasJourneyCompleted(booking)) {
    return "Completed";
  }

  return status || "Booked";
}

export default function BusBookings() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    passengerPhone: "",
    status: "All",
    bookingReference: "",
    passengerName: "",
    fromCity: "",
    toCity: "",
    departureDate: "",
  });

  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [loadingDetailFor, setLoadingDetailFor] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancellingBookingId, setCancellingBookingId] = useState(null);

  const fetchBookings = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const result = await listBusBookings({
        passengerPhone: filters.passengerPhone || undefined,
        status:
          filters.status === "All" || filters.status === "Completed"
            ? undefined
            : filters.status,
      });
      setBookings(result);
    } catch (error) {
      setBookings([]);
      setErrorMessage(error.message || "Unable to load bus bookings.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const displayStatus = getDisplayStatus(booking);

      if (filters.status !== "All" && displayStatus !== filters.status) {
        return false;
      }

      if (
        filters.bookingReference &&
        !String(booking.bookingReference || "")
          .toLowerCase()
          .includes(filters.bookingReference.toLowerCase())
      ) {
        return false;
      }

      if (
        filters.passengerName &&
        !String(booking.passengerName || "")
          .toLowerCase()
          .includes(filters.passengerName.toLowerCase())
      ) {
        return false;
      }

      if (
        filters.fromCity &&
        !String(booking.fromCity || "")
          .toLowerCase()
          .includes(filters.fromCity.toLowerCase())
      ) {
        return false;
      }

      if (
        filters.toCity &&
        !String(booking.toCity || "")
          .toLowerCase()
          .includes(filters.toCity.toLowerCase())
      ) {
        return false;
      }

      if (filters.departureDate) {
        const departureDate = String(booking.departureTimeUtc || "").slice(0, 10);
        if (departureDate !== filters.departureDate) {
          return false;
        }
      }

      return true;
    });
  }, [bookings, filters]);

  const handleReset = () => {
    setFilters({
      passengerPhone: "",
      status: "All",
      bookingReference: "",
      passengerName: "",
      fromCity: "",
      toCity: "",
      departureDate: "",
    });
    setErrorMessage("");
    setActionMessage("");
  };

  const handleViewDetails = async (bookingId) => {
    setLoadingDetailFor(bookingId);
    setErrorMessage("");

    try {
      const detail = await getBusBookingById(bookingId);
      setSelectedBooking(detail);
    } catch (error) {
      setErrorMessage(error.message || "Unable to fetch booking details.");
    } finally {
      setLoadingDetailFor(null);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    const reason = window.prompt("Enter cancellation reason (optional):", "Plan changed");
    if (reason === null) {
      return;
    }

    setCancellingBookingId(bookingId);
    setErrorMessage("");
    setActionMessage("");

    try {
      const result = await cancelBusBooking(bookingId, reason || undefined);
      setActionMessage(
        `Booking ${result.bookingReference || bookingId} has been cancelled.`
      );
      await fetchBookings();
    } catch (error) {
      setErrorMessage(error.message || "Unable to cancel booking.");
    } finally {
      setCancellingBookingId(null);
    }
  };

  return (
    <div className="flight-ops-page bus-booking-status-page">
      <header className="flight-ops-header">
        <div>
          <h1>Bus Bookings</h1>
        </div>
        <div className="flight-ops-header-actions">
          <button type="button" onClick={fetchBookings} className="ops-icon-btn">
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => setIsFilterOpen((previous) => !previous)}
            className="ops-icon-btn"
          >
            <SlidersHorizontal size={15} />
            <span>{isFilterOpen ? "Hide Filters" : "Show Filters"}</span>
          </button>
        </div>
      </header>

      {errorMessage && (
        <div className="ops-feedback error">
          <XCircle size={15} />
          <span>{errorMessage}</span>
        </div>
      )}

      {actionMessage && (
        <div className="ops-feedback success">
          <span>{actionMessage}</span>
        </div>
      )}

      {isFilterOpen && (
        <section className="flight-ops-filters">
          <label>
            <span>Passenger Phone</span>
            <input
              type="text"
              value={filters.passengerPhone}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  passengerPhone: event.target.value,
                }))
              }
              placeholder="+91XXXXXXXXXX"
            />
          </label>

          <label>
            <span>Status</span>
            <select
              value={filters.status}
              onChange={(event) =>
                setFilters((previous) => ({ ...previous, status: event.target.value }))
              }
            >
              <option value="All">All</option>
              <option value="Booked">Booked</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </label>

          <label>
            <span>Booking Reference</span>
            <input
              type="text"
              value={filters.bookingReference}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  bookingReference: event.target.value,
                }))
              }
              placeholder="BS-2026..."
            />
          </label>

          <label>
            <span>Passenger Name</span>
            <input
              type="text"
              value={filters.passengerName}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  passengerName: event.target.value,
                }))
              }
              placeholder="Passenger name"
            />
          </label>

          <label>
            <span>From City</span>
            <input
              type="text"
              value={filters.fromCity}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  fromCity: event.target.value,
                }))
              }
              placeholder="Hyderabad"
            />
          </label>

          <label>
            <span>To City</span>
            <input
              type="text"
              value={filters.toCity}
              onChange={(event) =>
                setFilters((previous) => ({ ...previous, toCity: event.target.value }))
              }
              placeholder="Vijayawada"
            />
          </label>

          <label>
            <span>Departure Date</span>
            <input
              type="date"
              value={filters.departureDate}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  departureDate: event.target.value,
                }))
              }
            />
          </label>

          <div className="filters-actions">
            <button type="button" className="primary" onClick={fetchBookings}>
              <Search size={14} />
              <span>Search</span>
            </button>
            <button type="button" className="secondary" onClick={handleReset}>
              <X size={14} />
              <span>Clear</span>
            </button>
          </div>
        </section>
      )}
      <section className="flight-ops-table-wrap">
        {isLoading ? (
          <div className="ops-empty">
            <Loader2 size={18} className="spin" />
            <p>Loading bus bookings...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="ops-empty">
            <p>No bus bookings found for current filters.</p>
          </div>
        ) : (
          <div className="ops-table-scroll">
            <table className="ops-table">
              <thead>
                <tr>
                  <th>Booking Ref</th>
                  <th>Passenger</th>
                  <th>Route</th>
                  <th>Departure</th>
                  <th>Seats</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => {
                  const displayStatus = getDisplayStatus(booking);

                  return (
                  <tr key={booking.bookingId}>
                    <td>
                      <span>{booking.bookingReference}</span>
                      <small>ID: {booking.bookingId}</small>
                    </td>
                    <td>
                      <span>{booking.passengerName || "--"}</span>
                      <small>{booking.passengerPhone || "--"}</small>
                    </td>
                    <td>
                      <span>
                        {booking.fromCity} to {booking.toCity}
                      </span>
                      <small>{booking.providerName}</small>
                    </td>
                    <td>
                      <span>{formatDateTime(booking.departureTimeUtc)}</span>
                    </td>
                    <td>
                      <span>{booking.seatsBooked}</span>
                      <small>{booking.tripNumber}</small>
                    </td>
                    <td>
                      <span>{formatCurrency(booking.totalPriceInr)}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusClassName(displayStatus)}`}>
                        {displayStatus}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          title="View details"
                          onClick={() => handleViewDetails(booking.bookingId)}
                          disabled={loadingDetailFor === booking.bookingId}
                        >
                          {loadingDetailFor === booking.bookingId ? (
                            <Loader2 size={15} className="spin" />
                          ) : (
                            <Eye size={15} />
                          )}
                        </button>

                        <button
                          type="button"
                          title="Cancel booking"
                          onClick={() => handleCancelBooking(booking.bookingId)}
                          disabled={
                            displayStatus === "Cancelled" ||
                            displayStatus === "Completed" ||
                            cancellingBookingId === booking.bookingId
                          }
                        >
                          {cancellingBookingId === booking.bookingId ? (
                            <Loader2 size={15} className="spin" />
                          ) : (
                            <ShieldX size={15} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedBooking && (
        <div className="ops-modal-backdrop" onClick={() => setSelectedBooking(null)}>
          <div className="ops-modal" onClick={(event) => event.stopPropagation()}>
            <header>
              <h3>Bus Booking Details</h3>
              <button type="button" onClick={() => setSelectedBooking(null)}>
                <X size={16} />
              </button>
            </header>
            <div className="ops-modal-grid">
              <div>
                <span>Booking Ref</span>
                <strong>{selectedBooking.bookingReference}</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>{getDisplayStatus(selectedBooking)}</strong>
              </div>
              <div>
                <span>Passenger</span>
                <strong>{selectedBooking.passengerName}</strong>
              </div>
              <div>
                <span>Phone</span>
                <strong>{selectedBooking.passengerPhone || "--"}</strong>
              </div>
              <div>
                <span>Email</span>
                <strong>{selectedBooking.passengerEmail || "--"}</strong>
              </div>
              <div>
                <span>Route</span>
                <strong>
                  {selectedBooking.fromCity} to {selectedBooking.toCity}
                </strong>
              </div>
              <div>
                <span>Seats Booked</span>
                <strong>{selectedBooking.seatsBooked}</strong>
              </div>
              <div>
                <span>Total Price</span>
                <strong>{formatCurrency(selectedBooking.totalPriceInr)}</strong>
              </div>
              <div>
                <span>Booked At</span>
                <strong>{formatDateTime(selectedBooking.bookedAtUtc)}</strong>
              </div>
              <div>
                <span>Cancelled At</span>
                <strong>{formatDateTime(selectedBooking.cancelledAtUtc)}</strong>
              </div>
              <div>
                <span>Cancellation Reason</span>
                <strong>{selectedBooking.cancellationReason || "--"}</strong>
              </div>
              <div>
                <span>Operator</span>
                <strong>{selectedBooking.providerName || "--"}</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
