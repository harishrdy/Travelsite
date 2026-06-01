
import React, { useEffect, useMemo, useState } from "react";
import { List } from "lucide-react";
import "./AddOffer.css";
import { createAdminFeaturedOffer } from "../../../services/adminFeaturedOffersService";
import { listBusCoupons } from "../../../services/busBookingService";

const BOOKING_TYPE_OPTIONS = [
  { value: "Bus", label: "Bus" },
  { value: "Flight", label: "Flight" },
  { value: "Hotel", label: "Hotel" },
];

const DEFAULT_FORM = {
  title: "",
  couponId: "",
  couponCode: "",
  bookingType: "Bus",
  isActive: true,
  couponExpiresAtUtc: "",
  startDateUtc: "",
  endDateUtc: "",
  shortDescription: "",
  offerCode: "",
  promotionId: "",
  displayOrder: "0",
  basePrice: "",
  isPercentageDiscount: false,
  discountValue: "",
  maxCouponUsage: "",
};



function toUtcIso(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function buildOfferFormData(formValues, fileInputObject) {
  const formData = new FormData();
  formData.append("Title", String(formValues.title || "").trim());
  formData.append("BookingType", formValues.bookingType);
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
    formData.append("Description", String(formValues.shortDescription).trim());
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
  
  formData.append("CouponUsedCount", 0);
  
  if (fileInputObject) {
    formData.append("Image", fileInputObject);
  }
  
  return formData;
}

export default function AdminAddOfferPage({ onBack }) {
  const [formValues, setFormValues] = useState(DEFAULT_FORM);
  const [selectedFile, setSelectedFile] = useState(null);
  const [couponOptions, setCouponOptions] = useState([]);
  const [couponLoadError, setCouponLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    listBusCoupons()
      .then((coupons) => {
        if (isMounted) {
          setCouponOptions(coupons);
          setCouponLoadError("");
        }
      })
      .catch((error) => {
        if (isMounted) {
          setCouponOptions([]);
          setCouponLoadError(error.message || "Unable to load coupons.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedCoupon = useMemo(
    () => couponOptions.find((coupon) => String(coupon.id) === String(formValues.couponId)),
    [couponOptions, formValues.couponId]
  );

  const handleChange = (field) => (event) => {
    const value = field === "isActive" ? event.target.value === "active" : event.target.value;
    setFormValues((previous) => ({ ...previous, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaved(false);
    setFormError("");

    const title = String(formValues.title || "").trim();
    if (!title) {
      setFormError("Offer name is required.");
      return;
    }

    if (!formValues.couponId) {
      setFormError("Linked coupon is required.");
      return;
    }

    if (
      formValues.startDateUtc &&
      formValues.endDateUtc &&
      new Date(formValues.startDateUtc).getTime() > new Date(formValues.endDateUtc).getTime()
    ) {
      setFormError("Offer end date should be after start date.");
      return;
    }

    setSubmitting(true);

    try {
      const formData = buildOfferFormData(formValues, selectedFile);
      await createAdminFeaturedOffer(formData);
      setFormValues(DEFAULT_FORM);
      setSelectedFile(null);
      setSaved(true);
      if (onBack) {
        onBack();
      }
    } catch (requestError) {
      setFormError(requestError.message || "Unable to create offer.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="flight-markup-panel offer-add-page">
      <header className="flight-markup-toolbar offer-add-page-toolbar">
        <div className="flight-markup-title">
          <h1>
            <strong>Add</strong> Offer
          </h1>
          <div className="flight-markup-title-underline" aria-hidden="true" />
        </div>

        {onBack && (
          <div className="flight-markup-actions">
            <button
              type="button"
              className="flight-markup-action-btn primary offer-add-list-btn"
              onClick={onBack}
            >
              <List size={16} />
              <span>Offer List</span>
            </button>
          </div>
        )}
      </header>

      <section className="menu-form-shell offer-add-shell">
        <form className="offer-add-form" onSubmit={handleSubmit}>
          <div className="offer-add-grid">
            <label className="offer-add-label" htmlFor="offer-name">
              Offer Name (Title) <span aria-hidden="true">*</span>
            </label>
            <div className="offer-add-control">
              <input
                id="offer-name"
                type="text"
                placeholder="Enter offer name"
                value={formValues.title}
                onChange={handleChange("title")}
                required
              />
            </div>

            <label className="offer-add-label" htmlFor="offer-code">
              Offer Code
            </label>
            <div className="offer-add-control">
              <input
                id="offer-code"
                type="text"
                placeholder="e.g. BUS2026"
                value={formValues.offerCode}
                onChange={handleChange("offerCode")}
              />
            </div>

            <label className="offer-add-label" htmlFor="booking-type">
              Booking Type <span aria-hidden="true">*</span>
            </label>
            <div className="offer-add-control">
              <select
                id="booking-type"
                value={formValues.bookingType}
                onChange={handleChange("bookingType")}
                required
              >
                {BOOKING_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <label className="offer-add-label" htmlFor="offer-status">
              Status
            </label>
            <div className="offer-add-control">
              <select
                id="offer-status"
                value={formValues.isActive ? "active" : "inactive"}
                onChange={handleChange("isActive")}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <label className="offer-add-label" htmlFor="coupon-code">
              Linked Coupon <span aria-hidden="true">*</span>
            </label>
            <div className="offer-add-control">
              <select
                id="coupon-code"
                value={formValues.couponId}
                onChange={(event) => {
                  const nextCouponId = event.target.value;
                  const nextCoupon = couponOptions.find(
                    (coupon) => String(coupon.id) === String(nextCouponId)
                  );
                  setFormValues((previous) => ({
                    ...previous,
                    couponId: nextCouponId,
                    couponCode: nextCoupon?.couponCode || "",
                  }));
                }}
                required
              >
                <option value="">Select linked coupon</option>
                {couponOptions.map((coupon) => (
                  <option key={coupon.id} value={coupon.id}>
                    #{coupon.id} - {coupon.couponCode} ({coupon.cpnType})
                  </option>
                ))}
              </select>
              {selectedCoupon ? (
                <small className="offer-add-help">Coupon code resolved as {selectedCoupon.couponCode}</small>
              ) : null}
            </div>

            <label className="offer-add-label" htmlFor="promotion-id">
              Promotion ID
            </label>
            <div className="offer-add-control">
              <input
                id="promotion-id"
                type="number"
                min="1"
                placeholder="e.g. 4"
                value={formValues.promotionId}
                onChange={handleChange("promotionId")}
              />
            </div>

            <label className="offer-add-label" htmlFor="display-order">
              Display Order
            </label>
            <div className="offer-add-control">
              <input
                id="display-order"
                type="number"
                min="0"
                placeholder="e.g. 1"
                value={formValues.displayOrder}
                onChange={handleChange("displayOrder")}
              />
            </div>

            <label className="offer-add-label" htmlFor="coupon-expires">
              Coupon Expires
            </label>
            <div className="offer-add-control">
              <input
                id="coupon-expires"
                type="datetime-local"
                value={formValues.couponExpiresAtUtc}
                onChange={handleChange("couponExpiresAtUtc")}
              />
            </div>

            <label className="offer-add-label" htmlFor="offer-start">
              Offer Starts
            </label>
            <div className="offer-add-control">
              <input
                id="offer-start"
                type="datetime-local"
                value={formValues.startDateUtc}
                onChange={handleChange("startDateUtc")}
              />
            </div>

            <label className="offer-add-label" htmlFor="offer-end">
              Offer Ends
            </label>
            <div className="offer-add-control">
              <input
                id="offer-end"
                type="datetime-local"
                value={formValues.endDateUtc}
                onChange={handleChange("endDateUtc")}
              />
            </div>

            <label className="offer-add-label" htmlFor="base-price">
              Base Price (INR)
            </label>
            <div className="offer-add-control">
              <input
                id="base-price"
                type="number"
                placeholder="e.g. 1000"
                value={formValues.basePrice}
                onChange={handleChange("basePrice")}
              />
            </div>

            <label className="offer-add-label" htmlFor="discount-type">
              Discount Type
            </label>
            <div className="offer-add-control">
              <select
                id="discount-type"
                value={formValues.isPercentageDiscount ? "percentage" : "flat"}
                onChange={(event) =>
                  setFormValues((previous) => ({
                    ...previous,
                    isPercentageDiscount: event.target.value === "percentage",
                  }))
                }
              >
                <option value="flat">Flat Discount</option>
                <option value="percentage">Percentage Discount</option>
              </select>
            </div>

            <label className="offer-add-label" htmlFor="discount-value">
              Discount Value
            </label>
            <div className="offer-add-control">
              <input
                id="discount-value"
                type="number"
                placeholder="e.g. 50 or 500"
                value={formValues.discountValue}
                onChange={handleChange("discountValue")}
              />
            </div>

            <label className="offer-add-label" htmlFor="max-coupon-usage">
              Max Coupon Usage
            </label>
            <div className="offer-add-control">
              <input
                id="max-coupon-usage"
                type="number"
                placeholder="e.g. 500"
                value={formValues.maxCouponUsage}
                onChange={handleChange("maxCouponUsage")}
              />
            </div>

            <label className="offer-add-label" htmlFor="offer-image-file">
              Image Upload
            </label>
            <div className="offer-add-control">
              <input
                id="offer-image-file"
                type="file"
                accept="image/*"
                onChange={(event) => {
                  if (event.target.files && event.target.files[0]) {
                    setSelectedFile(event.target.files[0]);
                  }
                }}
              />
            </div>
          </div>

          <div className="offer-add-section-bar">
            <span>Short Description</span>
          </div>
          <textarea
            className="offer-add-short-textarea"
            placeholder="Write the short description..."
            value={formValues.shortDescription}
            onChange={handleChange("shortDescription")}
          />

          {couponLoadError && <p className="admin-markup-form-error">{couponLoadError}</p>}
          {formError && <p className="admin-markup-form-error">{formError}</p>}
          {saved && <p className="menu-form-success">Offer saved to backend.</p>}

          <div className="admin-markup-modal-actions menu-form-actions offer-add-actions">
            <button type="submit" className="primary" disabled={submitting}>
              {submitting ? "Saving..." : "Submit"}
            </button>
          </div>
        </form>
      </section>
    </section>
  );
}
