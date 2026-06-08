import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeftRight,
  BedDouble,
  Building2,
  Bus,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MessageSquareText,
  Minus,
  MapPin,
  Plane,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from "lucide-react";
import travelServiceRoute from "../../assets/images/illustrations/travel-service-route.png";
import travelServiceFares from "../../assets/images/illustrations/travel-service-fares.png";
import travelServiceTraveller from "../../assets/images/illustrations/travel-service-traveller.png";
import flightServiceRoute from "../../assets/images/illustrations/flight-service-route.svg";
import flightServiceFares from "../../assets/images/illustrations/flight-service-fares.svg";
import flightServiceTraveller from "../../assets/images/illustrations/flight-service-traveller.svg";
import hotelServiceSearch from "../../assets/images/illustrations/hotel-service-search.svg";
import hotelServiceRooms from "../../assets/images/illustrations/hotel-service-rooms.svg";
import hotelServiceCheckin from "../../assets/images/illustrations/hotel-service-checkin.svg";
import airIndiaExpress from "../../assets/images/brands/air-india-express.png";
import airIndia from "../../assets/images/brands/air-india.png";
import akasaAir from "../../assets/images/brands/akasa-air.png";
import airAsia from "../../assets/images/brands/airasia.png";
import emirates from "../../assets/images/brands/emirates.png";
import indigo from "../../assets/images/brands/indigo.png";
import lufthansa from "../../assets/images/brands/lufthansa.png";
import qatarAirways from "../../assets/images/brands/qatar-airways.png";
import spiceJet from "../../assets/images/airlines/Spicejet.png";
import { POPULAR_RTC_OPERATORS } from "../../data/popularBuses";
import "../../STYLES/HomePage.css";
import { toDisplayDate } from "../../utils/apiDateFormat";
import { getActiveOffers } from "../../services/adminFeaturedOffersService";
import { getPopularBusRoutesFromSearchHistory } from "../../services/busSearchHistoryService";
import { listHotFlightRoutes } from "../../services/flightBookingService";
import { toApiUrl } from "../../services/apiClient";
import { usePromo } from "../../contexts/PromoContext";

const CLASS_OPTIONS = [
  "Economy",
  "Premium Economy",
  "Business",
  "Premium Business",
  "First Class",
];

const FLIGHT_TRIP_TYPES = [
  { value: "oneway", label: "One Way" },
  { value: "twoway", label: "Two Way" },
  { value: "multicity", label: "Multi City" },
];

const USE_DIRECT_API_IN_DEV =
  String(process.env.REACT_APP_USE_DIRECT_API_IN_DEV || "").toLowerCase() ===
  "true";
const IS_LOCAL_DEV =
  process.env.NODE_ENV === "development" &&
  typeof window !== "undefined" &&
  ["localhost", "127.0.0.1", "0.0.0.0"].includes(window.location.hostname);
const PLACES_API_URL =
  IS_LOCAL_DEV && !USE_DIRECT_API_IN_DEV
    ? "/api/Places"
    : process.env.REACT_APP_PLACES_API_URL || "/api/Places";
const FEATURED_OFFER_ASSET_PATHS = [
  "uploads",
  "upload",
  "images",
  "image",
  "files",
  "media",
  "assets",
  "offers",
];

const BUS_TRIP_TYPES = [
  { value: "oneway", label: "One Way" },
  { value: "twoway", label: "Two Way" },
];

const FALLBACK_CITIES = [
  "Hyderabad",
  "Bengaluru",
  "Chennai",
  "Mumbai",
  "Pune",
  "Vijayawada",
  "Visakhapatnam",
  "Delhi",
  "Kolkata",
  "Ahmedabad",
  "Proddatur",  
];

const POPULAR_FLIGHTS = [
  {
    id: "flight-1",
    route: "Delhi to Mumbai",
    fromCity: "Delhi",
    toCity: "Mumbai",
    summary: "Multiple daily departures and flexible timings.",
    searches: 1520,
  },
  {
    id: "flight-2",
    route: "Delhi to New York",
    fromCity: "Delhi",
    toCity: "New York",
    summary: "Premium long-haul options with one-stop routes.",
    searches: 1480,
  },
  {
    id: "flight-3",
    route: "Delhi to Dubai",
    fromCity: "Delhi",
    toCity: "Dubai",
    summary: "Fast visa-friendly routes with top carriers.",
    searches: 1390,
  },
  {
    id: "flight-4",
    route: "Kolkata to Patna",
    fromCity: "Kolkata",
    toCity: "Patna",
    summary: "Affordable direct routes for frequent travelers.",
    searches: 1210,
  },
  {
    id: "flight-5",
    route: "Pune to Chennai",
    fromCity: "Pune",
    toCity: "Chennai",
    summary: "Quick connections with excellent morning slots.",
    searches: 980,
  },
  {
    id: "flight-6",
    route: "Bangalore to Jaipur",
    fromCity: "Bangalore",
    toCity: "Jaipur",
    summary: "Business and economy seats available every day.",
    searches: 940,
  },
  {
    id: "flight-7",
    route: "Hyderabad to Kolkata",
    fromCity: "Hyderabad",
    toCity: "Kolkata",
    summary: "Convenient schedules for weekend travel plans.",
    searches: 870,
  },
  {
    id: "flight-8",
    route: "Mumbai to Doha",
    fromCity: "Mumbai",
    toCity: "Doha",
    summary: "Competitive fares on popular Gulf routes.",
    searches: 820,
  },
  {
    id: "flight-9",
    route: "Hyderabad to Proddatur",
    fromCity: "Hyderabad",
    toCity: "Proddatur",
    summary: "Competitive fares on most Gulf routes.",
    searches: 760,
  },
];

const FALLBACK_BUS_ROUTES = [
  {
    id: "bus-fallback-1",
    fromCity: "Mumbai",
    toCity: "Pune",
    searches: 1842,
  },
  {
    id: "bus-fallback-2",
    fromCity: "Bengaluru",
    toCity: "Chennai",
    searches: 1520,
  },
  {
    id: "bus-fallback-3",
    fromCity: "Delhi",
    toCity: "Jaipur",
    searches: 1480,
  },
  {
    id: "bus-fallback-4",
    fromCity: "Hyderabad",
    toCity: "Bengaluru",
    searches: 1390,
  },
  {
    id: "bus-fallback-5",
    fromCity: "Chennai",
    toCity: "Bengaluru",
    searches: 1210,
  },
  {
    id: "bus-fallback-6",
    fromCity: "Pune",
    toCity: "Goa",
    searches: 980,
  },
  {
    id: "bus-fallback-7",
    fromCity: "Hyderabad",
    toCity: "Vijayawada",
    searches: 870,
  },
  {
    id: "bus-fallback-8",
    fromCity: "Delhi",
    toCity: "Agra",
    searches: 750,
  },
];


const AIRLINE_BRANDS = [
  { id: "brand-1", image: indigo, name: "IndiGo", scale: 1.2 },
  { id: "brand-2", image: airIndia, name: "Air India", scale: 1.34 },
  { id: "brand-3", image: airAsia, name: "AirAsia", scale: 1.08 },
  { id: "brand-4", image: akasaAir, name: "Akasa Air", scale: 1.18 },
  { id: "brand-5", image: emirates, name: "Emirates", scale: 1.08 },
  { id: "brand-6", image: qatarAirways, name: "Qatar Airways", scale: 1.16 },
  { id: "brand-7", image: lufthansa, name: "Lufthansa", scale: 1.1 },
  { id: "brand-8", image: spiceJet, name: "SpiceJet", scale: 1.14 },
  {
    id: "brand-9",
    image: airIndiaExpress,
    name: "Air India Express",
    scale: 1.08,
  },
];

const REVIEWS = [
  {
    id: "review-1",
    type: "Bus Booking",
    comment: "Two-way booking flow is smooth and payment confirmation is instant.",
    author: "Rohit M.",
    rating: "4.9/5",
  },
  {
    id: "review-2",
    type: "Bus Booking",
    comment: "Seat layout and boarding point details are clear and accurate.",
    author: "Priya S.",
    rating: "4.8/5",
  },
  {
    id: "review-3",
    type: "Bus Booking",
    comment: "Route search is quick and boarding details are easy to follow.",
    author: "Karthik R.",
    rating: "4.7/5",
  },
  {
    id: "review-4",
    type: "Bus Booking",
    comment: "Round trip option helped me plan both routes in one screen.",
    author: "Sneha P.",
    rating: "4.8/5",
  },
  {
    id: "review-5",
    type: "Bus Booking",
    comment: "Date selector opens instantly and return date handling is perfect.",
    author: "Amit K.",
    rating: "4.9/5",
  },
  {
    id: "review-6",
    type: "Bus Booking",
    comment: "Price filters and route details make intercity planning easy.",
    author: "Neha T.",
    rating: "4.6/5",
  },
];

const HIGHLIGHTS = [
  {
    id: "highlight-1",
    icon: Search,
    value: "Fast",
    title: "Search Without Guesswork",
    text: "Compare routes, timings, fares, pickup points, and seat choices in one clean flow.",
  },
  {
    id: "highlight-2",
    icon: ShieldCheck,
    value: "Clear",
    title: "Book With Confidence",
    text: "Check cancellation rules, fare details, and trip information before you confirm.",
  },
  {
    id: "highlight-3",
    icon: Clock3,
    value: "Ready",
    title: "Better For Urgent Plans",
    text: "Find close-to-departure options quickly when your journey changes at the last minute.",
  },
  {
    id: "highlight-4",
    icon: RefreshCw,
    value: "Easy",
    title: "Everything In One Place",
    text: "Keep search, offers, booking, and ticket actions simple from start to finish.",
  },
];

const HOME_BOOKING_STEPS = [
  {
    id: "step-1",
    title: "Search Your Route",
    text: "Enter source, destination, and journey date to compare available buses in one place.",
  },
  {
    id: "step-2",
    title: "Pick The Right Bus",
    text: "Check timings, boarding points, bus type, fare, and cancellation rules before selecting seats.",
  },
  {
    id: "step-3",
    title: "Confirm Securely",
    text: "Add passenger details, complete payment, and keep your ticket reference ready for the journey.",
  },
];

const HOME_GUIDE_NOTES = [
  {
    id: "note-1",
    title: "Close-To-Departure Booking",
    text: "When plans change at the last minute, filter by departure time, pickup point, seat type, and cancellation flexibility. A slightly later boarding time can sometimes give better seat choice and fare clarity.",
  },
  {
    id: "note-2",
    title: "A Cleaner Way To Choose",
    text: "Instead of picking only the cheapest option, compare the whole trip: operator reliability, boarding location, arrival time, amenities, and refund rules. A calmer booking decision usually starts with fewer surprises.",
  },
];

const HOME_SERVICE_BLOCKS = [
  {
    id: "services",
    kicker: "Travel Desk Services",
    title: "Online Bus Booking Made Simple",
    text:
      "Search routes, compare departures, check fares, and keep booking details in one clear flow. Travel Desk is built for quick city-to-city planning without jumping between different tools.",
    points: [
      "Live route search with practical filters",
      "Boarding, dropping, and timing details in one place",
      "Ticket confirmation ready after payment",
    ],
    visual: "route",
    image: travelServiceRoute,
    imageAlt: "Bus route search shown on a mobile booking screen",
  },
  {
    id: "fares",
    kicker: "Fare Clarity",
    title: "Choose The Right Bus At The Right Price",
    text:
      "Compare AC, non-AC, sleeper, seater, private, and RTC-style options by comfort, timing, and cancellation rules before you confirm.",
    points: [
      "AC Sleeper",
      "Non-AC Seater",
      "Semi Sleeper",
      "Volvo / Premium",
      "Express Routes",
      "Night Services",
    ],
    visual: "fare",
    image: travelServiceFares,
    imageAlt: "Bus fare comparison cards with seat and route options",
  },
  {
    id: "benefits",
    kicker: "Better Booking Habits",
    title: "Everything You Need Before You Travel",
    text:
      "A good booking experience should reduce uncertainty. Review route details, passenger information, fare rules, and ticket status before the journey starts.",
    points: [
      "Avoid standing in queues at counters",
      "Review pickup and drop points before payment",
      "Keep booking reference and passenger details handy",
      "Use saved routes for repeat journeys",
    ],
    visual: "traveller",
    image: travelServiceTraveller,
    imageAlt: "Traveller checking ticket details beside a bus stop",
  },
];

const HOME_ASSURANCE_POINTS = [
  {
    id: "assurance-1",
    icon: ShieldCheck,
    title: "Trip Protection",
    text: "Clear cancellation and support paths when plans change.",
  },
  {
    id: "assurance-2",
    icon: Clock3,
    title: "Delay Ready",
    text: "Keep route timing, boarding details, and ticket status easy to check.",
  },
  {
    id: "assurance-3",
    icon: RefreshCw,
    title: "Flexible Changes",
    text: "Compare options with refund rules before you confirm your seat.",
  },
];

const HOME_BUS_FAQS = [
  {
    id: "faq-1",
    question: "How do I book bus tickets online?",
    answer:
      "Choose your source, destination, journey date, and preferred bus. Then select seats, add passenger details, and complete payment to receive your ticket confirmation.",
  },
  {
    id: "faq-2",
    question: "Can I book RTC and private bus operators?",
    answer:
      "Yes. The platform is designed for common routes across RTC operators and private buses, including seater, sleeper, AC, non-AC, and overnight journeys.",
  },
  {
    id: "faq-3",
    question: "What should I check before payment?",
    answer:
      "Always check the final fare, boarding point, cancellation rules, passenger details, and operator policy before payment.",
  },
  {
    id: "faq-4",
    question: "Where can I check boarding point and ticket details?",
    answer:
      "After booking, your ticket page shows route, date, boarding point, passenger details, fare summary, and confirmation reference for quick access.",
  },
];

const HOME_APP_BENEFITS = [
  "Route alerts",
  "PNR and ticket history",
  "Repeat traveller offers",
];

const FLIGHT_HIGHLIGHTS = [
  {
    id: "flight-highlight-1",
    icon: Search,
    value: "Smart",
    title: "Compare Flight Choices",
    text: "Check one-way, round-trip, and multi-city options with fares, timing, and cabin class in one flow.",
  },
  {
    id: "flight-highlight-2",
    icon: ShieldCheck,
    value: "Official",
    title: "Clear Booking Details",
    text: "Review route, passenger, fare, and airline information before moving to payment.",
  },
  {
    id: "flight-highlight-3",
    icon: Clock3,
    value: "Quick",
    title: "Built For Time-Sensitive Travel",
    text: "Find morning, evening, direct, and connecting flight options faster when plans change.",
  },
  {
    id: "flight-highlight-4",
    icon: RefreshCw,
    value: "Flexible",
    title: "Ready For Trip Changes",
    text: "Keep return dates, traveller counts, and cabin choices easy to adjust while searching.",
  },
];

