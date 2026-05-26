const FALLBACK_API_BASE_URL =
  "https://undogmatically-knotlike-evita.ngrok-free.dev";
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);
const DEFAULT_FLIGHT_USER_ID =
  process.env.REACT_APP_FLIGHT_USER_ID ||
  process.env.REACT_APP_DEFAULT_USER_ID ||
  "user_123";

function isLocalDevelopment() {
  if (process.env.NODE_ENV !== "development") {
    return false;
  }

  if (typeof window === "undefined") {
    return false;
  }

  return LOCAL_HOSTNAMES.has(window.location.hostname);
}

function resolveApiBaseUrl() {
  const preferProxyInDev =
    isLocalDevelopment() &&
    String(process.env.REACT_APP_USE_DIRECT_API_IN_DEV || "").toLowerCase() !==
      "true";

  if (preferProxyInDev) {
    return "";
  }

  const explicitBase =
    process.env.REACT_APP_API_BASE_URL ||
    process.env.REACT_APP_FLIGHT_API_BASE_URL;

  if (explicitBase && explicitBase.trim()) {
    return explicitBase.trim();
  }

  // Reuse the Places API host when present, so all APIs stay on the same backend.
  const placesUrl = process.env.REACT_APP_PLACES_API_URL;
  if (placesUrl && placesUrl.trim()) {
    try {
      return new URL(placesUrl.trim()).origin;
    } catch {
      // Fall through to default.
    }
  }

  return FALLBACK_API_BASE_URL;
}

const API_BASE_URL = resolveApiBaseUrl();

const FLIGHT_BOOKINGS_ROOT = "/api/FlightBookings";
const ADMIN_FLIGHT_ROOT = "/api/admin/flight";

const FALLBACK_FLIGHT_TEMPLATES = [
  {
    airline: "IndiGo",
    flightNumber: "6E 6782",
    departureOffsetMinutes: 60,
    durationMinutes: 115,
    classOptions: [
      { travelClass: "Economy", priceInr: 4820, availableSeats: 18, totalSeats: 120 },
      { travelClass: "Business", priceInr: 10340, availableSeats: 7, totalSeats: 18 },
    ],
  },
  {
    airline: "Air India",
    flightNumber: "AI 502",
    departureOffsetMinutes: 120,
    durationMinutes: 130,
    classOptions: [
      { travelClass: "Economy", priceInr: 5390, availableSeats: 14, totalSeats: 128 },
      { travelClass: "Premium Economy", priceInr: 7280, availableSeats: 9, totalSeats: 24 },
      { travelClass: "Business", priceInr: 11920, availableSeats: 4, totalSeats: 16 },
    ],
  },
  {
    airline: "Akasa Air",
    flightNumber: "QP 1456",
    departureOffsetMinutes: 175,
    durationMinutes: 125,
    classOptions: [
      { travelClass: "Economy", priceInr: 4540, availableSeats: 22, totalSeats: 140 },
      { travelClass: "Premium Economy", priceInr: 6920, availableSeats: 8, totalSeats: 22 },
    ],
  },
  {
    airline: "Air India Express",
    flightNumber: "IX 912",
    departureOffsetMinutes: 230,
    durationMinutes: 140,
    classOptions: [
      { travelClass: "Economy", priceInr: 4180, availableSeats: 26, totalSeats: 132 },
      { travelClass: "Business", priceInr: 10890, availableSeats: 5, totalSeats: 14 },
    ],
  },
];

function toAbsoluteUrl(urlOrPath) {
  if (/^https?:\/\//i.test(urlOrPath)) {
    return urlOrPath;
  }

  if (API_BASE_URL) {
    return `${API_BASE_URL.replace(/\/+$/, "")}/${urlOrPath.replace(/^\/+/, "")}`;
  }

  return urlOrPath;
}

function shouldUseNgrokBypass(urlOrPath) {
  try {
    const parsed = new URL(toAbsoluteUrl(urlOrPath), window.location.origin);
    return (
      parsed.hostname.includes("ngrok-free.dev") ||
      parsed.hostname.includes("ngrok.io")
    );
  } catch {
    return false;
  }
}

