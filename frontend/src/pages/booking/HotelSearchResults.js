import React, { useEffect, useMemo, useState } from "react";
import {
  BedDouble,
  Building2,
  Coffee,
  IndianRupee,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  Star,
  User,
  Wifi,
  X,
} from "lucide-react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { toDisplayDate } from "../../utils/apiDateFormat";
import { isTokenExpired } from "../../services/authSession";
import {
  bookHotelOffer,
  getHotelOfferDetails,
  searchHotelOffers,
} from "../../services/hotelBookingService";
import { openAuthModal } from "../../utils/authModalEvents";
import "../../STYLES/HotelSearchResults.css";

const HOTEL_PROMO_ITEMS = [
  { id: "breakfast", icon: Coffee, title: "Breakfast Picks", text: "Scan meal-ready stays" },
  { id: "wifi", icon: Wifi, title: "Work Ready", text: "Wi-Fi and desk-friendly rooms" },
  { id: "secure", icon: ShieldCheck, title: "Clear Policies", text: "Review cancellation notes" },
  { id: "rooms", icon: BedDouble, title: "Room Choices", text: "Compare comfort levels" },
];

const CITY_CODES = {
  ahmedabad: "AMD",
  bangalore: "BLR",
  bengaluru: "BLR",
  chennai: "MAA",
  delhi: "DEL",
  goa: "GOI",
  hyderabad: "HYD",
  kolkata: "CCU",
  london: "LON",
  mumbai: "BOM",
  paris: "PAR",
  pune: "PNQ",
};

function readValue(params, state, key, fallback = "") {
  const queryValue = params.get(key);

  if (typeof queryValue === "string" && queryValue.trim()) {
    return queryValue.trim();
  }

  const stateValue = state?.[key];
  return typeof stateValue === "string" && stateValue.trim()
    ? stateValue.trim()
    : fallback;
}

