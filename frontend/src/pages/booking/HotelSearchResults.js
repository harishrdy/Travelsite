import React, { useMemo, useState } from "react";
import {
  BedDouble,
  Building2,
  Coffee,
  IndianRupee,
  MapPin,
  Search,
  ShieldCheck,
  Star,
  Wifi,
} from "lucide-react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { toDisplayDate } from "../../utils/apiDateFormat";
import "../../STYLES/HotelSearchResults.css";

const HOTEL_PROMO_ITEMS = [
  { id: "breakfast", icon: Coffee, title: "Breakfast Picks", text: "Scan meal-ready stays" },
  { id: "wifi", icon: Wifi, title: "Work Ready", text: "Wi-Fi and desk-friendly rooms" },
  { id: "secure", icon: ShieldCheck, title: "Clear Policies", text: "Review cancellation notes" },
  { id: "rooms", icon: BedDouble, title: "Room Choices", text: "Compare comfort levels" },
];

const HOTEL_RESULTS = [
  {
    id: "hotel-hyd-1",
    name: "Atlas Pearl Suites",
    city: "Hyderabad",
    area: "HITEC City",
    rating: 4.7,
    price: 3499,
    oldPrice: 4299,
    tag: "Business pick",
    amenities: ["Breakfast", "Wi-Fi", "Late check-in"],
    note: "Flexible cancellation available on select rooms.",
  },
  {
    id: "hotel-hyd-2",
    name: "Teal Courtyard Hotel",
    city: "Hyderabad",
    area: "Gachibowli",
    rating: 4.5,
    price: 2899,
    oldPrice: 3699,
    tag: "Value stay",
    amenities: ["Wi-Fi", "Parking", "Restaurant"],
    note: "Popular for short business stays.",
  },
  {
    id: "hotel-blr-1",
    name: "Cobalt Garden Hotel",
    city: "Bengaluru",
    area: "Indiranagar",
    rating: 4.6,
    price: 4199,
    oldPrice: 4999,
    tag: "City favorite",
    amenities: ["Breakfast", "Wi-Fi", "Workspace"],
    note: "Calm rooms with quick metro access.",
  },
  {
    id: "hotel-mum-1",
    name: "Harbour View Residency",
    city: "Mumbai",
    area: "Colaba",
    rating: 4.8,
    price: 5299,
    oldPrice: 6399,
    tag: "Premium stay",
    amenities: ["Sea view", "Breakfast", "Concierge"],
    note: "Best for weekend and premium city stays.",
  },
  {
    id: "hotel-goa-1",
    name: "Coral Bay Retreat",
    city: "Goa",
    area: "Candolim",
    rating: 4.6,
    price: 4899,
    oldPrice: 5799,
    tag: "Resort style",
    amenities: ["Pool", "Breakfast", "Beach access"],
    note: "Relaxed stay close to cafes and beach routes.",
  },
  {
    id: "hotel-del-1",
    name: "Metro Nest Hotel",
    city: "Delhi",
    area: "Aerocity",
    rating: 4.4,
    price: 2999,
    oldPrice: 3799,
    tag: "Airport friendly",
    amenities: ["Airport access", "Wi-Fi", "Restaurant"],
    note: "Good for overnight and transit stays.",
  },
];

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

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

export default function HotelSearchResults() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};

  const destination = readValue(searchParams, state, "destination", "Hyderabad");
  const checkInDate = readValue(searchParams, state, "checkInDate", "");
  const checkOutDate = readValue(searchParams, state, "checkOutDate", "");
  const rooms = readValue(searchParams, state, "rooms", "1");
  const adults = readValue(searchParams, state, "adults", "2");
  const guests = readValue(
    searchParams,
    state,
    "guests",
    `${rooms} Room${Number(rooms) > 1 ? "s" : ""}, ${adults} Adult${Number(adults) > 1 ? "s" : ""}`,
  );

  const [sortKey, setSortKey] = useState("recommended");

  const hotels = useMemo(() => {
    const normalizedDestination = destination.toLowerCase();
    const matching = HOTEL_RESULTS.filter((hotel) =>
      `${hotel.city} ${hotel.area} ${hotel.name}`
        .toLowerCase()
        .includes(normalizedDestination),
    );
    const base = matching.length > 0 ? matching : HOTEL_RESULTS;

    return [...base].sort((a, b) => {
      if (sortKey === "price") return a.price - b.price;
      if (sortKey === "rating") return b.rating - a.rating;
      return b.rating * 100 - b.price / 100 - (a.rating * 100 - a.price / 100);
    });
  }, [destination, sortKey]);

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
              <strong>{destination}</strong>
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
              <strong>{hotels.length} stays</strong>
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
              <span>Hotel data is prepared as a front-end demo until hotel APIs are connected.</span>
            </div>
          </aside>

          <section className="hotel-list-panel">
            <header className="hotel-list-head">
              <div>
                <span>Hotel Results</span>
                <h1>{hotels.length} stays in {destination}</h1>
              </div>
              <button type="button" onClick={() => navigate("/?tab=hotels")}>
                <Search size={15} />
                New search
              </button>
            </header>

            <div className="hotel-card-list">
              {hotels.map((hotel) => (
                <article className="hotel-result-card" key={hotel.id}>
                  <div className="hotel-result-art">
                    <Building2 size={38} />
                    <span>{hotel.tag}</span>
                  </div>

                  <div className="hotel-result-main">
                    <div className="hotel-result-title-row">
                      <div>
                        <h2>{hotel.name}</h2>
                        <p>
                          <MapPin size={14} />
                          {hotel.area}, {hotel.city}
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

                    <p className="hotel-result-note">{hotel.note}</p>
                  </div>

                  <aside className="hotel-price-panel">
                    <span>per night</span>
                    <strong>{formatCurrency(hotel.price)}</strong>
                    <small>{formatCurrency(hotel.oldPrice)}</small>
                    <button type="button">
                      <IndianRupee size={15} />
                      Select Stay
                    </button>
                  </aside>
                </article>
              ))}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