function buildUrl(path, query = {}) {
  const base = toAbsoluteUrl(path);
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    const normalizedValue =
      typeof value === "string" ? value.trim() : String(value);

    if (normalizedValue) {
      params.set(key, normalizedValue);
    }
  });

  return params.toString() ? `${base}?${params.toString()}` : base;
}

function parseDateStart(dateText) {
  const [year, month, day] = String(dateText || "")
    .split("-")
    .map((part) => Number(part));

  if (!year || !month || !day) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 6, 0, 0, 0);
  }

  return new Date(year, month - 1, day, 6, 0, 0, 0);
}

function formatIso(date) {
  const value = date instanceof Date ? date : new Date(date || "");
  return Number.isNaN(value.getTime()) ? null : value.toISOString();
}

function buildFallbackFlights({ from, to, date }) {
  const source = String(from || "").trim() || "Hyderabad";
  const destination = String(to || "").trim() || "Bengaluru";
  const dateStart = parseDateStart(date);

  return FALLBACK_FLIGHT_TEMPLATES.map((template, index) => {
    const departureDate = new Date(
      dateStart.getTime() + template.departureOffsetMinutes * 60000
    );
    const arrivalDate = new Date(
      departureDate.getTime() + template.durationMinutes * 60000
    );
    const totalAvailableSeats = template.classOptions.reduce(
      (sum, option) => sum + Number(option.availableSeats || 0),
      0
    );

    return {
      id: `fallback-flight-${index + 1}`,
      airline: template.airline,
      flightNumber: template.flightNumber,
      fromCity: source,
      toCity: destination,
      departureTimeIst: formatIso(departureDate),
      arrivalTimeIst: formatIso(arrivalDate),
      departureTimeUtc: formatIso(departureDate),
      arrivalTimeUtc: formatIso(arrivalDate),
      classOptions: template.classOptions,
      selectedTravelClass: template.classOptions[0].travelClass,
      selectedTravelClassPriceInr: template.classOptions[0].priceInr,
      selectedTravelClassAvailableSeats: template.classOptions[0].availableSeats,
      selectedTravelClassTotalSeats: template.classOptions[0].totalSeats,
      supportedTravelClasses: template.classOptions.map((option) => option.travelClass),
      totalAvailableSeats,
      totalSeats: totalAvailableSeats,
      isFallback: true,
    };
  });
}

function shouldUseFallbackFlights(error) {
  const message = String(error?.message || "").toLowerCase();

  if (!message) {
    return false;
  }

  return (
    message.includes("cannot get /api/flightbookings") ||
    message.includes("err_ngrok_3200") ||
    (message.includes("endpoint") && message.includes("offline")) ||
    message.includes("failed to fetch") ||
    message.includes("networkerror")
  );
}

function pickFirst(source, keys, fallback = null) {
  if (!source || typeof source !== "object") {
    return fallback;
  }

  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) {
      return source[key];
    }
  }

  return fallback;
}

function normalizeText(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function decodeJwtPayload(token) {
  const rawToken = normalizeText(token, "");
  if (!rawToken) {
    return {};
  }

  const parts = rawToken.split(".");
  if (parts.length < 2) {
    return {};
  }

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const payload = atob(padded);
    return JSON.parse(payload) || {};
  } catch {
    return {};
  }
}

function resolveUserIdFromTokenPayload(tokenPayload) {
  return normalizeText(
    pickFirst(
      tokenPayload,
      [
        "userId",
        "UserId",
        "uid",
        "Uid",
        "id",
        "Id",
        "sub",
        "nameid",
        "user_id",
        "preferred_username",
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier",
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/sid",
        "http://schemas.microsoft.com/ws/2008/06/identity/claims/primarysid",
        "email",
        "upn",
        "unique_name",
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
      ],
      ""
    ),
    ""
  );
}

