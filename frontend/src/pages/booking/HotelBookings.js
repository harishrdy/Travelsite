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
  getMyHotelBookings,
  cancelHotelBooking,
} from "../../services/hotelBookingService";
import "../../STYLES/FlightOpsDashboard.css";
import { formatDateTime } from "../../utils/apiDateFormat";

function formatCurrency(value) {
  return `INR ${new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(Math.round(Number(value) || 0))}`;
}

function getStatusClassName(status) {
  const normalized = String(status || "").trim().toLowerCase();
  if (normalized.includes("cancel")) {
    return "danger";
  }
  if (
    normalized.includes("confirm") ||
    normalized.includes("success") ||
    normalized.includes("complete") ||
    normalized.includes("booked")
  ) {
    return "success";
  }
  return "default";
}

export default function HotelBookings() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: "All",
    bookingReference: "",
    hotelName: "",
    guestName: "",
  });
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancellingBookingId, setCancellingBookingId] = useState(null);

  const fetchBookings = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const result = await getMyHotelBookings();
      setBookings(Array.isArray(result) ? result : []);
    } catch (error) {
      setBookings([]);
      setErrorMessage(error.message || "Unable to load hotel bookings.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      if (
        filters.bookingReference &&
        !String(booking.bookingReference || "")
          .toLowerCase()
          .includes(filters.bookingReference.toLowerCase())
      ) {
        return false;
      }

      if (
        filters.hotelName &&
        !String(booking.hotelName || "")
          .toLowerCase()
          .includes(filters.hotelName.toLowerCase())
      ) {
        return false;
      }

      if (
        filters.guestName &&
        !String(booking.guestName || "")
          .toLowerCase()
          .includes(filters.guestName.toLowerCase())
      ) {
        return false;
      }

      if (filters.status !== "All") {
        const statusLower = String(booking.status || "").toLowerCase();
        const filterLower = filters.status.toLowerCase();
        if (!statusLower.includes(filterLower)) {
          return false;
        }
      }

      return true;
    });
  }, [bookings, filters]);

  const handleReset = () => {
    setFilters({
      status: "All",
      bookingReference: "",
      hotelName: "",
      guestName: "",
    });
    setErrorMessage("");
    setActionMessage("");
  };

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
  };

  const handleCancelBooking = async (bookingId) => {
    const reason = window.prompt("Enter cancellation reason:", "Change of plans");
    if (reason === null) {
      return;
    }

    setCancellingBookingId(bookingId);
    setErrorMessage("");
    setActionMessage("");

    try {
      const result = await cancelHotelBooking(bookingId, reason || undefined);
      setActionMessage(
        `Hotel Booking ${result.bookingReference || bookingId} cancelled successfully.`
      );
      await fetchBookings();
    } catch (error) {
      setErrorMessage(error.message || "Unable to cancel hotel booking.");
    } finally {
      setCancellingBookingId(null);
    }
  };

  return (
    <div className="flight-ops-page">
      <header className="flight-ops-header">
        <div>
          <h1>Hotel Stays & Reservations</h1>
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
            <span>Status</span>
            <select
              value={filters.status}
              onChange={(event) =>
                setFilters((previous) => ({ ...previous, status: event.target.value }))
              }
            >
              <option value="All">All</option>
              <option value="Confirmed">Confirmed</option>
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
              placeholder="HT-2026..."
            />
          </label>

          <label>
            <span>Hotel Name</span>
            <input
              type="text"
              value={filters.hotelName}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  hotelName: event.target.value,
                }))
              }
              placeholder="Ambassador"
            />
          </label>

          <label>
            <span>Guest Name</span>
            <input
              type="text"
              value={filters.guestName}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  guestName: event.target.value,
                }))
              }
              placeholder="John Doe"
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
            <p>Loading hotel reservations...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="ops-empty">
            <p>No hotel reservations found.</p>
          </div>
        ) : (
          <div className="ops-table-scroll">
            <table className="ops-table">
              <thead>
                <tr>
                  <th>Booking Ref</th>
                  <th>Guest Name</th>
                  <th>Hotel Property</th>
                  <th>Dates of Stay</th>
                  <th>Amount Paid</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => (
                  <tr key={booking.bookingId}>
                    <td>
                      <strong>{booking.bookingReference}</strong>
                      <small>ID: {booking.bookingId}</small>
                    </td>
                    <td>
                      <strong>{booking.guestName || "Primary Guest"}</strong>
                    </td>
                    <td>
                      <strong>{booking.hotelName}</strong>
                    </td>
                    <td>
                      <strong>{booking.dates || booking.checkInDate}</strong>
                    </td>
                    <td>
                      <strong>{formatCurrency(booking.amount || booking.price)}</strong>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusClassName(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          title="View details"
                          onClick={() => handleViewDetails(booking)}
                        >
                          <Eye size={15} />
                        </button>

                        <button
                          type="button"
                          title="Cancel booking"
                          onClick={() => handleCancelBooking(booking.bookingId)}
                          disabled={
                            String(booking.status || "").toLowerCase().includes("cancel") ||
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedBooking && (
        <div className="ops-modal-backdrop" onClick={() => setSelectedBooking(null)}>
          <div className="ops-modal" onClick={(event) => event.stopPropagation()}>
            <header>
              <h3>Hotel Stay Details</h3>
              <button type="button" onClick={() => setSelectedBooking(null)}>
                <X size={16} />
              </button>
            </header>
            <div className="ops-modal-grid">
              <div>
                <span>Booking Reference</span>
                <strong>{selectedBooking.bookingReference}</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>{selectedBooking.status}</strong>
              </div>
              <div>
                <span>Guest Name</span>
                <strong>{selectedBooking.guestName || "Primary Guest"}</strong>
              </div>
              <div>
                <span>Hotel Property</span>
                <strong>{selectedBooking.hotelName}</strong>
              </div>
              <div>
                <span>Dates of Stay</span>
                <strong>{selectedBooking.dates || `${selectedBooking.checkInDate} - ${selectedBooking.checkOutDate}`}</strong>
              </div>
              <div>
                <span>Provider booking ID</span>
                <strong>{selectedBooking.providerBookingId || "--"}</strong>
              </div>
              <div>
                <span>Total Amount Paid</span>
                <strong>{formatCurrency(selectedBooking.amount || selectedBooking.price)}</strong>
              </div>
              <div>
                <span>Booked At</span>
                <strong>{selectedBooking.createdAt ? formatDateTime(selectedBooking.createdAt) : "--"}</strong>
              </div>
              {selectedBooking.cancellationReason && (
                <div>
                  <span>Cancellation Reason</span>
                  <strong>{selectedBooking.cancellationReason}</strong>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
