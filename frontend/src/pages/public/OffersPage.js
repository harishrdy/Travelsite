import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tag, Bus, ArrowLeft } from "lucide-react";
import { getPublicFeaturedOffers } from "../../services/adminFeaturedOffersService";
import { sanitizeApiUrlValue, toApiAssetUrl } from "../../services/apiClient";
import SiteFooter from "../../components/layout/SiteFooter";
import { usePromo } from "../../contexts/PromoContext";
import "../../STYLES/OffersPage.css";

function normalizeFeaturedOffer(offer, index) {
  const featuredOfferId = offer?.id ?? offer?.Id ?? offer?.offerId ?? offer?.OfferId ?? null;
  const id = featuredOfferId ?? offer?.offerCode ?? `offer-${index}`;
  const bookingType = String(offer?.bookingType || "").trim();

  return {
    id,
    selectedFeaturedOfferId: featuredOfferId,
    promotionId: offer?.promotionId ?? offer?.PromotionId ?? null,
    offerCode: String(offer?.offerCode || "").trim(),
    title: String(offer?.title || "Travel Offer").trim(),
    subtitle: String(offer?.subtitle || "").trim(),
    description: String(offer?.description || offer?.subtitle || "").trim(),
    couponCode: String(offer?.couponCode || "").trim(),
    imageUrl: sanitizeApiUrlValue(offer?.imageUrl),
    bookingType,
    isActive: offer?.isActive !== false,
  };
}

function isAdminManagedFeaturedOffer(offer) {
  return Boolean(
    offer?.offerCode ||
      offer?.couponExpiresAtUtc ||
      offer?.maxCouponUsage !== undefined ||
      offer?.couponUsedCount !== undefined ||
      offer?.isPercentageDiscount !== undefined
  );
}

function getFeaturedOffersPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.offers)) return payload.offers;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.value)) return payload.value;
  return [];
}

function OfferImage({ offer }) {
  const [failed, setFailed] = useState(false);
  const imageUrl = offer.imageUrl && !failed ? toApiAssetUrl(offer.imageUrl) : "";

  if (!imageUrl) {
    return (
      <div className="offer-image-fallback">
        <Tag size={40} />
      </div>
    );
  }

  return (
    <img 
      src={imageUrl} 
      alt={offer.title} 
      onError={() => setFailed(true)} 
    />
  );
}

export default function OffersPage() {
  const navigate = useNavigate();
  const { setSelectedOffer } = usePromo();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const loadOffers = async () => {
      setLoading(true);
      try {
        const payload = await getPublicFeaturedOffers();
        const activeOffers = getFeaturedOffersPayload(payload)
          .filter(isAdminManagedFeaturedOffer)
          .map(normalizeFeaturedOffer)
          .filter((offer) => offer.isActive && (offer.bookingType || "").toLowerCase() === "bus");
        setOffers(activeOffers);
      } catch (err) {
        setError("Unable to load offers. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    loadOffers();
  }, []);

  const filteredOffers = offers.filter((offer) => {
    if (filter === "all") return true;
    return (offer.bookingType || "").toLowerCase() === filter;
  });

  const handleBookNow = (offer) => {
    setSelectedOffer(offer);
    navigate("/?tab=buses");
  };

  return (
    <div className="offers-page">
      <header className="offers-hero">
        <div className="shell">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          <h1>Exclusive Travel Deals</h1>
          <p>Save big on your next journey with our curated featured offers.</p>
        </div>
      </header>

      <main className="shell">
        <div className="offers-filter-bar">
          <button 
            className={`filter-chip ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            <Tag size={16} />
            <span>All Offers</span>
          </button>
          <button 
            className={`filter-chip ${filter === "bus" ? "active" : ""}`}
            onClick={() => setFilter("bus")}
          >
            <Bus size={16} />
            <span>Buses</span>
          </button>
        </div>

        {loading ? (
          <div className="offers-state-msg">Loading deals...</div>
        ) : error ? (
          <div className="offers-state-msg error">{error}</div>
        ) : filteredOffers.length === 0 ? (
          <div className="offers-state-msg">No deals found for this category.</div>
        ) : (
          <div className="offers-grid">
            {filteredOffers.map((offer) => (
              <article className="offer-full-card" key={offer.id}>
                <div className="offer-card-image">
                  <OfferImage offer={offer} />
                  <span className="offer-type-badge">{offer.bookingType}</span>
                </div>
                <div className="offer-card-info">
                  <h3>{offer.title}</h3>
                  <p>{offer.description}</p>
                  <div className="offer-card-footer">
                    {offer.couponCode && (
                      <div className="coupon-box">
                        <span>Code:</span>
                        <strong>{offer.couponCode}</strong>
                      </div>
                    )}
                    <button onClick={() => handleBookNow(offer)}>Book Now</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

