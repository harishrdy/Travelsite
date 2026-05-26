import React, { createContext, useContext, useState } from "react";

const PromoContext = createContext(null);

export function PromoProvider({ children }) {
  const [selectedOffer, setSelectedOfferState] = useState(() => {
    try {
      const saved = sessionStorage.getItem("selectedOffer");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("Error reading selectedOffer from sessionStorage:", e);
      return null;
    }
  });

  const setSelectedOffer = (offer) => {
    setSelectedOfferState(offer);
    if (offer) {
      sessionStorage.setItem("selectedOffer", JSON.stringify(offer));
    } else {
      sessionStorage.removeItem("selectedOffer");
    }
  };

  const clearSelectedOffer = () => {
    setSelectedOfferState(null);
    sessionStorage.removeItem("selectedOffer");
  };
  const selectedFeaturedOfferId =
    selectedOffer?.selectedFeaturedOfferId ??
    selectedOffer?.id ??
    selectedOffer?.offerId ??
    selectedOffer?.promotionId;
  const selectedPromotionId =
    selectedFeaturedOfferId !== undefined &&
    selectedFeaturedOfferId !== null &&
    selectedFeaturedOfferId !== ""
      ? Number(selectedFeaturedOfferId)
      : null;

  return (
    <PromoContext.Provider
      value={{
        selectedOffer,
        selectedFeaturedOfferId: Number.isFinite(selectedPromotionId)
          ? selectedPromotionId
          : null,
        selectedPromotionId: Number.isFinite(selectedPromotionId)
          ? selectedPromotionId
          : null,
        setSelectedOffer,
        clearSelectedOffer,
      }}
    >
      {children}
    </PromoContext.Provider>
  );
}

export function usePromo() {
  const context = useContext(PromoContext);
  if (!context) {
    throw new Error("usePromo must be used within a PromoProvider");
  }
  return context;
}
