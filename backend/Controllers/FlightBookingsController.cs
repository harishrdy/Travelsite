using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using PickNBook.Api.Data;
using PickNBook.Api.Models;
using PickNBook.Api.Models.DTOs;
using PickNBook.Api.Services;

namespace PickNBook.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class FlightBookingsController(
    AppDbContext dbContext,
    IBookingNotificationService bookingNotificationService,
    ILogger<FlightBookingsController> logger) : BaseApiController
    {
        //private const string UserIdHeaderName = "X-User-Id";
        private static readonly TimeSpan IndiaOffset = TimeSpan.FromHours(5.5);
        private static readonly string[] AllowedPassengerTypes = ["Adult", "Child", "Infant"];
        private static readonly string[] AllowedPassengerGenders = ["Male", "Female", "Other"];
        private static readonly string[] DynamicCities =
        [
            "Delhi", "Mumbai", "Bengaluru", "Chennai", "Hyderabad",
        "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Kochi"
        ];
        private static readonly (string Name, string Code)[] DynamicAirlines =
        [
            ("Air India", "AI"),
        ("IndiGo", "6E"),
        ("Vistara", "UK"),
        ("Akasa Air", "QP"),
        ("SpiceJet", "SG"),
        ("Air India Express", "IX")
        ];
        private static readonly (int Hour, int Minute)[] DynamicFlightSlots = [(6, 20), (12, 10), (19, 35)];
        private static readonly Dictionary<string, int> ClassSeatConfig = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Economy"] = 120,
            ["Premium Economy"] = 24,
            ["Business"] = 18,
            ["Premium Business"] = 12,
            ["First Class"] = 8
        };
        private static readonly Dictionary<string, decimal> ClassPriceMultiplier = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Economy"] = 1.00m,
            ["Premium Economy"] = 1.35m,
            ["Business"] = 2.00m,
            ["Premium Business"] = 2.40m,
            ["First Class"] = 3.20m
        };
        private static readonly string[] AllowedTravelClasses =
        [
            "Economy",
        "Premium Economy",
        "Business",
        "Premium Business",
        "First Class"
        ];

        [HttpGet]
        public async Task<IActionResult> SearchFlights(
            [FromQuery] string? fromCity = null,
            [FromQuery] string? toCity = null,
            [FromQuery] DateOnly? date = null,
            [FromQuery] string? travelClass = null,
            [FromQuery] string? tripType = null,
            [FromQuery] DateOnly? returnDate = null,
            [FromQuery(Name = "from")] string? from = null,
            [FromQuery(Name = "to")] string? to = null,
            [FromQuery(Name = "class")] string? travelClassAlias = null,
            [FromQuery] int adults = 1,
            [FromQuery] int children = 0,
            [FromQuery] int infants = 0)
        {
            var query = dbContext.FlightBookings.AsNoTracking().AsQueryable();
            var requestedFrom = string.IsNullOrWhiteSpace(fromCity) ? from : fromCity;
            var requestedTo = string.IsNullOrWhiteSpace(toCity) ? to : toCity;
            var requestedClass = string.IsNullOrWhiteSpace(travelClass) ? travelClassAlias : travelClass;
            var normalizedClass = ResolveTravelClass(requestedClass);

            if (date.HasValue)
            {
                await EnsureFlightSchedulesForDateAsync(date.Value, requestedFrom?.Trim(), requestedTo?.Trim());
            }

            if (!string.IsNullOrWhiteSpace(requestedFrom) && !string.IsNullOrWhiteSpace(requestedTo))
            {
                await IncrementFlightRouteSearchCounterAsync(
                    requestedFrom.Trim(),
                    requestedTo.Trim(),
                    GetOptionalUserId(),
                    date,
                    returnDate,
                    string.IsNullOrWhiteSpace(tripType) ? "OneWay" : tripType.Trim(),
                    adults,
                    children,
                    infants);
            }

            if (!string.IsNullOrWhiteSpace(requestedClass) && normalizedClass is null)
            {
                return BadRequest($"Invalid travelClass. Allowed values: {string.Join(", ", AllowedTravelClasses)}.");
            }

            if (!string.IsNullOrWhiteSpace(requestedFrom))
            {
                var fromValue = requestedFrom.Trim();
                query = query.Where(x => EF.Functions.Like(x.FromCity, fromValue));
            }

            if (!string.IsNullOrWhiteSpace(requestedTo))
            {
                var toValue = requestedTo.Trim();
                query = query.Where(x => EF.Functions.Like(x.ToCity, toValue));
            }

            if (date.HasValue)
            {
                var (startUtc, endUtc) = GetUtcRangeForIstDate(date.Value);
                query = query.Where(x => x.DepartureTime >= startUtc && x.DepartureTime < endUtc);
            }

            var flights = await query
                .OrderBy(x => x.DepartureTime)
                .Take(200)
                .ToListAsync();

            if (flights.Count == 0)
            {
                return Ok(Array.Empty<object>());
            }

            var flightIds = flights.Select(x => x.Id).ToList();
            var classInventories = await dbContext.FlightClassInventories
                .AsNoTracking()
                .Where(x => flightIds.Contains(x.FlightBookingId))
                .ToListAsync();

            var classInventoryByFlight = classInventories
                .GroupBy(x => x.FlightBookingId)
                .ToDictionary(x => x.Key, x => x.OrderBy(c => ClassSortOrder(c.TravelClass)).ToList());

            var response = new List<object>();
            foreach (var flight in flights)
            {
                if (!classInventoryByFlight.TryGetValue(flight.Id, out var classOptions) || classOptions.Count == 0)
                {
                    continue;
                }

                FlightClassInventory? selectedClassInventory;
                if (normalizedClass is not null)
                {
                    selectedClassInventory = classOptions.FirstOrDefault(x => x.TravelClass.Equals(normalizedClass, StringComparison.OrdinalIgnoreCase));
                    if (selectedClassInventory is null || selectedClassInventory.AvailableSeats <= 0)
                    {
                        continue;
                    }
                }
                else
                {
                    selectedClassInventory = classOptions.FirstOrDefault(x => x.TravelClass.Equals("Economy", StringComparison.OrdinalIgnoreCase))
                        ?? classOptions.FirstOrDefault(x => x.AvailableSeats > 0)
                        ?? classOptions.First();
                }

                response.Add(new
                {
                    flight.Id,
                    flight.FlightNumber,
                    flight.Airline,
                    flight.FromCity,
                    flight.ToCity,
                    DepartureTimeUtc = flight.DepartureTime,
                    ArrivalTimeUtc = flight.ArrivalTime,
                    DepartureTimeIst = ToIst(flight.DepartureTime),
                    ArrivalTimeIst = ToIst(flight.ArrivalTime),
                    flight.CabinClass,
                    SelectedTravelClass = selectedClassInventory.TravelClass,
                    SelectedTravelClassPriceInr = selectedClassInventory.PriceInr,
                    SelectedTravelClassAvailableSeats = selectedClassInventory.AvailableSeats,
                    SelectedTravelClassTotalSeats = selectedClassInventory.TotalSeats,
                    TotalAvailableSeats = flight.AvailableSeats,
                    TotalSeats = flight.TotalSeats,
                    SupportedTravelClasses = classOptions.Select(x => x.TravelClass).ToArray(),
                    ClassOptions = classOptions.Select(x => new
                    {
                        x.TravelClass,
                        x.PriceInr,
                        x.AvailableSeats,
                        x.TotalSeats
                    }).ToArray()
                });
            }

            return Ok(response);
        }

        [HttpGet("hot-routes")]
        public async Task<IActionResult> GetHotRoutes([FromQuery] string metric = "score")
        {
            var normalizedMetric = metric.Trim().ToLowerInvariant();
            if (normalizedMetric is not ("score" or "search" or "booking"))
            {
                return BadRequest("metric must be one of: score, search, booking.");
            }

            var stats = await dbContext.FlightRouteStats
                .AsNoTracking()
                .ToListAsync();

            var ranked = normalizedMetric switch
            {
                "search" => stats.OrderByDescending(x => x.SearchCount).ThenByDescending(x => x.BookingCount),
                "booking" => stats.OrderByDescending(x => x.BookingCount).ThenByDescending(x => x.SearchCount),
                _ => stats.OrderByDescending(x => x.SearchCount + (x.BookingCount * 3)).ThenByDescending(x => x.BookingCount)
            };

            var response = ranked
                .Take(10)
                .Select(x => new
                {
                    x.FromCity,
                    x.ToCity,
                    x.SearchCount,
                    x.BookingCount,
                    Score = x.SearchCount + (x.BookingCount * 3),
                    x.LastSearchedAtUtc,
                    x.LastBookedAtUtc
                });

            return Ok(response);
        }

        [HttpGet("{flightId:int}/seats")]
        public async Task<IActionResult> GetFlightSeatMap(int flightId, [FromQuery] string travelClass = "Economy")
        {
            var normalizedClass = ResolveTravelClass(travelClass);
            if (normalizedClass is null)
            {
                return BadRequest($"Invalid travelClass. Allowed values: {string.Join(", ", AllowedTravelClasses)}.");
            }

            var flight = await dbContext.FlightBookings
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == flightId);
            if (flight is null)
            {
                return NotFound("Flight not found.");
            }

            var seats = await dbContext.FlightSeats
                .AsNoTracking()
                .Where(x => x.FlightBookingId == flightId && x.TravelClass == normalizedClass)
                .OrderBy(x => x.SeatCode)
                .ToListAsync();

            var booked = seats.Count(x => x.IsBooked);
            var response = new SeatMapResponseDto
            {
                TripId = flightId,
                TripType = "Flight",
                TravelClass = normalizedClass,
                TotalSeats = seats.Count,
                BookedSeats = booked,
                AvailableSeats = seats.Count - booked,
                Seats = seats.Select(x => new SeatMapItemDto
                {
                    SeatCode = x.SeatCode,
                    IsBooked = x.IsBooked
                }).ToList()
            };

            return Ok(response);
        }

        [HttpPost("{flightId:int}/book")]
        public async Task<IActionResult> BookFlight(int flightId, [FromBody] CreateFlightBookingRequestDto request)
        {
            if (!TryGetCurrentUserId(out var userId, out var userIdError))
            {
                return BadRequest(userIdError);
            }

            if (string.IsNullOrWhiteSpace(request.PassengerName) || string.IsNullOrWhiteSpace(request.PassengerPhone))
            {
                return BadRequest("PassengerName and PassengerPhone are required.");
            }

            var passengerValidationError = BuildFlightPassengerManifest(
                request,
                out var passengers,
                out var adults,
                out var children,
                out var infants);

            if (passengerValidationError is not null)
            {
                return BadRequest(passengerValidationError);
            }

            var seatsRequired = adults + children;
            var normalizedClass = ResolveTravelClass(request.TravelClass);

            if (normalizedClass is null && string.IsNullOrWhiteSpace(request.TravelClass))
            {
                normalizedClass = "Economy";
            }

            if (normalizedClass is null)
            {
                return BadRequest($"Invalid travelClass. Allowed values: {string.Join(", ", AllowedTravelClasses)}.");
            }

            var strategy = dbContext.Database.CreateExecutionStrategy();

            try
            {
                return await strategy.ExecuteAsync(async () =>
                {
                    await using var transaction = await dbContext.Database.BeginTransactionAsync();

                    var flight = await dbContext.FlightBookings.FirstOrDefaultAsync(x => x.Id == flightId);
                    if (flight is null)
                        throw new Exception("Flight not found.");

                    if (flight.DepartureTime <= DateTime.UtcNow)
                        throw new Exception("Cannot book a flight that already departed.");

                    var classInventory = await dbContext.FlightClassInventories
                        .FirstOrDefaultAsync(x => x.FlightBookingId == flightId && x.TravelClass == normalizedClass);

                    if (classInventory is null)
                        throw new Exception("Selected travelClass is not available for this flight.");

                    if (classInventory.AvailableSeats < seatsRequired)
                        throw new Exception($"Only {classInventory.AvailableSeats} seats are available in {normalizedClass}.");

                    var seatCodes = await ReserveFlightSeatsAsync(flightId, normalizedClass, seatsRequired);
                    if (seatCodes.Count < seatsRequired)
                        throw new Exception("Not enough seats available in selected class.");

                    classInventory.AvailableSeats -= seatsRequired;
                    flight.AvailableSeats = Math.Max(0, flight.AvailableSeats - seatsRequired);

                    var unitPrice = classInventory.PriceInr;
                    var baseFare = seatsRequired * unitPrice;
                    var convenienceFee = await GetActiveFlightConvenienceFeeAsync(baseFare);

                    var couponCode = string.IsNullOrWhiteSpace(request.CouponCode) ? null : request.CouponCode.Trim();
                    FlightCoupon? appliedCoupon = null;
                    decimal couponAmount = 0m;

                    if (!string.IsNullOrWhiteSpace(couponCode))
                    {
                        var normalizedCoupon = couponCode.Trim().ToUpperInvariant();
                        appliedCoupon = await dbContext.FlightCoupons.FirstOrDefaultAsync(x =>
                            x.CouponCode.ToUpper() == normalizedCoupon);

                        if (appliedCoupon is null)
                            throw new Exception("Invalid coupon code.");

                        if (!appliedCoupon.Status.Equals("Active", StringComparison.OrdinalIgnoreCase))
                            throw new Exception("Coupon is not active.");

                        var todayIst = DateOnly.FromDateTime(DateTime.UtcNow.Add(IndiaOffset));
                        if (todayIst < appliedCoupon.StartDate || todayIst > appliedCoupon.ExpiryDate)
                            throw new Exception("Coupon is not valid for today.");

                        if (appliedCoupon.UseLimit > 0 && appliedCoupon.UsedCount >= appliedCoupon.UseLimit)
                            throw new Exception("Coupon usage limit reached.");

                        couponAmount = CalculateCouponAmount(baseFare, appliedCoupon);
                        appliedCoupon.UsedCount += 1;
                    }

                    var customerFare = baseFare - couponAmount + convenienceFee;
                    if (customerFare < 0)
                    {
                        customerFare = 0;
                    }

                    var reservation = new FlightReservation
                    {
                        BookingReference = $"FL-{DateTime.UtcNow:yyyyMMddHHmmss}-{Random.Shared.Next(100, 1000)}",
                        UserId = userId!,
                        FlightBookingId = flight.Id,
                        PassengerName = request.PassengerName.Trim(),
                        PassengerPhone = request.PassengerPhone.Trim(),
                        PassengerEmail = string.IsNullOrWhiteSpace(request.PassengerEmail) ? null : request.PassengerEmail.Trim(),
                        TravelClass = normalizedClass,
                        Adults = adults,
                        Children = children,
                        Infants = infants,
                        SeatsBooked = seatsRequired,
                        TotalPriceInr = customerFare,
                        CustomerFareInr = customerFare,
                        NetFareInr = baseFare,
                        DiscountAmountInr = couponAmount,
                        ConvenienceFeeInr = convenienceFee,
                        CouponCode = string.IsNullOrWhiteSpace(couponCode) ? null : couponCode.Trim().ToUpperInvariant(),
                        Status = "Booked",
                        BookedAtUtc = DateTime.UtcNow
                    };

                    dbContext.FlightReservations.Add(reservation);
                    await dbContext.SaveChangesAsync();

                    var seatIndex = 0;
                    var reservationPassengers = passengers!.Select(x =>
                    {
                        string? seatNumber = null;
                        if (x.PassengerType != "Infant")
                        {
                            seatNumber = seatCodes[seatIndex];
                            seatIndex++;
                        }

                        return new FlightReservationPassenger
                        {
                            FlightReservationId = reservation.Id,
                            FullName = x.FullName,
                            PassengerType = x.PassengerType,
                            Gender = x.Gender,
                            SeatNumber = seatNumber
                        };
                    }).ToList();

                    dbContext.FlightReservationPassengers.AddRange(reservationPassengers);

                    if (appliedCoupon is not null && couponAmount > 0)
                    {
                        dbContext.FlightCouponUsages.Add(new FlightCouponUsage
                        {
                            FlightReservationId = reservation.Id,
                            CouponCode = appliedCoupon.CouponCode,
                            UsedAtUtc = DateTime.UtcNow,
                            TotalFareInr = customerFare,
                            CouponType = appliedCoupon.CouponType,
                            CouponValue = appliedCoupon.Value,
                            CouponAmountInr = couponAmount,
                            BookingStatus = reservation.Status
                        });
                    }

                    await TrackFlightRouteBookingCounterAsync(flight.FromCity, flight.ToCity);
                    await dbContext.SaveChangesAsync();
                    await transaction.CommitAsync();

                    await TrySendFlightBookingEmailAsync(reservation, flight, reservationPassengers);

                    return CreatedAtAction(
                        nameof(GetFlightBookingById),
                        new { bookingId = reservation.Id },
                        MapFlightReservation(reservation, flight, reservationPassengers));
                });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("bookings")]
        public async Task<IActionResult> GetFlightBookings([FromQuery] string? passengerPhone, [FromQuery] string? status)
        {
            if (!TryGetCurrentUserId(out var userId, out var userIdError))
            {
                return BadRequest(userIdError);
            }

            var query = dbContext.FlightReservations
                .AsNoTracking()
                .Include(x => x.FlightBooking)
                .Where(x => x.UserId == userId)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(passengerPhone))
            {
                var phone = passengerPhone.Trim();
                query = query.Where(x => EF.Functions.Like(x.PassengerPhone, phone));
            }

            if (!string.IsNullOrWhiteSpace(status))
            {
                var normalizedStatus = status.Trim();
                query = query.Where(x => EF.Functions.Like(x.Status, normalizedStatus));
            }

            var bookings = await query
                .OrderByDescending(x => x.BookedAtUtc)
                .Take(200)
                .ToListAsync();

            var bookingIds = bookings.Select(x => x.Id).ToList();
            var passengers = await dbContext.FlightReservationPassengers
                .AsNoTracking()
                .Where(x => bookingIds.Contains(x.FlightReservationId))
                .OrderBy(x => x.Id)
                .ToListAsync();

            var passengersByBooking = passengers
                .GroupBy(x => x.FlightReservationId)
                .ToDictionary(x => x.Key, x => (IReadOnlyList<FlightReservationPassenger>)x.ToList());

            var response = bookings
                .Where(x => x.FlightBooking is not null)
                .Select(x =>
                {
                    if (!passengersByBooking.TryGetValue(x.Id, out var rows))
                    {
                        rows = Array.Empty<FlightReservationPassenger>();
                    }

                    return MapFlightReservation(x, x.FlightBooking!, rows);
                });

            return Ok(response);
        }

        [HttpGet("admin/bookings")]
        public async Task<IActionResult> GetAllFlightBookings([FromQuery] string? passengerPhone, [FromQuery] string? status)
        {
            var query = dbContext.FlightReservations
                .AsNoTracking()
                .Include(x => x.FlightBooking)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(passengerPhone))
            {
                var phone = passengerPhone.Trim();
                query = query.Where(x => EF.Functions.Like(x.PassengerPhone, phone));
            }

            if (!string.IsNullOrWhiteSpace(status))
            {
                var normalizedStatus = status.Trim();
                query = query.Where(x => EF.Functions.Like(x.Status, normalizedStatus));
            }

            var bookings = await query
                .OrderByDescending(x => x.BookedAtUtc)
                .Take(500)
                .ToListAsync();

            var bookingIds = bookings.Select(x => x.Id).ToList();
            var passengers = await dbContext.FlightReservationPassengers
                .AsNoTracking()
                .Where(x => bookingIds.Contains(x.FlightReservationId))
                .OrderBy(x => x.Id)
                .ToListAsync();

            var passengersByBooking = passengers
                .GroupBy(x => x.FlightReservationId)
                .ToDictionary(x => x.Key, x => (IReadOnlyList<FlightReservationPassenger>)x.ToList());

            var response = bookings
                .Where(x => x.FlightBooking is not null)
                .Select(x =>
                {
                    if (!passengersByBooking.TryGetValue(x.Id, out var rows))
                    {
                        rows = Array.Empty<FlightReservationPassenger>();
                    }

                    return MapFlightReservation(x, x.FlightBooking!, rows);
                });

            return Ok(response);
        }

        [HttpGet("bookings/{bookingId:int}")]
        public async Task<IActionResult> GetFlightBookingById(int bookingId)
        {
            if (!TryGetCurrentUserId(out var userId, out var userIdError))
            {
                return BadRequest(userIdError);
            }

            var booking = await dbContext.FlightReservations
                .AsNoTracking()
                .Include(x => x.FlightBooking)
                .FirstOrDefaultAsync(x => x.Id == bookingId && x.UserId == userId);

            if (booking is null || booking.FlightBooking is null)
            {
                return NotFound("Booking not found.");
            }

            var passengers = await dbContext.FlightReservationPassengers
                .AsNoTracking()
                .Where(x => x.FlightReservationId == booking.Id)
                .OrderBy(x => x.Id)
                .ToListAsync();

            return Ok(MapFlightReservation(booking, booking.FlightBooking, passengers));
        }

        [HttpPost("bookings/{bookingId:int}/cancel")]
        public async Task<IActionResult> CancelFlightBooking(int bookingId, [FromQuery] string? reason)
        {
            if (!TryGetCurrentUserId(out var userId, out var userIdError))
            {
                return BadRequest(userIdError);
            }

            var strategy = dbContext.Database.CreateExecutionStrategy();

            try
            {
                return await strategy.ExecuteAsync(async () =>
                {
                    await using var transaction = await dbContext.Database.BeginTransactionAsync();

                    var booking = await dbContext.FlightReservations
                        .Include(x => x.FlightBooking)
                        .FirstOrDefaultAsync(x => x.Id == bookingId && x.UserId == userId);

                    if (booking is null || booking.FlightBooking is null)
                        throw new Exception("Booking not found.");

                    if (booking.Status == "Cancelled")
                        throw new Exception("Booking is already cancelled.");

                    // 🔥 GET PASSENGERS (to release seats)
                    var passengers = await dbContext.FlightReservationPassengers
                        .Where(x => x.FlightReservationId == booking.Id)
                        .ToListAsync();

                    var seatNumbers = passengers
                        .Where(x => !string.IsNullOrWhiteSpace(x.SeatNumber))
                        .Select(x => x.SeatNumber!)
                        .ToList();

                    // 🔥 RELEASE SEATS (CRITICAL FIX)
                    if (seatNumbers.Count > 0)
                    {
                        var seats = await dbContext.FlightSeats
                            .Where(x =>
                                x.FlightBookingId == booking.FlightBookingId &&
                                x.TravelClass == booking.TravelClass &&
                                seatNumbers.Contains(x.SeatCode))
                            .ToListAsync();

                        foreach (var seat in seats)
                        {
                            seat.IsBooked = false;
                        }
                    }

                    // 🔥 UPDATE BOOKING
                    booking.Status = "Cancelled";
                    booking.CancelledAtUtc = DateTime.UtcNow;
                    booking.CancellationReason = string.IsNullOrWhiteSpace(reason)
                        ? "Cancelled by user"
                        : reason.Trim();

                    // 🔥 RESTORE INVENTORY
                    var classInventory = await dbContext.FlightClassInventories
                        .FirstOrDefaultAsync(x =>
                            x.FlightBookingId == booking.FlightBookingId &&
                            x.TravelClass == booking.TravelClass);

                    if (classInventory is null)
                        throw new Exception("Inventory not found.");

                    classInventory.AvailableSeats = Math.Min(
                        classInventory.TotalSeats,
                        classInventory.AvailableSeats + booking.SeatsBooked);

                    booking.FlightBooking.AvailableSeats = Math.Min(
                        booking.FlightBooking.TotalSeats,
                        booking.FlightBooking.AvailableSeats + booking.SeatsBooked);

                    await dbContext.SaveChangesAsync();
                    await transaction.CommitAsync();

                    var resultPassengers = await dbContext.FlightReservationPassengers
                        .AsNoTracking()
                        .Where(x => x.FlightReservationId == booking.Id)
                        .OrderBy(x => x.Id)
                        .ToListAsync();

                    return Ok(MapFlightReservation(booking, booking.FlightBooking, resultPassengers));
                });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        private static object MapFlightReservation(
            FlightReservation reservation,
            FlightBooking flight,
            IReadOnlyList<FlightReservationPassenger> passengers)
        {
            var baseDto = new BookingResponseDto
            {
                BookingId = reservation.Id,
                BookingReference = reservation.BookingReference,
                TripType = "Flight",
                TripId = flight.Id,
                TripNumber = flight.FlightNumber,
                ProviderName = flight.Airline,
                FromCity = flight.FromCity,
                ToCity = flight.ToCity,
                DepartureTimeUtc = flight.DepartureTime,
                ArrivalTimeUtc = flight.ArrivalTime,
                Status = reservation.Status,
                PassengerName = reservation.PassengerName,
                PassengerPhone = reservation.PassengerPhone,
                PassengerEmail = reservation.PassengerEmail,
                TravelClass = reservation.TravelClass,
                Adults = reservation.Adults,
                Children = reservation.Children,
                Infants = reservation.Infants,
                SeatsBooked = reservation.SeatsBooked,
                TotalPriceInr = reservation.TotalPriceInr,
                BookedAtUtc = reservation.BookedAtUtc,
                CancelledAtUtc = reservation.CancelledAtUtc,
                CancellationReason = reservation.CancellationReason
            };

            var passengerDtos = passengers.Select(x => new FlightPassengerResponseDto
            {
                Id = x.Id,
                FullName = x.FullName,
                PassengerType = x.PassengerType,
                Gender = x.Gender,
                SeatNumber = x.SeatNumber
            }).ToList();

            return new
            {
                baseDto.BookingId,
                baseDto.BookingReference,
                baseDto.TripType,
                baseDto.TripId,
                baseDto.TripNumber,
                baseDto.ProviderName,
                baseDto.FromCity,
                baseDto.ToCity,
                baseDto.DepartureTimeUtc,
                baseDto.ArrivalTimeUtc,
                baseDto.Status,
                baseDto.PassengerName,
                baseDto.PassengerPhone,
                baseDto.PassengerEmail,
                baseDto.TravelClass,
                baseDto.Adults,
                baseDto.Children,
                baseDto.Infants,
                baseDto.SeatsBooked,
                baseDto.TotalPriceInr,
                reservation.CustomerFareInr,
                reservation.NetFareInr,
                reservation.DiscountAmountInr,
                reservation.ConvenienceFeeInr,
                reservation.CouponCode,
                baseDto.BookedAtUtc,
                baseDto.CancelledAtUtc,
                baseDto.CancellationReason,
                Passengers = passengerDtos
            };
        }

        private static string? ResolveTravelClass(string? travelClass)
        {
            if (string.IsNullOrWhiteSpace(travelClass))
            {
                return null;
            }

            var value = travelClass.Trim();
            return AllowedTravelClasses.FirstOrDefault(x => x.Equals(value, StringComparison.OrdinalIgnoreCase));
        }

        private static int ClassSortOrder(string travelClass)
        {
            for (var i = 0; i < AllowedTravelClasses.Length; i++)
            {
                if (AllowedTravelClasses[i].Equals(travelClass, StringComparison.OrdinalIgnoreCase))
                {
                    return i;
                }
            }

            return int.MaxValue;
        }

        private static (DateTime StartUtc, DateTime EndUtc) GetUtcRangeForIstDate(DateOnly date)
        {
            var startIst = new DateTimeOffset(date.Year, date.Month, date.Day, 0, 0, 0, IndiaOffset);
            var endIst = startIst.AddDays(1);
            return (startIst.UtcDateTime, endIst.UtcDateTime);
        }

        private static DateTime ToIst(DateTime utcDateTime)
        {
            return DateTime.SpecifyKind(utcDateTime, DateTimeKind.Utc).Add(IndiaOffset);
        }

        private static string? BuildFlightPassengerManifest(
            CreateFlightBookingRequestDto request,
            out List<CreateFlightPassengerDto>? passengers,
            out int adults,
            out int children,
            out int infants)
        {
            passengers = null;
            adults = 0;
            children = 0;
            infants = 0;

            if (request.Passengers is not null && request.Passengers.Count > 0)
            {
                var normalized = new List<CreateFlightPassengerDto>();
                for (var i = 0; i < request.Passengers.Count; i++)
                {
                    var passenger = request.Passengers[i];
                    if (string.IsNullOrWhiteSpace(passenger.FullName))
                    {
                        return $"Passenger at index {i} has invalid FullName.";
                    }

                    var type = AllowedPassengerTypes.FirstOrDefault(x =>
                        x.Equals(passenger.PassengerType?.Trim(), StringComparison.OrdinalIgnoreCase));
                    if (type is null)
                    {
                        return $"Passenger at index {i} has invalid PassengerType. Allowed: {string.Join(", ", AllowedPassengerTypes)}.";
                    }

                    var gender = AllowedPassengerGenders.FirstOrDefault(x =>
                        x.Equals(passenger.Gender?.Trim(), StringComparison.OrdinalIgnoreCase));
                    if (gender is null)
                    {
                        return $"Passenger at index {i} has invalid Gender. Allowed: {string.Join(", ", AllowedPassengerGenders)}.";
                    }

                    normalized.Add(new CreateFlightPassengerDto
                    {
                        FullName = passenger.FullName.Trim(),
                        PassengerType = type,
                        Gender = gender
                    });
                }

                adults = normalized.Count(x => x.PassengerType == "Adult");
                children = normalized.Count(x => x.PassengerType == "Child");
                infants = normalized.Count(x => x.PassengerType == "Infant");

                if (adults == 0 && (children > 0 || infants > 0))
                {
                    return "At least one adult is required when child or infant is present.";
                }

                if (infants > adults)
                {
                    return "Infants cannot be more than adults.";
                }

                if ((adults + children) <= 0)
                {
                    return "At least one seat is required (Adult/Child).";
                }

                passengers = normalized;
                return null;
            }

            if (request.Adults < 0 || request.Children < 0 || request.Infants < 0)
            {
                return "Adults, Children and Infants cannot be negative.";
            }

            if (request.Adults == 0 && (request.Children > 0 || request.Infants > 0))
            {
                return "At least one adult is required when child or infant is present.";
            }

            if (request.Infants > request.Adults)
            {
                return "Infants cannot be more than adults.";
            }

            adults = request.Adults;
            children = request.Children;
            infants = request.Infants;

            if ((adults + children) <= 0)
            {
                return "At least one seat is required (Adult/Child).";
            }

            passengers = new List<CreateFlightPassengerDto>();
            for (var i = 1; i <= adults; i++)
            {
                passengers.Add(new CreateFlightPassengerDto
                {
                    FullName = $"Adult Passenger {i}",
                    PassengerType = "Adult",
                    Gender = "Male"
                });
            }

            for (var i = 1; i <= children; i++)
            {
                passengers.Add(new CreateFlightPassengerDto
                {
                    FullName = $"Child Passenger {i}",
                    PassengerType = "Child",
                    Gender = "Male"
                });
            }

            for (var i = 1; i <= infants; i++)
            {
                passengers.Add(new CreateFlightPassengerDto
                {
                    FullName = $"Infant Passenger {i}",
                    PassengerType = "Infant",
                    Gender = "Male"
                });
            }

            return null;
        }

        private async Task<List<string>> ReserveFlightSeatsAsync(int flightId, string travelClass, int seatCount)
        {
            if (seatCount <= 0)
                return new List<string>();

            // 🔒 Step 1: Lock seats using transaction-level isolation
            var seats = await dbContext.FlightSeats
                .Where(x => x.FlightBookingId == flightId &&
                            x.TravelClass == travelClass &&
                            !x.IsBooked)
               //.OrderBy(x => int.Parse(new string(x.SeatCode.TakeWhile(char.IsDigit).ToArray())))
               .OrderBy(x => x.SeatCode)
                .ThenBy(x => x.SeatCode)
                .Take(seatCount)
                .ToListAsync();

            if (seats.Count < seatCount)
                return new List<string>();

            // 🔒 Step 2: Mark them booked
            foreach (var seat in seats)
            {
                seat.IsBooked = true;
            }

            // 🔒 Step 3: Save inside SAME transaction
            await dbContext.SaveChangesAsync();

            return seats.Select(x => x.SeatCode).ToList();
        }

        private async Task EnsureFlightSchedulesForDateAsync(DateOnly date, string? fromCity, string? toCity)
        {
            var fromCities = string.IsNullOrWhiteSpace(fromCity)
                ? DynamicCities
                : DynamicCities.Where(x => x.Equals(fromCity, StringComparison.OrdinalIgnoreCase)).ToArray();

            var toCities = string.IsNullOrWhiteSpace(toCity)
                ? DynamicCities
                : DynamicCities.Where(x => x.Equals(toCity, StringComparison.OrdinalIgnoreCase)).ToArray();

            if (fromCities.Length == 0 || toCities.Length == 0)
            {
                return;
            }

            var (startUtc, endUtc) = GetUtcRangeForIstDate(date);
            var existingRows = await dbContext.FlightBookings
                .AsNoTracking()
                .Where(x => x.DepartureTime >= startUtc && x.DepartureTime < endUtc)
                .Select(x => new { x.FlightNumber, x.FromCity, x.ToCity, x.DepartureTime })
                .ToListAsync();

            var existingSet = existingRows
                .Select(x => $"{x.FlightNumber}|{x.FromCity}|{x.ToCity}|{x.DepartureTime:O}")
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            var flights = new List<FlightBooking>();
            var totalSeats = ClassSeatConfig.Values.Sum();
            foreach (var from in fromCities)
            {
                foreach (var to in toCities)
                {
                    if (from.Equals(to, StringComparison.OrdinalIgnoreCase))
                    {
                        continue;
                    }

                    foreach (var slot in DynamicFlightSlots)
                    {
                        var keySeed = $"{from}-{to}-{date:yyyyMMdd}-{slot.Hour}:{slot.Minute}";
                        var hash = StableHash(keySeed);
                        var airline = DynamicAirlines[hash % DynamicAirlines.Length];
                        var durationMinutes = 65 + (hash % 170);
                        var depUtc = UtcFromIst(date, slot.Hour, slot.Minute);
                        var flightNumber = $"{airline.Code}-{100 + (hash % 900)}";
                        var key = $"{flightNumber}|{from}|{to}|{depUtc:O}";
                        if (existingSet.Contains(key))
                        {
                            continue;
                        }

                        var economyPrice = decimal.Round(
                            2400m + (durationMinutes * 18m) + (hash % 1800),
                            2,
                            MidpointRounding.AwayFromZero);

                        flights.Add(new FlightBooking
                        {
                            FlightNumber = flightNumber,
                            Airline = airline.Name,
                            FromCity = from,
                            ToCity = to,
                            DepartureTime = depUtc,
                            ArrivalTime = depUtc.AddMinutes(durationMinutes),
                            PriceInr = economyPrice,
                            TotalSeats = totalSeats,
                            AvailableSeats = totalSeats,
                            CabinClass = "MultiClass"
                        });
                    }
                }
            }

            if (flights.Count == 0)
            {
                return;
            }

            await dbContext.FlightBookings.AddRangeAsync(flights);
            await dbContext.SaveChangesAsync();

            var inventories = new List<FlightClassInventory>();
            foreach (var flight in flights)
            {
                foreach (var travelClass in AllowedTravelClasses)
                {
                    var seats = ClassSeatConfig[travelClass];
                    inventories.Add(new FlightClassInventory
                    {
                        FlightBookingId = flight.Id,
                        TravelClass = travelClass,
                        TotalSeats = seats,
                        AvailableSeats = seats,
                        PriceInr = decimal.Round(
                            flight.PriceInr * ClassPriceMultiplier[travelClass],
                            2,
                            MidpointRounding.AwayFromZero)
                    });
                }
            }

            if (inventories.Count > 0)
            {
                await dbContext.FlightClassInventories.AddRangeAsync(inventories);
                await dbContext.SaveChangesAsync();
            }

            var seatsToInsert = new List<FlightSeat>();
            foreach (var flight in flights)
            {
                foreach (var travelClass in AllowedTravelClasses)
                {
                    if (!ClassSeatConfig.TryGetValue(travelClass, out var classSeats) || classSeats <= 0)
                    {
                        continue;
                    }

                    var seatCodes = BuildFlightSeatCodes(classSeats);
                    seatsToInsert.AddRange(seatCodes.Select(seatCode => new FlightSeat
                    {
                        FlightBookingId = flight.Id,
                        TravelClass = travelClass,
                        SeatCode = seatCode,
                        IsBooked = false
                    }));
                }
            }

            if (seatsToInsert.Count > 0)
            {
                await dbContext.FlightSeats.AddRangeAsync(seatsToInsert);
                await dbContext.SaveChangesAsync();
            }
        }

        private static List<string> BuildFlightSeatCodes(int totalSeats)
        {
            var letters = new[] { 'A', 'B', 'C', 'D', 'E', 'F' };
            var seats = new List<string>(totalSeats);
            for (var i = 1; i <= totalSeats; i++)
            {
                var row = ((i - 1) / letters.Length) + 1;
                var letter = letters[(i - 1) % letters.Length];
                seats.Add($"{row}{letter}");
            }

            return seats;
        }

        private static DateTime UtcFromIst(DateOnly date, int hour, int minute)
        {
            var ist = new DateTime(date.Year, date.Month, date.Day, hour, minute, 0, DateTimeKind.Unspecified);
            return DateTime.SpecifyKind(ist - IndiaOffset, DateTimeKind.Utc);
        }

        private static int StableHash(string value)
        {
            unchecked
            {
                var hash = 23;
                foreach (var c in value)
                {
                    hash = (hash * 31) + c;
                }

                return Math.Abs(hash);
            }
        }

        private async Task IncrementFlightRouteSearchCounterAsync(
            string fromCity,
            string toCity,
            string? userId,
            DateOnly? departDate,
            DateOnly? returnDate,
            string tripType,
            int adults,
            int children,
            int infants)
        {
            var stat = await dbContext.FlightRouteStats
                .FirstOrDefaultAsync(x => x.FromCity == fromCity && x.ToCity == toCity);

            if (stat is null)
            {
                dbContext.FlightRouteStats.Add(new FlightRouteStat
                {
                    FromCity = fromCity,
                    ToCity = toCity,
                    SearchCount = 1,
                    BookingCount = 0,
                    LastSearchedAtUtc = DateTime.UtcNow
                });
            }
            else
            {
                stat.SearchCount += 1;
                stat.LastSearchedAtUtc = DateTime.UtcNow;
            }

            dbContext.FlightSearchLogs.Add(new FlightSearchLog
            {
                UserId = userId,
                FromCity = fromCity,
                ToCity = toCity,
                DepartDate = departDate,
                ReturnDate = returnDate,
                TripType = string.IsNullOrWhiteSpace(tripType) ? "OneWay" : tripType.Trim(),
                Adults = adults < 0 ? 0 : adults,
                Children = children < 0 ? 0 : children,
                Infants = infants < 0 ? 0 : infants,
                SearchedAtUtc = DateTime.UtcNow
            });

            await dbContext.SaveChangesAsync();
        }

        private async Task TrackFlightRouteBookingCounterAsync(string fromCity, string toCity)
        {
            var stat = await dbContext.FlightRouteStats
                .FirstOrDefaultAsync(x => x.FromCity == fromCity && x.ToCity == toCity);

            if (stat is null)
            {
                dbContext.FlightRouteStats.Add(new FlightRouteStat
                {
                    FromCity = fromCity,
                    ToCity = toCity,
                    SearchCount = 0,
                    BookingCount = 1,
                    LastBookedAtUtc = DateTime.UtcNow
                });
            }
            else
            {
                stat.BookingCount += 1;
                stat.LastBookedAtUtc = DateTime.UtcNow;
            }
        }

        private async Task<decimal> GetActiveFlightConvenienceFeeAsync(decimal baseFare)
        {
            var feeRow = await dbContext.FlightConvenienceFees
                .AsNoTracking()
                .OrderByDescending(x => x.UpdateDateUtc)
                .FirstOrDefaultAsync(x => x.Status == "Active");

            if (feeRow is null)
            {
                return 0m;
            }

            return CalculateConvenienceFee(baseFare, feeRow);
        }

        private static decimal CalculateCouponAmount(decimal baseFare, FlightCoupon coupon)
        {
            var amount = coupon.CouponType.Equals("Percentage", StringComparison.OrdinalIgnoreCase)
                ? baseFare * (coupon.Value / 100m)
                : coupon.Value;

            if (amount < 0)
            {
                amount = 0;
            }

            if (amount > baseFare)
            {
                amount = baseFare;
            }

            return decimal.Round(amount, 2, MidpointRounding.AwayFromZero);
        }

        private static decimal CalculateConvenienceFee(decimal baseFare, FlightConvenienceFee fee)
        {
            var amount = fee.AmountType.Equals("Percentage", StringComparison.OrdinalIgnoreCase)
                ? baseFare * (fee.Value / 100m)
                : fee.Value;

            if (amount < 0)
            {
                amount = 0;
            }

            return decimal.Round(amount, 2, MidpointRounding.AwayFromZero);
        }

        private async Task TrySendFlightBookingEmailAsync(
            FlightReservation reservation,
            FlightBooking flight,
            IReadOnlyList<FlightReservationPassenger> passengers)
        {
            if (string.IsNullOrWhiteSpace(reservation.PassengerEmail))
            {
                return;
            }

            var seatNumbers = string.Join(", ",
                passengers
                    .Select(x => x.SeatNumber)
                    .Where(x => !string.IsNullOrWhiteSpace(x)));

            if (string.IsNullOrWhiteSpace(seatNumbers))
            {
                seatNumbers = "Auto-assigned";
            }

            var payload = new TicketEmailRequestDto
            {
                ToEmail = reservation.PassengerEmail,
                PassengerName = reservation.PassengerName,
                BookingReference = reservation.BookingReference,
                Airline = flight.Airline,
                Origin = flight.FromCity,
                Destination = flight.ToCity,
                DepartureTime = flight.DepartureTime,
                ArrivalTime = flight.ArrivalTime,
                Pnr = reservation.BookingReference,
                SeatNumber = seatNumbers,
                Terminal = "TBD",
                Price = reservation.TotalPriceInr,
                Currency = "INR",
                StopsCount = 0,
                DurationMinutes = (int)Math.Max(1, Math.Round((flight.ArrivalTime - flight.DepartureTime).TotalMinutes))
            };

            var sent = await bookingNotificationService.TrySendTicketEmailAsync(payload, HttpContext.RequestAborted);
            if (!sent)
            {
                logger.LogWarning("Flight booking email send failed for booking {BookingReference}", reservation.BookingReference);
            }
        }

        private bool TryGetCurrentUserId(out string? userId, out IActionResult? errorResult)
        {
            userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                  ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrWhiteSpace(userId))
            {
                errorResult = Unauthorized(new
                {
                    message = "User is not authenticated."
                });

                return false;
            }

            errorResult = null;
            return true;
        }

        private string? GetOptionalUserId()
        {
            return User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                   ?? User.FindFirst("sub")?.Value;
        }
    }
}
