import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Filter, Pencil, Plus, RefreshCw, Trash2, X, ZoomIn } from "lucide-react";
import "./OfferList.css";
import {
  getAdminFeaturedOffers,
  getAdminFeaturedOfferById,
  updateAdminFeaturedOffer,
  deleteAdminFeaturedOffer,
  getOfferConditions,
  addOfferCondition,
  updateOfferCondition,
  deleteOfferCondition,
} from "../../../services/adminFeaturedOffersService";
import { toApiUrl } from "../../../services/apiClient";

const BOOKING_TYPE_OPTIONS = [
  { value: "Bus", label: "Bus" },
  { value: "Flight", label: "Flight" },
  { value: "Hotel", label: "Hotel" },
];

const DEFAULT_FILTERS = {
  query: "",
  bookingType: "all",
  status: "all",
};

const DEFAULT_EDIT_FORM = {
  title: "",
  offerCode: "",
  couponId: "",
  couponCode: "",
  promotionId: "",
  displayOrder: "0",
  bookingType: "Bus",
  isActive: true,
  couponExpiresAtUtc: "",
  startDateUtc: "",
  endDateUtc: "",
  imageUrl: "",
  shortDescription: "",
  longDescription: "",
  basePrice: "",
  isPercentageDiscount: false,
  discountValue: "",
  maxCouponUsage: "",
  couponUsedCount: 0,
};

const COL_WIDTHS = ["6%", "16%", "10%", "24%", "14%", "12%", "18%"];
const HEADERS = ["SN", "Expires", "Image", "Name", "Booking Type", "Status", "Action"];

function getField(source, camelName, pascalName, fallback = "") {
  return source?.[camelName] ?? source?.[pascalName] ?? fallback;
}

function normalizeBookingType(value) {
  const norm = String(value || "").trim().toLowerCase();
  if (norm === "flight") return "Flight";
  if (norm === "hotel") return "Hotel";
  return "Bus";
}

function formatBookingType(value) {
  return BOOKING_TYPE_OPTIONS.find((option) => option.value.toLowerCase() === String(value || "").toLowerCase())?.label || "Bus";
}

function formatStatusLabel(isActive) {
  return isActive ? "Active" : "Inactive";
}

function toBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  if (typeof value === "boolean") {
    return value;
  }
  return String(value).trim().toLowerCase() === "true";
}