function resolveAuthToken() {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    return normalizeText(window.localStorage.getItem("token"), "");
  } catch {
    return "";
  }
}

function resolveCurrentUserId(explicitUserId) {
  const directValue = normalizeText(explicitUserId, "");
  if (directValue) {
    return directValue;
  }

  if (typeof window === "undefined") {
    return "";
  }

  let rawUser = "";
  let rawToken = "";
  let explicitStoredUserId = "";

  try {
    rawUser = window.localStorage.getItem("user") || "";
    rawToken = window.localStorage.getItem("token") || "";
    explicitStoredUserId =
      window.localStorage.getItem("userId") ||
      window.localStorage.getItem("UserId") ||
      "";
  } catch {
    return "";
  }

  const tokenPayload = decodeJwtPayload(rawToken);
  const tokenUserId = resolveUserIdFromTokenPayload(tokenPayload);

  if (!rawUser) {
    return normalizeText(explicitStoredUserId || tokenUserId, "");
  }

  let parsed = {};

  try {
    parsed = JSON.parse(rawUser) || {};
  } catch {
    return normalizeText(explicitStoredUserId || tokenUserId, "");
  }

  const nestedUser = pickFirst(parsed, ["user", "User"], {});
  const profileUserId = normalizeText(
    pickFirst(
      parsed,
      ["userId", "UserId", "id", "Id", "uid", "Uid", "userID", "UserID"],
      ""
    ),
    ""
  );
  const nestedProfileUserId = normalizeText(
    pickFirst(
      nestedUser,
      ["userId", "UserId", "id", "Id", "uid", "Uid", "userID", "UserID"],
      ""
    ),
    ""
  );
  const emailFallback = normalizeText(
    pickFirst(parsed, ["email", "Email"], "") ||
      pickFirst(
        tokenPayload,
        ["email", "upn", "unique_name", "preferred_username"],
        ""
      ),
    ""
  );

  const resolved = normalizeText(
    profileUserId ||
      nestedProfileUserId ||
      explicitStoredUserId ||
      tokenUserId ||
      emailFallback,
    ""
  );

  if (!resolved) {
    return "";
  }

  try {
    window.localStorage.setItem("userId", resolved);

    if (!profileUserId && parsed && typeof parsed === "object") {
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          ...parsed,
          userId: resolved,
        })
      );
    }
  } catch {
    // Ignore storage update failures.
  }

  return resolved;
}

function resolveRequiredUserId(userId) {
  const resolved = resolveCurrentUserId(userId) || DEFAULT_FLIGHT_USER_ID;
  if (!resolved) {
    throw new Error("X-User-Id header is required. Please sign in again.");
  }

  return resolved;
}

function normalizeFlightClassOption(option) {
  const travelClass = String(
    pickFirst(option, ["travelClass", "TravelClass"], "")
  ).trim();

  return {
    travelClass,
    priceInr: Number(pickFirst(option, ["priceInr", "PriceInr"], 0)) || 0,
    availableSeats:
      Number(pickFirst(option, ["availableSeats", "AvailableSeats"], 0)) || 0,
    totalSeats: Number(pickFirst(option, ["totalSeats", "TotalSeats"], 0)) || 0,
  };
}