const FLIGHT_SERVICE_BLOCKS = [
  {
    id: "flight-search",
    kicker: "Flight Desk Services",
    title: "Flight Search For Every Trip Type",
    text:
      "Search domestic and international routes, compare flight timings, and keep traveller details aligned from the first search.",
    points: [
      "One-way, round-trip, and multi-city planning",
      "Traveller and cabin class selection",
      "Route, timing, and fare details in one place",
    ],
    visual: "route",
    image: flightServiceRoute,
    imageAlt: "Flight route search shown in a travel booking flow",
  },
  {
    id: "flight-fares",
    kicker: "Fare Clarity",
    title: "Choose The Fare That Fits The Journey",
    text:
      "Compare economy, premium economy, business, and first class options with practical date and traveller controls.",
    points: [
      "Economy",
      "Premium Economy",
      "Business",
      "Premium Business",
      "First Class",
      "International Routes",
    ],
    visual: "fare",
    image: flightServiceFares,
    imageAlt: "Flight fare comparison cards with route options",
  },
  {
    id: "flight-ready",
    kicker: "Before You Fly",
    title: "Keep Check-In And Ticket Actions Close",
    text:
      "A flight booking flow should make it easy to find booking references, review passenger details, and move to web check-in when needed.",
    points: [
      "Open web check-in from the travel desk",
      "Keep PNR and passenger details ready",
      "Review date, route, and cabin before payment",
      "Use saved details for repeat searches",
    ],
    visual: "traveller",
    image: flightServiceTraveller,
    imageAlt: "Traveller checking flight booking details",
  },
];

const FLIGHT_BOOKING_STEPS = [
  {
    id: "flight-step-1",
    title: "Search Flights",
    text: "Enter origin, destination, dates, travellers, and cabin class for the right flight list.",
  },
  {
    id: "flight-step-2",
    title: "Compare Schedules",
    text: "Review direct, connecting, morning, evening, and premium options before choosing.",
  },
  {
    id: "flight-step-3",
    title: "Confirm And Fly",
    text: "Add passenger details, complete payment, and keep the PNR ready for web check-in.",
  },
];

const FLIGHT_GUIDE_NOTES = [
  {
    id: "flight-note-1",
    title: "Flexible Date Planning",
    text: "A nearby departure date or alternate return date can change fare and timing options. Compare the full journey before picking only the lowest price.",
  },
  {
    id: "flight-note-2",
    title: "Better Airport Readiness",
    text: "Keep your PNR, passenger names, baggage rules, terminal information, and web check-in timing ready before travel day.",
  },
];

const FLIGHT_ASSURANCE_POINTS = [
  {
    id: "flight-assurance-1",
    icon: ShieldCheck,
    title: "PNR Ready",
    text: "Keep booking references easy to find after payment.",
  },
  {
    id: "flight-assurance-2",
    icon: Clock3,
    title: "Schedule Aware",
    text: "Review departure, arrival, and connection timing clearly.",
  },
  {
    id: "flight-assurance-3",
    icon: RefreshCw,
    title: "Trip Flexible",
    text: "Adjust dates, cabin, and traveller counts before search.",
  },
];

const FLIGHT_REVIEWS = [
  {
    id: "flight-review-1",
    type: "Flight Booking",
    comment: "Round-trip search made the timing and fare comparison easy.",
    author: "Ananya R.",
    rating: "4.8/5",
  },
  {
    id: "flight-review-2",
    type: "Flight Booking",
    comment: "Traveller and cabin selection stayed clear even for family tickets.",
    author: "Vikram S.",
    rating: "4.7/5",
  },
  {
    id: "flight-review-3",
    type: "Flight Booking",
    comment: "The airline and route sections helped me choose quickly.",
    author: "Meera K.",
    rating: "4.9/5",
  },
  {
    id: "flight-review-4",
    type: "Flight Booking",
    comment: "Web check-in access beside booking tools is very useful.",
    author: "Rahul P.",
    rating: "4.8/5",
  },
  {
    id: "flight-review-5",
    type: "Flight Booking",
    comment: "Multi-city planning feels cleaner than switching between pages.",
    author: "Farah N.",
    rating: "4.7/5",
  },
  {
    id: "flight-review-6",
    type: "Flight Booking",
    comment: "Fare, timing, and airline choices are simple to scan.",
    author: "Nikhil D.",
    rating: "4.8/5",
  },
];

const HOME_FLIGHT_FAQS = [
  {
    id: "flight-faq-1",
    question: "How do I search for flights online?",
    answer:
      "Choose source, destination, departure date, traveller count, and cabin class. For return or multi-city trips, add the extra dates and routes before searching.",
  },
  {
    id: "flight-faq-2",
    question: "Can I search one-way, round-trip, and multi-city flights?",
    answer:
      "Yes. The homepage flight form supports one-way, two-way, and multi-city trip planning with traveller and cabin class details.",
  },
  {
    id: "flight-faq-3",
    question: "What should I check before confirming a flight?",
    answer:
      "Review passenger names, travel dates, departure and arrival timing, fare rules, baggage details, and airline policy before payment.",
  },
  {
    id: "flight-faq-4",
    question: "Where do I complete web check-in?",
    answer:
      "Use the Web Check-In page to open the official airline check-in portal and download your boarding pass when the airline window opens.",
  },
];

const HOME_FLIGHT_APP_BENEFITS = [
  "Saved traveller and route preferences",
  "Quick access to PNR and web check-in",
  "Flight offers for domestic and international routes",
];

const POPULAR_HOTELS = [
  {
    id: "hotel-1",
    city: "Hyderabad",
    name: "Atlas Pearl Suites",
    summary: "Business-friendly stays near HITEC City with breakfast options.",
    searches: 1420,
    price: "3,499",
  },
  {
    id: "hotel-2",
    city: "Bengaluru",
    name: "Cobalt Garden Hotel",
    summary: "Calm rooms, workspace corners, and quick airport access.",
    searches: 1310,
    price: "4,199",
  },
  {
    id: "hotel-3",
    city: "Mumbai",
    name: "Harbour View Residency",
    summary: "Premium city stays with flexible check-in and sea-facing rooms.",
    searches: 1260,
    price: "5,299",
  },
  {
    id: "hotel-4",
    city: "Goa",
    name: "Coral Bay Retreat",
    summary: "Resort-style rooms close to beaches, cafes, and weekend routes.",
    searches: 1188,
    price: "4,899",
  },
  {
    id: "hotel-5",
    city: "Delhi",
    name: "Metro Nest Hotel",
    summary: "Clean city-center rooms for short stays and family travel.",
    searches: 1040,
    price: "2,999",
  },
  {
    id: "hotel-6",
    city: "Jaipur",
    name: "Heritage Courtyard Stay",
    summary: "Boutique comfort with local breakfast and sightseeing access.",
    searches: 920,
    price: "3,199",
  },
];

const HOTEL_HIGHLIGHTS = [
  {
    id: "hotel-highlight-1",
    icon: Search,
    value: "Matched",
    title: "Find Stays By City",
    text: "Search hotels by destination, check-in date, room count, and guest mix in one compact flow.",
  },
  {
    id: "hotel-highlight-2",
    icon: ShieldCheck,
    value: "Clear",
    title: "Review Stay Details",
    text: "Compare price, amenities, cancellation notes, and room highlights before choosing.",
  },
  {
    id: "hotel-highlight-3",
    icon: BedDouble,
    value: "Ready",
    title: "Rooms And Guests Together",
    text: "Keep rooms, adults, children, and dates visible while planning the stay.",
  },
  {
    id: "hotel-highlight-4",
    icon: MapPin,
    value: "Local",
    title: "City-Friendly Planning",
    text: "Scan popular city stays for business trips, family travel, weekend breaks, and stopovers.",
  },
];

const HOTEL_SERVICE_BLOCKS = [
  {
    id: "hotel-search",
    kicker: "Hotel Desk Services",
    title: "Search Stays By City, Date, And Guest Plan",
    text:
      "Choose the destination, check-in, check-out, rooms, and guests before opening hotel results built for city stays.",
    points: [
      "Destination and hotel-area search",
      "Check-in and check-out date clarity",
      "Rooms and guests ready before results",
    ],
    visual: "route",
    image: hotelServiceSearch,
    imageAlt: "Hotel destination search card with stay dates",
  },
  {
    id: "hotel-fares",
    kicker: "Stay Clarity",
    title: "Compare Rooms, Amenities, And Nightly Price",
    text:
      "Scan budget, business, family, boutique, and premium stays with amenities and cancellation notes close to the price.",
    points: [
      "Budget Rooms",
      "Business Hotels",
      "Family Stays",
      "Boutique Hotels",
      "Breakfast Included",
      "Flexible Cancellation",
    ],
    visual: "fare",
    image: hotelServiceRooms,
    imageAlt: "Hotel room comparison cards with prices and amenities",
  },
  {
    id: "hotel-ready",
    kicker: "Before You Check In",
    title: "Keep Check-In Details Ready For Arrival",
    text:
      "Review city, dates, rooms, guests, amenities, and booking references before the stay begins.",
    points: [
      "Check stay dates before selection",
      "Review room and guest details",
      "Keep booking reference handy",
      "Use saved cities for repeat trips",
    ],
    visual: "traveller",
    image: hotelServiceCheckin,
    imageAlt: "Hotel check-in card with luggage and stay details",
  },
];

const HOTEL_BOOKING_STEPS = [
  {
    id: "hotel-step-1",
    title: "Search Stays",
    text: "Enter destination, check-in, check-out, rooms, and guests to open matching hotel options.",
  },
  {
    id: "hotel-step-2",
    title: "Compare Comfort",
    text: "Review amenities, city location, breakfast notes, cancellation terms, and nightly price.",
  },
  {
    id: "hotel-step-3",
    title: "Confirm The Stay",
    text: "Keep guest details, stay dates, fare summary, and booking reference ready for check-in.",
  },
];

const HOTEL_GUIDE_NOTES = [
  {
    id: "hotel-note-1",
    title: "Better Date Planning",
    text: "Hotel price and availability can shift quickly around weekends, events, and holidays. Compare nearby dates before locking the stay.",
  },
  {
    id: "hotel-note-2",
    title: "Choose Beyond Price",
    text: "Check location, breakfast, cancellation rules, room type, guest policy, and check-in timing so the stay matches the actual trip.",
  },
];

const HOTEL_ASSURANCE_POINTS = [
  {
    id: "hotel-assurance-1",
    icon: ShieldCheck,
    title: "Stay Details",
    text: "Dates, guests, room count, and city stay visible before results.",
  },
  {
    id: "hotel-assurance-2",
    icon: BedDouble,
    title: "Room Ready",
    text: "Compare comfort, amenities, and nightly prices clearly.",
  },
  {
    id: "hotel-assurance-3",
    icon: RefreshCw,
    title: "Change Flexible",
    text: "Review flexible cancellation and date choices before booking.",
  },
];

const HOTEL_REVIEWS = [
  {
    id: "hotel-review-1",
    type: "Hotel Booking",
    comment: "The room and guest selector made family stay planning simple.",
    author: "Ishita R.",
    rating: "4.8/5",
  },
  {
    id: "hotel-review-2",
    type: "Hotel Booking",
    comment: "City hotel cards are easy to scan for budget and amenities.",
    author: "Manoj S.",
    rating: "4.7/5",
  },
  {
    id: "hotel-review-3",
    type: "Hotel Booking",
    comment: "Check-in and check-out dates stayed clear through the search.",
    author: "Kavya P.",
    rating: "4.9/5",
  },
  {
    id: "hotel-review-4",
    type: "Hotel Booking",
    comment: "Popular stays helped me choose quickly for a weekend trip.",
    author: "Arjun V.",
    rating: "4.8/5",
  },
  {
    id: "hotel-review-5",
    type: "Hotel Booking",
    comment: "The hotel results page feels consistent with bus and flight.",
    author: "Naina K.",
    rating: "4.7/5",
  },
  {
    id: "hotel-review-6",
    type: "Hotel Booking",
    comment: "Good flow for comparing city stays without clutter.",
    author: "Dev M.",
    rating: "4.8/5",
  },
];

const HOME_HOTEL_FAQS = [
  {
    id: "hotel-faq-1",
    question: "How do I search for hotels online?",
    answer:
      "Choose a destination, check-in date, check-out date, rooms, and guests. The hotel results page shows matching stays with price and amenity details.",
  },
  {
    id: "hotel-faq-2",
    question: "Can I search by rooms and guests?",
    answer:
      "Yes. The hotel form includes a rooms and guests selector for adults, children, and room count.",
  },
  {
    id: "hotel-faq-3",
    question: "What should I check before selecting a hotel?",
    answer:
      "Review stay dates, guest count, room type, nightly price, amenities, cancellation notes, and check-in timing before confirming.",
  },
  {
    id: "hotel-faq-4",
    question: "Can I compare popular city stays?",
    answer:
      "Yes. The hotel mode includes popular city stays and a hotel results page for quick comparison.",
  },
];

const HOME_HOTEL_APP_BENEFITS = [
  "Saved city stay preferences",
  "Room and guest presets",
  "Hotel offers for business and weekend trips",
];

