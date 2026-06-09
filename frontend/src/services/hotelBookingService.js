import { toAuthUrl, readApiMessage } from "./authService";

function normalizePayload(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.Data)) {
    return payload.Data;
  }

  if (Array.isArray(payload?.hotels)) {
    return payload.hotels;
  }

  return [];
}

async function requestHotelJson(urlOrPath, options = {}, fallbackMessage = "Hotel request failed.") {
  const token = window.localStorage.getItem("token");
  const resolvedUrl = toAuthUrl(urlOrPath);
  const headers = {
    Accept: "application/json, text/plain, */*",
    ...(options.headers || {}),
  };

  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const parsed = new URL(resolvedUrl, window.location.origin);
    if (parsed.hostname.includes("ngrok-free.dev") || parsed.hostname.includes("ngrok.io")) {
      headers["ngrok-skip-browser-warning"] = "true";
    }
  } catch {
    // Keep the request usable for relative URLs.
  }

  const response = await fetch(resolvedUrl, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new Error(readApiMessage(payload, fallbackMessage) || fallbackMessage);
  }

  return payload;
}

export async function searchHotelOffers({ cityCode, checkInDate, checkOutDate, adults = 1, rooms = 1 }) {
  const params = new URLSearchParams({
    cityCode,
    checkInDate,
    checkOutDate,
    adults: String(Math.max(1, Number(adults) || 1)),
    rooms: String(Math.max(1, Number(rooms) || 1)),
  });

  const payload = await requestHotelJson(
    `/api/hotels/search?${params.toString()}`,
    { method: "GET" },
    "Unable to search hotels."
  );

  return normalizePayload(payload);
}

export async function getHotelOfferDetails(offerId) {
  return requestHotelJson(
    `/api/hotels/offers/${encodeURIComponent(offerId)}`,
    { method: "GET" },
    "Selected hotel offer is no longer available."
  );
}

export async function bookHotelOffer({ offerId, guestName, guestEmail, guestPhone }) {
  return requestHotelJson(
    "/api/hotels/book",
    {
      method: "POST",
      body: JSON.stringify({
        offerId,
        guestName,
        guestEmail,
        guestPhone,
      }),
    },
    "Hotel booking failed."
  );
}

export async function getMyHotelBookings() {
  const payload = await requestHotelJson(
    "/api/hotels/my-bookings",
    { method: "GET" },
    "Unable to load hotel bookings."
  );

  return normalizePayload(payload);
}

export async function cancelHotelBooking(bookingId, reason = "") {
  const query = reason ? `?reason=${encodeURIComponent(reason)}` : "";
  return requestHotelJson(
    `/api/hotels/bookings/${encodeURIComponent(bookingId)}/cancel${query}`,
    { method: "POST" },
    "Unable to cancel hotel booking."
  );
}
