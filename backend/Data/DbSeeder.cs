using Microsoft.EntityFrameworkCore;
using PickNBook.Api.Models;
using PickNBook.Api.Services.SeatLayouts;

namespace PickNBook.Api.Data;

public static class DbSeeder
{
    private static readonly TimeSpan IndiaOffset = TimeSpan.FromHours(5.5);

    private static readonly string[] AllowedTravelClasses =
    [
        "Economy",
        "Premium Economy",
        "Business",
        "Premium Business",
        "First Class"
    ];

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

    public static async Task SeedAsync(AppDbContext dbContext, CancellationToken cancellationToken = default)
    {
        //await EnsureTablesAsync(dbContext, cancellationToken);

        var hasConvenienceFee = await dbContext.BusConvenienceFees.AnyAsync(cancellationToken);
        if (!hasConvenienceFee)
        {
            dbContext.BusConvenienceFees.Add(new BusConvenienceFee
            {
                FeeInr = 0m,
                EntryDateUtc = DateTime.UtcNow,
                UpdateDateUtc = DateTime.UtcNow,
                UpdatedBy = "system",
                Status = "Active"
            });
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        var hasFlightConvenienceFee = await dbContext.FlightConvenienceFees.AnyAsync(cancellationToken);
        if (!hasFlightConvenienceFee)
        {
            dbContext.FlightConvenienceFees.Add(new FlightConvenienceFee
            {
                AmountType = "Fixed",
                Value = 0m,
                EntryDateUtc = DateTime.UtcNow,
                UpdateDateUtc = DateTime.UtcNow,
                UpdatedBy = "system",
                Status = "Active"
            });
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        var hasBuses = await dbContext.BusBookings.AnyAsync(cancellationToken);
        if (!hasBuses)
        {
            var buses = BuildBusSeed();
            await dbContext.BusBookings.AddRangeAsync(buses, cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);
            Console.WriteLine($"Seeded {buses.Count} rows into bus_bookings.");
        }


      


       
        var hasFullWeekData = await dbContext.BusBookings
     .Where(x => x.DepartureTime > DateTime.UtcNow)
     .Select(x => x.DepartureTime.Date)
     .Distinct()
     .CountAsync(cancellationToken);

        if (hasFullWeekData < 7)
        {
            await InsertNextWeekBusSchedulesAsync(dbContext, cancellationToken);
        }

        await EnsureRichNextWeekFlightDataAsync(dbContext, cancellationToken);
        await EnsureSeatMapsAsync(dbContext, cancellationToken);
    }
    
    private static async Task EnsureSeatMapsAsync(AppDbContext dbContext, CancellationToken cancellationToken)
    {
        await EnsureFlightSeatMapsAsync(dbContext, cancellationToken);
        await EnsureBusSeatMapsAsync(dbContext, cancellationToken);
    }

    private static async Task EnsureFlightSeatMapsAsync(AppDbContext dbContext, CancellationToken cancellationToken)
    {
        var flights = await dbContext.FlightBookings
            .AsNoTracking()
            .ToListAsync(cancellationToken);
        if (flights.Count == 0)
        {
            return;
        }

        var existing = await dbContext.FlightSeats
            .AsNoTracking()
            .Select(x => new { x.FlightBookingId, x.TravelClass, x.SeatCode })
            .ToListAsync(cancellationToken);

        var existingSet = existing
            .Select(x => $"{x.FlightBookingId}|{x.TravelClass}|{x.SeatCode}")
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var seatsToInsert = new List<FlightSeat>();
        foreach (var flight in flights)
        {
            foreach (var travelClass in AllowedTravelClasses)
            {
                if (!ClassSeatConfig.TryGetValue(travelClass, out var totalSeats) || totalSeats <= 0)
                {
                    continue;
                }

                var seatCodes = BuildFlightSeatCodes(totalSeats);
                foreach (var seatCode in seatCodes)
                {
                    var key = $"{flight.Id}|{travelClass}|{seatCode}";
                    if (existingSet.Contains(key))
                    {
                        continue;
                    }

                    seatsToInsert.Add(new FlightSeat
                    {
                        FlightBookingId = flight.Id,
                        TravelClass = travelClass,
                        SeatCode = seatCode,
                        IsBooked = false
                    });
                }
            }
        }

        if (seatsToInsert.Count > 0)
        {
            const int batchSize = 5000;
            for (var i = 0; i < seatsToInsert.Count; i += batchSize)
            {
                var batch = seatsToInsert.Skip(i).Take(batchSize).ToList();
                await dbContext.FlightSeats.AddRangeAsync(batch, cancellationToken);
                await dbContext.SaveChangesAsync(cancellationToken);
                dbContext.ChangeTracker.Clear();
            }
        }
    }

    private static async Task EnsureBusSeatMapsAsync(AppDbContext dbContext, CancellationToken cancellationToken)
    {
        var buses = await dbContext.BusBookings
            .AsNoTracking()
            .ToListAsync(cancellationToken);
        if (buses.Count == 0)
        {
            return;
        }

        // Fetch ALL existing seats to check for updates
        var existingSeats = await dbContext.BusSeats
            .ToListAsync(cancellationToken);

        var existingMap = existingSeats
            .ToDictionary(x => $"{x.BusBookingId}|{x.SeatCode}", x => x, StringComparer.OrdinalIgnoreCase);

        var seatsToInsert = new List<BusSeat>();
        var seatsToUpdate = new List<BusSeat>();

        foreach (var bus in buses)
        {
            var seatCodes = BusSeatLayoutRegistry.BuildSeatCodes(
                Math.Max(1, bus.TotalSeats),
                bus.BusType);

            foreach (var seatCode in seatCodes)
            {
                var key = $"{bus.Id}|{seatCode}";

                var generatedSeatType = BusSeatLayoutRegistry.GetSeatType(
                    bus.BusType,
                    seatCode,
                    bus.TotalSeats);

                if (existingMap.TryGetValue(key, out var existingSeat))
                {
                    // 🔥 SYNC: Update existing seat type if it differs from layout definition
                    if (existingSeat.SeatType != generatedSeatType)
                    {
                        existingSeat.SeatType = generatedSeatType;
                        seatsToUpdate.Add(existingSeat);
                    }
                    continue;
                }

                seatsToInsert.Add(new BusSeat
                {
                    BusBookingId = bus.Id,
                    SeatCode = seatCode,
                    SeatType = generatedSeatType,
                    IsBooked = false
                });
            }
        }

        if (seatsToUpdate.Count > 0)
        {
            await dbContext.SaveChangesAsync(cancellationToken);
            Console.WriteLine($"Synchronized {seatsToUpdate.Count} existing bus seat types.");
        }

        if (seatsToInsert.Count > 0)
        {
            const int batchSize = 5000;
            for (var i = 0; i < seatsToInsert.Count; i += batchSize)
            {
                var batch = seatsToInsert.Skip(i).Take(batchSize).ToList();
                await dbContext.BusSeats.AddRangeAsync(batch, cancellationToken);
                await dbContext.SaveChangesAsync(cancellationToken);
                dbContext.ChangeTracker.Clear();
            }
            Console.WriteLine($"Inserted {seatsToInsert.Count} new bus seats.");
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

    

    private static async Task EnsureRichNextWeekFlightDataAsync(AppDbContext dbContext, CancellationToken cancellationToken)
    {
        var (startUtc, endUtc) = NextWeekUtcRange();

        var flightCountInNextWeek = await dbContext.FlightBookings
            .CountAsync(x => x.DepartureTime >= startUtc && x.DepartureTime < endUtc, cancellationToken);

        var inventoryCount = await dbContext.FlightClassInventories.CountAsync(cancellationToken);
        var looksRichAlready = flightCountInNextWeek >= 1500 && inventoryCount >= flightCountInNextWeek * AllowedTravelClasses.Length;

        if (looksRichAlready)
        {
            await EnsureClassInventoryForAllFlightsAsync(dbContext, cancellationToken);
            Console.WriteLine("Rich next-week flight data already available.");
            return;
        }

        await dbContext.FlightReservations.ExecuteDeleteAsync(cancellationToken);
        await dbContext.FlightClassInventories.ExecuteDeleteAsync(cancellationToken);
        await dbContext.FlightBookings.ExecuteDeleteAsync(cancellationToken);

        var flights = BuildRichNextWeekFlightSeed();
        await dbContext.FlightBookings.AddRangeAsync(flights, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        var inventories = BuildClassInventories(flights);
        await dbContext.FlightClassInventories.AddRangeAsync(inventories, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        Console.WriteLine($"Seeded {flights.Count} rows into flight_bookings.");
        Console.WriteLine($"Seeded {inventories.Count} rows into flight_class_inventories.");
    }
   

    private static async Task EnsureClassInventoryForAllFlightsAsync(AppDbContext dbContext, CancellationToken cancellationToken)
    {
        var flights = await dbContext.FlightBookings.AsNoTracking().ToListAsync(cancellationToken);
        if (flights.Count == 0)
        {
            return;
        }

        var existing = await dbContext.FlightClassInventories
            .AsNoTracking()
            .Select(x => new { x.FlightBookingId, x.TravelClass })
            .ToListAsync(cancellationToken);

        var existingSet = existing
            .Select(x => $"{x.FlightBookingId}|{x.TravelClass}")
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var toInsert = new List<FlightClassInventory>();
        foreach (var flight in flights)
        {
            foreach (var travelClass in AllowedTravelClasses)
            {
                var key = $"{flight.Id}|{travelClass}";
                if (existingSet.Contains(key))
                {
                    continue;
                }

                var total = ClassSeatConfig[travelClass];
                toInsert.Add(new FlightClassInventory
                {
                    FlightBookingId = flight.Id,
                    TravelClass = travelClass,
                    TotalSeats = total,
                    AvailableSeats = total,
                    PriceInr = decimal.Round(flight.PriceInr * ClassPriceMultiplier[travelClass], 2, MidpointRounding.AwayFromZero)
                });
            }
        }

        if (toInsert.Count > 0)
        {
            await dbContext.FlightClassInventories.AddRangeAsync(toInsert, cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);
            Console.WriteLine($"Added {toInsert.Count} missing class inventory rows.");
        }
    }

   

    private static List<FlightBooking> BuildRichNextWeekFlightSeed()
    {
        var cities = new[]
        {
            "Delhi", "Mumbai", "Bengaluru", "Chennai", "Hyderabad",
            "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Kochi"
        };

        var airlines = new[]
        {
            new AirlineDef("Air India", "AI"),
            new AirlineDef("IndiGo", "6E"),
            new AirlineDef("Vistara", "UK"),
            new AirlineDef("Akasa Air", "QP"),
            new AirlineDef("SpiceJet", "SG"),
            new AirlineDef("Air India Express", "IX")
        };

        var departureSlots = new[] { (6, 20), (12, 10), (19, 35) };
        var flights = new List<FlightBooking>();

        for (var day = 7; day <= 13; day++)
        {
            foreach (var fromCity in cities)
            {
                foreach (var toCity in cities)
                {
                    if (fromCity.Equals(toCity, StringComparison.OrdinalIgnoreCase))
                    {
                        continue;
                    }

                    foreach (var slot in departureSlots)
                    {
                        var key = $"{fromCity}-{toCity}-{day}-{slot.Item1}:{slot.Item2}";
                        var hash = StableHash(key);
                        var airline = airlines[hash % airlines.Length];
                        var durationMinutes = 65 + (hash % 170); // 65m .. 234m

                        var departure = DepartureAtUtcFromIst(day, slot.Item1, slot.Item2);
                        var economyPrice = decimal.Round(2400m + (durationMinutes * 18m) + (hash % 1800), 2, MidpointRounding.AwayFromZero);
                        var totalSeats = ClassSeatConfig.Values.Sum();

                        flights.Add(new FlightBooking
                        {
                            FlightNumber = $"{airline.Code}-{100 + (hash % 900)}",
                            Airline = airline.Name,
                            FromCity = fromCity,
                            ToCity = toCity,
                            DepartureTime = departure,
                            ArrivalTime = departure.AddMinutes(durationMinutes),
                            PriceInr = economyPrice,
                            AvailableSeats = totalSeats,
                            TotalSeats = totalSeats,
                            CabinClass = "MultiClass"
                        });
                    }
                }
            }
        }

        return flights;
    }

    private static List<FlightClassInventory> BuildClassInventories(IEnumerable<FlightBooking> flights)
    {
        var rows = new List<FlightClassInventory>();
        foreach (var flight in flights)
        {
            foreach (var travelClass in AllowedTravelClasses)
            {
                var seats = ClassSeatConfig[travelClass];
                rows.Add(new FlightClassInventory
                {
                    FlightBookingId = flight.Id,
                    TravelClass = travelClass,
                    TotalSeats = seats,
                    AvailableSeats = seats,
                    PriceInr = decimal.Round(flight.PriceInr * ClassPriceMultiplier[travelClass], 2, MidpointRounding.AwayFromZero)
                });
            }
        }

        return rows;
    }

    private static List<BusBooking> BuildBusSeed()
    {
        var templates = new[]
        {
            new BusTemplate("PNB-B1001", "VRL Travels", "AC Sleeper", "Mumbai", "Pune", 1, 6, 0, 210, 850m, 18, 36, "Borivali", "Swargate"),
            new BusTemplate("PNB-B1002", "RedBus Partner", "Non-AC Seater", "Delhi", "Jaipur", 1, 7, 30, 300, 650m, 22, 44, "ISBT Kashmere Gate", "Sindhi Camp"),
            new BusTemplate("PNB-B1003", "SRS Travels", "AC Sleeper", "Bengaluru", "Chennai", 1, 22, 0, 390, 1200m, 14, 32, "Madiwala", "Koyambedu"),
            new BusTemplate("PNB-B1004", "Orange Travels", "Volvo Multi-Axle", "Hyderabad", "Bengaluru", 1, 21, 15, 510, 1450m, 16, 40, "MGBS", "Majestic"),
            new BusTemplate("PNB-B1005", "Gujarat Travels", "AC Seater", "Ahmedabad", "Udaipur", 2, 8, 45, 330, 980m, 20, 40, "Paldi", "Udaipole"),
            new BusTemplate("PNB-B1006", "Parveen Travels", "AC Sleeper", "Chennai", "Coimbatore", 2, 22, 30, 470, 1350m, 19, 36, "Perungalathur", "Gandhipuram"),
            new BusTemplate("PNB-B1007", "GreenLine", "Volvo AC", "Kolkata", "Bhubaneswar", 2, 20, 0, 430, 1250m, 17, 40, "Esplanade", "Baramunda"),
            new BusTemplate("PNB-B1008", "Neeta Tours", "AC Sleeper", "Goa", "Mumbai", 2, 18, 45, 710, 1650m, 12, 34, "Mapusa", "Dadar"),
            new BusTemplate("PNB-B1009", "RSRTC", "Non-AC Seater", "Jaipur", "Delhi", 3, 9, 15, 310, 620m, 25, 48, "Sindhi Camp", "ISBT Kashmere Gate"),
            new BusTemplate("PNB-B1010", "IntrCity", "AC Sleeper", "Lucknow", "Delhi", 3, 21, 0, 560, 1550m, 13, 30, "Alambagh", "Anand Vihar"),
            new BusTemplate("PNB-B1011", "TSRTC", "AC Seater", "Hyderabad", "Vijayawada", 3, 6, 50, 330, 900m, 24, 44, "Ameerpet", "Benz Circle"),
            new BusTemplate("PNB-B1012", "KSRTC", "AC Seater", "Bengaluru", "Mysuru", 3, 7, 10, 190, 550m, 27, 44, "Satellite Bus Stand", "Mysuru Suburban"),
            new BusTemplate("PNB-B1013", "HRTC", "Volvo AC", "Delhi", "Chandigarh", 4, 5, 30, 260, 780m, 20, 40, "Majnu Ka Tila", "Sector 43"),
            new BusTemplate("PNB-B1014", "AbhiBus Partner", "AC Sleeper", "Pune", "Nagpur", 4, 20, 40, 720, 1750m, 11, 30, "Wakad", "Ravi Nagar"),
            new BusTemplate("PNB-B1015", "Patel Travels", "Non-AC Sleeper", "Surat", "Ahmedabad", 4, 23, 15, 270, 740m, 18, 40, "Adajan", "Geeta Mandir"),
            new BusTemplate("PNB-B1016", "Sangitam", "AC Sleeper", "Bhopal", "Indore", 5, 6, 45, 240, 620m, 21, 36, "Nadra Bus Stand", "Sarvate"),
            new BusTemplate("PNB-B1017", "Orange Travels", "AC Sleeper", "Visakhapatnam", "Hyderabad", 5, 19, 20, 760, 1850m, 10, 28, "Maddilapalem", "Miyapur"),
            new BusTemplate("PNB-B1018", "VRL Travels", "Volvo AC Seater", "Mumbai", "Goa", 5, 20, 10, 690, 1700m, 9, 40, "Sion", "Panaji")
            ,
new BusTemplate(
    "PNB-B2001",
    "SURESH TRAVELS",
    "Non AC Seater/Sleeper 2+1",
    "Hyderabad",
    "Vijayawada",
    5,
    15,
    30,
    480,
    750m,
    45,
    45,
    "MGBS",
    "Benz Circle"
),

new BusTemplate(
    "TS-HYB-002",
    "Royal Travels",
    "SEATER/SLEEPER 2+1 HYBRID AC",
    "Delhi",
    "Jaipur",
    5,
    18,
    0,
    420,
    1350m,
    36,
    36,
    "Delhi ISBT",
    "Jaipur Sindhi Camp"
)
        };
        
        return templates.Select(t =>
        {
            var departure = DepartureAtUtcFromIst(t.DayOffset, t.DepartureHour, t.DepartureMinute);
            return new BusBooking
            {
                BusNumber = t.BusNumber,
                OperatorName = t.OperatorName,
                BusType = t.BusType,
                FromCity = t.FromCity,
                ToCity = t.ToCity,
                DepartureTime = departure,
                ArrivalTime = departure.AddMinutes(t.DurationMinutes),
                PriceInr = t.PriceInr,
                AvailableSeats = t.AvailableSeats,
                TotalSeats = t.TotalSeats,
                BoardingPoint = t.BoardingPoint,
                DroppingPoint = t.DroppingPoint
            };
        }).ToList();
    }
    private static async Task InsertNextWeekBusSchedulesAsync(
        AppDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var todayIst = DateTimeOffset.UtcNow.ToOffset(IndiaOffset).Date;

        // ── 1. Fetch one template row per unique bus+route ──────────────────────
        var allRows = await dbContext.BusBookings
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var templates = allRows
            .GroupBy(x => new
            {
                x.BusNumber,
                x.FromCity,
                x.ToCity,
                Time = x.DepartureTime.Add(IndiaOffset).TimeOfDay
            })
            .Select(g => g.OrderBy(x => x.Id).First())   // always pick the seed/original row
            .ToList();

        // ── 2. Load ALL existing keys for the next 7 days in ONE query ──────────
        var windowStart = DateTime.SpecifyKind(todayIst.AddDays(1) - IndiaOffset, DateTimeKind.Utc);
        var windowEnd = DateTime.SpecifyKind(todayIst.AddDays(8) - IndiaOffset, DateTimeKind.Utc);

        var existingKeys = await dbContext.BusBookings
            .AsNoTracking()
            .Where(x => x.DepartureTime >= windowStart && x.DepartureTime < windowEnd)
            .Select(x => new { x.BusNumber, x.FromCity, x.ToCity, x.DepartureTime })
            .ToListAsync(cancellationToken);

        // Use minute-precision string key — immune to sub-minute tick differences
        var existingSet = existingKeys
            .Select(x => $"{x.BusNumber}|{x.FromCity}|{x.ToCity}|{x.DepartureTime:yyyy-MM-ddTHH:mm}")
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        // ── 3. Build only the genuinely missing rows ────────────────────────────
        var newBuses = new List<BusBooking>();

        foreach (var template in templates)
        {
            for (int i = 1; i <= 7; i++)
            {
                var newDateIst = todayIst.AddDays(i);

                var depIstTime = template.DepartureTime.Add(IndiaOffset).TimeOfDay;
                var depIst = new DateTime(newDateIst.Year, newDateIst.Month, newDateIst.Day).Add(depIstTime);
                var depUtc = DateTime.SpecifyKind(depIst - IndiaOffset, DateTimeKind.Utc);

                // ✅ ONE set lookup instead of one DB round-trip per row
                var key = $"{template.BusNumber}|{template.FromCity}|{template.ToCity}|{depUtc:yyyy-MM-ddTHH:mm:ss}";
                if (existingSet.Contains(key))
                    continue;

                var duration = template.ArrivalTime - template.DepartureTime;
                if (duration <= TimeSpan.Zero)
                    duration = TimeSpan.FromMinutes(300);

                newBuses.Add(new BusBooking
                {
                    BusNumber = template.BusNumber,
                    OperatorName = template.OperatorName,
                    BusType = template.BusType,
                    FromCity = template.FromCity,
                    ToCity = template.ToCity,
                    BoardingPoint = template.BoardingPoint,
                    DroppingPoint = template.DroppingPoint,
                    DepartureTime = depUtc,
                    ArrivalTime = depUtc.Add(duration),
                    PriceInr = template.PriceInr,
                    TotalSeats = template.TotalSeats,
                    AvailableSeats = template.TotalSeats
                });
            }
        }

        // ── 4. Insert only if there is something new ────────────────────────────
        if (newBuses.Count == 0)
            return;

        await dbContext.BusBookings.AddRangeAsync(newBuses, cancellationToken);

        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
            Console.WriteLine($"Inserted {newBuses.Count} new bus schedule rows.");
        }
        catch (DbUpdateException ex) when (ex.InnerException?.Message.Contains("Duplicate") == true)
        {
            // DB-level safety net — should never fire now
            Console.WriteLine("Duplicate insert caught and ignored.");
        }
    }

    private static (DateTime StartUtc, DateTime EndUtc) NextWeekUtcRange()
    {
        var todayIst = DateTimeOffset.UtcNow.ToOffset(IndiaOffset).Date;
        var startIst = new DateTimeOffset(todayIst.Year, todayIst.Month, todayIst.Day, 0, 0, 0, IndiaOffset).AddDays(7);
        var endIst = startIst.AddDays(7);
        return (startIst.UtcDateTime, endIst.UtcDateTime);
    }

    private static DateTime DepartureAtUtcFromIst(int dayOffset, int hour, int minute)
    {
        var todayIst = DateTimeOffset.UtcNow.ToOffset(IndiaOffset).Date;
        var date = todayIst.AddDays(dayOffset);
        var departureIst = new DateTimeOffset(date.Year, date.Month, date.Day, hour, minute, 0, IndiaOffset);
        return departureIst.UtcDateTime;
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

    private sealed record BusTemplate(
        string BusNumber,
        string OperatorName,
        string BusType,
        string FromCity,
        string ToCity,
        int DayOffset,
        int DepartureHour,
        int DepartureMinute,
        int DurationMinutes,
        decimal PriceInr,
        int AvailableSeats,
        int TotalSeats,
        string BoardingPoint,
        string DroppingPoint);

    private sealed record AirlineDef(string Name, string Code);
}