const HOME_MODE_CONTENT = {
  buses: {
    mode: "buses",
    Icon: Bus,
    heroTitle: "Book bus journeys with clearer routes and fares",
    heroTags: ["Live bus fares", "Seat selection ready", "Boarding point clarity"],
    insightsTitle: "Make every bus booking feel clear before you pay.",
    insightsText:
      "Travel Desk helps users compare the full bus journey, not just the price, so the final booking feels easier to trust.",
    highlights: HIGHLIGHTS,
    services: HOME_SERVICE_BLOCKS,
    serviceHeading: "Plan, compare, and book buses with clearer choices",
    guideHeading: "Book Bus Tickets With Less Guesswork",
    guideIntro:
      "A good bus booking flow should help you compare routes quickly, understand the fare clearly, and confirm the ticket without hunting for details later.",
    bookingSteps: HOME_BOOKING_STEPS,
    guideNotes: HOME_GUIDE_NOTES,
    assuranceBadge: "Bus Travel Assured",
    assuranceEnding: "Book bus tickets with confidence",
    assuranceMapLabel: "Live journey view",
    assurancePoints: HOME_ASSURANCE_POINTS,
    assuranceProofs: [
      ["Details verified", "Fare, pickup point, and rules are easy to review."],
      ["Timing matched", "Departure and arrival stay easy to scan."],
      ["Change-ready plan", "Review flexibility before confirming."],
      ["Ticket ready", "Saved in one place after booking."],
    ],
    reviews: REVIEWS,
    faqHeading: "Online Bus Booking FAQs",
    faqs: HOME_BUS_FAQS,
    appKicker: "Quick Booking",
    appTitle: "Book buses faster",
    appText:
      "Save routes, compare fares, and keep tickets ready for city-to-city journeys.",
    appOffer: "Code TRAVELFIRST",
    appBenefits: HOME_APP_BENEFITS,
    aboutTitle: "About Travel Desk Bus Booking",
    aboutParagraphs: [
      "Travel Desk keeps bus booking simple for city-to-city journeys. The platform focuses on route search, practical filters, transparent fare checks, and ticket workflows that work for everyday intercity travel.",
      "Whether it is a weekend visit home, a pilgrimage route, a business trip, or a family holiday, bus mode helps compare operators, pickup points, timings, and ticket details in one place.",
    ],
  },
  flights: {
    mode: "flights",
    Icon: Plane,
    heroTitle: "Search flights with fares, travellers, and cabin choices",
    heroTags: ["Live flight fares", "One-way and round-trip", "Web check-in ready"],
    insightsTitle: "Make every flight search feel organized before you book.",
    insightsText:
      "Travel Desk brings fare comparison, traveller details, cabin choices, and airline actions into a calmer flight booking flow.",
    highlights: FLIGHT_HIGHLIGHTS,
    services: FLIGHT_SERVICE_BLOCKS,
    serviceHeading: "Plan, compare, and book flights with clearer choices",
    guideHeading: "Book Flights With Less Guesswork",
    guideIntro:
      "A good flight booking flow should help you compare timing, fare, cabin class, traveller details, and airline actions before payment.",
    bookingSteps: FLIGHT_BOOKING_STEPS,
    guideNotes: FLIGHT_GUIDE_NOTES,
    assuranceBadge: "Flight Travel Assured",
    assuranceEnding: "Book flights with confidence",
    assuranceMapLabel: "Flight journey view",
    assurancePoints: FLIGHT_ASSURANCE_POINTS,
    assuranceProofs: [
      ["PNR checked", "Booking reference and passenger details stay easy to find."],
      ["Schedule matched", "Departure, arrival, and route timing are simple to scan."],
      ["Cabin ready", "Traveller count and cabin class stay visible before search."],
      ["Check-in ready", "Official airline check-in stays close when you need it."],
    ],
    reviews: FLIGHT_REVIEWS,
    faqHeading: "Online Flight Booking FAQs",
    faqs: HOME_FLIGHT_FAQS,
    appKicker: "Flight Desk",
    appTitle: "Plan flights faster on your next trip",
    appText:
      "Save frequent flight routes, compare airline choices, and keep PNR and check-in actions ready.",
    appOffer: "Use code FLYFIRST",
    appBenefits: HOME_FLIGHT_APP_BENEFITS,
    aboutTitle: "About Travel Desk Flight Booking",
    aboutParagraphs: [
      "Travel Desk flight mode is built for fast route search, clearer fare comparison, traveller selection, cabin choices, and web check-in readiness across popular airline routes.",
      "Whether it is a domestic business trip, family vacation, international connection, or multi-city plan, flight mode keeps schedules, passenger details, PNR actions, and booking choices easy to review.",
    ],
  },
  hotels: {
    mode: "hotels",
    Icon: Building2,
    heroTitle: "Book hotel stays with rooms, guests, and dates aligned",
    heroTags: ["City stays", "Rooms and guests", "Flexible stay planning"],
    insightsTitle: "Make every hotel search feel clear before you choose.",
    insightsText:
      "Travel Desk hotel mode brings destination, dates, room count, guest details, and stay choices into the same calm booking flow.",
    highlights: HOTEL_HIGHLIGHTS,
    services: HOTEL_SERVICE_BLOCKS,
    serviceHeading: "Plan, compare, and book hotels with clearer choices",
    guideHeading: "Book Hotels With Less Guesswork",
    guideIntro:
      "A good hotel booking flow should help you compare city stays, dates, rooms, guest counts, amenities, and fare notes before you select a stay.",
    bookingSteps: HOTEL_BOOKING_STEPS,
    guideNotes: HOTEL_GUIDE_NOTES,
    assuranceBadge: "Hotel Stay Assured",
    assuranceEnding: "Book hotel stays with confidence",
    assuranceMapLabel: "Stay planning view",
    assurancePoints: HOTEL_ASSURANCE_POINTS,
    assuranceProofs: [
      ["Dates checked", "Check-in and check-out stay visible before results."],
      ["Guests matched", "Rooms, adults, and children are easy to review."],
      ["Comfort compared", "Amenities and stay notes stay close to the price."],
      ["Stay ready", "Booking reference and city details stay in one place."],
    ],
    reviews: HOTEL_REVIEWS,
    faqHeading: "Online Hotel Booking FAQs",
    faqs: HOME_HOTEL_FAQS,
    appKicker: "Hotel Desk",
    appTitle: "Plan hotel stays faster",
    appText:
      "Save favourite cities, compare stay options, and keep room and guest details ready.",
    appOffer: "Use code STAYFIRST",
    appBenefits: HOME_HOTEL_APP_BENEFITS,
    aboutTitle: "About Travel Desk Hotel Booking",
    aboutParagraphs: [
      "Travel Desk hotel mode is built for destination-first stay planning with clear dates, room counts, guest details, popular city stays, and simple results.",
      "Whether it is a business trip, weekend break, family stay, or stopover, hotel mode keeps room choices, stay dates, amenities, and booking details easy to compare.",
    ],
  },
};

function getDateInputValue(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);

  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

function normalizeHomeTab(value) {
  return ["buses", "hotels"].includes(value) ? value : "flights";
}

function createMultiCityLeg(from, to, offsetDays) {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    from,
    to,
    departureDate: "",
  };
}

function formatTravellerSummary(adults, children, infants) {
  if (adults <= 0 && children <= 0 && infants <= 0) {
    return "";
  }

  const parts = [`${adults} ${adults > 1 ? "ADULTS" : "ADULT"}`];

  if (children > 0) {
    parts.push(`${children} ${children > 1 ? "CHILDREN" : "CHILD"}`);
  }

  if (infants > 0) {
    parts.push(`${infants} ${infants > 1 ? "INFANTS" : "INFANT"}`);
  }

  return parts.join(", ");
}

function formatHotelGuestSummary(rooms, adults, children) {
  const roomPart = `${rooms} ${rooms > 1 ? "Rooms" : "Room"}`;
  const adultPart = `${adults} ${adults > 1 ? "Adults" : "Adult"}`;
  const childPart =
    children > 0 ? `, ${children} ${children > 1 ? "Children" : "Child"}` : "";

  return `${roomPart}, ${adultPart}${childPart}`;
}

function getStaticAiReply(message) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("hi") ||
    normalized.includes("hello") ||
    normalized.includes("hey")
  ) {
    return "Hello. I can help with flights, buses, hotels, fares, and booking flow questions.";
  }

  if (
    normalized.includes("flight") ||
    normalized.includes("airline") ||
    normalized.includes("plane")
  ) {
    return "For flights, share source, destination, and travel dates. I can suggest one-way, round-trip, or multi-city flow.";
  }

  if (
    normalized.includes("bus") ||
    normalized.includes("rtc") ||
    normalized.includes("seat")
  ) {
    return "For buses, tell me your route and travel date. I can guide you to seat selection and payment steps.";
  }

  if (
    normalized.includes("price") ||
    normalized.includes("fare") ||
    normalized.includes("cost") ||
    normalized.includes("offer")
  ) {
    return "You can compare fares from the search results page and use active offers shown in the Featured Offers section.";
  }

  if (
    normalized.includes("cancel") ||
    normalized.includes("refund") ||
    normalized.includes("reschedule")
  ) {
    return "For cancellation or refunds, go to your bookings section and choose the specific trip to view refund details.";
  }

  return "This is a static AI demo reply. Once your API is connected, I will respond with dynamic answers.";
}