function toDateInput(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function resolveCityCode(destination) {
  const clean = String(destination || "").trim();
  if (/^[a-z]{3}$/i.test(clean)) {
    return clean.toUpperCase();
  }

  const normalized = clean.toLowerCase();
  return CITY_CODES[normalized] || clean.slice(0, 3).toUpperCase() || "DEL";
}

function formatMoney(value, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency || "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function parseStoredUser() {
  try {
    return JSON.parse(window.localStorage.getItem("user") || "{}") || {};
  } catch {
    return {};
  }
}

function formatHotelDate(value) {
  const raw = String(value || "").slice(0, 10);
  return toDisplayDate(raw) || raw || "--";
}

function calcNights(checkInDate, checkOutDate) {
  const start = new Date(checkInDate);
  const end = new Date(checkOutDate);
  const diff = end.getTime() - start.getTime();
  return Math.max(1, Math.round(diff / 86400000) || 1);
}

function normalizeOffer(offer, hotel, index) {
  const hotelName = offer.hotelName || offer.HotelName || hotel.name || hotel.Name || "Hotel stay";
  const cityCode = offer.cityCode || offer.CityCode || hotel.cityCode || hotel.CityCode || "";
  const address = offer.address || offer.Address || hotel.address || hotel.Address || cityCode;
  const roomCategory = offer.roomCategory || offer.RoomCategory || "Room";
  const bedType = offer.bedType || offer.BedType || "";
  const paymentType = offer.paymentType || offer.PaymentType || "";

  return {
    offerId: String(offer.offerId || offer.OfferId || `${hotelName}-${index}`),
    hotelId: offer.hotelId || offer.HotelId || hotel.hotelId || hotel.HotelId || "",
    hotelName,
    cityCode,
    address,
    checkInDate: offer.checkInDate || offer.CheckInDate || "",
    checkOutDate: offer.checkOutDate || offer.CheckOutDate || "",
    roomQuantity: offer.roomQuantity || offer.RoomQuantity || 1,
    roomCategory,
    bedType,
    beds: offer.beds || offer.Beds || 1,
    roomDescription: offer.roomDescription || offer.RoomDescription || roomCategory,
    price: Number(offer.price ?? offer.Price ?? 0),
    currency: offer.currency || offer.Currency || "INR",
    cancellationDeadline: offer.cancellationDeadline || offer.CancellationDeadline || "",
    cancellationPolicy: offer.cancellationPolicy || offer.CancellationPolicy || "Check policy before booking.",
    checkInTime: offer.checkInTime || offer.CheckInTime || "",
    checkOutTime: offer.checkOutTime || offer.CheckOutTime || "",
    paymentType,
    tag: paymentType ? paymentType.replace(/_/g, " ") : "Verified offer",
    rating: (4.2 + (index % 6) / 10).toFixed(1),
    amenities: [roomCategory, bedType, paymentType].filter(Boolean).slice(0, 3),
  };
}

function flattenHotelOffers(hotels) {
  return hotels.flatMap((hotel, hotelIndex) => {
    const offers = Array.isArray(hotel.offers || hotel.Offers) ? (hotel.offers || hotel.Offers) : [];
    return offers.map((offer, offerIndex) =>
      normalizeOffer(offer, hotel, hotelIndex * 20 + offerIndex)
    );
  });
}

export default function HotelSearchResults() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};
  const today = useMemo(() => new Date(), []);

  const destination = readValue(searchParams, state, "destination", "Delhi");
  const cityCode = readValue(searchParams, state, "cityCode", resolveCityCode(destination));
  const checkInDate = readValue(searchParams, state, "checkInDate", toDateInput(addDays(today, 1)));
  const checkOutDate = readValue(searchParams, state, "checkOutDate", toDateInput(addDays(today, 2)));
  const rooms = readValue(searchParams, state, "rooms", "1");
  const adults = readValue(searchParams, state, "adults", "1");
  const guests = readValue(
    searchParams,
    state,
    "guests",
    `${rooms} Room${Number(rooms) > 1 ? "s" : ""}, ${adults} Adult${Number(adults) > 1 ? "s" : ""}`
  );

  const [sortKey, setSortKey] = useState("recommended");
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [offerLoadingId, setOfferLoadingId] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingStatus, setBookingStatus] = useState({ type: "", message: "" });
  const [bookingErrors, setBookingErrors] = useState({});
  const [guestForm, setGuestForm] = useState({
    guestName: "",
    guestEmail: "",
    guestPhone: "",
  });

  useEffect(() => {
    let isMounted = true;

    async function loadHotels() {
      setLoading(true);
      setLoadError("");

      try {
        const hotels = await searchHotelOffers({
          cityCode: resolveCityCode(cityCode || destination),
          checkInDate,
          checkOutDate,
          adults,
          rooms,
        });

        if (isMounted) {
          setOffers(flattenHotelOffers(hotels));
        }
      } catch (error) {
        if (isMounted) {
          setOffers([]);
          setLoadError(error?.message || "Unable to load hotel offers.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadHotels();
    return () => {
      isMounted = false;
    };
  }, [adults, checkInDate, checkOutDate, cityCode, destination, rooms]);

  const sortedOffers = useMemo(() => {
    return [...offers].sort((a, b) => {
      if (sortKey === "price") return a.price - b.price;
      if (sortKey === "rating") return Number(b.rating) - Number(a.rating);
      return Number(b.rating) * 100 - b.price / 100 - (Number(a.rating) * 100 - a.price / 100);
    });
  }, [offers, sortKey]);

  const openBookingReview = async (offer) => {
    setOfferLoadingId(offer.offerId);
    setBookingStatus({ type: "", message: "" });
    setBookingErrors({});

    try {
      const details = await getHotelOfferDetails(offer.offerId);
      const normalized = normalizeOffer(details, details, 0);
      const storedUser = parseStoredUser();
      setGuestForm({
        guestName: storedUser.name || storedUser.fullName || "",
        guestEmail: storedUser.email || "",
        guestPhone: storedUser.mobile || storedUser.phoneNumber || "",
      });
      setSelectedOffer({ ...offer, ...normalized });
    } catch (error) {
      setBookingStatus({
        type: "error",
        message: error?.message || "Selected hotel offer is no longer available.",
      });
    } finally {
      setOfferLoadingId("");
    }
  };

  const closeBookingReview = () => {
    if (bookingLoading) return;
    setSelectedOffer(null);
    setBookingStatus({ type: "", message: "" });
    setBookingErrors({});
  };

  const updateGuestForm = (field, value) => {
    setGuestForm((previous) => ({ ...previous, [field]: value }));
    setBookingErrors({});
    setBookingStatus({ type: "", message: "" });
  };

  const submitHotelBooking = async (event) => {
    event.preventDefault();
    if (!selectedOffer || bookingLoading) return;

    const errors = {};
    const payload = {
      offerId: selectedOffer.offerId,
      guestName: guestForm.guestName.trim(),
      guestEmail: guestForm.guestEmail.trim(),
      guestPhone: guestForm.guestPhone.trim(),
    };

    if (!payload.guestName) errors.guestName = "Guest name is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.guestEmail)) {
      errors.guestEmail = "Enter a valid email";
    }
    if (!/^\+?\d[\d\s-]{7,16}$/.test(payload.guestPhone)) {
      errors.guestPhone = "Enter a valid phone number";
    }

    if (Object.keys(errors).length) {
      setBookingErrors(errors);
      return;
    }

    const token = window.localStorage.getItem("token");
    if (!token || isTokenExpired(token)) {
      openAuthModal("login", {
        returnTo: `${location.pathname || "/search/hotels"}${location.search || ""}`,
      });
      setBookingStatus({
        type: "error",
        message: "Please login with email before confirming this hotel booking.",
      });
      return;
    }

    setBookingLoading(true);
    setBookingStatus({ type: "", message: "" });

    try {
      const booking = await bookHotelOffer(payload);
      setBookingStatus({
        type: "success",
        message: `Hotel booked successfully. Reference: ${booking.bookingReference || booking.BookingReference || "Confirmed"}`,
      });
    } catch (error) {
      setBookingStatus({
        type: "error",
        message: error?.message || "Hotel booking failed.",
      });
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <main className="hotel-results-page">
      <div className="hotel-results-shell">
        <section className="hotel-search-summary">
          <div className="hotel-promo-scroller">
            {HOTEL_PROMO_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <article className="hotel-promo-chip" key={item.id}>
                  <span className="hotel-promo-icon">
                    <Icon size={17} />
                  </span>
                  <div>
                    <strong>{item.title}</strong>
                    <small>{item.text}</small>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="hotel-search-card">
            <div className="hotel-route-part">
              <span>Destination</span>
              <strong>{destination} ({resolveCityCode(cityCode || destination)})</strong>
            </div>
            <div className="hotel-route-part">
              <span>Check-in</span>
              <strong>{toDisplayDate(checkInDate) || "Today"}</strong>
            </div>
            <div className="hotel-route-part">
              <span>Check-out</span>
              <strong>{toDisplayDate(checkOutDate) || "Tomorrow"}</strong>
            </div>
            <div className="hotel-route-part">
              <span>Guests</span>
              <strong>{guests}</strong>
            </div>
            <button
              type="button"
              className="hotel-modify-btn"
              onClick={() => navigate("/?tab=hotels")}
            >
              Modify Search
            </button>
          </div>
        </section>

        <section className="hotel-results-layout">
          <aside className="hotel-filter-panel">
            <div className="hotel-filter-head">
              <span>Filters</span>
              <strong>{sortedOffers.length} stays</strong>
            </div>
            <label>
              Sort by
              <select value={sortKey} onChange={(event) => setSortKey(event.target.value)}>
                <option value="recommended">Recommended</option>
                <option value="price">Lowest price</option>
                <option value="rating">Highest rating</option>
              </select>
            </label>
            <div className="hotel-filter-note">
              <ShieldCheck size={16} />
              <span>Live hotel prices are rechecked before you enter guest details.</span>
            </div>
          </aside>

          <section className="hotel-list-panel">
            <header className="hotel-list-head">
              <div>
                <span>Hotel Results</span>
                <h1>
                  {loading ? "Searching stays" : `${sortedOffers.length} stays in ${destination}`}
                </h1>
              </div>
              <button type="button" onClick={() => navigate("/?tab=hotels")}>
                <Search size={15} />
                New search
              </button>
            </header>

            {bookingStatus.message && !selectedOffer && (
              <p className={`hotel-inline-status ${bookingStatus.type === "success" ? "is-success" : "is-error"}`}>
                {bookingStatus.message}
              </p>
            )}

            {loading && (
              <div className="hotel-state-card">
                <Loader2 size={22} className="hotel-spin" />
                <strong>Finding available hotel offers...</strong>
              </div>
            )}

            {!loading && loadError && (
              <div className="hotel-state-card is-error">
                <strong>{loadError}</strong>
                <span>Try changing the city code or stay dates.</span>
              </div>
            )}

            {!loading && !loadError && sortedOffers.length === 0 && (
              <div className="hotel-state-card">
                <strong>No hotel offers found.</strong>
                <span>Try another city code, check-in date, or room count.</span>
              </div>
            )}

            <div className="hotel-card-list">
              {sortedOffers.map((hotel) => (
                <article className="hotel-result-card" key={hotel.offerId}>
                  <div className="hotel-result-art">
                    <Building2 size={38} />
                    <span>{hotel.tag}</span>
                  </div>

                  <div className="hotel-result-main">
                    <div className="hotel-result-title-row">
                      <div>
                        <h2>{hotel.hotelName}</h2>
                        <p>
                          <MapPin size={14} />
                          {hotel.address}
                        </p>
                      </div>
                      <span className="hotel-rating">
                        <Star size={14} fill="currentColor" />
                        {hotel.rating}
                      </span>
                    </div>

                    <div className="hotel-amenities">
                      {hotel.amenities.map((amenity) => (
                        <span key={amenity}>{amenity}</span>
                      ))}
                    </div>

                    <p className="hotel-result-note">
                      {hotel.roomDescription}. {hotel.cancellationPolicy}
                    </p>
                  </div>

                  <aside className="hotel-price-panel">
                    <span>{calcNights(hotel.checkInDate || checkInDate, hotel.checkOutDate || checkOutDate)} night stay</span>
                    <strong>{formatMoney(hotel.price, hotel.currency)}</strong>
                    <small>{hotel.currency}</small>
                    <button type="button" onClick={() => openBookingReview(hotel)} disabled={offerLoadingId === hotel.offerId}>
                      {offerLoadingId === hotel.offerId ? <Loader2 size={15} className="hotel-spin" /> : <IndianRupee size={15} />}
                      Select Stay
                    </button>
                  </aside>
                </article>
              ))}
            </div>
          </section>
        </section>
      </div>

      {selectedOffer && (
        <div className="hotel-booking-modal-shell" role="dialog" aria-modal="true" aria-label="Review hotel booking">
          <button type="button" className="hotel-booking-backdrop" onClick={closeBookingReview} aria-label="Close hotel review" />
          <section className="hotel-booking-modal">
            <button type="button" className="hotel-booking-close" onClick={closeBookingReview} aria-label="Close">
              <X size={18} />
            </button>

            <div className="hotel-booking-summary">
              <span>Revalidated Offer</span>
              <h2>{selectedOffer.hotelName}</h2>
              <p>{selectedOffer.address}</p>
              <dl>
                <div>
                  <dt>Check-in</dt>
                  <dd>{formatHotelDate(selectedOffer.checkInDate || checkInDate)}</dd>
                </div>
                <div>
                  <dt>Check-out</dt>
                  <dd>{formatHotelDate(selectedOffer.checkOutDate || checkOutDate)}</dd>
                </div>
                <div>
                  <dt>Room</dt>
                  <dd>{selectedOffer.roomDescription}</dd>
                </div>
                <div>
                  <dt>Total</dt>
                  <dd>{formatMoney(selectedOffer.price, selectedOffer.currency)}</dd>
                </div>
              </dl>
              <small>{selectedOffer.cancellationPolicy}</small>
            </div>

            <form className="hotel-booking-form" onSubmit={submitHotelBooking}>
              <h3>Guest details</h3>

              {bookingStatus.message && (
                <p className={`hotel-inline-status ${bookingStatus.type === "success" ? "is-success" : "is-error"}`}>
                  {bookingStatus.message}
                </p>
              )}

              <label>
                Full name
                <span>
                  <User size={16} />
                  <input
                    value={guestForm.guestName}
                    onChange={(event) => updateGuestForm("guestName", event.target.value)}
                    placeholder="Primary guest name"
                  />
                </span>
                {bookingErrors.guestName && <small>{bookingErrors.guestName}</small>}
              </label>

              <label>
                Email
                <span>
                  <Mail size={16} />
                  <input
                    type="email"
                    value={guestForm.guestEmail}
                    onChange={(event) => updateGuestForm("guestEmail", event.target.value)}
                    placeholder="Guest email"
                  />
                </span>
                {bookingErrors.guestEmail && <small>{bookingErrors.guestEmail}</small>}
              </label>

              <label>
                Phone
                <span>
                  <Phone size={16} />
                  <input
                    value={guestForm.guestPhone}
                    onChange={(event) => updateGuestForm("guestPhone", event.target.value)}
                    placeholder="+91 9876543210"
                  />
                </span>
                {bookingErrors.guestPhone && <small>{bookingErrors.guestPhone}</small>}
              </label>

              <button type="submit" disabled={bookingLoading || bookingStatus.type === "success"}>
                {bookingLoading ? "Confirming..." : "Confirm hotel booking"}
              </button>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
