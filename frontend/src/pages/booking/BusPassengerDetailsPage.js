import React, { useMemo, useState, useEffect } from "react";
import { Clock3, Mail, Phone, User, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../STYLES/BusBookingFlow.css";
import {
  readBusBookingFlowState,
  writeBusBookingFlowState,
} from "./busBookingFlowStore";
import { listTravelers, normalizeTraveler } from "../../services/travelerService";
import {
  getBusPricingPreview,
  listAvailableBusCoupons,
  getFeaturedBusOffers,
  calculateBusPayableAmount,
  getBusPromotionDiscountAmount,
} from "../../services/busBookingService";
import { usePromo } from "../../contexts/PromoContext";

const TRAVELER_STORAGE_KEY = "my_traveler_data";

function formatCurrency(amount) {
  return `₹ ${new Intl.NumberFormat("en-IN").format(Number(amount) || 0)}`;
}

function formatDateLabel(dateString) {
  if (!dateString) return "";
  try {
    const match = String(dateString).match(/^(\d{2})-(\d{2})-(\d{4})$/);
    let date;
    if (match) {
      date = new Date(`${match[3]}-${match[2]}-${match[1]}`);
    } else {
      date = new Date(dateString);
    }
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

function buildPassengerSeed(selectedSeats, passengers) {
  if (Array.isArray(passengers) && passengers.length > 0) {
    return passengers.map((passenger, index) => {
      const matchingSeat = selectedSeats?.[index] || {};
      const seatLabel =
        passenger.seatLabel ||
        passenger.seatNumber ||
        passenger.seat ||
        matchingSeat.label ||
        "";

      const fullNameParts = String(passenger.fullName || passenger.name || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);

      const gender = String(passenger.gender || "").trim();
      const title =
        passenger.title ||
        (gender === "Female" ? "Ms" : gender === "Male" ? "Mr" : "Mr");

      const savedAge = passenger.age ?? passenger.Age ?? "";

      return {
        ...passenger,
        seatLabel,
        title,
        firstName: passenger.firstName || fullNameParts[0] || "",
        lastName:
          passenger.lastName ||
          (fullNameParts.length > 1 ? fullNameParts.slice(1).join(" ") : ""),
        age: savedAge ? String(savedAge) : "",
        gender,
        selectedTravelerId: "",
        id: passenger.id || `p-${seatLabel || index + 1}-${index + 1}`,
      };
    });
  }

  return (selectedSeats || []).map((seat, index) => {
    const isFemaleRestricted = seat.bookedGender === "Female" || hasAdjacentFemaleSeat(seat);
    const isMaleRestricted = seat.bookedGender === "Male" || hasAdjacentMaleSeat(seat);
    return {
      seatLabel: seat.label,
      title: isFemaleRestricted ? "Ms" : "Mr",
      firstName: "",
      lastName: "",
      age: "",
      gender: isFemaleRestricted ? "Female" : (isMaleRestricted ? "Male" : ""),
      selectedTravelerId: "",
      id: `p-${seat.label}-${index + 1}`,
    };
  });
}

function isValidEmail(email) {
  return /^\S+@\S+\.\S+$/.test(String(email || "").trim());
}

function isValidMobile(mobile) {
  const digits = String(mobile || "").replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 13;
}

function normalizeGender(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "female") return "Female";
  if (normalized === "male") return "Male";
  return "";
}

function hasAdjacentFemaleSeat(seat) {
  return Array.isArray(seat?.adjacentBookedGenders)
    ? seat.adjacentBookedGenders.some((gender) => normalizeGender(gender) === "Female")
    : false;
}

function getFemaleAdjacentSeatMessage(seatLabel) {
  return `Seat ${seatLabel || ""} is beside a female-booked seat. Only female passengers can book this seat.`;
}

function hasAdjacentMaleSeat(seat) {
  return Array.isArray(seat?.adjacentBookedGenders)
    ? seat.adjacentBookedGenders.some((gender) => normalizeGender(gender) === "Male")
    : false;
}

function getMaleAdjacentSeatMessage(seatLabel) {
  return `Seat ${seatLabel || ""} is beside a male-booked seat. Only male passengers can book this seat.`;
}

function getGenderSeatConflict(passengers, selectedSeats) {
  for (let index = 0; index < passengers.length; index += 1) {
    const passenger = passengers[index] || {};
    const seat = selectedSeats[index] || {};

    if (
      normalizeGender(passenger.gender) === "Male" &&
      (seat.bookedGender === "Female" || hasAdjacentFemaleSeat(seat))
    ) {
      return {
        passengerNumber: index + 1,
        seatLabel: passenger.seatLabel || passenger.seatNumber || seat.label || "",
        isReserved: seat.bookedGender === "Female",
        isMaleAdjacentConflict: false,
      };
    }

    if (
      normalizeGender(passenger.gender) === "Female" &&
      (seat.bookedGender === "Male" || hasAdjacentMaleSeat(seat))
    ) {
      return {
        passengerNumber: index + 1,
        seatLabel: passenger.seatLabel || passenger.seatNumber || seat.label || "",
        isReserved: seat.bookedGender === "Male",
        isMaleAdjacentConflict: true,
      };
    }
  }

  return null;
}

function getCouponDescription(coupon) {
  const code = String(coupon?.couponCode || "").trim().toUpperCase();
  const value = Number(coupon?.value) || 0;
  const isPercent = String(coupon?.couponType || coupon?.cpnType || "")
    .toLowerCase()
    .includes("percent");

  if (coupon?.remark) {
    return coupon.remark;
  }

  if (isPercent) {
    return `Use Coupon ${code} & Get ${value}% OFF`;
  }

  return `Use Coupon ${code} & Get ${formatCurrency(value)} OFF`;
}

function getCouponStatus(coupon) {
  return String(coupon.status || "").trim().toLowerCase();
}

function isCouponVisible(coupon) {
  const code = String(coupon?.couponCode || "").trim();
  const status = getCouponStatus(coupon);

  return Boolean(code) && (!status || status === "active");
}

function getFeaturedOfferIdentity(offer) {
  return String(
    offer?.selectedFeaturedOfferId ||
      offer?.id ||
      offer?.offerId ||
      offer?.promotionId ||
      offer?.offerCode ||
      offer?.couponCode ||
      ""
  )
    .trim()
    .toLowerCase();
}

function isSameFeaturedOffer(leftOffer, rightOffer) {
  const leftIdentity = getFeaturedOfferIdentity(leftOffer);
  const rightIdentity = getFeaturedOfferIdentity(rightOffer);

  if (leftIdentity && rightIdentity && leftIdentity === rightIdentity) {
    return true;
  }

  const leftCode = String(leftOffer?.offerCode || leftOffer?.couponCode || "").trim().toLowerCase();
  const rightCode = String(rightOffer?.offerCode || rightOffer?.couponCode || "").trim().toLowerCase();
  if (leftCode && rightCode && leftCode === rightCode) {
    return true;
  }

  const leftTitle = String(leftOffer?.title || "").trim().toLowerCase();
  const rightTitle = String(rightOffer?.title || "").trim().toLowerCase();
  return Boolean(leftTitle && rightTitle && leftTitle === rightTitle);
}

function getPromotionDiscountAmount(pricingPreview, fallbackDiscount = 0) {
  return getBusPromotionDiscountAmount(pricingPreview, fallbackDiscount);
}

function hasBackendConfirmedPromotion(pricingPreview) {
  return Boolean(
    pricingPreview?.appliedPromotionCode ||
      pricingPreview?.appliedPromotionTitle ||
      getPromotionDiscountAmount(pricingPreview, 0) > 0
  );
}

/** Read + normalize travelers from localStorage so structure always matches API shape */
function readLocalTravelers() {
  try {
    const raw = localStorage.getItem(TRAVELER_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    // Run normalizeTraveler on every record so fields are consistent
    return parsed.map((t) => normalizeTraveler(t));
  } catch {
    return [];
  }
}

export default function BusPassengerDetailsPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const persistedState = readBusBookingFlowState();
  const incomingState = location.state || {};
  const flowState = incomingState.bus ? incomingState : persistedState || {};

  const bus = flowState.bus || null;
  const selectedSeats = flowState.selectedSeats || [];
  const boardingPoint = flowState.boardingPoint || null;
  const droppingPoint = flowState.droppingPoint || null;

  const { selectedOffer: contextOffer, clearSelectedOffer } = usePromo();

  const validatedContextOffer = useMemo(() => {
    if (!contextOffer) return null;
    const expiryStr = contextOffer.expiry || contextOffer.couponExpiresAtUtc;
    const isExpired = expiryStr ? new Date(expiryStr) < new Date() : false;
    const isBus = String(contextOffer.bookingType || "").toLowerCase() === "bus";
    if (isExpired || !isBus) {
      return null;
    }
    return contextOffer;
  }, [contextOffer]);

  useEffect(() => {
    if (contextOffer && !validatedContextOffer) {
      clearSelectedOffer();
    }
  }, [contextOffer, validatedContextOffer, clearSelectedOffer]);

  const initialFareSummary = flowState.fareSummary || {
    baseFare: selectedSeats.reduce(
      (sum, seat) => sum + (Number(seat.fare) || 0),
      0
    ),
    tax: 0,
    convenienceFee: 0,
    totalFare: selectedSeats.reduce(
      (sum, seat) => sum + (Number(seat.fare) || 0),
      0
    ),
  };
  const [pricingPreview, setPricingPreview] = useState(
    flowState.pricingPreview || {
      subtotalBeforeCoupon:
        Number(initialFareSummary.subtotalBeforeCoupon) ||
        Number(initialFareSummary.baseFare) ||
        0,
      couponAmount:
        Number(initialFareSummary.couponAmount) ||
        Number(flowState.pricingPreview?.couponDiscountAmount) ||
        Number(flowState.couponDiscount) ||
        0,
      taxableFare:
        Number(initialFareSummary.taxableFare) ||
        Math.max(
          0,
          (Number(initialFareSummary.baseFare) || 0) -
            (Number(flowState.couponDiscount) || 0)
        ),
      gstPercent: Number(initialFareSummary.gstPercent) || 0,
      gstAmount:
        Number(initialFareSummary.gstAmount) ||
        Number(initialFareSummary.tax) ||
        0,
      convenienceFee: Number(initialFareSummary.convenienceFee) || 0,
      grandTotal:
        Number(initialFareSummary.grandTotal) ||
        Number(flowState.payableAmount) ||
        Number(initialFareSummary.totalFare) ||
        0,
      seats: Array.isArray(flowState.pricingPreview?.seats)
        ? flowState.pricingPreview.seats
        : [],
    }
  );
  const [basePricingPreview, setBasePricingPreview] = useState(
    flowState.basePricingPreview || flowState.pricingPreview || null
  );
  const fareSummary = useMemo(
    () => {
      const calculatedTotal = calculateBusPayableAmount(
        pricingPreview,
        Number(pricingPreview.finalAmount || pricingPreview.grandTotal) || 0
      );

      return {
        baseFare: Number(pricingPreview.subtotalBeforeCoupon) || 0,
        subtotalBeforeCoupon: Number(pricingPreview.subtotalBeforeCoupon) || 0,
        couponAmount: getPromotionDiscountAmount(pricingPreview, 0),
        taxableFare: Number(pricingPreview.taxableFare) || 0,
        gstPercent: Number(pricingPreview.gstPercent) || 0,
        gstAmount: Number(pricingPreview.gstAmount) || 0,
        tax: Number(pricingPreview.gstAmount) || 0,
        convenienceFee: Number(pricingPreview.convenienceFee) || 0,
        grandTotal: calculatedTotal,
        totalFare: calculatedTotal,
      };
    },
    [pricingPreview]
  );

  const [passengers, setPassengers] = useState(() =>
    buildPassengerSeed(selectedSeats, flowState.passengers)
  );

  // true = Existing Traveler mode, false = Add New Traveler mode
  const [passengerModes, setPassengerModes] = useState(
    selectedSeats.map(() => false)
  );

  const [savedTravelers, setSavedTravelers] = useState([]);
  const [travelerLoadError, setTravelerLoadError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      // Step 1: Load from localStorage immediately so dropdown is never empty
      const localList = readLocalTravelers();
      if (isMounted && localList.length > 0) {
        setSavedTravelers(localList);
      }

      // Step 2: Try API — merge results with local so nothing is lost
      try {
        const apiList = await listTravelers();
        if (!isMounted) return;

        if (Array.isArray(apiList) && apiList.length > 0) {
          // Merge: API wins on conflict, keep local-only records
          const apiById = new Map(apiList.map((t) => [String(t.id), t]));
          const merged = [...apiList];
          for (const local of localList) {
            if (!apiById.has(String(local.id))) {
              merged.push(local);
            }
          }
          setSavedTravelers(merged);
          setTravelerLoadError("");
        } else if (apiList.length === 0 && localList.length > 0) {
          // API returned empty but we have local data — keep local
          setSavedTravelers(localList);
        }
      } catch (err) {
        if (!isMounted) return;
        // API failed — already showing local data, just log the warning
        setTravelerLoadError("Using locally saved travelers.");
        console.warn("listTravelers API error:", err.message);
      }
    };

    load();
    return () => { isMounted = false; };
  }, []);




  const [contact, setContact] = useState(() => ({
    email: flowState.contact?.email || "",
    mobile: flowState.contact?.mobile || "",
    whatsappUpdates: Boolean(flowState.contact?.whatsappUpdates),
    whatsappNumber: flowState.contact?.whatsappNumber || "",
  }));
  // ── Separate state for Featured Offer vs Manual Coupon ──
  const [selectedFeaturedOffer, setSelectedFeaturedOffer] = useState(() => {
    if (validatedContextOffer) {
      return {
        ...validatedContextOffer,
        isFeaturedOffer: true,
        promotionId: null,
        selectedFeaturedOfferId:
          validatedContextOffer.selectedFeaturedOfferId ||
          validatedContextOffer.id ||
          validatedContextOffer.offerId ||
          validatedContextOffer.promotionId ||
          null,
        couponCode: null,
      };
    }
    const saved = flowState.selectedOffer;
    if (
      saved?.isFeaturedOffer ||
      Boolean(saved?.selectedFeaturedOfferId) ||
      Boolean(flowState.selectedFeaturedOfferId) ||
      Boolean(saved?.promotionId) ||
      Boolean(flowState.promotionId)
    ) {
      return saved;
    }
    return null;
  });
  const [manualCouponCode, setManualCouponCode] = useState(() => {
    const isFeatured =
      validatedContextOffer !== null ||
      flowState.selectedOffer?.isFeaturedOffer ||
      Boolean(flowState.selectedOffer?.selectedFeaturedOfferId) ||
      Boolean(flowState.selectedFeaturedOfferId) ||
      Boolean(flowState.selectedOffer?.promotionId) ||
      Boolean(flowState.promotionId);
    if (isFeatured) return "";
    return flowState.selectedOffer?.couponCode || flowState.couponCode || "";
  });
  const [couponDiscount, setCouponDiscount] = useState(() => {
    return Number(flowState.couponDiscount) || 0;
  });
  const [appliedCoupon, setAppliedCoupon] = useState(() => {
    const isFeatured =
      validatedContextOffer !== null ||
      flowState.selectedOffer?.isFeaturedOffer ||
      Boolean(flowState.selectedOffer?.selectedFeaturedOfferId) ||
      Boolean(flowState.selectedFeaturedOfferId) ||
      Boolean(flowState.selectedOffer?.promotionId) ||
      Boolean(flowState.promotionId);
    if (isFeatured) return null;
    return flowState.appliedCoupon || (flowState.selectedOffer?.couponCode ? { couponCode: flowState.selectedOffer.couponCode } : null);
  });

  useEffect(() => {
    if (validatedContextOffer) {
      clearSelectedOffer();
    }
  }, [validatedContextOffer, clearSelectedOffer]);

  const [couponMessage, setCouponMessage] = useState("");
  const [couponMessageType, setCouponMessageType] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [isLoadingCoupons, setIsLoadingCoupons] = useState(false);
  const [featuredOffers, setFeaturedOffers] = useState([]);
  const [isLoadingOffers, setIsLoadingOffers] = useState(false);
  const [agreedToFare, setAgreedToFare] = useState(
    Boolean(flowState.agreedToFare)
  );
  const [formError, setFormError] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);



  useEffect(() => {
    let isMounted = true;

    const loadCoupons = async () => {
      setIsLoadingCoupons(true);

      try {
        const coupons = await listAvailableBusCoupons();
        if (isMounted) {
          setAvailableCoupons(
            coupons
              .filter((coupon) => isCouponVisible(coupon))
              .sort((firstCoupon, secondCoupon) => {
                const firstDate = new Date(firstCoupon.expiryDate || "").getTime();
                const secondDate = new Date(secondCoupon.expiryDate || "").getTime();
                return (Number.isFinite(firstDate) ? firstDate : 0) -
                  (Number.isFinite(secondDate) ? secondDate : 0);
              })
          );
        }
      } catch {
        if (isMounted) {
          setAvailableCoupons([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingCoupons(false);
        }
      }
    };

    loadCoupons();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    setIsLoadingOffers(true);

    getFeaturedBusOffers()
      .then((offers) => {
        if (isMounted) setFeaturedOffers(offers);
      })
      .catch(() => {
        if (isMounted) setFeaturedOffers([]);
      })
      .finally(() => {
        if (isMounted) setIsLoadingOffers(false);
      });

    return () => { isMounted = false; };
  }, []);

  const totalAfterDiscount = Number(fareSummary.grandTotal) || 0;

  const loadPricingPreview = async (
    { selectedFeaturedOfferId = null, promotionId = null, couponCode = null } = {}
  ) => {
    const busId = bus?.id ?? bus?.busId;
    const seatCodes = selectedSeats
      .map((seat) => seat.label || seat.seatCode || seat)
      .map((seatCode) => String(seatCode || "").trim())
      .filter(Boolean);

    if (!busId || seatCodes.length === 0) {
      throw new Error("Seat selection is missing. Please select seats again.");
    }

    const featuredOfferIdParam =
      selectedFeaturedOfferId !== null && selectedFeaturedOfferId !== undefined && selectedFeaturedOfferId !== ""
        ? selectedFeaturedOfferId
        : promotionId !== null && promotionId !== undefined && promotionId !== ""
        ? promotionId
        : null;
    const couponCodeParam = featuredOfferIdParam
      ? null
      : couponCode
      ? String(couponCode).trim().toUpperCase()
      : null;

    setIsCalculatingPrice(true);
    try {
      const preview = await getBusPricingPreview({
        busId,
        seatCodes,
        couponCode: couponCodeParam,
        promotionId: null,
        selectedFeaturedOfferId: featuredOfferIdParam,
      });

      if (!couponCodeParam && !featuredOfferIdParam) {
        setBasePricingPreview(preview);
      }

      const hasAppliedPromotion = Boolean(couponCodeParam || featuredOfferIdParam);
      const backendCouponDiscount = hasAppliedPromotion
        ? getPromotionDiscountAmount(preview, 0)
        : 0;
      const activeOffer =
        featuredOfferIdParam
          ? selectedFeaturedOffer ||
            featuredOffers.find(
              (offer) =>
                Number(offer.id) === Number(featuredOfferIdParam) ||
                Number(offer.offerId) === Number(featuredOfferIdParam) ||
                Number(offer.selectedFeaturedOfferId) === Number(featuredOfferIdParam)
            ) ||
            validatedContextOffer
          : null;

      setPricingPreview(preview);
      setCouponDiscount(backendCouponDiscount);
      writeBusBookingFlowState({
        pricingPreview: preview,
        couponCode: featuredOfferIdParam ? null : couponCodeParam,
        promotionId: null,
        selectedFeaturedOfferId: featuredOfferIdParam,
        couponDiscount: backendCouponDiscount,
        appliedCoupon: featuredOfferIdParam || !couponCodeParam ? null : { couponCode: couponCodeParam },
        selectedOffer: featuredOfferIdParam ? activeOffer : null,
      });

      return preview;
    } catch (err) {
      console.error("Pricing preview error:", err);
      throw err;
    } finally {
      setIsCalculatingPrice(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initialFeaturedOfferId = validatedContextOffer
      ? (
          validatedContextOffer.selectedFeaturedOfferId ||
          validatedContextOffer.id ||
          validatedContextOffer.offerId ||
          validatedContextOffer.promotionId ||
          null
        )
      : (
          flowState.selectedFeaturedOfferId ||
          flowState.selectedOffer?.selectedFeaturedOfferId ||
          flowState.selectedOffer?.id ||
          flowState.selectedOffer?.offerId ||
          flowState.promotionId ||
          flowState.selectedOffer?.promotionId ||
          null
        );
    const initialCouponCode = initialFeaturedOfferId ? null : (flowState.couponCode || null);
    loadPricingPreview({ selectedFeaturedOfferId: initialFeaturedOfferId, couponCode: initialCouponCode })
      .then((preview) => {
        if (isMounted) {
          setPricingPreview(preview);
        }
      })
      .catch((error) => {
        if (isMounted) {
          setFormError(error.message || "Unable to refresh pricing.");
        }
      });

    return () => {
      isMounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allPassengersValid = useMemo(
    () =>
      passengers.every((passenger) => {
        const age = Number(passenger.age);
        return (
          passenger.title &&
          String(passenger.firstName || "").trim() &&
          String(passenger.lastName || "").trim() &&
          normalizeGender(passenger.gender) &&
          !Number.isNaN(age) &&
          age > 0 &&
          age <= 120
        );
      }),
    [passengers]
  );

  if (!bus || selectedSeats.length === 0 || !boardingPoint || !droppingPoint) {
    return (
      <main className="bus-flow-page">
        <div className="bus-flow-shell">
          <section className="bus-flow-empty">
            <h2>Seat selection data missing</h2>
            <p>
              Select seats, boarding, and dropping points before filling
              passenger details.
            </p>
            <button type="button" onClick={() => navigate("/bus/seats")}>
              Back to Seat Selection
            </button>
          </section>
        </div>
      </main>
    );
  }

  const updatePassenger = (index, field, value) => {
    const seat = selectedSeats[index] || {};

    if (
      field === "gender" &&
      normalizeGender(value) === "Male" &&
      (seat.bookedGender === "Female" || hasAdjacentFemaleSeat(seat))
    ) {
      const isReserved = seat.bookedGender === "Female";
      setFormError(
        isReserved
          ? `Seat ${seat.label || seat.seatLabel || ""} is reserved for females. Only female passengers can book this seat.`
          : getFemaleAdjacentSeatMessage(seat.label || seat.seatLabel)
      );
      return;
    }

    if (
      field === "gender" &&
      normalizeGender(value) === "Female" &&
      (seat.bookedGender === "Male" || hasAdjacentMaleSeat(seat))
    ) {
      const isReserved = seat.bookedGender === "Male";
      setFormError(
        isReserved
          ? `Seat ${seat.label || seat.seatLabel || ""} is reserved for males. Only male passengers can book this seat.`
          : getMaleAdjacentSeatMessage(seat.label || seat.seatLabel)
      );
      return;
    }

    setFormError("");
    setPassengers((previous) =>
      previous.map((passenger, i) =>
        i === index ? { ...passenger, [field]: value } : passenger
      )
    );
  };

  const setPassengerMode = (index, isExisting) => {
    setPassengerModes((prev) =>
      prev.map((mode, i) => (i === index ? isExisting : mode))
    );
    setPassengers((prev) =>
      prev.map((passenger, i) => {
        if (i !== index) return passenger;
        const isFemaleRestricted = selectedSeats[index]?.bookedGender === "Female" || hasAdjacentFemaleSeat(selectedSeats[index]);
        const isMaleRestricted = selectedSeats[index]?.bookedGender === "Male" || hasAdjacentMaleSeat(selectedSeats[index]);
        return {
          ...passenger,
          selectedTravelerId: "",
          title: isFemaleRestricted ? "Ms" : "Mr",
          firstName: "",
          lastName: "",
          age: "",
          gender: isFemaleRestricted ? "Female" : (isMaleRestricted ? "Male" : ""),
        };
      })
    );
  };

  const handleSelectExistingTraveler = (index, travelerId) => {
    if (!travelerId) {
      updatePassenger(index, "selectedTravelerId", "");
      return;
    }

    const found = savedTravelers.find((t) => String(t.id) === travelerId);
    if (!found) return;

    const seat = selectedSeats[index] || {};
    const travelerGender = normalizeGender(found.gender);

    if (travelerGender === "Male" && (seat.bookedGender === "Female" || hasAdjacentFemaleSeat(seat))) {
      const isReserved = seat.bookedGender === "Female";
      setFormError(
        isReserved
          ? `Seat ${seat.label || seat.seatLabel || ""} is reserved for females. Only female passengers can book this seat.`
          : getFemaleAdjacentSeatMessage(seat.label || seat.seatLabel)
      );
      return;
    }

    if (travelerGender === "Female" && (seat.bookedGender === "Male" || hasAdjacentMaleSeat(seat))) {
      const isReserved = seat.bookedGender === "Male";
      setFormError(
        isReserved
          ? `Seat ${seat.label || seat.seatLabel || ""} is reserved for males. Only male passengers can book this seat.`
          : getMaleAdjacentSeatMessage(seat.label || seat.seatLabel)
      );
      return;
    }

    setFormError("");
    setPassengers((prev) =>
      prev.map((passenger, i) =>
        i === index
          ? {
              ...passenger,
              selectedTravelerId: travelerId,
              title:     found.title     || (travelerGender === "Female" ? "Ms" : "Mr"),
              firstName: found.firstName || "",
              lastName:  found.lastName  || "",
              gender:    travelerGender  || "",
              age:       found.age       ? String(found.age) : "",
            }
          : passenger
      )
    );
  };

  const handleSelectOffer = async (offer) => {
    const snapshotBase = basePricingPreview;
    setIsApplyingCoupon(true);
    setCouponMessage("");
    setCouponMessageType("");

    const featuredOfferId = offer?.id || offer?.selectedFeaturedOfferId || offer?.offerId || offer?.promotionId;
    if (!featuredOfferId) {
      setCouponMessage("Offer is missing an ID.");
      setCouponMessageType("error");
      setIsApplyingCoupon(false);
      return;
    }

    const pendingOffer = {
      ...offer,
      selectedFeaturedOfferId: featuredOfferId,
      promotionId: null,
      isFeaturedOffer: true,
    };

    setSelectedFeaturedOffer(pendingOffer);
    setManualCouponCode("");
    setCouponDiscount(0);
    setAppliedCoupon(null);
    if (snapshotBase) setPricingPreview(snapshotBase);

    try {
      const preview = await loadPricingPreview(
        { selectedFeaturedOfferId: featuredOfferId, couponCode: null }
      );

      setSelectedFeaturedOffer(pendingOffer);
      setManualCouponCode("");
      setAppliedCoupon(null);
      if (hasBackendConfirmedPromotion(preview)) {
        setCouponMessage("Offer discount applied successfully.");
        setCouponMessageType("success");
      } else {
        setCouponMessage("Offer selected. Backend did not return a discount for this seat yet.");
        setCouponMessageType("error");
      }
    } catch (error) {
      setSelectedFeaturedOffer(pendingOffer);
      setManualCouponCode("");
      setAppliedCoupon(null);
      if (snapshotBase) setPricingPreview(snapshotBase);
      setCouponMessage(error.message || "Offer saved, but pricing preview failed.");
      setCouponMessageType("error");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveOffer = async () => {
    clearSelectedOffer();
    setSelectedFeaturedOffer(null);
    setManualCouponCode("");
    setCouponDiscount(0);
    setAppliedCoupon(null);
    setCouponMessage("");
    setCouponMessageType("");
    try {
      await loadPricingPreview();
    } catch (err) {
      if (basePricingPreview) setPricingPreview(basePricingPreview);
      setCouponMessage(err.message || "Unable to refresh pricing.");
      setCouponMessageType("error");
    }
  };

  const handleCouponCodeChange = (event) => {
    clearSelectedOffer();
    setSelectedFeaturedOffer(null);
    setManualCouponCode(event.target.value);
    setCouponDiscount(0);
    setAppliedCoupon(null);
    if (basePricingPreview) {
      setPricingPreview(basePricingPreview);
    }
    setCouponMessage("");
    setCouponMessageType("");
  };

  const applyCouponCode = async (code) => {
    const normalized = String(code || "").trim().toUpperCase();
    if (!normalized) {
      setCouponDiscount(0);
      setAppliedCoupon(null);
      setCouponMessage("Enter a coupon code.");
      setCouponMessageType("error");
      return null;
    }

    setManualCouponCode(normalized);
    clearSelectedOffer();
    setSelectedFeaturedOffer(null);
    setIsApplyingCoupon(true);
    setCouponMessage("");
    setCouponMessageType("");

    try {
      const snapshotBase = basePricingPreview;
      const preview = await loadPricingPreview(
        { selectedFeaturedOfferId: null, couponCode: normalized }
      );

      const effectiveDiscount = getPromotionDiscountAmount(preview, 0);

      if (effectiveDiscount <= 0) {
        setAppliedCoupon(null);
        if (snapshotBase) setPricingPreview(snapshotBase);
        setCouponMessage("Coupon could not be applied.");
        setCouponMessageType("error");
        return { valid: false, message: "Coupon could not be applied." };
      }

      setAppliedCoupon({ couponCode: normalized });
      setCouponMessage("Coupon applied successfully.");
      setCouponMessageType("success");
      return { valid: true, preview };
    } catch (error) {
      setAppliedCoupon(null);
      setCouponMessage(error.message || "Unable to apply coupon right now.");
      setCouponMessageType("error");
      return null;
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleSelectCoupon = async (coupon) => {
    setIsApplyingCoupon(true);
    setCouponMessage("");
    setCouponMessageType("");

    const snapshotBase = basePricingPreview;

    try {
      const couponCodeValue = coupon.couponCode ? String(coupon.couponCode).trim().toUpperCase() : null;

      if (couponCodeValue) {
        // This is a manual coupon applied via chip
        clearSelectedOffer();
        setSelectedFeaturedOffer(null);
        setManualCouponCode(couponCodeValue);

        const preview = await loadPricingPreview(
          { selectedFeaturedOfferId: null, couponCode: couponCodeValue }
        );

        const effectiveDiscount = getPromotionDiscountAmount(preview, 0);

        if (effectiveDiscount <= 0) {
          setManualCouponCode("");
          setAppliedCoupon(null);
          if (snapshotBase) setPricingPreview(snapshotBase);
          setCouponMessage("Coupon could not be applied.");
          setCouponMessageType("error");
          return;
        }

        setAppliedCoupon({ couponCode: couponCodeValue });
        setCouponMessage("Coupon applied successfully.");
        setCouponMessageType("success");
      } else {
        // No coupon code — skip
        setCouponMessage("Invalid coupon.");
        setCouponMessageType("error");
      }
    } catch (error) {
      setSelectedFeaturedOffer(null);
      setManualCouponCode("");
      setAppliedCoupon(null);
      if (snapshotBase) setPricingPreview(snapshotBase);
      setCouponMessage(error.message || "Unable to apply coupon.");
      setCouponMessageType("error");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleApplyCoupon = async () => applyCouponCode(manualCouponCode);

  const handleRemoveCoupon = async () => {
    clearSelectedOffer();
    setSelectedFeaturedOffer(null);
    setManualCouponCode("");
    setCouponDiscount(0);
    setAppliedCoupon(null);
    setCouponMessage("");
    setCouponMessageType("");
    try {
      await loadPricingPreview();
    } catch (error) {
      if (basePricingPreview) setPricingPreview(basePricingPreview);
      setCouponMessage(error.message || "Unable to refresh pricing.");
      setCouponMessageType("error");
    }
  };



  const handleOpenConfirmation = async () => {
    if (!allPassengersValid) {
      setFormError("Please fill all passenger fields, including gender. Age must be between 1 and 120.");
      return;
    }
    const genderSeatConflict = getGenderSeatConflict(passengers, selectedSeats);
    if (genderSeatConflict) {
      if (genderSeatConflict.isMaleAdjacentConflict) {
        setFormError(
          genderSeatConflict.isReserved
            ? `Seat ${genderSeatConflict.seatLabel} is reserved for males. Only male passengers can book this seat.`
            : getMaleAdjacentSeatMessage(genderSeatConflict.seatLabel)
        );
      } else {
        setFormError(
          genderSeatConflict.isReserved
            ? `Seat ${genderSeatConflict.seatLabel} is reserved for females. Only female passengers can book this seat.`
            : getFemaleAdjacentSeatMessage(genderSeatConflict.seatLabel)
        );
      }
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
    if (!agreedToFare) {
      setFormError("Please accept fare rules and terms.");
      return;
    }
    if (manualCouponCode.trim() && !appliedCoupon) {
      setFormError("Apply the coupon or clear the coupon code before continuing.");
      return;
    }
    setFormError("");
    setShowConfirmation(true);
  };

  const handleProceedPayment = async () => {
    const cleanedPassengers = passengers.map((passenger) => {
      const ageNumber = Number(passenger.age);
      return {
        ...passenger,
        firstName: String(passenger.firstName || "").trim(),
        lastName: String(passenger.lastName || "").trim(),
        age: ageNumber,
        Age: ageNumber,
      };
    });

    const isFeatured = Boolean(selectedFeaturedOffer);
    const finalCouponCode = isFeatured ? null : (appliedCoupon?.couponCode || manualCouponCode || null);
    const finalFeaturedOfferId = isFeatured
      ? (
          selectedFeaturedOffer.selectedFeaturedOfferId ||
          selectedFeaturedOffer.id ||
          selectedFeaturedOffer.offerId ||
          selectedFeaturedOffer.promotionId ||
          null
        )
      : null;

    const payload = {
      ...flowState,
      passengers: cleanedPassengers,
      contact,
      couponCode: finalCouponCode,
      promotionId: null,
      selectedFeaturedOfferId: finalFeaturedOfferId,
      couponDiscount,
      appliedCoupon: isFeatured ? null : (appliedCoupon || (finalCouponCode ? { couponCode: finalCouponCode } : null)),
      selectedOffer: isFeatured ? selectedFeaturedOffer : null,
      pricingPreview,
      basePricingPreview,
      agreedToFare,
      payableAmount: totalAfterDiscount,
      fareSummary,
    };

    writeBusBookingFlowState(payload);
    navigate("/bus/payment", { state: payload });
  };

  const renderPassengerFields = (passenger, index) => {
    const seat = selectedSeats[index] || {};
    const isFemaleOnlySeat = hasAdjacentFemaleSeat(seat);
    const isMaleOnlySeat = hasAdjacentMaleSeat(seat);

    return (
      <div className="passenger-fields">
        <label className="passenger-field">
          <span>Title</span>
          <select
            value={passenger.title}
            onChange={(e) => updatePassenger(index, "title", e.target.value)}
          >
            <option value="">Title</option>
            <option value="Mr">Mr</option>
            <option value="Mrs">Mrs</option>
            <option value="Ms">Ms</option>
          </select>
        </label>

        <label className="passenger-field">
          <span>First Name</span>
          <input
            type="text"
            placeholder="First Name"
            value={passenger.firstName}
            onChange={(e) => updatePassenger(index, "firstName", e.target.value)}
          />
        </label>

        <label className="passenger-field">
          <span>Last Name</span>
          <input
            type="text"
            placeholder="Last Name"
            value={passenger.lastName}
            onChange={(e) => updatePassenger(index, "lastName", e.target.value)}
          />
        </label>

        <label className="passenger-field">
          <span>Age</span>
          <input
            type="number"
            placeholder="Age"
            value={passenger.age}
            onChange={(e) => updatePassenger(index, "age", e.target.value)}
          />
        </label>

        <label className="passenger-field">
          <span>Gender</span>
          <select
            value={passenger.gender}
            onChange={(e) => updatePassenger(index, "gender", e.target.value)}
          >
            <option value="">Gender</option>
            <option value="Male" disabled={isFemaleOnlySeat}>Male</option>
            <option value="Female" disabled={isMaleOnlySeat}>Female</option>
          </select>
          {isFemaleOnlySeat && (
            <small className="passenger-restriction-note">
              Female passenger required for this seat.
            </small>
          )}
          {isMaleOnlySeat && (
            <small className="passenger-restriction-note">
              Male passenger required for this seat.
            </small>
          )}
        </label>
      </div>
    );
  };

  return (
    <main className="bus-flow-page">
      <div className="bus-flow-shell">
        <section className="bus-passenger-layout">

          {/* ── LEFT COLUMN ── */}
          <div className="bus-passenger-main">

            {/* Bus Details */}
            <article className="flow-card">
              <header>Bus Details</header>
              <div className="flow-card-body bus-journey-grid">
                <div>
                  <small>{bus.fromCity} - {bus.toCity}</small>
                  <strong>
                    {formatDateLabel(
                      flowState.searchContext?.departureDate || bus.departureDate
                    )}
                  </strong>
                </div>
                <div>
                  <small>Depart Time</small>
                  <strong>{bus.departureTime}</strong>
                </div>
                <div className="journey-duration">
                  <Clock3 size={16} />
                  <strong>{bus.duration}</strong>
                </div>
                <div>
                  <small>Arrival Time</small>
                  <strong>{bus.arrivalTime}</strong>
                </div>
                <div>
                  <small>Seat No</small>
                  <strong>
                    {selectedSeats.map((s) => s.label).join(", ")}
                  </strong>
                </div>
                <div className="journey-point">
                  <span>Boarding Time &amp; Address</span>
                  <strong>{boardingPoint.time}</strong>
                  <p>{boardingPoint.name}</p>
                  <small>{boardingPoint.address}</small>
                </div>
                <div className="journey-point">
                  <span>Dropping Time &amp; Address</span>
                  <strong>{droppingPoint.time}</strong>
                  <p>{droppingPoint.name}</p>
                  <small>{droppingPoint.address}</small>
                </div>
              </div>
            </article>

            {/* Passenger Details */}
            <article className="flow-card">
              <header>Passenger Details</header>
              <div className="flow-card-body">
                {passengers.map((passenger, index) => {
                  const isExisting = passengerModes[index];

                  return (
                    <div className="passenger-row" key={passenger.id}>

                      <h4>
                        Passenger {index + 1}
                        <span>Seat {passenger.seatLabel}</span>
                      </h4>

                      {/* ── Mode Toggle ── */}
                      <div className="passenger-mode-toggle">
                        <button
                          type="button"
                          className={`pmode-btn${isExisting ? " pmode-btn--active" : ""}`}
                          onClick={() => setPassengerMode(index, true)}
                        >
                          Existing Traveler
                        </button>
                        <button
                          type="button"
                          className={`pmode-btn${!isExisting ? " pmode-btn--active" : ""}`}
                          onClick={() => setPassengerMode(index, false)}
                        >
                          Add New Traveler
                        </button>
                      </div>

                      {/* ── Existing Traveler ── */}
                      {isExisting ? (
                        <div className="passenger-existing-wrap">
                          {travelerLoadError && (
                            <p className="pmode-warn">{travelerLoadError}</p>
                          )}

                          <select
                            className="passenger-existing-select"
                            value={passenger.selectedTravelerId || ""}
                            onChange={(e) =>
                              handleSelectExistingTraveler(index, e.target.value)
                            }
                          >
                            <option value="">-- Select Existing Traveler --</option>
                            {savedTravelers.length === 0 ? (
                              <option disabled>No saved travelers found</option>
                            ) : (
                              savedTravelers.map((t) => (
                                <option key={t.id} value={String(t.id)}>
                                  {[t.title, t.firstName, t.lastName]
                                    .filter(Boolean)
                                    .join(" ")}
                                  {t.mobile
                                    ? ` — ${t.mobile}`
                                    : t.email
                                    ? ` — ${t.email}`
                                    : ""}
                                </option>
                              ))
                            )}
                          </select>

                          {passenger.selectedTravelerId &&
                            renderPassengerFields(passenger, index)}
                        </div>
                      ) : (
                        renderPassengerFields(passenger, index)
                      )}
                    </div>
                  );
                })}
              </div>
            </article>

            {/* Contact Details */}
            <article className="flow-card">
              <header>Contact Details</header>
              <div className="flow-card-body contact-grid">
                <label>
                  <span>Enter Your Email:</span>
                  <div className="contact-input">
                    <Mail size={14} />
                    <input
                      type="email"
                      placeholder="Email id"
                      value={contact.email}
                      onChange={(e) =>
                        setContact((prev) => ({ ...prev, email: e.target.value }))
                      }
                    />
                  </div>
                </label>

                <label>
                  <span>Enter Your Mobile:</span>
                  <div className="contact-input">
                    <Phone size={14} />
                    <input
                      type="text"
                      placeholder="Mobile"
                      value={contact.mobile}
                      onChange={(e) =>
                        setContact((prev) => ({
                          ...prev,
                          mobile: e.target.value,
                          whatsappNumber:
                            prev.whatsappUpdates && !prev.whatsappNumber
                              ? e.target.value
                              : prev.whatsappNumber,
                        }))
                      }
                    />
                  </div>
                </label>

                <label style={{ gridColumn: "1 / -1" }}>
                  <span>WhatsApp Updates:</span>
                  <div
                    className="contact-input"
                    style={{ gridTemplateColumns: "auto 1fr" }}
                  >
                    <input
                      type="checkbox"
                      checked={contact.whatsappUpdates}
                      onChange={(e) =>
                        setContact((prev) => ({
                          ...prev,
                          whatsappUpdates: e.target.checked,
                          whatsappNumber:
                            e.target.checked && !prev.whatsappNumber
                              ? prev.mobile
                              : prev.whatsappNumber,
                        }))
                      }
                      style={{ width: 16, height: 16, margin: 0 }}
                    />
                    <input
                      type="text"
                      placeholder="WhatsApp no. (defaults to mobile)"
                      value={contact.whatsappNumber}
                      onChange={(e) =>
                        setContact((prev) => ({
                          ...prev,
                          whatsappNumber: e.target.value,
                        }))
                      }
                      disabled={!contact.whatsappUpdates}
                    />
                  </div>
                </label>
              </div>
            </article>

            {/* Acknowledgement */}
            <article className="flow-card">
              <header>Acknowledgement</header>
              <div className="flow-card-body acknowledgement">
                <label className="ack-checkbox">
                  <input
                    type="checkbox"
                    checked={agreedToFare}
                    onChange={(e) => setAgreedToFare(e.target.checked)}
                  />
                  <span>
                    I agree to the rules and restrictions of this fare, and the
                    terms of this fare.
                  </span>
                </label>

                <div className="ack-pay-strip">
                  <span>Travel....</span>
                  <small>VISA Mastercard RuPay UPI</small>
                </div>

                {formError && <p className="flow-error">{formError}</p>}

                <button
                  type="button"
                  className="flow-continue-btn align-right"
                  onClick={handleOpenConfirmation}
                >
                  Continue
                </button>
              </div>
            </article>
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <aside className="bus-passenger-side">
            <article className="flow-card">
              <header>Fare Details</header>
              <div className="flow-card-body fare-list">
                {isCalculatingPrice ? (
                  <div className="skeleton-loader-container" style={{ padding: "10px 0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                      <div className="skeleton-line pulse" style={{ height: "16px", backgroundColor: "#e5e7eb", borderRadius: "4px", width: "120px" }}></div>
                      <div className="skeleton-line pulse" style={{ height: "16px", backgroundColor: "#e5e7eb", borderRadius: "4px", width: "60px" }}></div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                      <div className="skeleton-line pulse" style={{ height: "16px", backgroundColor: "#e5e7eb", borderRadius: "4px", width: "90px" }}></div>
                      <div className="skeleton-line pulse" style={{ height: "16px", backgroundColor: "#e5e7eb", borderRadius: "4px", width: "50px" }}></div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                      <div className="skeleton-line pulse" style={{ height: "16px", backgroundColor: "#e5e7eb", borderRadius: "4px", width: "100px" }}></div>
                      <div className="skeleton-line pulse" style={{ height: "16px", backgroundColor: "#e5e7eb", borderRadius: "4px", width: "40px" }}></div>
                    </div>
                    <hr style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: "12px 0" }} />
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <div className="skeleton-line pulse" style={{ height: "20px", backgroundColor: "#d1d5db", borderRadius: "4px", width: "80px" }}></div>
                      <div className="skeleton-line pulse" style={{ height: "20px", backgroundColor: "#d1d5db", borderRadius: "4px", width: "70px" }}></div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <span>Subtotal Before Coupon</span>
                      <strong>{formatCurrency(pricingPreview.subtotalBeforeCoupon)}</strong>
                    </div>
                    {Number(pricingPreview.autoDiscountAmount) > 0 && (
                      <div>
                        <span>Auto Discount</span>
                        <strong>(-) {formatCurrency(pricingPreview.autoDiscountAmount)}</strong>
                      </div>
                    )}
                    {/* Discount row — uses appliedPromotionCode / discountSource for featured offers */}
                    {(() => {
                      const isFeaturedActive = Boolean(selectedFeaturedOffer);
                      const appliedCode = pricingPreview.appliedPromotionCode || appliedCoupon?.couponCode;
                      const hasAppliedDiscount = isFeaturedActive || Boolean(appliedCoupon || appliedCode);
                      const displayDiscount = hasAppliedDiscount
                        ? getPromotionDiscountAmount(pricingPreview, couponDiscount)
                        : 0;
                      const featuredTitle =
                        selectedFeaturedOffer?.title ||
                        pricingPreview.appliedPromotionTitle ||
                        selectedFeaturedOffer?.offerCode ||
                        selectedFeaturedOffer?.selectedFeaturedOfferId ||
                        "";
                      const label = isFeaturedActive
                        ? `Featured Offer${featuredTitle ? ` (${featuredTitle})` : ""}`
                        : appliedCode
                        ? `Coupon Discount (${appliedCode})`
                        : "Coupon Discount";
                      return hasAppliedDiscount && displayDiscount > 0 ? (
                        <div>
                          <span>{label}</span>
                          <strong>(-) {formatCurrency(displayDiscount)}</strong>
                        </div>
                      ) : null;
                    })()}
                    <div>
                      <span>GST {pricingPreview.gstPercent ? `(${pricingPreview.gstPercent}%)` : ""}</span>
                      <strong>(+) {formatCurrency(pricingPreview.gstAmount)}</strong>
                    </div>
                    <div>
                      <span>Convenience Fee</span>
                      <strong>(+) {formatCurrency(pricingPreview.convenienceFee)}</strong>
                    </div>
                    <div className="grand-total">
                      <span>Grand Total</span>
                      <strong>{formatCurrency(fareSummary.grandTotal)}</strong>
                    </div>
                  </>
                )}
              </div>
            </article>

            {/* Coupons & Featured Offers */}
            <article className="flow-card">
              <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Coupons &amp; Offers</span>
                {(isLoadingCoupons || isLoadingOffers || isApplyingCoupon) && (
                  <span style={{ fontSize: "11px", color: "#9ca3af", fontWeight: "normal" }}>Loading...</span>
                )}
              </header>
              <div className="flow-card-body">

                {/* ── Featured Offer Cards ── */}
                {featuredOffers.length > 0 && (
                  <div style={{ marginBottom: "14px" }}>
                    <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "8px", fontWeight: "600" }}>Featured Offers:</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {featuredOffers.map((offer) => {
                        const isThisSelected = isSameFeaturedOffer(selectedFeaturedOffer, offer);
                        const anotherOfferSelected = Boolean(selectedFeaturedOffer) && !isThisSelected;
                        const discountLabel = offer.isPercentageDiscount
                          ? `${offer.discountValue}% OFF`
                          : `₹${offer.discountValue} OFF`;
                        const appliedTitle = isThisSelected && pricingPreview.appliedPromotionTitle
                          ? pricingPreview.appliedPromotionTitle
                          : offer.title;

                        return (
                          <div
                            key={offer.offerId || offer.id || offer.couponCode}
                            style={{
                              border: isThisSelected ? "2px solid #10b981" : "1px solid #e5e7eb",
                              borderRadius: "10px",
                              padding: "10px",
                              background: isThisSelected ? "#f0fdf4" : anotherOfferSelected ? "#f9fafb" : "#fff",
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              position: "relative",
                              transition: "border 0.2s, opacity 0.2s",
                              opacity: anotherOfferSelected ? 0.5 : 1,
                            }}
                          >
                            {offer.imageUrl && (
                              <img
                                src={offer.imageUrl}
                                alt={appliedTitle}
                                style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover", flexShrink: 0 }}
                                onError={(e) => { e.target.style.display = "none"; }}
                              />
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <strong style={{ fontSize: "13px", color: "#111827" }}>{appliedTitle}</strong>
                                <span style={{
                                  fontSize: "10px", fontWeight: "700", padding: "2px 6px",
                                  borderRadius: "4px", background: "#fef9c3", color: "#854d0e"
                                }}>{discountLabel}</span>
                                {isThisSelected && (
                                  <span style={{
                                    fontSize: "10px", fontWeight: "700", padding: "2px 6px",
                                    borderRadius: "4px", background: "#dcfce7", color: "#166534"
                                  }}>✓ Offer Applied</span>
                                )}
                              </div>
                              <p style={{ fontSize: "11px", color: "#6b7280", margin: "2px 0 0" }}>{offer.subtitle || offer.description}</p>
                            </div>
                            {isThisSelected ? (
                              <button
                                type="button"
                                onClick={handleRemoveOffer}
                                disabled={isApplyingCoupon}
                                style={{
                                  padding: "5px 10px", borderRadius: "6px", border: "none",
                                  background: "#ef4444", color: "#fff", fontSize: "11px",
                                  fontWeight: "600", cursor: "pointer", flexShrink: 0,
                                }}
                              >Remove</button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSelectOffer(offer)}
                                disabled={isApplyingCoupon || anotherOfferSelected}
                                style={{
                                  padding: "5px 10px", borderRadius: "6px", border: "none",
                                  background: anotherOfferSelected ? "#9ca3af" : "#10b981", color: "#fff", fontSize: "11px",
                                  fontWeight: "600", cursor: anotherOfferSelected ? "not-allowed" : "pointer", flexShrink: 0,
                                }}
                              >{isApplyingCoupon && isThisSelected ? "Applying..." : "Apply"}</button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── Manual Coupon Input ── */}
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    placeholder="Enter Coupon Code"
                    value={manualCouponCode}
                    onChange={handleCouponCodeChange}
                    disabled={isApplyingCoupon || Boolean(selectedFeaturedOffer)}
                    style={{
                      flex: 1, padding: "8px 12px", borderRadius: "6px",
                      border: "1px solid #d1d5db", textTransform: "uppercase", fontSize: "14px",
                      opacity: selectedFeaturedOffer ? 0.5 : 1,
                    }}
                  />
                  {appliedCoupon ? (
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      style={{
                        padding: "8px 16px", borderRadius: "6px", backgroundColor: "#ef4444",
                        color: "#ffffff", border: "none", fontWeight: "600", cursor: "pointer",
                      }}
                    >Remove</button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={isApplyingCoupon || !manualCouponCode.trim() || Boolean(selectedFeaturedOffer)}
                      style={{
                        padding: "8px 16px", borderRadius: "6px", backgroundColor: "#10b981",
                        color: "#ffffff", border: "none", fontWeight: "600", cursor: "pointer",
                        opacity: (!manualCouponCode.trim() || isApplyingCoupon || selectedFeaturedOffer) ? 0.6 : 1,
                      }}
                    >{isApplyingCoupon ? "Applying..." : "Apply"}</button>
                  )}
                </div>
                {selectedFeaturedOffer && (
                  <div style={{ marginTop: "8px", display: "flex", gap: "8px", alignItems: "center", justifyContent: "space-between" }}>
                    <p style={{ margin: 0, fontSize: "12px", color: "#6b7280", lineHeight: 1.35 }}>
                      Featured offer applied. Remove it to use a manual coupon.
                    </p>
                    <button
                      type="button"
                      onClick={handleRemoveOffer}
                      disabled={isApplyingCoupon}
                      style={{
                        padding: "6px 10px",
                        borderRadius: "6px",
                        border: "none",
                        background: "#ef4444",
                        color: "#fff",
                        fontSize: "11px",
                        fontWeight: "700",
                        cursor: isApplyingCoupon ? "not-allowed" : "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}

                {couponMessage && (
                  <p style={{
                    marginTop: "8px", fontSize: "13px", fontWeight: "500",
                    color: couponMessageType === "success" ? "#10b981" : "#ef4444",
                  }}>{couponMessage}</p>
                )}

                {/* ── Coupon Chips ── */}
                {availableCoupons.length > 0 && (
                  <div style={{ marginTop: "12px" }}>
                    <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "6px" }}>Available Coupons:</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {availableCoupons.map((coupon, idx) => {
                        const code = coupon.couponCode || `Promo #${coupon.id}`;
                        const isChipSelected = appliedCoupon?.couponCode === coupon.couponCode;
                        return (
                          <button
                            key={coupon.id || idx}
                            type="button"
                            onClick={() => handleSelectCoupon(coupon)}
                            disabled={isApplyingCoupon || Boolean(selectedFeaturedOffer)}
                            title={getCouponDescription(coupon)}
                            style={{
                              padding: "4px 8px",
                              borderRadius: "4px",
                              border: isChipSelected ? "1px solid #10b981" : "1px dashed #10b981",
                              backgroundColor: isChipSelected ? "#dcfce7" : "#ecfdf5",
                              color: isChipSelected ? "#065f46" : "#047857",
                              fontSize: "11px",
                              fontWeight: "600",
                              cursor: selectedFeaturedOffer ? "not-allowed" : "pointer",
                              opacity: selectedFeaturedOffer ? 0.5 : 1,
                            }}
                          >{code}</button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </article>
          </aside>

        </section>

        {/* ── Confirmation Modal ── */}
        {showConfirmation && (
          <div
            className="flow-modal-backdrop"
            onClick={() => setShowConfirmation(false)}
          >
            <section
              className="flow-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <header className="flow-modal-header">
                <h3>Please Confirm your Bus</h3>
                <button
                  type="button"
                  onClick={() => setShowConfirmation(false)}
                >
                  <X size={16} />
                </button>
              </header>

              <div className="flow-modal-grid">
                <div className="flow-modal-main">
                  <article className="flow-card compact">
                    <header>Journey Details</header>
                    <div className="flow-card-body">
                      <p><strong>{bus.fromCity} - {bus.toCity}</strong></p>
                      <p>{bus.departureTime} to {bus.arrivalTime} | {bus.duration}</p>
                      <p>Boarding: {boardingPoint.name} ({boardingPoint.time})</p>
                      <p>Dropping: {droppingPoint.name} ({droppingPoint.time})</p>
                    </div>
                  </article>

                  <article className="flow-card compact">
                    <header>Passenger Detail</header>
                    <div className="flow-card-body detail-list">
                      {passengers.map((passenger) => (
                        <div key={passenger.id}>
                          <User size={14} />
                          <span>
                            {passenger.title} {passenger.firstName}{" "}
                            {passenger.lastName} (Seat {passenger.seatLabel})
                          </span>
                        </div>
                      ))}
                    </div>
                  </article>

                  <article className="flow-card compact">
                    <header>Contact Detail</header>
                    <div className="flow-card-body detail-list">
                      <div>
                        <Mail size={14} />
                        <span>{contact.email}</span>
                      </div>
                      <div>
                        <Phone size={14} />
                        <span>{contact.mobile}</span>
                      </div>
                    </div>
                  </article>
                </div>

                <aside className="flow-modal-side">
                  <article className="flow-card compact">
                    <header>Fare Details</header>
                    <div className="flow-card-body fare-list">
                      <div>
                        <span>Subtotal Before Coupon</span>
                                <strong>{formatCurrency(pricingPreview.subtotalBeforeCoupon)}</strong>
                      </div>
                      {Number(pricingPreview.autoDiscountAmount) > 0 && (
                        <div>
                          <span>Auto Discount</span>
                          <strong>(-) {formatCurrency(pricingPreview.autoDiscountAmount)}</strong>
                        </div>
                      )}
                      {/* Discount row in confirmation modal */}
                      {(() => {
                        const isFeaturedActive = Boolean(selectedFeaturedOffer);
                        const appliedCode = pricingPreview.appliedPromotionCode || appliedCoupon?.couponCode;
                        const hasAppliedDiscount = isFeaturedActive || Boolean(appliedCoupon || appliedCode);
                        const displayDiscount = hasAppliedDiscount
                          ? getPromotionDiscountAmount(pricingPreview, couponDiscount)
                          : 0;
                        const featuredTitle =
                          selectedFeaturedOffer?.title ||
                          pricingPreview.appliedPromotionTitle ||
                          selectedFeaturedOffer?.offerCode ||
                          selectedFeaturedOffer?.selectedFeaturedOfferId ||
                          "";
                        const label = isFeaturedActive
                          ? `Featured Offer${featuredTitle ? ` (${featuredTitle})` : ""}`
                          : appliedCode
                          ? `Coupon Discount (${appliedCode})`
                          : "Coupon Discount";
                        return hasAppliedDiscount && displayDiscount > 0 ? (
                          <div>
                            <span>{label}</span>
                            <strong>(-) {formatCurrency(displayDiscount)}</strong>
                          </div>
                        ) : null;
                      })()}
                      <div>
                        <span>GST {pricingPreview.gstPercent ? `(${pricingPreview.gstPercent}%)` : ""}</span>
                        <strong>(+) {formatCurrency(pricingPreview.gstAmount)}</strong>
                      </div>
                      <div>
                        <span>Convenience Fee</span>
                        <strong>(+) {formatCurrency(pricingPreview.convenienceFee)}</strong>
                      </div>
                      <div className="grand-total">
                        <span>Total Fare</span>
                        <strong>{formatCurrency(fareSummary.grandTotal)}</strong>
                      </div>
                    </div>
                  </article>

                  <div className="flow-modal-actions">
                    <button
                      type="button"
                      className="cancel"
                      onClick={() => setShowConfirmation(false)}
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      className="proceed"
                      onClick={handleProceedPayment}
                    >
                      Proceed Payment
                    </button>
                  </div>
                </aside>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
