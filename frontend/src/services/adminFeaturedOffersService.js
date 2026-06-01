import axios from "axios";
import { toApiUrl, withNgrokSkipWarningHeader } from "./apiClient";

const PUBLIC_FEATURED_OFFERS_PATHS = [
  "/api/FeaturedOffers",
  "/api/FeaturedOffers/active",
];

function buildActiveOffersPaths(bookingType) {
  const encodedBookingType = encodeURIComponent(String(bookingType || "").trim());
  const query = encodedBookingType ? `?bookingType=${encodedBookingType}` : "";

  return [
    `/api/offers/active${query}`,
    `/api/FeaturedOffers/active${query}`,
    "/api/FeaturedOffers",
  ];
}

const offersApi = axios.create({
  headers: {
    Accept: "application/json",
  },
});

offersApi.interceptors.request.use((config) => {
  const originalUrl = config.url || "";
  const token = getStoredAdminToken();

  return {
    ...config,
    url: toApiUrl(originalUrl),
    headers: withNgrokSkipWarningHeader(originalUrl, {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(config.headers || {}),
    }),
  };
});

function getStoredAdminToken() {
  if (typeof window === "undefined") {
    return "";
  }

  return (
    window.localStorage.getItem("adminToken") ||
    window.localStorage.getItem("authToken") ||
    window.localStorage.getItem("token") ||
    ""
  );
}

function shouldTryNextPublicEndpoint(error) {
  const status = error?.response?.status;
  return status === 401 || status === 403 || status === 404 || status === 405;
}

export async function getPublicFeaturedOffers() {
  for (const path of PUBLIC_FEATURED_OFFERS_PATHS) {
    try {
      const response = await offersApi.get(path);
      return response.data;
    } catch (error) {
      if (!shouldTryNextPublicEndpoint(error)) {
        throw error;
      }
    }
  }

  const token = getStoredAdminToken();
  if (!token) {
    return [];
  }

  const response = await offersApi.get("/api/AdminFeaturedOffers", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}

export async function getActiveOffers(bookingType = "Bus") {
  for (const path of buildActiveOffersPaths(bookingType)) {
    try {
      const response = await offersApi.get(path);
      return response.data;
    } catch (error) {
      if (!shouldTryNextPublicEndpoint(error)) {
        throw error;
      }
    }
  }

  return getPublicFeaturedOffers();
}

export async function getAdminFeaturedOffers() {
  const response = await offersApi.get("/api/AdminFeaturedOffers");
  return response.data;
}

export async function getAdminFeaturedOfferById(id) {
  const response = await offersApi.get(`/api/AdminFeaturedOffers/${id}`);
  return response.data;
}

export async function createAdminFeaturedOffer(formData) {
  const response = await offersApi.post("/api/AdminFeaturedOffers", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

export async function updateAdminFeaturedOffer(id, formData) {
  const response = await offersApi.put(`/api/AdminFeaturedOffers/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

export async function deleteAdminFeaturedOffer(id) {
  const response = await offersApi.delete(`/api/AdminFeaturedOffers/${id}`);
  return response.data;
}

export async function getOfferConditions(offerId) {
  const response = await offersApi.get(`/api/AdminFeaturedOffers/${offerId}/conditions`);
  return response.data;
}

export async function addOfferCondition(offerId, data) {
  const response = await offersApi.post(`/api/AdminFeaturedOffers/${offerId}/conditions`, data);
  return response.data;
}

export async function updateOfferCondition(offerId, conditionId, data) {
  const response = await offersApi.put(
    `/api/AdminFeaturedOffers/${offerId}/conditions/${conditionId}`,
    data
  );
  return response.data;
}

export async function deleteOfferCondition(offerId, conditionId) {
  const response = await offersApi.delete(
    `/api/AdminFeaturedOffers/${offerId}/conditions/${conditionId}`
  );
  return response.data;
}

export default offersApi;