function normalizeFlightSearchRecord(record, index = 0) {
  const classOptionsRaw = pickFirst(
    record,
    ["classOptions", "ClassOptions", "travelClassOptions", "TravelClassOptions"],
    []
  );
  const classOptions = Array.isArray(classOptionsRaw)
    ? classOptionsRaw
        .map((option) => normalizeFlightClassOption(option))
        .filter((option) => option.travelClass)
    : [];
  const selectedTravelClass = String(
    pickFirst(
      record,
      ["selectedTravelClass", "SelectedTravelClass", "travelClass", "TravelClass"],
      classOptions[0]?.travelClass || ""
    ) || ""
  ).trim();

  const selectedOption =
    classOptions.find((option) => option.travelClass === selectedTravelClass) ||
    classOptions[0] ||
    null;

  const seatsFromOptions = classOptions.reduce(
    (sum, option) => sum + Number(option.availableSeats || 0),
    0
  );

  const supportedTravelClassesRaw = pickFirst(
    record,
    ["supportedTravelClasses", "SupportedTravelClasses"],
    []
  );
  const supportedTravelClasses = Array.isArray(supportedTravelClassesRaw)
    ? supportedTravelClassesRaw.map((value) => String(value || "").trim()).filter(Boolean)
    : classOptions.map((option) => option.travelClass);

  return {
    id:
      pickFirst(record, ["id", "Id", "flightId", "FlightId"], null) ||
      `flight-${index + 1}`,
    airline: String(
      pickFirst(
        record,
        ["airline", "Airline", "airlineName", "AirlineName", "providerName", "ProviderName"],
        "Unknown Airline"
      ) || "Unknown Airline"
    ),
    flightNumber: String(
      pickFirst(record, ["flightNumber", "FlightNumber", "tripNumber", "TripNumber"], "--") ||
        "--"
    ),
    cabinClass: String(pickFirst(record, ["cabinClass", "CabinClass"], "") || ""),
    fromCity: String(pickFirst(record, ["fromCity", "FromCity", "source", "Source"], "") || ""),
    toCity: String(
      pickFirst(record, ["toCity", "ToCity", "destination", "Destination"], "") || ""
    ),
    departureTimeIst: pickFirst(
      record,
      ["departureTimeIst", "DepartureTimeIst", "departureDateTimeIst", "DepartureDateTimeIst"],
      null
    ),
    arrivalTimeIst: pickFirst(
      record,
      ["arrivalTimeIst", "ArrivalTimeIst", "arrivalDateTimeIst", "ArrivalDateTimeIst"],
      null
    ),
    departureTimeUtc: pickFirst(
      record,
      ["departureTimeUtc", "DepartureTimeUtc", "departureDateTimeUtc", "DepartureDateTimeUtc"],
      null
    ),
    arrivalTimeUtc: pickFirst(
      record,
      ["arrivalTimeUtc", "ArrivalTimeUtc", "arrivalDateTimeUtc", "ArrivalDateTimeUtc"],
      null
    ),
    classOptions,
    selectedTravelClass:
      selectedTravelClass || selectedOption?.travelClass || "Economy",
    selectedTravelClassPriceInr:
      Number(
        pickFirst(record, ["selectedTravelClassPriceInr", "SelectedTravelClassPriceInr"], null)
      ) ||
      Number(selectedOption?.priceInr || 0),
    selectedTravelClassAvailableSeats:
      Number(
        pickFirst(
          record,
          ["selectedTravelClassAvailableSeats", "SelectedTravelClassAvailableSeats"],
          null
        )
      ) ||
      Number(selectedOption?.availableSeats || 0),
    selectedTravelClassTotalSeats:
      Number(
        pickFirst(
          record,
          ["selectedTravelClassTotalSeats", "SelectedTravelClassTotalSeats"],
          null
        )
      ) ||
      Number(selectedOption?.totalSeats || 0),
    totalAvailableSeats:
      Number(pickFirst(record, ["totalAvailableSeats", "TotalAvailableSeats"], null)) ||
      seatsFromOptions,
    totalSeats:
      Number(pickFirst(record, ["totalSeats", "TotalSeats"], null)) ||
      Number(pickFirst(record, ["totalAvailableSeats", "TotalAvailableSeats"], null)) ||
      seatsFromOptions,
    supportedTravelClasses,
  };
}

function normalizeFlightPassenger(passenger, index = 0) {
  return {
    fullName: String(
      pickFirst(passenger, ["fullName", "FullName", "name", "Name"], `Passenger ${index + 1}`)
    ),
    passengerType: String(
      pickFirst(passenger, ["passengerType", "PassengerType"], "Adult")
    ),
    gender: String(pickFirst(passenger, ["gender", "Gender"], "")),
    seatNumber: pickFirst(passenger, ["seatNumber", "SeatNumber"], null),
  };
}