function getInitialAiChatMessages() {
  return [
    {
      id: `ai-welcome-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      role: "assistant",
      text: "Hi, I am Travel AI. Ask me anything about flights, buses, or hotel bookings.",
    },
  ];
}

function getFeaturedOffersPayload(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  if (Array.isArray(payload?.$values)) {
    return payload.$values;
  }

  if (Array.isArray(payload?.offers)) {
    return payload.offers;
  }

  if (Array.isArray(payload?.Offers)) {
    return payload.Offers;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.Data)) {
    return payload.Data;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  if (Array.isArray(payload?.Items)) {
    return payload.Items;
  }

  if (Array.isArray(payload?.value)) {
    return payload.value;
  }

  if (Array.isArray(payload?.Value)) {
    return payload.Value;
  }

  const nestedPayloads = [
    payload?.result,
    payload?.Result,
    payload?.results,
    payload?.Results,
    payload?.payload,
    payload?.Payload,
    payload?.response,
    payload?.Response,
    payload?.data?.$values,
    payload?.Data?.$values,
    payload?.data?.items,
    payload?.Data?.Items,
    payload?.data?.offers,
    payload?.Data?.Offers,
  ];

  for (const nestedPayload of nestedPayloads) {
    const nestedOffers = getFeaturedOffersPayload(nestedPayload);
    if (nestedOffers.length > 0) {
      return nestedOffers;
    }
  }

  return [];
}

function pickOfferValue(source, keys, fallback = "") {
  if (!source || typeof source !== "object") {
    return fallback;
  }

  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null) {
      const text = String(value).trim();
      if (text) {
        return text;
      }
    }
  }

  return fallback;
}

function normalizeOfferActiveFlag(value) {
  if (value === undefined || value === null || value === "") {
    return true;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  const normalized = String(value).trim().toLowerCase();
  return !["false", "0", "no", "inactive", "disabled", "expired"].includes(normalized);
}

function cleanFeaturedOfferImageUrl(value) {
  let text = String(value || "")
    .trim()
    .replace(/^["']+|["']+$/g, "")
    .replace(/%22/gi, "")
    .replace(/\\/g, "/")
    .replace(/^~\//, "/");

  if (!text) {
    return "";
  }

  if (/^(https?:|data:|blob:)/i.test(text)) {
    return text;
  }

  text = text
    .replace(/^.*\/wwwroot\//i, "/")
    .replace(/^\/?wwwroot\//i, "/")
    .replace(/^\/?public\//i, "/");

  if (
    new RegExp(`^(${FEATURED_OFFER_ASSET_PATHS.join("|")})/`, "i").test(text)
  ) {
    return `/${text}`;
  }

  return text;
}

function isNgrokHostname(hostname) {
  const normalizedHostname = String(hostname || "").toLowerCase();
  return (
    normalizedHostname.includes("ngrok-free.dev") ||
    normalizedHostname.includes("ngrok.io")
  );
}

function shouldProxyFeaturedOfferImagePath(pathname) {
  const normalizedPath = String(pathname || "").replace(/^\/+/, "");
  return FEATURED_OFFER_ASSET_PATHS.some((prefix) =>
    normalizedPath.toLowerCase().startsWith(`${prefix.toLowerCase()}/`),
  );
}

function resolveFeaturedOfferImageSrc(imageUrl) {
  const cleanUrl = cleanFeaturedOfferImageUrl(imageUrl);

  if (!cleanUrl) {
    return "";
  }

  if (/^(data:|blob:)/i.test(cleanUrl)) {
    return cleanUrl;
  }

  if (IS_LOCAL_DEV) {
    try {
      const parsedUrl = new URL(cleanUrl, window.location.origin);

      if (
        isNgrokHostname(parsedUrl.hostname) &&
        shouldProxyFeaturedOfferImagePath(parsedUrl.pathname)
      ) {
        return `${parsedUrl.pathname}${parsedUrl.search}`;
      }
    } catch {
      // Fall back to the normal API URL resolution below.
    }
  }

  return toApiUrl(cleanUrl);
}

function normalizeFeaturedOffer(offer, index) {
  const id =
    pickOfferValue(offer, ["id", "Id", "offerId", "OfferId", "offerCode", "OfferCode"]) ||
    `offer-${index}`;
  const bookingType = pickOfferValue(offer, ["bookingType", "BookingType"]);
  const isActive =
    offer?.isCouponActive ??
    offer?.IsCouponActive ??
    offer?.isActive ??
    offer?.IsActive ??
    true;
  const imageUrl = pickOfferValue(offer, [
    "imageUrl",
    "ImageUrl",
    "imageURL",
    "ImageURL",
    "image",
    "Image",
    "imagePath",
    "ImagePath",
    "offerImageUrl",
    "OfferImageUrl",
    "bannerImageUrl",
    "BannerImageUrl",
    "thumbnailUrl",
    "ThumbnailUrl",
  ]);

  const promo = offer?.promotion ?? offer?.Promotion ?? null;

  const promotionId = offer?.promotionId ?? offer?.PromotionId ?? promo?.id ?? promo?.Id ?? null;
  const promotionCode = offer?.promotionCode ?? offer?.PromotionCode ?? promo?.code ?? promo?.Code ?? null;
  const promotionTitle = offer?.promotionTitle ?? offer?.PromotionTitle ?? promo?.title ?? promo?.Title ?? null;
  const promotionType = offer?.promotionType ?? offer?.PromotionType ?? promo?.promotionType ?? promo?.PromotionType ?? null;
  const discountType = offer?.discountType ?? offer?.DiscountType ?? promo?.discountType ?? promo?.DiscountType ?? null;
  const discountValue = offer?.discountValue ?? offer?.DiscountValue ?? promo?.discountValue ?? promo?.DiscountValue ?? null;
  const maxDiscountAmount = offer?.maxDiscountAmount ?? offer?.MaxDiscountAmount ?? promo?.maxDiscountAmount ?? promo?.MaxDiscountAmount ?? null;
  const minBookingAmount = offer?.minBookingAmount ?? offer?.MinBookingAmount ?? promo?.minBookingAmount ?? promo?.MinBookingAmount ?? null;
  const previewFinalPrice = offer?.previewFinalPrice ?? offer?.PreviewFinalPrice ?? null;
  const rawConditions = offer?.conditions ?? offer?.Conditions ?? [];
  const conditions = Array.isArray(rawConditions)
    ? rawConditions.map((cond) => {
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
          id: cond?.id ?? cond?.Id,
          featuredOfferId: cond?.featuredOfferId ?? cond?.FeaturedOfferId,
          conditionType,
          conditionOperator,
          value1: cond?.value1 ?? cond?.Value1 ?? "",
          value2: cond?.value2 ?? cond?.Value2 ?? "",
          isActive: cond?.isActive ?? cond?.IsActive ?? true,
        };
      })
    : [];

  return {
    id,
    offerCode: pickOfferValue(offer, ["offerCode", "OfferCode", "offerId", "OfferId"]),
    title: pickOfferValue(offer, ["title", "Title", "name", "Name"], "Travel Offer"),
    subtitle: pickOfferValue(offer, ["subtitle", "Subtitle"]),
    description: pickOfferValue(offer, ["description", "Description", "subtitle", "Subtitle"]),
    couponCode: pickOfferValue(offer, ["couponCode", "CouponCode", "code", "Code"]) || promotionCode,
    imageUrl: cleanFeaturedOfferImageUrl(imageUrl),
    bookingType,
    isActive: normalizeOfferActiveFlag(isActive),
    couponExpiresAtUtc: pickOfferValue(offer, ["couponExpiresAtUtc", "CouponExpiresAtUtc"]) || promo?.endDateUtc || promo?.EndDateUtc || null,
    promotionId,
    promotionCode,
    promotionTitle,
    promotionType,
    discountType,
    discountValue,
    maxDiscountAmount,
    minBookingAmount,
    previewFinalPrice,
    conditions
  };
}

function AutoMarquee({ items, className, duration, renderItem }) {
  const marqueeRef = useRef(null);
  const animationFrameRef = useRef(null);
  const draggedClickRef = useRef(false);
  const hoveredRef = useRef(false);
  const momentumRef = useRef(0);
  const dragStateRef = useRef({
    active: false,
    dragged: false,
    pointerId: null,
    startX: 0,
    lastX: 0,
    lastTime: 0,
    scrollLeft: 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  const loopItems = [...items, ...items, ...items];

  const normalizeMarqueeScroll = (node) => {
    if (!node || node.scrollWidth <= node.clientWidth) {
      return;
    }

    const segmentWidth = node.scrollWidth / 3;

    if (segmentWidth <= 0) {
      return;
    }

    if (node.scrollLeft < segmentWidth * 0.5) {
      node.scrollLeft += segmentWidth;
    } else if (node.scrollLeft > segmentWidth * 1.5) {
      node.scrollLeft -= segmentWidth;
    }
  };

  useEffect(() => {
    const node = marqueeRef.current;

    if (!node || items.length === 0) {
      return undefined;
    }

    const segmentWidth = node.scrollWidth / 3;
    if (segmentWidth > 0) {
      node.scrollLeft = segmentWidth;
    }

    let previousTime = performance.now();

    const animate = (time) => {
      const currentNode = marqueeRef.current;
      const elapsed = Math.min(time - previousTime, 32);
      previousTime = time;

      if (currentNode && currentNode.scrollWidth > currentNode.clientWidth) {
        const state = dragStateRef.current;

        if (!state.active) {
          if (Math.abs(momentumRef.current) > 0.02) {
            currentNode.scrollLeft += momentumRef.current * elapsed;
            momentumRef.current *= Math.pow(0.92, elapsed / 16.67);
          } else if (!hoveredRef.current) {
            const loopWidth = currentNode.scrollWidth / 3;
            const pixelsPerMs = loopWidth / Math.max(duration * 1000, 1);
            currentNode.scrollLeft += pixelsPerMs * elapsed;
          }

          normalizeMarqueeScroll(currentNode);
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [items, duration]);

  const handlePointerDown = (event) => {
    if (event.button !== undefined && event.button !== 0) {
      return;
    }

    const node = marqueeRef.current;
    if (!node) {
      return;
    }

    momentumRef.current = 0;
    dragStateRef.current = {
      active: true,
      dragged: false,
      pointerId: event.pointerId,
      startX: event.clientX,
      lastX: event.clientX,
      lastTime: performance.now(),
      scrollLeft: node.scrollLeft,
    };
    draggedClickRef.current = false;
    setIsDragging(true);
    node.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event) => {
    const state = dragStateRef.current;
    const node = marqueeRef.current;

    if (!state.active || !node) {
      return;
    }

    const deltaX = event.clientX - state.startX;
    const now = performance.now();
    const frameElapsed = Math.max(now - state.lastTime, 1);

    if (Math.abs(deltaX) > 4) {
      state.dragged = true;
      draggedClickRef.current = true;
      event.preventDefault();
    }

    node.scrollLeft = state.scrollLeft - deltaX;
    momentumRef.current = -((event.clientX - state.lastX) / frameElapsed);
    state.lastX = event.clientX;
    state.lastTime = now;
    normalizeMarqueeScroll(node);
  };

  const endDrag = (event) => {
    const state = dragStateRef.current;
    const node = marqueeRef.current;

    if (node && state.pointerId !== null) {
      node.releasePointerCapture?.(state.pointerId);
    }

    dragStateRef.current = {
      active: false,
      dragged: false,
      pointerId: null,
      startX: 0,
      lastX: 0,
      lastTime: 0,
      scrollLeft: 0,
    };
    setIsDragging(false);
  };

  const handleClickCapture = (event) => {
    if (draggedClickRef.current) {
      event.preventDefault();
      event.stopPropagation();
      draggedClickRef.current = false;
    }
  };

  return (
    <div
      ref={marqueeRef}
      className={`marquee ${className} ${isDragging ? "is-dragging" : ""}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={endDrag}
      onMouseEnter={() => {
        hoveredRef.current = true;
      }}
      onMouseLeave={() => {
        hoveredRef.current = false;
      }}
      onClickCapture={handleClickCapture}
      role="region"
      aria-label="Draggable carousel"
    >
      <div
        className="marquee-track"
        style={{ "--marquee-duration": `${duration}s` }}
      >
        {loopItems.map((item, index) => (
          <div className="marquee-slide" key={`${item.id}-${index}`}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
}

function FeaturedOfferImage({ offer }) {
  const [failed, setFailed] = useState(false);
  const hasImage = offer.imageUrl && !failed;

  useEffect(() => {
    setFailed(false);
  }, [offer.imageUrl]);

  if (!hasImage) {
    return (
      <div className="offer-image-placeholder">
        <span>{offer.bookingType || "Offer"}</span>
      </div>
    );
  }

  return (
    <img
      src={resolveFeaturedOfferImageSrc(offer.imageUrl)}
      alt={offer.title}
      onError={() => setFailed(true)}
    />
  );
}

function PlaceAutocomplete({
  label,
  value,
  onChange,
  tripType,
  field,
  placeholder,
  className,
  error,
}) {
  const [inputValue, setInputValue] = useState(value || "");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const requestAbortRef = useRef(null);

  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    const query = inputValue.trim();

    if (!open || query.length === 0) {
      setResults([]);
      setLoading(false);

      if (requestAbortRef.current) {
        requestAbortRef.current.abort();
      }

      return;
    }

    const controller = new AbortController();

    if (requestAbortRef.current) {
      requestAbortRef.current.abort();
    }

    requestAbortRef.current = controller;

    const timer = setTimeout(async () => {
      setLoading(true);

      try {
        const endpoint = new URL(PLACES_API_URL, window.location.origin);
        endpoint.searchParams.set("query", query);
        endpoint.searchParams.set("tripType", tripType);
        endpoint.searchParams.set("field", field);
        endpoint.searchParams.set("limit", "20");

        const needsNgrokBypass =
          endpoint.hostname.includes("ngrok-free.dev") ||
          endpoint.hostname.includes("ngrok.io");

        const response = await fetch(endpoint.toString(), {
          signal: controller.signal,
          headers: needsNgrokBypass
            ? { "ngrok-skip-browser-warning": "true" }
            : undefined,
        });

        if (!response.ok) {
          throw new Error(`Place API failed with status ${response.status}`);
        }

        const payload = await response.json();

        const rawList = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.value)
            ? payload.value
            : [];

        const normalized = rawList
          .map((item) => ({
            cityName: typeof item === "string" ? item : item?.cityName || "",
            usageCount:
              typeof item === "object" && item?.usageCount
                ? item.usageCount
                : 0,
          }))
          .filter((item) => item.cityName);

        setResults(normalized);
      } catch (error) {
        if (error.name !== "AbortError") {
          const normalizedQuery = query.toLowerCase();
          const fallbackMatches = FALLBACK_CITIES.filter((city) =>
            city.toLowerCase().includes(normalizedQuery),
          ).map((cityName, index) => ({
            cityName,
            usageCount: 100 - index,
          }));

          setResults(fallbackMatches);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 220);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [inputValue, open, tripType, field]);

  const handleInputChange = (event) => {
    const nextValue = event.target.value;
    setInputValue(nextValue);
    onChange(nextValue);
    setOpen(nextValue.trim().length > 0);
  };

  const handleSelect = (cityName) => {
    setInputValue(cityName);
    onChange(cityName);
    setOpen(false);
  };

  return (
    <div className={`field place-autocomplete ${className || ""}`} ref={wrapperRef}>
      <label>{label}</label>
      <div className="control-wrap">
        {tripType === "flight" ? (
          <Plane size={18} />
        ) : tripType === "hotel" ? (
          <Building2 size={18} />
        ) : (
          <Bus size={18} />
        )}
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setOpen(inputValue.trim().length > 0)}
          className="field-control place-input with-leading-icon"
          placeholder={placeholder}
          autoComplete="off"
        />
      </div>

      {open && (
        <div className="place-dropdown">
          {loading ? (
            <div className="place-meta">Searching places...</div>
          ) : results.length > 0 ? (
            results.map((item) => (
              <button
                key={`${item.cityName}-${item.usageCount}`}
                type="button"
                className="place-option"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelect(item.cityName)}
              >
                {item.cityName}
              </button>
            ))
          ) : (
            <div className="place-meta">No matching places found</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = normalizeHomeTab(searchParams.get("tab"));

  const { setSelectedOffer } = usePromo();
  const aiChatMessagesRef = useRef(null);
  const aiReplyTimerRef = useRef(null);

  const [activeTab, setActiveTab] = useState(initialTab);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [aiChatInput, setAiChatInput] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [aiChatMessages, setAiChatMessages] = useState(
    getInitialAiChatMessages,
  );

  const [flightTripType, setFlightTripType] = useState("oneway");
  const [flightFrom, setFlightFrom] = useState("");
  const [flightTo, setFlightTo] = useState("");
  const [flightFromError, setFlightFromError] = useState("");
  const [flightToError, setFlightToError] = useState("");
  const [flightDepartureDate, setFlightDepartureDate] = useState("");
  const [flightReturnDate, setFlightReturnDate] = useState("");

  const [adults, setAdults] = useState(0);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [cabinClass, setCabinClass] = useState("Economy");
  const [showTravellerDropdown, setShowTravellerDropdown] = useState(false);
  const travellerFieldRef = useRef(null);

  const [multiCityLegs, setMultiCityLegs] = useState(() => [
    createMultiCityLeg("", "", 0),
    createMultiCityLeg("", "", 2),
  ]);

  const [busTripType, setBusTripType] = useState("oneway");
  const [busFrom, setBusFrom] = useState("");
  const [busTo, setBusTo] = useState("");
  const [busFromError, setBusFromError] = useState("");
  const [busToError, setBusToError] = useState("");
  const [busDepartureDate, setBusDepartureDate] = useState("");
  const [busReturnDate, setBusReturnDate] = useState("");

  const [hotelDestination, setHotelDestination] = useState("");
  const [hotelDestinationError, setHotelDestinationError] = useState("");
  const [hotelCheckInDate, setHotelCheckInDate] = useState("");
  const [hotelCheckOutDate, setHotelCheckOutDate] = useState("");
  const [hotelRooms, setHotelRooms] = useState(1);
  const [hotelAdults, setHotelAdults] = useState(2);
  const [hotelChildren, setHotelChildren] = useState(0);
  const [showHotelGuestsDropdown, setShowHotelGuestsDropdown] = useState(false);
  const hotelGuestsFieldRef = useRef(null);

  const [featuredOffers, setFeaturedOffers] = useState([]);
  const [featuredOffersLoading, setFeaturedOffersLoading] = useState(false);
  const [featuredOffersError, setFeaturedOffersError] = useState("");
  const [popularRoutes, setPopularRoutes] = useState([]);
  const [popularRoutesLoading, setPopularRoutesLoading] = useState(false);
  const [popularRoutesError, setPopularRoutesError] = useState("");
  const [popularFlights, setPopularFlights] = useState([]);
  const [popularFlightsLoading, setPopularFlightsLoading] = useState(false);
  const [popularFlightsError, setPopularFlightsError] = useState("");
  const [isDealsDialogOpen, setIsDealsDialogOpen] = useState(false);

  useEffect(() => {
    const tab = normalizeHomeTab(searchParams.get("tab"));
    setActiveTab(tab);
  }, [searchParams]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        travellerFieldRef.current &&
        !travellerFieldRef.current.contains(event.target)
      ) {
        setShowTravellerDropdown(false);
      }

      if (
        hotelGuestsFieldRef.current &&
        !hotelGuestsFieldRef.current.contains(event.target)
      ) {
        setShowHotelGuestsDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setShowTravellerDropdown(false);
    setShowHotelGuestsDropdown(false);
  }, [activeTab, flightTripType]);

  useEffect(() => {
    if (!isDealsDialogOpen || typeof document === "undefined") {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isDealsDialogOpen]);

  const dealsDialog =
    isDealsDialogOpen && typeof document !== "undefined"
      ? createPortal(
          <div
            className="deals-dialog-backdrop"
            role="presentation"
            onClick={() => setIsDealsDialogOpen(false)}
          >
            <section
              className="deals-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="deals-dialog-title"
              onClick={(event) => event.stopPropagation()}
            >
              <header className="deals-dialog-header">
                <div>
                  <span className="section-kicker">This Week</span>
                  <h2 id="deals-dialog-title">All Featured Deals</h2>
                </div>
                <button
                  type="button"
                  className="deals-dialog-close"
                  onClick={() => setIsDealsDialogOpen(false)}
                  aria-label="Close deals"
                >
                  <X size={18} />
                  <span>Close</span>
                </button>
              </header>
              <div className="deals-dialog-grid">
                {featuredOffers.map((offer) => (
                  <article className="offer-card deals-dialog-card" key={offer.id}>
                    <FeaturedOfferImage offer={offer} />
                    <div className="offer-content">
                      <h3>{offer.title}</h3>
                      <p>{offer.description || offer.subtitle}</p>
                      {offer.couponCode ? (
                        <span className="offer-code">Code: {offer.couponCode}</span>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => handleOfferBooking(offer)}
                      >
                        Book now
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>,
          document.body,
        )
      : null;

  useEffect(() => {
    if (!isAiChatOpen || !aiChatMessagesRef.current) {
      return;
    }

    aiChatMessagesRef.current.scrollTop =
      aiChatMessagesRef.current.scrollHeight;
  }, [isAiChatOpen, aiChatMessages, isAiTyping]);

  useEffect(
    () => () => {
      if (aiReplyTimerRef.current) {
        clearTimeout(aiReplyTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    let isMounted = true;

    const loadFeaturedOffers = async () => {
      setFeaturedOffersLoading(true);
      setFeaturedOffersError("");

      try {
        const bookingType =
          activeTab === "buses"
            ? "Bus"
            : activeTab === "hotels"
              ? "Hotel"
              : "Flight";
        const response = await getActiveOffers(bookingType);
        const activeOffers = getFeaturedOffersPayload(response)
          .map(normalizeFeaturedOffer)
          .filter((offer) => offer.isActive);

        if (isMounted) {
          setFeaturedOffers(activeOffers);
        }
      } catch (error) {
        if (isMounted) {
          setFeaturedOffersError("Unable to load featured offers.");
        }
      } finally {
        if (isMounted) {
          setFeaturedOffersLoading(false);
        }
      }
    };

    loadFeaturedOffers();
    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  useEffect(() => {
    let isMounted = true;

    const loadPopularRoutes = async () => {
      setPopularRoutesLoading(true);
      setPopularRoutesError("");

      try {
        const routes = await getPopularBusRoutesFromSearchHistory({ limit: 12 });

        if (isMounted) {
          if (routes && routes.length > 0) {
            setPopularRoutes(routes);
          } else {
            setPopularRoutes(FALLBACK_BUS_ROUTES);
          }
        }
      } catch (error) {
        if (isMounted) {
          setPopularRoutes(FALLBACK_BUS_ROUTES);
        }
      } finally {
        if (isMounted) {
          setPopularRoutesLoading(false);
        }
      }
    };

    loadPopularRoutes();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadPopularFlights = async () => {
      setPopularFlightsLoading(true);
      setPopularFlightsError("");

      try {
        const routes = await listHotFlightRoutes();
        if (isMounted) {
          if (routes && routes.length > 0) {
            const mapped = routes.map((route, index) => {
              const from = route.fromCity || "Hyderabad";
              const to = route.toCity || "Bengaluru";
              const searches =
                Number(route.searchCount || route.bookingCount || route.score) ||
                620 + index * 115;
              return {
                id: route.routeId || `flight-hot-${index}`,
                route: `${from} to ${to}`,
                fromCity: from,
                toCity: to,
                summary: "Trending from flight search history",
                searches,
              };
            });
            setPopularFlights(mapped);
          } else {
            setPopularFlights(POPULAR_FLIGHTS);
          }
        }
      } catch (error) {
        if (isMounted) {
          setPopularFlights(POPULAR_FLIGHTS);
        }
      } finally {
        if (isMounted) {
          setPopularFlightsLoading(false);
        }
      }
    };

    loadPopularFlights();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSwapFlights = () => {
    setFlightFrom(flightTo);
    setFlightTo(flightFrom);
  };

  const handleBookingTabChange = (nextTab) => {
    const normalizedTab = normalizeHomeTab(nextTab);
    setActiveTab(normalizedTab);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("tab", normalizedTab);
    setSearchParams(nextParams, { replace: true });
  };

  const handleSwapBuses = () => {
    setBusFrom(busTo);
    setBusTo(busFrom);
  };

  const openPopularBusRoutes = () => {
    setActiveTab("buses");
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("tab", "buses");
    setSearchParams(nextParams, { replace: true });

    window.setTimeout(() => {
      document
        .querySelector(".hero-section")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  const changeAdults = (delta) => {
    setAdults((previous) => {
      const next = Math.min(9, Math.max(0, previous + delta));

      if (next === 0) {
        setChildren(0);
        setInfants(0);
        return 0;
      }

      setInfants((previousInfants) => Math.min(previousInfants, next));
      return next;
    });
  };

  const changeChildren = (delta) => {
    setChildren((previous) => Math.min(8, Math.max(0, previous + delta)));
  };

  const changeInfants = (delta) => {
    setInfants((previous) => {
      const candidate = previous + delta;
      return Math.max(0, Math.min(adults, candidate));
    });
  };

  const changeHotelRooms = (delta) => {
    setHotelRooms((previous) => Math.min(8, Math.max(1, previous + delta)));
  };

  const changeHotelAdults = (delta) => {
    setHotelAdults((previous) => Math.min(16, Math.max(1, previous + delta)));
  };

  const changeHotelChildren = (delta) => {
    setHotelChildren((previous) => Math.min(8, Math.max(0, previous + delta)));
  };

  const updateMultiCityLeg = (legId, field, value) => {
    setMultiCityLegs((previousLegs) =>
      previousLegs.map((leg) =>
        leg.id === legId ? { ...leg, [field]: value } : leg,
      ),
    );
  };

  const addMultiCityLeg = () => {
    setMultiCityLegs((previousLegs) => {
      const lastLeg = previousLegs[previousLegs.length - 1];
      const defaultFrom = lastLeg ? lastLeg.to : "";

      return [
        ...previousLegs,
        createMultiCityLeg(defaultFrom, "Mumbai", previousLegs.length + 1),
      ];
    });
  };

  const removeMultiCityLeg = (legId) => {
    setMultiCityLegs((previousLegs) =>
      previousLegs.length === 1
        ? previousLegs
        : previousLegs.filter((leg) => leg.id !== legId),
    );
  };

  const isFlightTwoWay = flightTripType === "twoway";
  const isBusTwoWay = busTripType === "twoway";
  const travellerSummary = formatTravellerSummary(adults, children, infants);
  const hasTravellerSelection = Boolean(travellerSummary);
  const hotelGuestSummary = formatHotelGuestSummary(
    hotelRooms,
    hotelAdults,
    hotelChildren,
  );

  const navigateToFlightSearch = (flightPayload) => {
    const flightParams = new URLSearchParams();

    Object.entries(flightPayload).forEach(([key, value]) => {
      if (typeof value === "string" && value.trim()) {
        flightParams.set(key, value.trim());
      }
    });

    navigate(
      `/search/flights${
        flightParams.toString() ? `?${flightParams.toString()}` : ""
      }`,
      { state: flightPayload },
    );
  };

  const navigateToBusSearch = (busPayload) => {
    const busParams = new URLSearchParams();

    Object.entries(busPayload).forEach(([key, value]) => {
      if (typeof value === "string" && value.trim()) {
        busParams.set(key, value.trim());
      }
    });

    navigate(
      `/search/buses${busParams.toString() ? `?${busParams.toString()}` : ""}`,
      { state: busPayload },
    );
  };

  const navigateToHotelSearch = (hotelPayload) => {
    const hotelParams = new URLSearchParams();

    Object.entries(hotelPayload).forEach(([key, value]) => {
      if (typeof value === "string" && value.trim()) {
        hotelParams.set(key, value.trim());
      }
    });

    navigate(
      `/search/hotels${
        hotelParams.toString() ? `?${hotelParams.toString()}` : ""
      }`,
      { state: hotelPayload },
    );
  };

  const handleOfferBooking = (offer) => {
    setIsDealsDialogOpen(false);
    setSelectedOffer(offer);

    let source = "";
    let destination = "";
    let travelDate = getDateInputValue(0);

    if (offer.conditions && Array.isArray(offer.conditions)) {
      const activeConditions = offer.conditions.filter((c) => c.isActive !== false);

      const sourceCond = activeConditions.find((c) => c.conditionType === "SourceCity");
      if (sourceCond) {
        source = sourceCond.value1;
      }

      const destCond = activeConditions.find((c) => c.conditionType === "DestinationCity");
      if (destCond) {
        destination = destCond.value1;
      }

      const dateCond = activeConditions.find((c) => c.conditionType === "TravelDate");
      if (dateCond) {
        if (dateCond.value1) {
          travelDate = dateCond.value1;
        }
      }
    }

    if (offer.bookingType === "bus" || offer.bookingType === "Bus") {
      navigateToBusSearch({
        source,
        destination,
        tripType: "oneway",
        departureDate: travelDate,
      });
      return;
    }

    if (offer.bookingType === "hotel" || offer.bookingType === "Hotel") {
      navigateToHotelSearch({
        destination: destination || source || "Hyderabad",
        checkInDate: travelDate,
        checkOutDate: getDateInputValue(1),
        rooms: "1",
        adults: "2",
        children: "0",
        guests: "1 Room, 2 Adults",
      });
      return;
    }

    navigateToFlightSearch({
      source,
      destination,
      tripType: "oneway",
      departureDate: travelDate,
      travellers: "1 Adult",
      cabinClass: "Economy",
    });
  };

  const handlePopularRouteBooking = (route) => {
    navigateToBusSearch({
      source: route.fromCity,
      destination: route.toCity,
      tripType: "oneway",
      departureDate: getDateInputValue(0),
    });
  };

  const handlePopularFlightBooking = (popularFlight) => {
    const [sourceRaw, destinationRaw] = String(popularFlight.route || "").split(/\s+to\s+/i);
    const source = popularFlight.fromCity || sourceRaw?.trim() || "Delhi";
    const destination = popularFlight.toCity || destinationRaw?.trim() || "Mumbai";

    navigateToFlightSearch({
      source,
      destination,
      tripType: "oneway",
      departureDate: getDateInputValue(0),
      travellers: "1 Adult",
      cabinClass: "Economy",
    });
  };

  const handlePopularHotelBooking = (hotel) => {
    navigateToHotelSearch({
      destination: hotel.city,
      checkInDate: getDateInputValue(0),
      checkOutDate: getDateInputValue(1),
      rooms: "1",
      adults: "2",
      children: "0",
      guests: "1 Room, 2 Adults",
    });
  };

  const handleBusFromChange = (value) => {
    setBusFrom(value);
    if (value.trim()) {
      setBusFromError("");
    }
  };

  const handleBusToChange = (value) => {
    setBusTo(value);
    if (value.trim()) {
      setBusToError("");
    }
  };

  const handleFlightFromChange = (value) => {
    setFlightFrom(value);
    if (value.trim()) {
      setFlightFromError("");
    }
  };

  const handleFlightToChange = (value) => {
    setFlightTo(value);
    if (value.trim()) {
      setFlightToError("");
    }
  };

  const handleHotelDestinationChange = (value) => {
    setHotelDestination(value);
    if (value.trim()) {
      setHotelDestinationError("");
    }
  };

  const handleSearch = () => {
    if (activeTab === "hotels") {
      const destinationVal = hotelDestination.trim();

      if (!destinationVal) {
        setHotelDestinationError("Destination city is required.");
        return;
      }

      setHotelDestinationError("");
      navigateToHotelSearch({
        destination: destinationVal,
        checkInDate: hotelCheckInDate.trim(),
        checkOutDate: hotelCheckOutDate.trim(),
        rooms: String(hotelRooms),
        adults: String(hotelAdults),
        children: String(hotelChildren),
        guests: formatHotelGuestSummary(hotelRooms, hotelAdults, hotelChildren),
      });
      return;
    }

    if (activeTab === "flights") {
      const isMultiCity = flightTripType === "multicity";
      let hasError = false;

      if (isMultiCity) {
        multiCityLegs.forEach(leg => {
          if (!leg.from.trim() || !leg.to.trim()) {
            hasError = true;
          }
        });
        if (hasError) {
          alert("Please fill all source and destination cities for multi-city legs.");
          return;
        }
      } else {
        const fromVal = flightFrom.trim();
        const toVal = flightTo.trim();

        if (!fromVal) {
          setFlightFromError("Source city is required.");
          hasError = true;
        } else {
          setFlightFromError("");
        }

        if (!toVal) {
          setFlightToError("Destination city is required.");
          hasError = true;
        } else {
          setFlightToError("");
        }

        if (hasError) {
          return;
        }
      }

      const source = isMultiCity ? multiCityLegs[0]?.from || "" : flightFrom;
      const destination = isMultiCity
        ? multiCityLegs[multiCityLegs.length - 1]?.to || ""
        : flightTo;
      const departureDate = isMultiCity
        ? multiCityLegs[0]?.departureDate || ""
        : flightDepartureDate;

      const flightPayload = {
        source: source.trim(),
        destination: destination.trim(),
        tripType: flightTripType,
        departureDate: departureDate.trim(),
        returnDate: flightTripType === "twoway" ? flightReturnDate.trim() : "",
        travellers: travellerSummary,
        cabinClass,
      };
      navigateToFlightSearch(flightPayload);
      return;
    }

    const fromVal = busFrom.trim();
    const toVal = busTo.trim();

    let hasError = false;
    if (!fromVal) {
      setBusFromError("Source city is required.");
      hasError = true;
    } else {
      setBusFromError("");
    }

    if (!toVal) {
      setBusToError("Destination city is required.");
      hasError = true;
    } else {
      setBusToError("");
    }

    if (hasError) {
      return;
    }

    const busPayload = {
      source: fromVal,
      destination: toVal,
      tripType: busTripType,
      departureDate: busDepartureDate.trim(),
      returnDate: busTripType === "twoway" ? busReturnDate.trim() : "",
    };
    navigateToBusSearch(busPayload);
  };

  const handleAiChatSubmit = (event) => {
    event.preventDefault();

    const trimmedInput = aiChatInput.trim();
    if (!trimmedInput) {
      return;
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmedInput,
    };

    setAiChatMessages((previous) => [...previous, userMessage]);
    setAiChatInput("");
    setIsAiTyping(true);

    if (aiReplyTimerRef.current) {
      clearTimeout(aiReplyTimerRef.current);
    }

    aiReplyTimerRef.current = setTimeout(() => {
      const assistantReply = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text: getStaticAiReply(trimmedInput),
      };

      setAiChatMessages((previous) => [...previous, assistantReply]);
      setIsAiTyping(false);
      aiReplyTimerRef.current = null;
    }, 460);
  };

  const handleAiChatReset = () => {
    if (aiReplyTimerRef.current) {
      clearTimeout(aiReplyTimerRef.current);
      aiReplyTimerRef.current = null;
    }

    setIsAiTyping(false);
    setAiChatInput("");
    setAiChatMessages(getInitialAiChatMessages());
  };

  const canResetAiChat =
    isAiTyping || aiChatInput.trim().length > 0 || aiChatMessages.length > 1;

  const travellerField = (
    <div className="field traveller-field" ref={travellerFieldRef}>
      <label>Travellers</label>
      <button
        type="button"
        className={`traveller-trigger ${showTravellerDropdown ? "open" : ""}`}
        onClick={() => setShowTravellerDropdown((previous) => !previous)}
      >
        <span
          className={`traveller-summary ${
            hasTravellerSelection ? "" : "placeholder"
          }`}
        >
          <Users size={16} />
          <span>
            {hasTravellerSelection ? travellerSummary : "Select travellers"}
          </span>
        </span>
        <ChevronDown
          size={16}
          className={`traveller-caret ${showTravellerDropdown ? "open" : ""}`}
        />
      </button>

      {showTravellerDropdown && (
        <div className="traveller-dropdown">
          <div className="counter-row">
            <div className="counter-copy">
              <strong>Adults</strong>
              <span>12 years and above</span>
            </div>
            <div className="counter-box">
              <button
                type="button"
                onClick={() => changeAdults(-1)}
                disabled={adults <= 0}
              >
                <Minus size={14} />
              </button>
              <span>{adults}</span>
              <button type="button" onClick={() => changeAdults(1)}>
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="counter-row">
            <div className="counter-copy">
              <strong>Child</strong>
              <span>2 to 11 years</span>
            </div>
            <div className="counter-box">
              <button
                type="button"
                onClick={() => changeChildren(-1)}
                disabled={children <= 0}
              >
                <Minus size={14} />
              </button>
              <span>{children}</span>
              <button
                type="button"
                onClick={() => changeChildren(1)}
                disabled={adults <= 0}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="counter-row">
            <div className="counter-copy">
              <strong>Infant</strong>
              <span>Under 2 years</span>
            </div>
            <div className="counter-box">
              <button
                type="button"
                onClick={() => changeInfants(-1)}
                disabled={infants <= 0}
              >
                <Minus size={14} />
              </button>
              <span>{infants}</span>
              <button
                type="button"
                onClick={() => changeInfants(1)}
                disabled={adults <= 0 || infants >= adults}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          <button
            type="button"
            className="traveller-done"
            onClick={() => setShowTravellerDropdown(false)}
          >
            Done
          </button>
        </div>
      )}
    </div>
  );

  const hotelGuestField = (
    <div className="field traveller-field hotel-guests-field" ref={hotelGuestsFieldRef}>
      <label>Rooms & Guests</label>
      <button
        type="button"
        className={`traveller-trigger ${showHotelGuestsDropdown ? "open" : ""}`}
        onClick={() => setShowHotelGuestsDropdown((previous) => !previous)}
      >
        <span className="traveller-summary">
          <BedDouble size={16} />
          <span>{hotelGuestSummary}</span>
        </span>
        <ChevronDown
          size={16}
          className={`traveller-caret ${showHotelGuestsDropdown ? "open" : ""}`}
        />
      </button>

      {showHotelGuestsDropdown && (
        <div className="traveller-dropdown hotel-guests-dropdown">
          <div className="counter-row">
            <div className="counter-copy">
              <strong>Rooms</strong>
              <span>Hotel rooms required</span>
            </div>
            <div className="counter-box">
              <button
                type="button"
                onClick={() => changeHotelRooms(-1)}
                disabled={hotelRooms <= 1}
              >
                <Minus size={14} />
              </button>
              <span>{hotelRooms}</span>
              <button type="button" onClick={() => changeHotelRooms(1)}>
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="counter-row">
            <div className="counter-copy">
              <strong>Adults</strong>
              <span>12 years and above</span>
            </div>
            <div className="counter-box">
              <button
                type="button"
                onClick={() => changeHotelAdults(-1)}
                disabled={hotelAdults <= 1}
              >
                <Minus size={14} />
              </button>
              <span>{hotelAdults}</span>
              <button type="button" onClick={() => changeHotelAdults(1)}>
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="counter-row">
            <div className="counter-copy">
              <strong>Children</strong>
              <span>0 to 11 years</span>
            </div>
            <div className="counter-box">
              <button
                type="button"
                onClick={() => changeHotelChildren(-1)}
                disabled={hotelChildren <= 0}
              >
                <Minus size={14} />
              </button>
              <span>{hotelChildren}</span>
              <button type="button" onClick={() => changeHotelChildren(1)}>
                <Plus size={14} />
              </button>
            </div>
          </div>

          <button
            type="button"
            className="traveller-done"
            onClick={() => setShowHotelGuestsDropdown(false)}
          >
            Done
          </button>
        </div>
      )}
    </div>
  );

  const classField = (
    <div className="field class-field">
      <label>Class</label>
      <div className="control-wrap class-control-wrap">
        <select
          value={cabinClass}
          onChange={(event) => setCabinClass(event.target.value)}
          className="field-control"
        >
          {CLASS_OPTIONS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  const homeContent = HOME_MODE_CONTENT[activeTab] || HOME_MODE_CONTENT.flights;
  const HomeModeIcon = homeContent.Icon;

  return (
    <div className={`homepage homepage-${homeContent.mode}`}>
      <style>{`
        /* Custom Popular Route Card Embedded Styles */
        .pop-route-card {
           box-sizing: border-box;
           background: #ffffff;
           border: 1px solid rgba(225, 230, 235, 0.9);
           border-radius: 16px;
           padding: 16px;
           width: 280px;
           display: flex;
           flex-direction: column;
           box-shadow: 0 4px 12px rgba(6, 24, 44, 0.04);
           transition: transform 0.2s, box-shadow 0.2s;
           text-align: left;
        }

        .pop-route-card:hover {
           transform: translateY(-2px);
           box-shadow: 0 6px 18px rgba(6, 24, 44, 0.08);
        }

        .pop-route-top-row {
           display: flex;
           justify-content: space-between;
           align-items: center;
           width: 100%;
        }

        .pop-route-tag-search {
           background: #e14e2a;
           color: #ffffff;
           padding: 3px 10px;
           border-radius: 999px;
           font-size: 0.65rem;
           font-weight: 800;
           letter-spacing: 0.04em;
        }

        .pop-route-tag-searches {
           background: #fdf2e9;
           color: #b73e21;
           border: 1px solid #f9dbce;
           padding: 2px 8px;
           border-radius: 999px;
           font-size: 0.65rem;
           font-weight: 700;
        }

        .pop-route-cities-row {
           display: flex;
           align-items: center;
           justify-content: space-between;
           margin-top: 16px;
           width: 100%;
           gap: 8px;
        }

        .pop-route-city {
           font-size: 1.05rem;
           font-weight: 700;
           color: #1e2c3a;
           white-space: nowrap;
           overflow: hidden;
           text-overflow: ellipsis;
           flex: 1;
        }

        .pop-route-city.from {
           text-align: left;
           text-transform: capitalize;
        }

        .pop-route-city.to {
           text-align: right;
           text-transform: capitalize;
        }

        .pop-route-icon-circle {
           width: 28px;
           height: 28px;
           min-width: 28px;
           min-height: 28px;
           border-radius: 50%;
           border: 1px solid #f9dbce;
           background: #fdf2e9;
           display: flex;
           align-items: center;
           justify-content: center;
           color: #e14e2a;
           margin: 0 4px;
        }

        .pop-route-trending {
           color: #7a8c9e;
           font-size: 0.72rem;
           margin-top: 10px;
           font-weight: 500;
        }

        .pop-route-meta-row {
           display: flex;
           justify-content: space-between;
           align-items: center;
           margin-top: 16px;
           width: 100%;
           border-top: 1px dashed rgba(225, 230, 235, 0.8);
           padding-top: 12px;
        }

        .pop-route-meta-left {
           color: #e14e2a;
           font-size: 0.68rem;
           font-weight: 700;
           letter-spacing: 0.02em;
        }

        .pop-route-book-btn {
           background: #e14e2a;
           color: #ffffff;
           font-weight: 700;
           font-size: 0.8rem;
           letter-spacing: 0.06em;
           border: none;
           border-radius: 8px;
           width: 100%;
           padding: 10px 0;
           cursor: pointer;
           text-align: center;
           margin-top: 14px;
           transition: background 0.2s, transform 0.1s;
        }

        .pop-route-book-btn:hover {
           background: #b73e21;
        }

        .pop-route-book-btn:active {
           transform: scale(0.98);
        }

         .popular-routes-marquee .marquee-slide {
            width: 300px;
            padding: 12px 20px 12px 0;
         }

         /* Custom Offers Scrollable Row and Selected Highlighting */
         .offers-scroll-row {
           display: flex;
           gap: 24px;
           overflow-x: auto;
           padding: 12px 4px 20px;
           scroll-behavior: smooth;
         }
         .offers-scroll-row::-webkit-scrollbar {
           height: 8px;
         }
         .offers-scroll-row::-webkit-scrollbar-track {
           background: rgba(0, 0, 0, 0.03);
           border-radius: 10px;
         }
         .offers-scroll-row::-webkit-scrollbar-thumb {
           background: rgba(0, 0, 0, 0.1);
           border-radius: 10px;
         }
         .offers-scroll-row::-webkit-scrollbar-thumb:hover {
           background: rgba(0, 0, 0, 0.2);
         }
         .offer-card {
           position: relative;
           min-width: 320px;
           max-width: 320px;
           flex-shrink: 0;
           transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
         }
         .offer-card-selected {
           border: 2px solid #10b981 !important;
           box-shadow: 0 12px 24px rgba(16, 185, 129, 0.15) !important;
           transform: translateY(-2px);
         }
         .offer-badge-applied {
           position: absolute;
           top: 12px;
           right: 12px;
           background: #10b981;
           color: #ffffff;
           font-size: 0.75rem;
           font-weight: 700;
           padding: 4px 10px;
           border-radius: 999px;
           box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3);
           z-index: 10;
         }
         /* Skeleton loaders style */
         .offer-skeleton-card {
           min-width: 320px;
           height: 380px;
           background: #ffffff;
           border: 1px solid rgba(225, 230, 235, 0.9);
           border-radius: 16px;
           padding: 16px;
           display: flex;
           flex-direction: column;
           gap: 12px;
           box-shadow: 0 4px 12px rgba(6, 24, 44, 0.04);
         }
         .skeleton-image {
           height: 160px;
           background: linear-gradient(90deg, #f2f2f2 25%, #e6e6e6 37%, #f2f2f2 63%);
           background-size: 400% 100%;
           animation: skeleton-loading 1.4s ease infinite;
           border-radius: 12px;
         }
         .skeleton-title {
           height: 24px;
           width: 70%;
           background: linear-gradient(90deg, #f2f2f2 25%, #e6e6e6 37%, #f2f2f2 63%);
           background-size: 400% 100%;
           animation: skeleton-loading 1.4s ease infinite;
           border-radius: 4px;
         }
         .skeleton-desc {
           height: 16px;
           width: 90%;
           background: linear-gradient(90deg, #f2f2f2 25%, #e6e6e6 37%, #f2f2f2 63%);
           background-size: 400% 100%;
           animation: skeleton-loading 1.4s ease infinite;
           border-radius: 4px;
         }
         .skeleton-button {
           height: 40px;
           width: 100%;
           background: linear-gradient(90deg, #f2f2f2 25%, #e6e6e6 37%, #f2f2f2 63%);
           background-size: 400% 100%;
           animation: skeleton-loading 1.4s ease infinite;
           border-radius: 8px;
           margin-top: auto;
         }
         @keyframes skeleton-loading {
           0% {
             background-position: 100% 50%;
           }
           100% {
             background-position: 0% 50%;
           }
         }
      `}</style>
      <section className="hero-section">
        <div className="hero-content">
          {/* Left-aligned Heading and Point Tags */}
          <div className="hero-header-left">
            <h1 className="hero-title-left">{homeContent.heroTitle}</h1>
            <div className="hero-tag-row-left">
              {homeContent.heroTags.map((tag) => (
                <span className="hero-tag-left" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="hero-grid">
            <div className="search-panel">
              <div className="tabs-wrap">
                <div className="tabs" role="tablist" aria-label="Booking type">
                  <button
                    type="button"
                    className={`tab ${activeTab === "flights" ? "active" : ""}`}
                    onClick={() => handleBookingTabChange("flights")}
                  >
                    <Plane size={17} />
                    <span>Flights</span>
                  </button>

                  <button
                    type="button"
                    className={`tab ${activeTab === "buses" ? "active" : ""}`}
                    onClick={() => handleBookingTabChange("buses")}
                  >
                    <Bus size={17} />
                    <span>Buses</span>
                  </button>

                  <button
                    type="button"
                    className={`tab ${activeTab === "hotels" ? "active" : ""}`}
                    onClick={() => handleBookingTabChange("hotels")}
                  >
                    <Building2 size={17} />
                    <span>Hotels</span>
                  </button>
                </div>
              </div>

              {activeTab === "flights" ? (
                <div className="booking-content">
                  <div
                    className="trip-switch"
                    role="tablist"
                    aria-label="Flight trip type"
                  >
                    {FLIGHT_TRIP_TYPES.map((tripType) => (
                      <button
                        key={tripType.value}
                        type="button"
                        className={`trip-chip ${
                          flightTripType === tripType.value ? "active" : ""
                        }`}
                        onClick={() => setFlightTripType(tripType.value)}
                      >
                        {tripType.label}
                      </button>
                    ))}
                  </div>

                  {flightTripType === "multicity" ? (
                    <div className="multi-city-list">
                      {multiCityLegs.map((leg) => (
                        <div className="multi-city-row" key={leg.id}>
                          <PlaceAutocomplete
                            label="Source"
                            value={leg.from}
                            onChange={(nextValue) =>
                              updateMultiCityLeg(leg.id, "from", nextValue)
                            }
                            tripType="flight"
                            field="from"
                            placeholder="Source"
                          />

                          <PlaceAutocomplete
                            label="Destination"
                            value={leg.to}
                            onChange={(nextValue) =>
                              updateMultiCityLeg(leg.id, "to", nextValue)
                            }
                            tripType="flight"
                            field="to"
                            placeholder="Destination"
                          />

                          <div className="field field-with-icon" style={{ position: "relative" }}>
                            <label>Departure</label>
                            <div className="control-wrap">
                              <CalendarDays size={18} />
                              <input
                                type="text"
                                readOnly
                                value={toDisplayDate(leg.departureDate)}
                                placeholder="DD-MM-YYYY"
                                className="field-control with-leading-icon"
                                style={{ cursor: "pointer" }}
                                onClick={() => document.getElementById(`leg-dep-date-${leg.id}`).showPicker?.()}
                              />
                            </div>
                            <input
                              id={`leg-dep-date-${leg.id}`}
                              type="date"
                              value={leg.departureDate}
                              onChange={(event) =>
                                updateMultiCityLeg(
                                  leg.id,
                                  "departureDate",
                                  event.target.value
                                )
                              }
                              style={{ position: "absolute", opacity: 0, width: 0, height: 0, pointerEvents: "none" }}
                            />
                          </div>

                          <div
                            className="multi-actions"
                            aria-label="Multi-city row actions"
                          >
                            <button
                              type="button"
                              className="action-circle action-add"
                              onClick={addMultiCityLeg}
                              title="Add row"
                            >
                              <Plus size={16} />
                            </button>

                            <button
                              type="button"
                              className="action-circle action-delete"
                              onClick={() => removeMultiCityLeg(leg.id)}
                              title="Delete row"
                              disabled={multiCityLegs.length === 1}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      ))}

                      <div className="multi-footer-row">
                        {travellerField}
                        {classField}
                      </div>
                    </div>
                  ) : (
                    <div className={`search-grid standard-grid ${isFlightTwoWay ? "two-way" : "one-way"}`}>
                      <PlaceAutocomplete
                        label="Source"
                        value={flightFrom}
                        onChange={handleFlightFromChange}
                        tripType="flight"
                        field="from"
                        placeholder="Source"
                        error={flightFromError}
                        className="source-field"
                      />

                      <div className="swap-field">
                        <button
                          type="button"
                          className="swap-btn"
                          onClick={handleSwapFlights}
                          aria-label="Swap flight origin and destination"
                        >
                          <ArrowLeftRight size={16} />
                        </button>
                      </div>

                      <PlaceAutocomplete
                        label="Destination"
                        value={flightTo}
                        onChange={handleFlightToChange}
                        tripType="flight"
                        field="to"
                        placeholder="Destination"
                        error={flightToError}
                        className="destination-field"
                      />

                      <div className="field field-with-icon departure-field" style={{ position: "relative" }}>
                        <label>Departure</label>
                        <div className="control-wrap">
                          <CalendarDays size={18} />
                          <input
                            type="text"
                            readOnly
                            value={toDisplayDate(flightDepartureDate)}
                            placeholder="DD-MM-YYYY"
                            className="field-control with-leading-icon"
                            style={{ cursor: "pointer" }}
                            onClick={() => document.getElementById("flight-dep-date").showPicker?.()}
                          />
                        </div>
                        <input
                          id="flight-dep-date"
                          type="date"
                          value={flightDepartureDate}
                          onChange={(event) => setFlightDepartureDate(event.target.value)}
                          style={{ position: "absolute", opacity: 0, width: 0, height: 0, pointerEvents: "none" }}
                        />
                      </div>

                      {isFlightTwoWay && (
                        <div className="field field-with-icon return-field" style={{ position: "relative" }}>
                          <label>Return</label>
                          <div className="control-wrap">
                            <CalendarDays size={18} />
                            <input
                              type="text"
                              readOnly
                              value={toDisplayDate(flightReturnDate)}
                              placeholder="DD-MM-YYYY"
                              className="field-control with-leading-icon"
                              style={{ cursor: "pointer" }}
                              onClick={() => document.getElementById("flight-ret-date").showPicker?.()}
                            />
                            <input
                              id="flight-ret-date"
                              type="date"
                              value={flightReturnDate}
                              onChange={(event) => setFlightReturnDate(event.target.value)}
                              style={{ position: "absolute", opacity: 0, width: 0, height: 0, pointerEvents: "none" }}
                            />
                          </div>
                        </div>
                      )}

                      {travellerField}
                      {classField}
                    </div>
                  )}
                </div>
              ) : activeTab === "buses" ? (
                <div className="booking-content">
                  <div
                    className="trip-switch"
                    role="tablist"
                    aria-label="Bus trip type"
                  >
                    {BUS_TRIP_TYPES.map((tripType) => (
                      <button
                        key={tripType.value}
                        type="button"
                        className={`trip-chip ${
                          busTripType === tripType.value ? "active" : ""
                        }`}
                        onClick={() => setBusTripType(tripType.value)}
                      >
                        {tripType.label}
                      </button>
                    ))}
                  </div>

                  <div className={`search-grid bus-standard-grid ${isBusTwoWay ? "two-way" : "one-way"}`}>
                    <PlaceAutocomplete
                      label="Source"
                      value={busFrom}
                      onChange={handleBusFromChange}
                      tripType="bus"
                      field="from"
                      placeholder="Source"
                      error={busFromError}
                      className="source-field"
                    />

                    <div className="swap-field">
                      <button
                        type="button"
                        className="swap-btn"
                        onClick={handleSwapBuses}
                        aria-label="Swap bus origin and destination"
                      >
                        <ArrowLeftRight size={16} />
                      </button>
                    </div>

                    <PlaceAutocomplete
                      label="Destination"
                      value={busTo}
                      onChange={handleBusToChange}
                      tripType="bus"
                      field="to"
                      placeholder="Destination"
                      error={busToError}
                      className="destination-field"
                    />

                    <div className="field field-with-icon departure-field" style={{ position: "relative" }}>
                      <label>Departure</label>
                      <div className="control-wrap">
                        <CalendarDays size={18} />
                        <input
                          type="text"
                          readOnly
                          value={toDisplayDate(busDepartureDate)}
                          placeholder="DD-MM-YYYY"
                          className="field-control with-leading-icon"
                          style={{ cursor: "pointer" }}
                          onClick={() => document.getElementById("bus-dep-date").showPicker?.()}
                        />
                      </div>
                      <input
                        id="bus-dep-date"
                        type="date"
                        value={busDepartureDate}
                        onChange={(event) => setBusDepartureDate(event.target.value)}
                        style={{ position: "absolute", opacity: 0, width: 0, height: 0, pointerEvents: "none" }}
                      />
                    </div>

                    {isBusTwoWay && (
                      <div className="field field-with-icon return-field" style={{ position: "relative" }}>
                        <label>Return</label>
                        <div className="control-wrap">
                          <CalendarDays size={18} />
                          <input
                            type="text"
                            readOnly
                            value={toDisplayDate(busReturnDate)}
                            placeholder="DD-MM-YYYY"
                            className="field-control with-leading-icon"
                            style={{ cursor: "pointer" }}
                            onClick={() => document.getElementById("bus-ret-date").showPicker?.()}
                          />
                          <input
                            id="bus-ret-date"
                            type="date"
                            value={busReturnDate}
                            onChange={(event) => setBusReturnDate(event.target.value)}
                            style={{ position: "absolute", opacity: 0, width: 0, height: 0, pointerEvents: "none" }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="booking-content hotel-booking-content">
                  <div className="search-grid hotel-standard-grid">
                    <PlaceAutocomplete
                      label="Destination"
                      value={hotelDestination}
                      onChange={handleHotelDestinationChange}
                      tripType="hotel"
                      field="destination"
                      placeholder="City or hotel area"
                      error={hotelDestinationError}
                      className="hotel-destination-field"
                    />

                    <div className="field field-with-icon checkin-field" style={{ position: "relative" }}>
                      <label>Check-in</label>
                      <div className="control-wrap">
                        <CalendarDays size={18} />
                        <input
                          type="text"
                          readOnly
                          value={toDisplayDate(hotelCheckInDate)}
                          placeholder="DD-MM-YYYY"
                          className="field-control with-leading-icon"
                          style={{ cursor: "pointer" }}
                          onClick={() => document.getElementById("hotel-checkin-date").showPicker?.()}
                        />
                      </div>
                      <input
                        id="hotel-checkin-date"
                        type="date"
                        value={hotelCheckInDate}
                        onChange={(event) => setHotelCheckInDate(event.target.value)}
                        style={{ position: "absolute", opacity: 0, width: 0, height: 0, pointerEvents: "none" }}
                      />
                    </div>

                    <div className="field field-with-icon checkout-field" style={{ position: "relative" }}>
                      <label>Check-out</label>
                      <div className="control-wrap">
                        <CalendarDays size={18} />
                        <input
                          type="text"
                          readOnly
                          value={toDisplayDate(hotelCheckOutDate)}
                          placeholder="DD-MM-YYYY"
                          className="field-control with-leading-icon"
                          style={{ cursor: "pointer" }}
                          onClick={() => document.getElementById("hotel-checkout-date").showPicker?.()}
                        />
                      </div>
                      <input
                        id="hotel-checkout-date"
                        type="date"
                        value={hotelCheckOutDate}
                        onChange={(event) => setHotelCheckOutDate(event.target.value)}
                        style={{ position: "absolute", opacity: 0, width: 0, height: 0, pointerEvents: "none" }}
                      />
                    </div>

                    {hotelGuestField}
                  </div>
                </div>
              )}

              <button
                type="button"
                className="search-btn"
                onClick={handleSearch}
              >
                <Search size={16} />
                <span>Search</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="offers-section section-shell">
        <div className="section-header offers-header">
          <div>
            <span className="section-kicker">This Week</span>
            <h2>Featured Offers</h2>
          </div>
          <button
            type="button"
            className="section-link"
            onClick={() => setIsDealsDialogOpen(true)}
            disabled={featuredOffers.length === 0}
          >
            View all deals
          </button>
        </div>
        {featuredOffersLoading ? (
          <div className="offers-scroll-row">
            {[1, 2, 3].map((n) => (
              <div key={n} className="offer-skeleton-card">
                <div className="skeleton-image"></div>
                <div className="skeleton-title"></div>
                <div className="skeleton-desc"></div>
                <div className="skeleton-button"></div>
              </div>
            ))}
          </div>
        ) : featuredOffersError ? (
          <div className="offers-error">{featuredOffersError}</div>
        ) : featuredOffers.length === 0 ? (
          <div className="offers-empty">No featured offers available.</div>
        ) : (
          <div className="offers-scroll-row">
            {featuredOffers.map((offer) => (
                <article
                  className="offer-card"
                  key={offer.id}
                >
                  {false && (
                    <span className="offer-badge-applied">
                      Applied ✓
                    </span>
                  )}
                  <FeaturedOfferImage offer={offer} />
                  <div className="offer-content">
                    <h3>{offer.title}</h3>
                    <p>{offer.description || offer.subtitle}</p>
                    {offer.couponCode ? (
                      <span className="offer-code">Code: {offer.couponCode}</span>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => handleOfferBooking(offer)}
                    >
                      Book now
                    </button>
                  </div>
                </article>
            ))}
          </div>
        )}
      </section>

      <section className="insights-section section-shell">
        <div className="insights-banner">
          <div className="insights-copy">
            <h2>{homeContent.insightsTitle}</h2>
            <p>{homeContent.insightsText}</p>
          </div>

          <div className="insights-grid">
            {homeContent.highlights.map((item) => {
              const Icon = item.icon;

              return (
                <article key={item.id} className="insight-card">
                  <span className="insight-icon">
                    <Icon size={22} />
                  </span>
                  <div>
                    <strong>{item.value}</strong>
                    <p>{item.title}</p>
                    <span>{item.text}</span>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {activeTab === "buses" && (
      <section className="popular-routes-section section-shell">
        <div className="section-header">
          <div>
            <span className="section-kicker">POPULAR BUS ROUTES</span>
            <h2>Most Booked Bus Routes</h2>
          </div>
        </div>

        {popularRoutesLoading ? (
          <div className="popular-routes-loading">Loading popular routes...</div>
        ) : popularRoutesError ? (
          <div className="popular-routes-error">{popularRoutesError}</div>
        ) : popularRoutes.length === 0 ? (
          <div className="popular-routes-empty">No popular routes available.</div>
        ) : (
          <AutoMarquee
            items={popularRoutes}
            className="popular-routes-marquee"
            duration={36}
            renderItem={(route) => (
              <article
                className="pop-route-card"
                key={route.id}
                role="button"
                tabIndex={0}
                onClick={() => handlePopularRouteBooking(route)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handlePopularRouteBooking(route);
                  }
                }}
              >
                <div className="pop-route-top-row">
                  <span className="pop-route-tag-search">SEARCH</span>
                  <span className="pop-route-tag-searches">{route.searches.toLocaleString()} SEARCHES</span>
                </div>
                
                <div className="pop-route-cities-row">
                  <span className="pop-route-city from" title={route.fromCity}>
                    {route.fromCity}
                  </span>
                  <div className="pop-route-icon-circle">
                    <Bus size={13} />
                  </div>
                  <span className="pop-route-city to" title={route.toCity}>
                    {route.toCity}
                  </span>
                </div>

                <div className="pop-route-trending">
                  Trending from bus search history
                </div>

                <div className="pop-route-meta-row">
                  <span className="pop-route-meta-left">Recently searched</span>
                </div>

                <button
                  type="button"
                  className="pop-route-book-btn"
                  onClick={(event) => {
                    event.stopPropagation();
                    handlePopularRouteBooking(route);
                  }}
                >
                  BOOK BUS
                </button>
              </article>
            )}
          />
        )}
      </section>
      )}

      {dealsDialog}

      {activeTab === "buses" && (
      <section
        className="popular-buses-section section-shell"
        id="popular-buses"
      >
        <div className="section-header">
          <div>
            <span className="section-kicker">Popular Buses</span>
            <h2>RTC Bus Corporations</h2>
          </div>
        </div>

        <div className="rtc-carousel-wrap">
          <AutoMarquee
            items={POPULAR_RTC_OPERATORS}
            className="rtc-marquee"
            duration={34}
            renderItem={(operator) => (
              <article
                key={operator.id}
                className="rtc-card"
                style={{ backgroundImage: `url(${operator.background})` }}
              >
                <div className="rtc-card-overlay" />
                <div className="rtc-card-logo">
                  <img src={operator.logo} alt={`${operator.shortName} logo`} />
                </div>
                <div className="rtc-card-content">
                  <h3>{operator.shortName}</h3>
                  <p>{operator.name}</p>
                  <button
                    type="button"
                    onClick={() => openPopularBusRoutes(operator.id)}
                  >
                    Book Now
                  </button>
                </div>
              </article>
            )}
          />
        </div>
      </section>
      )}

      {activeTab === "flights" && (
      <>
      <section className="popular-section section-shell">
        <div className="section-header">
          <div>
            <span className="section-kicker">Popular Picks</span>
            <h2>Trending Flight Routes</h2>
          </div>
        </div>

        {popularFlightsLoading ? (
          <div className="popular-routes-loading">Loading popular flights...</div>
        ) : popularFlightsError ? (
          <div className="popular-routes-error">{popularFlightsError}</div>
        ) : popularFlights.length === 0 ? (
          <div className="popular-routes-empty">No popular flights available.</div>
        ) : (
          <AutoMarquee
            items={popularFlights}
            className="popular-routes-marquee flight-routes-marquee"
            duration={38}
            renderItem={(flight) => (
              <article className="pop-route-card pop-flight-card" key={flight.id}>
                <div className="pop-route-top-row">
                  <span className="pop-route-tag-search">SEARCH</span>
                  <span className="pop-route-tag-searches">
                    {(flight.searches || 0).toLocaleString()} SEARCHES
                  </span>
                </div>

                <div className="pop-route-cities-row">
                  <span className="pop-route-city from" title={flight.fromCity}>
                    {flight.fromCity}
                  </span>
                  <div className="pop-route-icon-circle">
                    <Plane size={13} />
                  </div>
                  <span className="pop-route-city to" title={flight.toCity}>
                    {flight.toCity}
                  </span>
                </div>

                <div className="pop-route-trending">
                  Trending from flight search history
                </div>

                <div className="pop-route-meta-row">
                  <span className="pop-route-meta-left">Recently searched</span>
                </div>

                <button
                  type="button"
                  className="pop-route-book-btn"
                  onClick={() => handlePopularFlightBooking(flight)}
                >
                  BOOK FLIGHT
                </button>
              </article>
            )}
          />
        )}
      </section>

      <section className="brands-section section-shell">
        <div className="section-header">
          <div>
            <span className="section-kicker">Trusted Partners</span>
            <h2>Airline Brands</h2>
          </div>
        </div>

        <AutoMarquee
          items={AIRLINE_BRANDS}
          className="brand-marquee"
          duration={30}
          renderItem={(brand) => (
            <article className="brand-slide">
              <img
                src={brand.image}
                alt={brand.name}
                className="brand-logo"
                style={{ "--brand-scale": brand.scale }}
              />
              <span>{brand.name}</span>
            </article>
          )}
        />
      </section>
      </>
      )}

      {activeTab === "hotels" && (
      <section className="popular-section hotel-popular-section section-shell">
        <div className="section-header">
          <div>
            <span className="section-kicker">Popular Stays</span>
            <h2>Trending Hotel Picks</h2>
          </div>
        </div>

        <AutoMarquee
          items={POPULAR_HOTELS}
          className="popular-routes-marquee hotel-routes-marquee"
          duration={38}
          renderItem={(hotel) => (
            <article className="pop-route-card pop-hotel-card" key={hotel.id}>
              <div className="pop-route-top-row">
                <span className="pop-route-tag-search">STAY</span>
                <span className="pop-route-tag-searches">
                  {hotel.searches.toLocaleString()} SEARCHES
                </span>
              </div>

              <div className="hotel-card-city-row">
                <span className="hotel-card-icon">
                  <Building2 size={15} />
                </span>
                <div>
                  <strong>{hotel.name}</strong>
                  <span>{hotel.city}</span>
                </div>
              </div>

              <p className="hotel-card-summary">{hotel.summary}</p>

              <div className="pop-route-meta-row">
                <span className="pop-route-meta-left">From INR {hotel.price}</span>
              </div>

              <button
                type="button"
                className="pop-route-book-btn"
                onClick={() => handlePopularHotelBooking(hotel)}
              >
                BOOK HOTEL
              </button>
            </article>
          )}
        />
      </section>
      )}

      <section className="travel-services-section section-shell">
        <div className="section-header">
          <div>
            <span className="section-kicker">Booking Services</span>
            <h2>{homeContent.serviceHeading}</h2>
          </div>
        </div>

        <div className="travel-services-grid">
          {homeContent.services.map((block) => (
            <article
              className={`travel-service-card ${block.visual}`}
              key={block.id}
            >
              <div className="travel-service-copy">
                <span className="service-kicker">{block.kicker}</span>
                <h3>{block.title}</h3>
                <p>{block.text}</p>
                <ul
                  className={
                    block.id === "fares"
                      ? "service-pill-list"
                      : "service-check-list"
                  }
                >
                  {block.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>

              <div className="travel-service-visual">
                <span className="service-spark one" aria-hidden="true" />
                <span className="service-spark two" aria-hidden="true" />
                <span className="service-spark three" aria-hidden="true" />
                <img
                  className="travel-service-image"
                  src={block.image}
                  alt={block.imageAlt}
                  loading="lazy"
                />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="booking-guide-section section-shell">
        <div className="section-header">
          <div>
            <span className="section-kicker">Booking Guide</span>
            <h2>{homeContent.guideHeading}</h2>
          </div>
        </div>

        <div className="booking-guide-hero">
          <div className="booking-guide-visual" aria-hidden="true">
            <div className="booking-route-map">
              <span className="route-node start">From</span>
              <span className="route-line" />
              <span className="route-bus">
                <HomeModeIcon size={18} />
              </span>
              <span className="route-node end">To</span>
            </div>
            <div className="booking-visual-steps">
              {homeContent.bookingSteps.map((step, index) => (
                <span key={step.id} style={{ "--step-index": index }}>
                  {step.title}
                </span>
              ))}
            </div>
          </div>

          <div className="booking-guide-copy">
            <p>{homeContent.guideIntro}</p>
            <div className="booking-step-grid">
              {homeContent.bookingSteps.map((step, index) => (
                <article className="booking-step-card" key={step.id}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </article>
              ))}
            </div>
          </div>
        </div>

        <div className="booking-note-grid">
          {homeContent.guideNotes.map((item) => (
            <article className="booking-note-card" key={item.id}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="assurance-section section-shell">
        <div className="assurance-banner">
          <div className="assurance-panel">
            <span className="assurance-badge">
              <ShieldCheck size={17} />
              {homeContent.assuranceBadge}
            </span>

            <div className="assurance-list">
              {homeContent.assurancePoints.map((item) => {
                const Icon = item.icon;

                return (
                  <article className="assurance-item" key={item.id}>
                    <span className="assurance-icon">
                      <Icon size={18} />
                    </span>
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.text}</p>
                    </div>
                  </article>
                );
              })}
            </div>

            <p className="assurance-ending">
              {homeContent.assuranceEnding}
            </p>
          </div>

          <div className="assurance-visual" aria-hidden="true">
            <span className="assurance-glow" />

            <div className="assurance-story-board">
              <div className="assurance-map-card">
                <div className="assurance-map-header">
                  <span>{homeContent.assuranceMapLabel}</span>
                  <strong>3 checks passed</strong>
                </div>
                <div className="assurance-map-path">
                  <span className="map-pin source">Start</span>
                  <span className="map-line" />
                  <span className="map-bus">
                    <HomeModeIcon size={24} />
                  </span>
                  <span className="map-pin destination">Arrive</span>
                </div>
                <div className="assurance-map-grid">
                  <span />
                  <span />
                  <span />
                </div>
              </div>

              <div className="assurance-proof-grid">
                {homeContent.assuranceProofs.map(([title, text], index) => {
                  const proofIcons = [ShieldCheck, Clock3, RefreshCw, Search];
                  const ProofIcon = proofIcons[index] || ShieldCheck;
                  const proofClasses = ["verified", "timing", "support", "ticket"];

                  return (
                    <div
                      className={`assurance-proof-card ${proofClasses[index] || "verified"}`}
                      key={title}
                    >
                      <span className="assurance-proof-icon">
                        <ProofIcon size={index === 0 ? 20 : 18} />
                      </span>
                      <div>
                        <strong>{title}</strong>
                        <span>{text}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="reviews-section section-shell">
        <div className="section-header">
          <div>
            <span className="section-kicker">Customer Voices</span>
            <h2>What Travelers Say</h2>
          </div>
        </div>

        <AutoMarquee
          items={homeContent.reviews}
          className="review-marquee"
          duration={36}
          renderItem={(review) => (
            <article className="review-slide">
              <div className="review-slide-top">
                <MessageSquareText size={14} />
                <span className="review-type">{review.type}</span>
              </div>
              <p>{review.comment}</p>
              <div className="review-slide-footer">
                <strong>{review.author}</strong>
                <span>{review.rating}</span>
              </div>
            </article>
          )}
        />
      </section>

      <section className="signup-section section-shell">
        <div className="signup-card">
          <div className="signup-copy">
            <h2>Sign Up For Exclusive Offers</h2>
            <p>Exclusive access to coupons, special offers and promotions.</p>
          </div>
 
          <form
            className="signup-form"
            onSubmit={(event) => event.preventDefault()}
          >
            <label className="signup-field signup-email-field">
              <span>Email Address</span>
              <input type="email" placeholder="Enter your email address" />
            </label>
            <label className="signup-field signup-mobile-field">
              <span>Mobile Number</span>
              <input type="tel" placeholder="Enter your mobile no." />
            </label>
            <button type="submit">SUBMIT</button>
          </form>
        </div>
      </section>
 

      <section className="india-booking-section section-shell">
        <div className="india-faq-block">
          <div className="section-header india-static-header">
            <div>
              <span className="section-kicker">Help Center</span>
              <h2>{homeContent.faqHeading}</h2>
            </div>
            <button type="button" className="india-faq-link">
              View all FAQs
            </button>
          </div>

          <div className="india-faq-list">
            {homeContent.faqs.map((item) => (
              <details className="india-faq-item" key={item.id}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </div>

          <div className="india-app-card">
          <div className="india-app-mark" aria-hidden="true">
            <HomeModeIcon size={42} />
            <span>APP</span>
          </div>

          <div className="india-app-copy">
            <span className="section-kicker">{homeContent.appKicker}</span>
            <h2>{homeContent.appTitle}</h2>
            <p>{homeContent.appText}</p>
            <div className="india-offer-chip">{homeContent.appOffer}</div>
          </div>

          <div className="india-app-side">
            <ul className="india-app-benefits">
              {homeContent.appBenefits.map((benefit) => (
                <li key={benefit}>{benefit}</li>
              ))}
            </ul>

            <div className="india-app-qr" aria-label="App QR code">
              <div className="india-app-qr-code" aria-hidden="true">
                {Array.from({ length: 49 }, (_, index) => (
                  <span
                    key={index}
                    className={
                      [0, 2, 3, 6, 7, 9, 12, 14, 17, 18, 20, 22, 24, 27, 28, 31, 33, 35, 37, 38, 41, 43, 45, 46, 48].includes(index)
                        ? "filled"
                        : undefined
                    }
                  />
                ))}
              </div>
              <strong>Scan QR</strong>
              <span>Get app link</span>
            </div>

            <div className="india-app-downloads" aria-label="Mobile app download links">
              <a className="store-badge play-store-badge" href="#google-play" aria-label="Get it on Google Play">
                <img
                  className="store-badge-img google-play-badge-img"
                  src="https://commons.wikimedia.org/wiki/Special:Redirect/file/Google_Play_Store_badge_EN.svg"
                  alt="Get it on Google Play"
                  loading="lazy"
                />
              </a>

              <a className="store-badge app-store-badge" href="#app-store" aria-label="Download on the App Store">
                <img
                  className="store-badge-img app-store-badge-img"
                  src="https://commons.wikimedia.org/wiki/Special:Redirect/file/Download_on_the_App_Store_Badge_US-UK_RGB_blk.svg"
                  alt="Download on the App Store"
                  loading="lazy"
                />
              </a>
            </div>
          </div>
        </div>

        <div className="india-about-block">
          <h2>{homeContent.aboutTitle}</h2>
          {homeContent.aboutParagraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>

      <div className={`home-ai-chat ${isAiChatOpen ? "open" : "closed"}`}>
        <button
          type="button"
          className="home-ai-toggle"
          aria-expanded={isAiChatOpen}
          aria-controls="home-ai-chat-panel"
          aria-label={isAiChatOpen ? "Close AI chat" : "Open AI chat"}
          onClick={() => setIsAiChatOpen((previous) => !previous)}
        >
          <span className="home-ai-toggle-line" aria-hidden="true" />
          {isAiChatOpen ? (
            <ChevronRight size={12} />
          ) : (
            <ChevronLeft size={12} />
          )}
        </button>

        {isAiChatOpen && (
          <aside
            className="home-ai-chat-panel"
            id="home-ai-chat-panel"
            aria-label="Travel AI Assistant"
          >
            <div className="home-ai-cameo" aria-hidden="true">
              <span className="home-ai-cameo-halo" />
              <span className="home-ai-cameo-orbit home-ai-cameo-orbit-a" />
              <span className="home-ai-cameo-orbit home-ai-cameo-orbit-b" />
              <span className="home-ai-cameo-core">AI</span>
            </div>

            <div className="home-ai-chat-head">
              <div className="home-ai-chat-head-copy">
                <strong>AI Concierge</strong>
                <span className="home-ai-chat-status">
                  Static assistant preview
                </span>
              </div>
              <button
                type="button"
                className="home-ai-reset-btn"
                onClick={handleAiChatReset}
                disabled={!canResetAiChat}
              >
                Reset
              </button>
            </div>

            <div className="home-ai-chat-messages" ref={aiChatMessagesRef}>
              {aiChatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`home-ai-chat-message ${
                    message.role === "user" ? "user" : "assistant"
                  }`}
                >
                  {message.text}
                </div>
              ))}

              {isAiTyping && (
                <div className="home-ai-chat-message assistant typing">
                  <span />
                  <span />
                  <span />
                </div>
              )}
            </div>

            <form className="home-ai-chat-form" onSubmit={handleAiChatSubmit}>
              <input
                type="text"
                value={aiChatInput}
                onChange={(event) => setAiChatInput(event.target.value)}
                placeholder="Ask Travel AI..."
                maxLength={220}
              />
              <button type="submit">Send</button>
            </form>
          </aside>
        )}
      </div>

    </div>
  );
}
