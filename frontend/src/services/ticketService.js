import {
  normalizeResponseMessage,
  readResponsePayload,
  toApiUrl,
  withNgrokSkipWarningHeader,
} from "./apiClient";

const TICKET_FETCH_ENDPOINT = "/api/tickets/fetch";

function pickFirst(source, keys, fallback = null) {
  if (!source || typeof source !== "object") return fallback;
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) return source[key];
  }
  return fallback;
}

function getAuthHeaders() {
  if (typeof window === "undefined") return {};
  const token = window.localStorage.getItem("token");
  const userId = window.localStorage.getItem("userId");
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(userId ? { "X-User-Id": userId } : {}),
  };
}

function normalizeSuccess(value) {
  if (typeof value === "boolean") return value;
  return String(value || "").trim().toLowerCase() === "true";
}

function toFareNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function normalizePassenger(passenger, index) {
  const fullName = String(
    pickFirst(passenger, ["fullName", "FullName", "name", "Name"], "") ||
      `Passenger ${index + 1}`
  ).trim();
  const seatNumber = String(
    pickFirst(passenger, ["seatNumber", "SeatNumber", "seat", "Seat", "seatLabel", "SeatLabel"], "") || ""
  ).trim();
  return { ...passenger, fullName, name: fullName, seatNumber, seat: seatNumber };
}

function normalizeFetchedTicket(ticket, request) {
  const bookingType = String(request.bookingType || "").trim().toLowerCase();
  const bookingReference = String(
    pickFirst(ticket, ["bookingReference", "BookingReference", "pnr", "PNR", "reference", "Reference"], "") || ""
  ).trim();
  const departureTimeIst = pickFirst(ticket, ["departureTimeIst", "DepartureTimeIst"], "");
  const arrivalTimeIst = pickFirst(ticket, ["arrivalTimeIst", "ArrivalTimeIst"], "");
  const departureTimeUtc = pickFirst(ticket, ["departureTimeUtc", "DepartureTimeUtc"], "");
  const arrivalTimeUtc = pickFirst(ticket, ["arrivalTimeUtc", "ArrivalTimeUtc"], "");
  const fareValue = pickFirst(
    ticket,
    ["totalPaid", "TotalPaid", "totalFare", "TotalFare", "totalPriceInr", "TotalPriceInr", "customerFareInr", "CustomerFareInr"],
    pickFirst(ticket?.fare, ["totalFare", "TotalFare"], 0)
  );
  const passengers = Array.isArray(ticket?.passengers)
    ? ticket.passengers
    : Array.isArray(ticket?.Passengers)
      ? ticket.Passengers
      : [];

  return {
    ...ticket,
    bookingReference,
    pnr: bookingReference,
    ticketType: String(
      pickFirst(ticket, ["ticketType", "TicketType", "type", "Type"], bookingType) || bookingType
    ).trim().toLowerCase(),
    providerName: String(
      pickFirst(
        ticket,
        ["providerName", "ProviderName", "operatorName", "OperatorName", "operator", "Operator"],
        "Bus Service"
      ) || ""
    ).trim(),
    tripNumber: String(
      pickFirst(
        ticket,
        ["tripNumber", "TripNumber", "busNumber", "BusNumber", "busNo", "BusNo"],
        "--"
      ) || "--"
    ).trim(),
    fromCity: String(
      pickFirst(ticket, ["fromCity", "FromCity", "source", "Source"], "--") || "--"
    ).trim(),
    toCity: String(
      pickFirst(ticket, ["toCity", "ToCity", "destination", "Destination"], "--") || "--"
    ).trim(),
    departureTime: pickFirst(
      ticket,
      ["departureTimeIst", "DepartureTimeIst", "departureTime", "DepartureTime", "departureDateTime", "DepartureDateTime", "departureTimeUtc", "DepartureTimeUtc"],
      ""
    ),
    arrivalTime: pickFirst(
      ticket,
      ["arrivalTimeIst", "ArrivalTimeIst", "arrivalTime", "ArrivalTime", "arrivalDateTime", "ArrivalDateTime", "arrivalTimeUtc", "ArrivalTimeUtc"],
      ""
    ),
    departureTimeIst,
    arrivalTimeIst,
    departureTimeUtc,
    arrivalTimeUtc,
    busType: String(
      pickFirst(ticket, ["busType", "BusType", "travelClass", "TravelClass", "className", "ClassName"], "") || ""
    ).trim(),
    boardingPoint: pickFirst(
      ticket,
      ["boardingPoint", "BoardingPoint", "boarding", "Boarding"],
      ticket?.boardingPoint
    ),
    droppingPoint: pickFirst(
      ticket,
      ["droppingPoint", "DroppingPoint", "arrivalPlace", "ArrivalPlace", "dropping", "Dropping"],
      ticket?.droppingPoint
    ),
    status: String(pickFirst(ticket, ["status", "Status"], "Booked") || "Booked"),
    passengers: passengers.map(normalizePassenger),
    contact: {
      ...(ticket.contact && typeof ticket.contact === "object" ? ticket.contact : {}),
      ...(ticket.Contact && typeof ticket.Contact === "object" ? ticket.Contact : {}),
      mobile: request.mobile,
      email: request.email,
    },
    fare: {
      ...(ticket.fare && typeof ticket.fare === "object" ? ticket.fare : {}),
      totalFare: toFareNumber(fareValue),
    },
    totalFare: toFareNumber(fareValue),
    totalPaid: toFareNumber(fareValue),
    fetchVerified: true,
  };
}

// Returns ALL tickets normalized (not just one)
export async function fetchTicketByContact({ mobile, email, bookingType, activeOnly = true }) {
  const request = {
    mobile: String(mobile || "").trim(),
    email: String(email || "").trim(),
    bookingType: String(bookingType || "").trim().toLowerCase(),
    activeOnly: activeOnly !== false,
  };

  const response = await fetch(toApiUrl(TICKET_FETCH_ENDPOINT), {
    method: "POST",
    headers: withNgrokSkipWarningHeader(TICKET_FETCH_ENDPOINT, {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    }),
    body: JSON.stringify(request),
  });

  const payload = await readResponsePayload(response);

  if (!response.ok) {
    throw new Error(normalizeResponseMessage(payload, "Unable to fetch booking."));
  }

  const hasSuccessField =
    payload && typeof payload === "object" && ("success" in payload || "Success" in payload);
  const successValue = pickFirst(payload, ["success", "Success"], false);

  if (hasSuccessField && !normalizeSuccess(successValue)) {
    throw new Error(normalizeResponseMessage(payload, "No active booking found"));
  }

  // Handle array response (your backend returns "tickets": [...])
  const ticketsArray = pickFirst(payload, ["tickets", "Tickets"], null);
  const singleTicket = pickFirst(payload, ["ticket", "Ticket", "data", "Data"], null);

  if (Array.isArray(ticketsArray) && ticketsArray.length > 0) {
    // Return ALL tickets normalized
    return ticketsArray.map((t) => normalizeFetchedTicket(t, request));
  }

  if (singleTicket && typeof singleTicket === "object") {
    return [normalizeFetchedTicket(singleTicket, request)];
  }

  throw new Error("No active booking found");
}