function normalizeFlightBookingRecord(record) {
  const passengersRaw = pickFirst(record, ["passengers", "Passengers"], []);
  const passengers = Array.isArray(passengersRaw)
    ? passengersRaw.map((passenger, index) => normalizeFlightPassenger(passenger, index))
    : [];
  const seatsBookedFallback = passengers.filter(
    (passenger) => String(passenger.passengerType || "").toLowerCase() !== "infant"
  ).length;

  return {
    bookingId: pickFirst(record, ["bookingId", "BookingId"], null),
    bookingReference: String(
      pickFirst(record, ["bookingReference", "BookingReference"], "") || ""
    ),
    passengerName: String(
      pickFirst(record, ["passengerName", "PassengerName"], "") || ""
    ),
    passengerPhone: String(
      pickFirst(record, ["passengerPhone", "PassengerPhone"], "") || ""
    ),
    passengerEmail: String(
      pickFirst(record, ["passengerEmail", "PassengerEmail"], "") || ""
    ),
    fromCity: String(pickFirst(record, ["fromCity", "FromCity"], "") || ""),
    toCity: String(pickFirst(record, ["toCity", "ToCity"], "") || ""),
    providerName: String(
      pickFirst(record, ["providerName", "ProviderName", "airline", "Airline"], "") || ""
    ),
    departureTimeUtc: pickFirst(
      record,
      ["departureTimeUtc", "DepartureTimeUtc", "departureDateTimeUtc", "DepartureDateTimeUtc"],
      null
    ),
    travelClass: String(
      pickFirst(record, ["travelClass", "TravelClass"], "") || ""
    ),
    seatsBooked:
      Number(pickFirst(record, ["seatsBooked", "SeatsBooked"], null)) ||
      seatsBookedFallback,
    totalPriceInr:
      Number(pickFirst(record, ["totalPriceInr", "TotalPriceInr"], 0)) || 0,
    status: String(pickFirst(record, ["status", "Status"], "Unknown") || "Unknown"),
    bookedAtUtc: pickFirst(record, ["bookedAtUtc", "BookedAtUtc"], null),
    cancelledAtUtc: pickFirst(record, ["cancelledAtUtc", "CancelledAtUtc"], null),
    cancellationReason: String(
      pickFirst(record, ["cancellationReason", "CancellationReason"], "") || ""
    ),
    tripNumber: String(
      pickFirst(record, ["tripNumber", "TripNumber", "flightNumber", "FlightNumber"], "") ||
        ""
    ),
    passengers,
  };
}

function normalizeFlightCouponRecord(record) {
  const couponType = String(
    pickFirst(record, ["couponType", "CouponType", "cpnType", "CpnType"], "") || ""
  );
  const status = String(pickFirst(record, ["status", "Status"], "") || "")
    .trim()
    .toLowerCase();

  return {
    id: pickFirst(record, ["id", "Id"], null),
    value: Number(pickFirst(record, ["value", "Value"], 0)) || 0,
    couponType,
    cpnType: couponType,
    couponCode: String(
      pickFirst(record, ["couponCode", "CouponCode"], "") || ""
    ).toUpperCase(),
    startDate: String(pickFirst(record, ["startDate", "StartDate"], "") || ""),
    expiryDate: String(pickFirst(record, ["expiryDate", "ExpiryDate"], "") || ""),
    useLimit: Number(pickFirst(record, ["useLimit", "UseLimit"], 0)) || 0,
    usedCount: Number(pickFirst(record, ["usedCount", "UsedCount"], 0)) || 0,
    status,
    entryDate: pickFirst(
      record,
      ["entryDate", "EntryDate", "entryDateUtc", "EntryDateUtc", "insertDateUtc", "InsertDateUtc"],
      null
    ),
    remark: String(pickFirst(record, ["remark", "Remark"], "") || ""),
  };
}