function formatDateTime(value) {
  if (!value) {
    return "--";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date
    .toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .replace(",", "");
}

function toDatetimeLocal(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

function toUtcIso(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeOffer(raw) {
  const promo = raw?.promotion || raw?.Promotion || null;

  const couponId = promo
    ? getField(promo, "sourceId", "SourceId")
    : getField(raw, "couponId", "CouponId");

  const couponCode = promo
    ? getField(promo, "code", "Code")
    : getField(raw, "couponCode", "CouponCode");

  const couponExpiresAtUtc = promo
    ? getField(promo, "endDateUtc", "EndDateUtc")
    : getField(raw, "couponExpiresAtUtc", "CouponExpiresAtUtc", null);

  const discountValue = promo
    ? getField(promo, "discountValue", "DiscountValue")
    : getField(raw, "discountValue", "DiscountValue");

  const maxCouponUsage = promo
    ? getField(promo, "maxUsage", "MaxUsage")
    : getField(raw, "maxCouponUsage", "MaxCouponUsage");

  const couponUsedCount = promo
    ? getField(promo, "usedCount", "UsedCount", 0)
    : getField(raw, "couponUsedCount", "CouponUsedCount", 0);

  const isPercentageDiscount = promo
    ? String(getField(promo, "discountType", "DiscountType")).toLowerCase() === "percentage"
    : toBoolean(getField(raw, "isPercentageDiscount", "IsPercentageDiscount", false), false);

  const startDateUtc = promo
    ? getField(promo, "startDateUtc", "StartDateUtc")
    : getField(raw, "startDateUtc", "StartDateUtc", null);

  const endDateUtc = promo
    ? getField(promo, "endDateUtc", "EndDateUtc")
    : getField(raw, "endDateUtc", "EndDateUtc", null);

  return {
    id: getField(raw, "id", "Id"),
    title: getField(raw, "title", "Title"),
    offerCode: getField(raw, "offerCode", "OfferCode"),
    couponId,
    couponCode,
    promotionId: getField(raw, "promotionId", "PromotionId"),
    displayOrder: getField(raw, "displayOrder", "DisplayOrder", 0),
    bookingType: normalizeBookingType(getField(raw, "bookingType", "BookingType", "Bus")),
    isActive: toBoolean(getField(raw, "isActive", "IsActive", false), false),
    couponExpiresAtUtc,
    startDateUtc,
    endDateUtc,
    imageUrl: getField(raw, "imageUrl", "ImageUrl"),
    shortDescription: getField(raw, "subtitle", "Subtitle"),
    longDescription: getField(raw, "description", "Description"),
    basePrice: getField(raw, "basePrice", "BasePrice"),
    isPercentageDiscount,
    discountValue,
    maxCouponUsage,
    couponUsedCount,
    createdAtUtc: getField(raw, "createdAtUtc", "CreatedAtUtc", null),
    updatedAtUtc: getField(raw, "updatedAtUtc", "UpdatedAtUtc", null),
  };
}

function buildOfferFormData(formValues, fileInputObject) {
  const formData = new FormData();
  formData.append("Title", String(formValues.title || "").trim());
  formData.append("BookingType", normalizeBookingType(formValues.bookingType));
  formData.append("IsActive", Boolean(formValues.isActive));
  
  if (formValues.couponId !== undefined && formValues.couponId !== null && formValues.couponId !== "") {
    formData.append("CouponId", Number(formValues.couponId));
  }
  if (formValues.offerCode !== undefined && formValues.offerCode !== null) {
    formData.append("OfferCode", String(formValues.offerCode).trim());
  }
  if (formValues.promotionId !== undefined && formValues.promotionId !== null && formValues.promotionId !== "") {
    formData.append("PromotionId", Number(formValues.promotionId));
  }
  if (formValues.displayOrder !== undefined && formValues.displayOrder !== null && formValues.displayOrder !== "") {
    formData.append("DisplayOrder", Number(formValues.displayOrder));
  }
  if (formValues.shortDescription !== undefined && formValues.shortDescription !== null) {
    formData.append("Subtitle", String(formValues.shortDescription).trim());
  }
  if (formValues.longDescription !== undefined && formValues.longDescription !== null) {
    formData.append("Description", String(formValues.longDescription).trim());
  }
  
  if (formValues.couponExpiresAtUtc) {
    formData.append("CouponExpiresAtUtc", toUtcIso(formValues.couponExpiresAtUtc));
  }
  if (formValues.startDateUtc) {
    formData.append("StartDateUtc", toUtcIso(formValues.startDateUtc));
  }
  if (formValues.endDateUtc) {
    formData.append("EndDateUtc", toUtcIso(formValues.endDateUtc));
  }
  
  if (formValues.basePrice !== undefined && formValues.basePrice !== null && formValues.basePrice !== "") {
    formData.append("BasePrice", Number(formValues.basePrice));
  }
  formData.append("IsPercentageDiscount", Boolean(formValues.isPercentageDiscount));
  
  if (formValues.discountValue !== undefined && formValues.discountValue !== null && formValues.discountValue !== "") {
    formData.append("DiscountValue", Number(formValues.discountValue));
  }
  
  if (formValues.maxCouponUsage !== undefined && formValues.maxCouponUsage !== null && formValues.maxCouponUsage !== "") {
    formData.append("MaxCouponUsage", Number(formValues.maxCouponUsage));
  }
  
  if (formValues.couponUsedCount !== undefined && formValues.couponUsedCount !== null && formValues.couponUsedCount !== "") {
    formData.append("CouponUsedCount", Number(formValues.couponUsedCount));
  } else {
    formData.append("CouponUsedCount", 0);
  }
  
  if (fileInputObject) {
    formData.append("Image", fileInputObject);
  }
  
  return formData;
}

export default function AdminOfferListPage({ onAddOffer }) {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [imageOffer, setImageOffer] = useState(null);
  const [detailsOffer, setDetailsOffer] = useState(null);
  const [editOffer, setEditOffer] = useState(null);
  const [editForm, setEditForm] = useState(DEFAULT_EDIT_FORM);
  const [selectedFile, setSelectedFile] = useState(null);
  const [editError, setEditError] = useState("");
  const [deleteOffer, setDeleteOffer] = useState(null);

  const [conditions, setConditions] = useState([]);
  const [conditionsLoading, setConditionsLoading] = useState(false);
  const [conditionsError, setConditionsError] = useState("");
  const [newCondition, setNewCondition] = useState({
    conditionType: "SourceCity",
    conditionOperator: "Equals",
    value1: "",
    value2: "",
    isActive: true
  });
  const [showAddCondition, setShowAddCondition] = useState(false);
  const [editingConditionId, setEditingConditionId] = useState(null);

  const loadConditions = useCallback(async (offerId) => {
    setConditionsLoading(true);
    setConditionsError("");
    try {
      const payload = await getOfferConditions(offerId);
      const rows = Array.isArray(payload)
        ? payload
        : payload?.data || payload?.items || payload?.Items || [];
      
      const normalized = rows.map((cond) => {
        const typeRaw = cond?.conditionType ?? cond?.ConditionType;
        const opRaw = cond?.conditionOperator ?? cond?.ConditionOperator;
        
        let conditionType = String(typeRaw || "");
        if (typeRaw === 1 || conditionType.toLowerCase() === "sourcecity") {
          conditionType = "SourceCity";
        } else if (typeRaw === 2 || conditionType.toLowerCase() === "destinationcity") {
          conditionType = "DestinationCity";
        } else if (typeRaw === 3 || conditionType.toLowerCase() === "bustype") {
          conditionType = "BusType";
        } else if (typeRaw === 4 || conditionType.toLowerCase() === "traveldate") {
          conditionType = "TravelDate";
        }

        let conditionOperator = String(opRaw || "Equals");
        if (opRaw === 1 || conditionOperator.toLowerCase() === "equals") {
          conditionOperator = "Equals";
        } else if (opRaw === 2 || conditionOperator.toLowerCase() === "contains") {
          conditionOperator = "Contains";
        } else if (opRaw === 3 || conditionOperator.toLowerCase() === "between") {
          conditionOperator = "Between";
        }

        return {
          ...cond,
          id: cond?.id ?? cond?.Id,
          featuredOfferId: cond?.featuredOfferId ?? cond?.FeaturedOfferId,
          conditionType,
          conditionOperator,
          value1: cond?.value1 ?? cond?.Value1 ?? "",
          value2: cond?.value2 ?? cond?.Value2 ?? "",
          isActive: cond?.isActive ?? cond?.IsActive ?? true,
        };
      });

      setConditions(normalized);
    } catch (err) {
      setConditionsError(err.message || "Failed to load conditions.");
    } finally {
      setConditionsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (detailsOffer?.id) {
      loadConditions(detailsOffer.id);
    }
  }, [detailsOffer?.id, loadConditions]);

  const handleAddCondition = async () => {
    if (!newCondition.value1.trim()) {
      setConditionsError("Value 1 is required.");
      return;
    }
    setConditionsError("");
    try {
      if (editingConditionId) {
        await updateOfferCondition(detailsOffer.id, editingConditionId, {
          conditionType: newCondition.conditionType,
          conditionOperator: newCondition.conditionOperator,
          value1: newCondition.value1.trim(),
          value2: newCondition.value2?.trim() || null,
          isActive: newCondition.isActive
        });
      } else {
        await addOfferCondition(detailsOffer.id, {
          conditionType: newCondition.conditionType,
          conditionOperator: newCondition.conditionOperator,
          value1: newCondition.value1.trim(),
          value2: newCondition.value2?.trim() || null,
          isActive: newCondition.isActive
        });
      }
      setNewCondition({
        conditionType: "SourceCity",
        conditionOperator: "Equals",
        value1: "",
        value2: "",
        isActive: true
      });
      setShowAddCondition(false);
      setEditingConditionId(null);
      await loadConditions(detailsOffer.id);
    } catch (err) {
      setConditionsError(err.message || "Failed to save condition.");
    }
  };

  const handleEditConditionClick = (cond) => {
    setNewCondition({
      conditionType: cond.conditionType,
      conditionOperator: cond.conditionOperator || "Equals",
      value1: cond.value1,
      value2: cond.value2 || "",
      isActive: cond.isActive
    });
    setEditingConditionId(cond.id);
    setShowAddCondition(true);
  };

  const handleDeleteConditionClick = async (conditionId) => {
    if (!window.confirm("Are you sure you want to delete this condition?")) {
      return;
    }
    setConditionsError("");
    try {
      await deleteOfferCondition(detailsOffer.id, conditionId);
      await loadConditions(detailsOffer.id);
    } catch (err) {
      setConditionsError(err.message || "Failed to delete condition.");
    }
  };

  const loadOffers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const payload = await getAdminFeaturedOffers();
      const rows = Array.isArray(payload) ? payload : payload?.items || payload?.Items || [];
      setOffers(rows.map(normalizeOffer));
    } catch (requestError) {
      setError(requestError.message || "Unable to load offers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  const filteredOffers = useMemo(() => {
    const query = filters.query.trim().toLowerCase();

    return offers.filter((offer) => {
      const matchesQuery =
        !query ||
        String(offer.title || "").toLowerCase().includes(query) ||
        String(offer.couponId || "").toLowerCase().includes(query) ||
        String(offer.couponCode || "").toLowerCase().includes(query) ||
        String(offer.promotionId || "").toLowerCase().includes(query) ||
        String(offer.bookingType || "").toLowerCase().includes(query) ||
        String(offer.couponExpiresAtUtc || "").toLowerCase().includes(query);
      const matchesBookingType =
        filters.bookingType === "all" || offer.bookingType === filters.bookingType;
      const matchesStatus =
        filters.status === "all" ||
        (filters.status === "active" ? offer.isActive : !offer.isActive);

      return matchesQuery && matchesBookingType && matchesStatus;
    });
  }, [filters, offers]);

  const handleFilterChange = (field) => (event) => {
    setFilters((previous) => ({ ...previous, [field]: event.target.value }));
  };

  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setShowFilters(false);
  };

  const handleToggleStatus = async (offer) => {
    setBusyId(offer.id);
    setError("");

    try {
      // Step 1: Get full details by ID first
      const fullOffer = await getAdminFeaturedOfferById(offer.id);
      const normalized = normalizeOffer(fullOffer);
      
      // Step 2: Toggle state and save via PUT
      normalized.isActive = !offer.isActive;
      const formData = buildOfferFormData(normalized, null);
      
      await updateAdminFeaturedOffer(offer.id, formData);
      await loadOffers();
      setDetailsOffer((previous) =>
        previous?.id === offer.id ? { ...previous, isActive: !previous.isActive } : previous
      );
    } catch (requestError) {
      setError(requestError.message || "Unable to update offer status.");
    } finally {
      setBusyId(null);
    }
  };

  const openEditModal = async (offer) => {
    setEditError("");
    setBusyId(offer.id);
    setSelectedFile(null);

    try {
      // Step 1: GET /api/AdminFeaturedOffers/{id} to get fresh details
      const fullOffer = await getAdminFeaturedOfferById(offer.id);
      const normalized = normalizeOffer(fullOffer);
      
      setEditOffer(normalized);
      setEditForm({
        title: normalized.title || "",
        offerCode: normalized.offerCode || "",
        couponId: normalized.couponId !== null && normalized.couponId !== undefined ? normalized.couponId : "",
        couponCode: normalized.couponCode || "",
        promotionId: normalized.promotionId !== null && normalized.promotionId !== undefined ? normalized.promotionId : "",
        displayOrder: normalized.displayOrder !== null && normalized.displayOrder !== undefined ? normalized.displayOrder : "0",
        bookingType: normalizeBookingType(normalized.bookingType),
        isActive: Boolean(normalized.isActive),
        couponExpiresAtUtc: toDatetimeLocal(normalized.couponExpiresAtUtc),
        startDateUtc: toDatetimeLocal(normalized.startDateUtc),
        endDateUtc: toDatetimeLocal(normalized.endDateUtc),
        imageUrl: normalized.imageUrl || "",
        shortDescription: normalized.shortDescription || "",
        longDescription: normalized.longDescription || "",
        basePrice: normalized.basePrice !== null && normalized.basePrice !== undefined ? normalized.basePrice : "",
        isPercentageDiscount: Boolean(normalized.isPercentageDiscount),
        discountValue: normalized.discountValue !== null && normalized.discountValue !== undefined ? normalized.discountValue : "",
        maxCouponUsage: normalized.maxCouponUsage !== null && normalized.maxCouponUsage !== undefined ? normalized.maxCouponUsage : "",
        couponUsedCount: normalized.couponUsedCount || 0,
      });
    } catch (requestError) {
      setError(requestError.message || "Unable to load offer details for editing.");
    } finally {
      setBusyId(null);
    }
  };

  const handleEditSave = async () => {
    const title = String(editForm.title || "").trim();
    const bookingType = normalizeBookingType(editForm.bookingType);

    if (!title || !bookingType) {
      setEditError("Offer name and booking type are required.");
      return;
    }

    if (!editForm.couponId) {
      setEditError("Linked coupon ID is required.");
      return;
    }

    if (
      editForm.startDateUtc &&
      editForm.endDateUtc &&
      new Date(editForm.startDateUtc).getTime() > new Date(editForm.endDateUtc).getTime()
    ) {
      setEditError("Offer end date should be after start date.");
      return;
    }

    setBusyId(editOffer.id);
    setEditError("");
    setError("");

    try {
      // Step 2: PUT /api/AdminFeaturedOffers/{id}
      const formData = buildOfferFormData(editForm, selectedFile);
      await updateAdminFeaturedOffer(editOffer.id, formData);
      setEditOffer(null);
      await loadOffers();
    } catch (requestError) {
      setEditError(requestError.message || "Unable to save offer.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteOffer) {
      return;
    }

    setBusyId(deleteOffer.id);
    setError("");

    try {
      await deleteAdminFeaturedOffer(deleteOffer.id);
      setDeleteOffer(null);
      setImageOffer((previous) => (previous?.id === deleteOffer.id ? null : previous));
      setDetailsOffer((previous) => (previous?.id === deleteOffer.id ? null : previous));
      await loadOffers();
    } catch (requestError) {
      setError(requestError.message || "Unable to delete offer.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      {detailsOffer ? (
        <section className="flight-markup-panel offer-details-page">
          <header className="flight-markup-toolbar offer-details-toolbar">
            <div className="flight-markup-title">
              <h1>
                <strong>View Offer</strong> Details
              </h1>
              <div className="flight-markup-title-underline" aria-hidden="true" />
            </div>

            <button
              type="button"
              className="offer-details-close-btn"
              onClick={() => setDetailsOffer(null)}
            >
              Close Tab
            </button>
          </header>

          <section className="offer-details-shell">
            <div className="offer-details-section">
              <div className="offer-details-section-bar">
                <span>Basic Details</span>
              </div>

              <div className="offer-details-grid">
                <div className="offer-details-label">ID</div>
                <div className="offer-details-value">
                  {detailsOffer.id} ({formatStatusLabel(detailsOffer.isActive)})
                </div>

                <div className="offer-details-label">Offer Name</div>
                <div className="offer-details-value">{detailsOffer.title || "--"}</div>

                <div className="offer-details-label">Offer Code</div>
                <div className="offer-details-value">{detailsOffer.offerCode || "--"}</div>

                <div className="offer-details-label">Booking Type</div>
                <div className="offer-details-value">{formatBookingType(detailsOffer.bookingType)}</div>

                <div className="offer-details-label">Coupon Code</div>
                <div className="offer-details-value">{detailsOffer.couponCode || "--"}</div>

                <div className="offer-details-label">Coupon ID</div>
                <div className="offer-details-value">{detailsOffer.couponId || "--"}</div>

                <div className="offer-details-label">Promotion ID</div>
                <div className="offer-details-value">{detailsOffer.promotionId || "--"}</div>

                <div className="offer-details-label">Display Order</div>
                <div className="offer-details-value">{detailsOffer.displayOrder ?? "--"}</div>

                <div className="offer-details-label">Coupon Expires</div>
                <div className="offer-details-value">
                  {formatDateTime(detailsOffer.couponExpiresAtUtc)}
                </div>

                <div className="offer-details-label">Offer Starts</div>
                <div className="offer-details-value">{formatDateTime(detailsOffer.startDateUtc)}</div>

                <div className="offer-details-label">Offer Ends</div>
                <div className="offer-details-value">{formatDateTime(detailsOffer.endDateUtc)}</div>

                <div className="offer-details-label">Base Price</div>
                <div className="offer-details-value">
                  {detailsOffer.basePrice !== null && detailsOffer.basePrice !== undefined ? `${detailsOffer.basePrice} INR` : "--"}
                </div>

                <div className="offer-details-label">Discount</div>
                <div className="offer-details-value">
                  {detailsOffer.discountValue ? (
                    <span>
                      {detailsOffer.discountValue} {detailsOffer.isPercentageDiscount ? "%" : "INR"}
                    </span>
                  ) : "--"}
                </div>

                <div className="offer-details-label">Max Usage</div>
                <div className="offer-details-value">{detailsOffer.maxCouponUsage || "--"}</div>

                <div className="offer-details-label">Used Count</div>
                <div className="offer-details-value">{detailsOffer.couponUsedCount || 0}</div>

                <div className="offer-details-label">Image</div>
                <div className="offer-details-value">
                  {detailsOffer.imageUrl ? (
                    <button
                      type="button"
                      className="offer-details-image-btn"
                      onClick={() => setImageOffer(detailsOffer)}
                    >
                      View Full Image
                    </button>
                  ) : (
                    "--"
                  )}
                </div>

                <div className="offer-details-label">Image Path</div>
                <div className="offer-details-value offer-details-link">
                  {detailsOffer.imageUrl || "--"}
                </div>

                <div className="offer-details-label">Created</div>
                <div className="offer-details-value">{formatDateTime(detailsOffer.createdAtUtc)}</div>

                <div className="offer-details-label">Updated</div>
                <div className="offer-details-value">{formatDateTime(detailsOffer.updatedAtUtc)}</div>
              </div>
            </div>

            <div className="offer-details-section">
              <div className="offer-details-section-bar">
                <span>Short Description (Subtitle)</span>
              </div>
              <div className="offer-details-copy">{detailsOffer.shortDescription || "--"}</div>
            </div>

            <div className="offer-details-section">
              <div className="offer-details-section-bar">
                <span>Long Description (Description)</span>
              </div>
              <div className="offer-details-copy offer-details-long-copy">
                {detailsOffer.longDescription || "--"}
              </div>
            </div>

            <div className="offer-details-section">
              <div className="offer-details-section-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Search Prefill Conditions</span>
                <button
                  type="button"
                  className="admin-markup-coupon-btn generate"
                  style={{ height: "30px", padding: "0 12px", fontSize: "12px", margin: 0 }}
                  onClick={() => {
                    setEditingConditionId(null);
                    setNewCondition({
                      conditionType: "SourceCity",
                      conditionOperator: "Equals",
                      value1: "",
                      value2: "",
                      isActive: true
                    });
                    setShowAddCondition((prev) => !prev);
                  }}
                >
                  {showAddCondition ? "Cancel" : "Add Condition"}
                </button>
              </div>

              {conditionsError && (
                <p className="admin-markup-form-error" style={{ margin: "10px 0" }}>
                  {conditionsError}
                </p>
              )}

              {showAddCondition && (
                <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "16px" }}>
                  <h3 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>
                    {editingConditionId ? "Edit Condition" : "Add New Condition"}
                  </h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginBottom: "12px" }}>
                    <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>Condition Type</span>
                      <select
                        value={newCondition.conditionType}
                        onChange={(e) => setNewCondition(prev => ({ ...prev, conditionType: e.target.value }))}
                        style={{ height: "36px", border: "1.5px solid #cbd5e1", borderRadius: "6px", padding: "0 8px" }}
                      >
                        <option value="SourceCity">SourceCity (Origin)</option>
                        <option value="DestinationCity">DestinationCity (Destination)</option>
                        <option value="BusType">BusType</option>
                        <option value="TravelDate">TravelDate</option>
                      </select>
                    </label>

                    <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>Operator</span>
                      <select
                        value={newCondition.conditionOperator}
                        onChange={(e) => setNewCondition(prev => ({ ...prev, conditionOperator: e.target.value }))}
                        style={{ height: "36px", border: "1.5px solid #cbd5e1", borderRadius: "6px", padding: "0 8px" }}
                      >
                        <option value="Equals">Equals</option>
                        <option value="Contains">Contains</option>
                        <option value="Between">Between</option>
                      </select>
                    </label>

                    <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>Value 1 *</span>
                      <input
                        type="text"
                        value={newCondition.value1}
                        onChange={(e) => setNewCondition(prev => ({ ...prev, value1: e.target.value }))}
                        placeholder={newCondition.conditionType === "TravelDate" ? "YYYY-MM-DD" : "Value 1"}
                        style={{ height: "36px", border: "1.5px solid #cbd5e1", borderRadius: "6px", padding: "0 8px" }}
                      />
                    </label>

                    {newCondition.conditionOperator === "Between" && (
                      <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>Value 2 (For range) *</span>
                        <input
                          type="text"
                          value={newCondition.value2}
                          onChange={(e) => setNewCondition(prev => ({ ...prev, value2: e.target.value }))}
                          placeholder={newCondition.conditionType === "TravelDate" ? "YYYY-MM-DD" : "Value 2"}
                          style={{ height: "36px", border: "1.5px solid #cbd5e1", borderRadius: "6px", padding: "0 8px" }}
                        />
                      </label>
                    )}

                    <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>Is Active</span>
                      <select
                        value={newCondition.isActive ? "active" : "inactive"}
                        onChange={(e) => setNewCondition(prev => ({ ...prev, isActive: e.target.value === "active" }))}
                        style={{ height: "36px", border: "1.5px solid #cbd5e1", borderRadius: "6px", padding: "0 8px" }}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </label>
                  </div>
                  <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      className="admin-markup-coupon-btn clear"
                      style={{ height: "30px", margin: 0 }}
                      onClick={() => {
                        setShowAddCondition(false);
                        setEditingConditionId(null);
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="admin-markup-coupon-btn generate"
                      style={{ height: "30px", margin: 0 }}
                      onClick={handleAddCondition}
                    >
                      {editingConditionId ? "Update Condition" : "Save Condition"}
                    </button>
                  </div>
                </div>
              )}

              {conditionsLoading ? (
                <p style={{ textAlign: "center", color: "#64748b", margin: "16px 0" }}>Loading conditions...</p>
              ) : conditions.length === 0 ? (
                <p style={{ textAlign: "center", color: "#64748b", margin: "16px 0" }}>No conditions set for this offer.</p>
              ) : (
                <div className="admin-markup-table-wrap" style={{ marginTop: "12px", maxHeight: "300px", overflowY: "auto" }}>
                  <table className="admin-markup-table">
                    <thead>
                      <tr>
                        <th>Condition Type</th>
                        <th>Operator</th>
                        <th>Value 1</th>
                        <th>Value 2</th>
                        <th>Status</th>
                        <th className="action-col">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {conditions.map((cond) => (
                        <tr key={cond.id}>
                          <td><strong>{cond.conditionType}</strong></td>
                          <td>{cond.conditionOperator || "Equals"}</td>
                          <td>{cond.value1}</td>
                          <td>{cond.value2 || "--"}</td>
                          <td>
                            <span style={{
                              padding: "4px 8px",
                              borderRadius: "4px",
                              fontSize: "11px",
                              fontWeight: 600,
                              background: cond.isActive ? "#f0fdf4" : "#f1f5f9",
                              color: cond.isActive ? "#166534" : "#475569"
                            }}>
                              {cond.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="action-col">
                            <div className="markup-action-group">
                              <button
                                type="button"
                                title="Edit"
                                onClick={() => handleEditConditionClick(cond)}
                              >
                                <Pencil size={12} />
                              </button>
                              <button
                                type="button"
                                title="Delete"
                                className="danger"
                                onClick={() => handleDeleteConditionClick(cond.id)}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </section>
      ) : (
        <section className="flight-markup-panel">
          <header className="flight-markup-toolbar">
            <div className="flight-markup-title">
              <h1>
                <strong>Offer</strong> List
              </h1>
              <div className="flight-markup-title-underline" aria-hidden="true" />
            </div>

            <div className="admin-markup-coupon-actions">
              <button
                type="button"
                className={`admin-markup-coupon-btn filter ${showFilters ? "active" : ""}`}
                onClick={() => setShowFilters((previous) => !previous)}
              >
                <Filter size={16} />
                <span>Filter</span>
              </button>
              <button type="button" className="admin-markup-coupon-btn clear" onClick={handleClearFilters}>
                <X size={16} />
                <span>Clear Filter</span>
              </button>
              <button type="button" className="admin-markup-coupon-btn clear" onClick={loadOffers}>
                <RefreshCw size={16} />
                <span>Refresh</span>
              </button>
              {onAddOffer && (
                <button type="button" className="admin-markup-coupon-btn generate" onClick={onAddOffer}>
                  <Plus size={16} />
                  <span>Add Offer</span>
                </button>
              )}
            </div>
          </header>

          {showFilters && (
            <section className="flight-destination-filter-panel">
              <div className="flight-destination-filter-grid">
                <label>
                  <span>Search</span>
                  <input
                    type="text"
                    value={filters.query}
                    onChange={handleFilterChange("query")}
                    placeholder="Search offers..."
                  />
                </label>
                <label>
                  <span>Booking Type</span>
                  <select value={filters.bookingType} onChange={handleFilterChange("bookingType")}>
                    <option value="all">All</option>
                    {BOOKING_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Status</span>
                  <select value={filters.status} onChange={handleFilterChange("status")}>
                    <option value="all">All</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </label>
              </div>
            </section>
          )}

          {error && <p className="admin-markup-form-error">{error}</p>}

          <section className="admin-markup-table-wrap">
            <table className="admin-markup-table">
              <colgroup>
                {COL_WIDTHS.map((width, index) => (
                  <col key={`${width}-${index}`} style={{ width }} />
                ))}
              </colgroup>
              <thead>
                <tr>
                  {HEADERS.map((header) => (
                    <th key={header} className={header === "Action" ? "action-col" : undefined}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={HEADERS.length}>
                      <p className="admin-markup-empty">Loading offers...</p>
                    </td>
                  </tr>
                ) : filteredOffers.length === 0 ? (
                  <tr>
                    <td colSpan={HEADERS.length}>
                      <p className="admin-markup-empty">No offer records found.</p>
                    </td>
                  </tr>
                ) : (
                  filteredOffers.map((offer, index) => (
                    <tr key={offer.id}>
                      <td>{index + 1}</td>
                      <td>{formatDateTime(offer.couponExpiresAtUtc)}</td>
                      <td>
                        {offer.imageUrl ? (
                          <div className="offer-list-thumbnail-box">
                            <img
                              src={toApiUrl(offer.imageUrl)}
                              alt={offer.title}
                              className="offer-list-thumbnail"
                              onClick={() => setImageOffer(offer)}
                            />
                          </div>
                        ) : (
                          <span className="offer-list-no-image">No Image</span>
                        )}
                      </td>
                      <td>{offer.title}</td>
                      <td>{formatBookingType(offer.bookingType)}</td>
                      <td>
                        <button
                          type="button"
                          className={`markup-status-toggle ${offer.isActive ? "active" : "inactive"}`}
                          onClick={() => handleToggleStatus(offer)}
                          disabled={busyId === offer.id}
                          aria-label={`Set offer ${offer.id} status to ${
                            offer.isActive ? "inactive" : "active"
                          }`}
                        >
                          {offer.isActive ? <Check size={14} /> : <X size={14} />}
                          <span>{formatStatusLabel(offer.isActive)}</span>
                        </button>
                      </td>
                      <td className="action-col">
                        <div className="markup-action-group" aria-label="Offer actions">
                          <button
                            type="button"
                            className="offer-details-trigger"
                            title="Zoom In"
                            aria-label={`Open details for ${offer.title}`}
                            onClick={() => setDetailsOffer(offer)}
                          >
                            <ZoomIn size={14} />
                          </button>
                          <button
                            type="button"
                            title="Edit"
                            aria-label={`Edit ${offer.title}`}
                            onClick={() => openEditModal(offer)}
                            disabled={busyId === offer.id}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            title="Delete"
                            aria-label={`Delete ${offer.title}`}
                            className="danger"
                            onClick={() => setDeleteOffer(offer)}
                            disabled={busyId === offer.id}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>
        </section>
      )}

      {imageOffer && (
        <div className="admin-markup-modal-backdrop" onClick={() => setImageOffer(null)}>
          <section
            className="admin-markup-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Offer image preview"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <h2>Offer Image Preview</h2>
              <button type="button" onClick={() => setImageOffer(null)} aria-label="Close image preview">
                <X size={16} />
              </button>
            </header>

            <div className="flight-route-image-body">
              <img src={toApiUrl(imageOffer.imageUrl)} alt={imageOffer.title} />
            </div>
          </section>
        </div>
      )}

      {editOffer && (
        <div className="admin-markup-modal-backdrop" onClick={() => setEditOffer(null)}>
          <section
            className="admin-markup-modal fullscreen"
            role="dialog"
            aria-modal="true"
            aria-label="Edit offer"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <h2>Edit Offer</h2>
              <button type="button" onClick={() => setEditOffer(null)} aria-label="Close edit offer">
                <X size={16} />
              </button>
            </header>

            <div className="admin-markup-form-grid">
              <label className="wide">
                <span>Offer Name (Title) *</span>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(event) => setEditForm((previous) => ({ ...previous, title: event.target.value }))}
                  required
                />
              </label>
              
              <label>
                <span>Offer Code</span>
                <input
                  type="text"
                  value={editForm.offerCode}
                  onChange={(event) => setEditForm((previous) => ({ ...previous, offerCode: event.target.value }))}
                  placeholder="e.g. BUS2026"
                />
              </label>

              <label>
                <span>Booking Type *</span>
                <select
                  value={editForm.bookingType}
                  onChange={(event) =>
                    setEditForm((previous) => ({ ...previous, bookingType: event.target.value }))
                  }
                  required
                >
                  {BOOKING_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Status</span>
                <select
                  value={editForm.isActive ? "active" : "inactive"}
                  onChange={(event) =>
                    setEditForm((previous) => ({
                      ...previous,
                      isActive: event.target.value === "active",
                    }))
                  }
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>

              <label>
                <span>Coupon ID *</span>
                <input
                  type="number"
                  min="1"
                  value={editForm.couponId}
                  onChange={(event) =>
                    setEditForm((previous) => ({ ...previous, couponId: event.target.value }))
                  }
                  placeholder="Linked coupon ID"
                  required
                />
              </label>

              <label>
                <span>Coupon Code</span>
                <input
                  type="text"
                  value={editForm.couponCode}
                  disabled
                  placeholder="Resolved by backend"
                />
              </label>

              <label>
                <span>Promotion ID</span>
                <input
                  type="number"
                  min="1"
                  value={editForm.promotionId}
                  onChange={(event) =>
                    setEditForm((previous) => ({ ...previous, promotionId: event.target.value }))
                  }
                  placeholder="e.g. 4"
                />
              </label>

              <label>
                <span>Display Order</span>
                <input
                  type="number"
                  min="0"
                  value={editForm.displayOrder}
                  onChange={(event) =>
                    setEditForm((previous) => ({ ...previous, displayOrder: event.target.value }))
                  }
                  placeholder="e.g. 1"
                />
              </label>

              <label>
                <span>Coupon Expires</span>
                <input
                  type="datetime-local"
                  value={editForm.couponExpiresAtUtc}
                  onChange={(event) =>
                    setEditForm((previous) => ({
                      ...previous,
                      couponExpiresAtUtc: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                <span>Offer Starts</span>
                <input
                  type="datetime-local"
                  value={editForm.startDateUtc}
                  onChange={(event) =>
                    setEditForm((previous) => ({
                      ...previous,
                      startDateUtc: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                <span>Offer Ends</span>
                <input
                  type="datetime-local"
                  value={editForm.endDateUtc}
                  onChange={(event) =>
                    setEditForm((previous) => ({
                      ...previous,
                      endDateUtc: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                <span>Base Price (INR)</span>
                <input
                  type="number"
                  value={editForm.basePrice}
                  onChange={(event) => setEditForm((previous) => ({ ...previous, basePrice: event.target.value }))}
                  placeholder="e.g. 1000"
                />
              </label>

              <label>
                <span>Discount Type</span>
                <select
                  value={editForm.isPercentageDiscount ? "percentage" : "flat"}
                  onChange={(event) =>
                    setEditForm((previous) => ({
                      ...previous,
                      isPercentageDiscount: event.target.value === "percentage",
                    }))
                  }
                >
                  <option value="percentage">Percentage Discount</option>
                  <option value="flat">Flat Discount</option>
                </select>
              </label>

              <label>
                <span>Discount Value</span>
                <input
                  type="number"
                  value={editForm.discountValue}
                  onChange={(event) => setEditForm((previous) => ({ ...previous, discountValue: event.target.value }))}
                  placeholder="e.g. 50 or 500"
                />
              </label>

              <label>
                <span>Max Coupon Usage</span>
                <input
                  type="number"
                  value={editForm.maxCouponUsage}
                  onChange={(event) => setEditForm((previous) => ({ ...previous, maxCouponUsage: event.target.value }))}
                  placeholder="e.g. 500"
                />
              </label>

              <label className="wide">
                <span>Image Upload</span>
                <div className="offer-edit-file-uploader">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      if (event.target.files && event.target.files[0]) {
                        setSelectedFile(event.target.files[0]);
                      }
                    }}
                  />
                  {editForm.imageUrl && (
                    <div className="offer-edit-current-image">
                      <span>Current image:</span>
                      <img src={toApiUrl(editForm.imageUrl)} alt="Current Offer" />
                    </div>
                  )}
                </div>
              </label>

              <label className="wide">
                <span>Short Description (Subtitle)</span>
                <textarea
                  value={editForm.shortDescription}
                  onChange={(event) =>
                    setEditForm((previous) => ({
                      ...previous,
                      shortDescription: event.target.value,
                    }))
                  }
                  placeholder="Brief summary shown in the user portal card"
                />
              </label>

              <label className="wide">
                <span>Long Description (Description)</span>
                <textarea
                  value={editForm.longDescription}
                  onChange={(event) =>
                    setEditForm((previous) => ({
                      ...previous,
                      longDescription: event.target.value,
                    }))
                  }
                  placeholder="Full terms and conditions"
                  style={{ minHeight: "140px" }}
                />
              </label>
            </div>

            {editError && <p className="admin-markup-form-error">{editError}</p>}

            <div className="admin-markup-modal-actions">
              <button type="button" className="secondary" onClick={() => setEditOffer(null)}>
                Cancel
              </button>
              <button type="button" className="primary" onClick={handleEditSave} disabled={busyId === editOffer.id}>
                Save Changes
              </button>
            </div>
          </section>
        </div>
      )}

      {deleteOffer && (
        <div className="admin-markup-modal-backdrop" onClick={() => setDeleteOffer(null)}>
          <section
            className="admin-markup-modal small"
            role="dialog"
            aria-modal="true"
            aria-label="Delete offer"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <h2>Delete Offer</h2>
              <button type="button" onClick={() => setDeleteOffer(null)} aria-label="Close delete offer">
                <X size={16} />
              </button>
            </header>

            <p className="admin-markup-delete-copy">
              Are you sure you want to delete <strong>{deleteOffer.title}</strong>?
            </p>

            <div className="admin-markup-modal-actions">
              <button type="button" className="secondary" onClick={() => setDeleteOffer(null)}>
                Cancel
              </button>
              <button type="button" className="danger" onClick={handleDeleteConfirm} disabled={busyId === deleteOffer.id}>
                Delete
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