function toCouponRequestDate(value) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }

  const parsed = new Date(value || "");
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

function toFlightCouponRequestPayload(coupon) {
  return {
    value: Number(pickFirst(coupon, ["value", "Value"], 0)) || 0,
    couponType: String(
      pickFirst(coupon, ["couponType", "CouponType", "cpnType", "CpnType"], "") || ""
    ).trim(),
    couponCode: String(pickFirst(coupon, ["couponCode", "CouponCode"], "") || "")
      .trim()
      .toUpperCase(),
    startDate: toCouponRequestDate(pickFirst(coupon, ["startDate", "StartDate"], "")),
    expiryDate: toCouponRequestDate(pickFirst(coupon, ["expiryDate", "ExpiryDate"], "")),
    useLimit: Number(pickFirst(coupon, ["useLimit", "UseLimit"], 0)) || 0,
    status: String(pickFirst(coupon, ["status", "Status"], "active") || "active").trim(),
    remark: String(pickFirst(coupon, ["remark", "Remark"], "") || "").trim(),
  };
}

function normalizeFlightActionResponse(response) {
  if (!response || typeof response !== "object") {
    return response;
  }

  return {
    ...response,
    bookingId: pickFirst(response, ["bookingId", "BookingId"], response.bookingId),
    bookingReference: pickFirst(
      response,
      ["bookingReference", "BookingReference"],
      response.bookingReference
    ),
    status: pickFirst(response, ["status", "Status"], response.status),
    message: pickFirst(response, ["message", "Message"], response.message),
  };
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text;
}

function normalizeErrorMessage(payload) {
  if (typeof payload === "string") {
    const text = payload.trim();
    if (!text) {
      return "";
    }

    // ngrok / express error pages may return HTML with a <pre> message.
    const preMatch = text.match(/<pre>(.*?)<\/pre>/i);
    if (preMatch?.[1]) {
      return preMatch[1].replace(/\s+/g, " ").trim();
    }

    const noTags = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    if (noTags) {
      return noTags;
    }

    return text;
  }

  if (payload && typeof payload?.message === "string") {
    return payload.message.trim();
  }

  return "";
}

async function requestJson(urlOrPath, options = {}) {
  const { userId, requireUserId, ...fetchOptions } = options;
  const resolvedUserId = requireUserId
    ? resolveRequiredUserId(userId)
    : resolveCurrentUserId(userId);
  const resolvedToken = resolveAuthToken();
  const headers = {
    Accept: "application/json",
    ...(resolvedUserId ? { "X-User-Id": resolvedUserId } : {}),
    ...(resolvedToken && !options?.headers?.Authorization
      ? { Authorization: `Bearer ${resolvedToken}` }
      : {}),
    ...(options.headers || {}),
  };

  if (fetchOptions.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (shouldUseNgrokBypass(urlOrPath)) {
    headers["ngrok-skip-browser-warning"] = "true";
  }

  const response = await fetch(toAbsoluteUrl(urlOrPath), {
    ...fetchOptions,
    headers,
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    const normalizedMessage = normalizeErrorMessage(payload);
    if (normalizedMessage) {
      throw new Error(normalizedMessage);
    }

    throw new Error("Request failed. Please try again.");
  }

  return payload;
}

export async function searchFlights({ from, to, date, travelClass }) {
  const url = buildUrl(FLIGHT_BOOKINGS_ROOT, {
    from,
    fromCity: from,
    to,
    toCity: to,
    date,
    class: travelClass,
    travelClass,
  });

  try {
    const data = await requestJson(url, { method: "GET" });

    if (Array.isArray(data)) {
      return data.map((record, index) => normalizeFlightSearchRecord(record, index));
    }

    const responseText = String(data || "").toLowerCase();
    if (
      responseText.includes("<!doctype html") ||
      responseText.includes("<html") ||
      responseText.includes("cannot get /api/flightbookings")
    ) {
      return buildFallbackFlights({ from, to, date });
    }

    return [];
  } catch (error) {
    if (shouldUseFallbackFlights(error)) {
      return buildFallbackFlights({ from, to, date });
    }

    throw error;
  }
}

export async function bookFlight({ flightId, payload, userId } = {}) {
  const data = await requestJson(`${FLIGHT_BOOKINGS_ROOT}/${flightId}/book`, {
    method: "POST",
    body: JSON.stringify(payload),
    userId,
    requireUserId: true,
  });

  return normalizeFlightActionResponse(data);
}

export async function listFlightCoupons() {
  const data = await requestJson(`${ADMIN_FLIGHT_ROOT}/coupons`, { method: "GET" });

  return Array.isArray(data)
    ? data.map((record) => normalizeFlightCouponRecord(record))
    : [];
}

export async function createFlightCoupon(coupon) {
  const data = await requestJson(`${ADMIN_FLIGHT_ROOT}/coupons`, {
    method: "POST",
    body: JSON.stringify(toFlightCouponRequestPayload(coupon)),
  });

  return normalizeFlightCouponRecord(data);
}

export async function updateFlightCoupon(couponId, coupon) {
  const data = await requestJson(`${ADMIN_FLIGHT_ROOT}/coupons/${couponId}`, {
    method: "PUT",
    body: JSON.stringify(toFlightCouponRequestPayload(coupon)),
  });

  return normalizeFlightCouponRecord(data);
}

export async function deleteFlightCoupon(couponId) {
  return requestJson(`${ADMIN_FLIGHT_ROOT}/coupons/${couponId}`, {
    method: "DELETE",
  });
}

export async function listFlightBookings({ passengerPhone, status, userId } = {}) {
  const url = buildUrl(`${FLIGHT_BOOKINGS_ROOT}/bookings`, {
    passengerPhone,
    status,
  });

  try {
    const data = await requestJson(url, { method: "GET", userId, requireUserId: true });
    return Array.isArray(data)
      ? data.map((record) => normalizeFlightBookingRecord(record))
      : [];
  } catch (error) {
    if (shouldUseFallbackFlights(error)) {
      return [];
    }

    throw error;
  }
}

export async function getFlightBookingById(bookingId, { userId } = {}) {
  const data = await requestJson(`${FLIGHT_BOOKINGS_ROOT}/bookings/${bookingId}`, {
    method: "GET",
    userId,
    requireUserId: true,
  });

  return normalizeFlightBookingRecord(data);
}

export async function cancelFlightBooking(bookingId, reason, { userId } = {}) {
  const url = buildUrl(`${FLIGHT_BOOKINGS_ROOT}/bookings/${bookingId}/cancel`, {
    reason,
  });

  const data = await requestJson(url, { method: "POST", userId, requireUserId: true });
  return normalizeFlightActionResponse(data);
}

export async function listHotFlightRoutes({ metric = "score" } = {}) {
  const url = buildUrl(`${FLIGHT_BOOKINGS_ROOT}/hot-routes`, { metric });
  const data = await requestJson(url, { method: "GET" });

  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((record, index) => ({
    routeId:
      pickFirst(record, ["routeId", "RouteId"], null) || `flight-hot-${index + 1}`,
    fromCity: String(
      pickFirst(record, ["fromCity", "FromCity", "source", "Source"], "") || ""
    ),
    toCity: String(
      pickFirst(record, ["toCity", "ToCity", "destination", "Destination"], "") || ""
    ),
    score: Number(pickFirst(record, ["score", "Score"], 0)) || 0,
    searchCount: Number(pickFirst(record, ["searchCount", "SearchCount"], 0)) || 0,
    bookingCount:
      Number(pickFirst(record, ["bookingCount", "BookingCount"], 0)) || 0,
    ...record,
  }));
}

export async function getFlightSeatMap(flightId, travelClass, { userId } = {}) {
  const url = buildUrl(`${FLIGHT_BOOKINGS_ROOT}/${flightId}/seats`, {
    travelClass,
  });

  return requestJson(url, { method: "GET", userId });
}
