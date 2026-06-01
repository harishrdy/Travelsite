using Microsoft.EntityFrameworkCore;
using PickNBook.Api.Data;
using PickNBook.Api.Models;
using PickNBook.Api.Models.DTOs;

namespace PickNBook.Api.Services;

public class BusPromotionEngineService
    : IBusPromotionEngineService
{
    private readonly AppDbContext _db;

    private static readonly TimeSpan IndiaOffset =
        TimeSpan.FromHours(5.5);

    public BusPromotionEngineService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<BusPricingPreviewResponseDto> CalculateAsync(
    int busId,
    List<string> seatCodes,
    string? couponCode,
    int? promotionId,
    int? userId = null,
    int? selectedFeaturedOfferId = null)
    {
        var bus = await _db.BusBookings
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == busId);

        if (bus is null)
            throw new Exception("Bus not found.");

        var seats = await _db.BusSeats
            .AsNoTracking()
            .Where(x =>
                x.BusBookingId == busId &&
                seatCodes.Contains(x.SeatCode))
            .ToListAsync();

        var response =
            new BusPricingPreviewResponseDto
            {
                BusId = bus.Id,
                GstCategory = bus.GstCategory,
                CouponAllowed = true
            };

        decimal subtotal = 0m;


        foreach (var seat in seats)
        {
            var markup = await _db.BusMarkupSettings
                .AsNoTracking()
                .FirstOrDefaultAsync(x =>
                    x.Status == "Active" &&
                    x.SeatType == seat.SeatType);

            decimal markupAmount = 0m;

            if (markup != null)
            {
                markupAmount =
                    markup.MarkupType.Equals(
                        "Percentage",
                        StringComparison.OrdinalIgnoreCase)
                    ? bus.PriceInr * markup.Value / 100m
                    : markup.Value;
            }

            var fareBeforeTax =
                bus.PriceInr + markupAmount;

            subtotal += fareBeforeTax;

            response.Seats.Add(
                new BusSeatPriceBreakdownDto
                {
                    SeatCode = seat.SeatCode,
                    SeatType = seat.SeatType,
                    BaseFare = bus.PriceInr,
                    MarkupAmount = decimal.Round(
                        markupAmount,
                        2),
                    FareBeforeTax = decimal.Round(
                        fareBeforeTax,
                        2)
                });
        }

        response.SubtotalBeforeCoupon =
     decimal.Round(subtotal, 2);
        FeaturedOffer? selectedOffer = null;

        if (selectedFeaturedOfferId.HasValue)
        {
            selectedOffer = await _db.FeaturedOffers
                .Include(x => x.Promotion)
                .ThenInclude(p => p!.Conditions)
                .FirstOrDefaultAsync(x =>
                    x.Id == selectedFeaturedOfferId.Value &&
                    x.IsActive);

            if (selectedOffer == null)
                throw new Exception("Selected offer is invalid or inactive");

            if (selectedOffer.Promotion == null || !selectedOffer.Promotion.IsActive)
                throw new Exception("The promotion associated with this offer is invalid or inactive");
        }
        // ========================================
        // AUTO APPLY PROMOTIONS
        // ========================================

        // ========================================
        // BEST AUTO APPLY PROMOTION ONLY
        // ========================================

        decimal autoDiscount = 0m;

        BusPromotion? bestAutoPromotion = null;

        decimal bestAutoDiscount = 0m;
        var promoNowUtc = DateTime.UtcNow;
        var autoPromotions = await _db.BusPromotions
            .Include(x => x.Conditions)
          .Where(x =>
    x.IsActive &&
    x.IsAutoApply &&
    (!x.StartDateUtc.HasValue || x.StartDateUtc <= promoNowUtc) &&
    (!x.EndDateUtc.HasValue || x.EndDateUtc >= promoNowUtc))
            .OrderByDescending(x => x.Priority)
            .ToListAsync();

        foreach (var promo in autoPromotions)
        {
            if (!ValidatePromotionConditions(
                    promo,
                    bus,
                    seats))
            {
                continue;
            }

            if (promo.MinBookingAmount > 0m &&
      subtotal < promo.MinBookingAmount)
            {
                continue;
            }

            decimal amount =
                promo.DiscountType.Equals(
                    "Percentage",
                    StringComparison.OrdinalIgnoreCase)
                ? subtotal * promo.DiscountValue / 100m
                : promo.DiscountValue;

            if (promo.MaxDiscountAmount.HasValue)
            {
                amount = Math.Min(
                    amount,
                    promo.MaxDiscountAmount.Value);
            }

            if (amount > bestAutoDiscount)
            {
                bestAutoDiscount = amount;
                bestAutoPromotion = promo;
            }
        }

        autoDiscount = bestAutoDiscount;

        bool skipCouponValidation = false;

        if (bestAutoPromotion != null)
        {
            response.AutoPromotionCode =
                bestAutoPromotion.Code;

            // Exclusive auto discounts should block
            // ONLY manual coupons,
            // NOT featured-offer-linked coupons.

            if (bestAutoPromotion.IsExclusive &&
                selectedOffer == null)
            {
                skipCouponValidation = true;
            }
        }

        // ========================================
        // BEST AUTO DISCOUNT (already calculated above)
        // ========================================

        // ========================================
        // USER COUPON / MANUAL PROMOTION
        // ========================================

        BusPromotion? manualPromotion = null;
        decimal manualDiscount = 0m;

        if (selectedOffer != null)
        {
            if (!string.IsNullOrWhiteSpace(couponCode))
            {
                throw new Exception("Featured offers cannot stack with manual coupons");
            }

            if (promotionId.HasValue && promotionId.Value != selectedOffer.PromotionId)
            {
                throw new Exception("Only one manual promotion/offer can be applied.");
            }

            manualPromotion = selectedOffer.Promotion;
        }
        else if (!skipCouponValidation && !string.IsNullOrWhiteSpace(couponCode))
        {
            var normalizedCoupon = couponCode.Trim().ToUpperInvariant();
            var promoByCode = await _db.BusPromotions
                .Include(x => x.Conditions)
                .FirstOrDefaultAsync(x =>
                    x.Code == normalizedCoupon &&
                    x.IsActive &&
                    !x.IsAutoApply);

            if (promoByCode == null)
            {
                throw new Exception("Invalid or inactive coupon");
            }

            if (promotionId.HasValue && promotionId.Value != promoByCode.Id)
            {
                throw new Exception("Only one manual promotion/offer can be applied.");
            }

            manualPromotion = promoByCode;
        }
        else if (promotionId.HasValue)
        {
            var promoById = await _db.BusPromotions
                .Include(x => x.Conditions)
                .FirstOrDefaultAsync(x =>
                    x.Id == promotionId.Value &&
                    x.IsActive &&
                    !x.IsAutoApply);

            if (promoById == null)
            {
                throw new Exception("Invalid or inactive promotion");
            }

            manualPromotion = promoById;
        }

        decimal couponDiscount = 0m;
        decimal offerDiscount = 0m;

        if (manualPromotion != null)
        {
            bool valid =
                ValidatePromotionConditions(
                    manualPromotion,
                    bus,
                    seats);

            if (valid)
            {
                // Validate min booking amount
                if (manualPromotion.MinBookingAmount > 0m && subtotal < manualPromotion.MinBookingAmount)
                {
                    throw new Exception($"Minimum booking amount of INR {manualPromotion.MinBookingAmount} is required.");
                }

                manualDiscount =
                    manualPromotion.DiscountType.Equals(
                        "Percentage",
                        StringComparison.OrdinalIgnoreCase)
                    ? subtotal *
                        manualPromotion.DiscountValue / 100m
                    : manualPromotion.DiscountValue;

                if (manualPromotion.MaxDiscountAmount.HasValue)
                {
                    manualDiscount = Math.Min(
                        manualDiscount,
                        manualPromotion.MaxDiscountAmount.Value);
                }
                // SET APPLIED PROMOTION DETAILS
                response.AppliedPromotionCode = manualPromotion.Code;
                response.AppliedPromotionTitle = manualPromotion.Title;
                response.AppliedPromotionType = manualPromotion.PromotionType;
                response.DiscountSource = manualPromotion.PromotionType;
                response.DiscountLabel = manualPromotion.Title;

                // SPLIT MANUAL DISCOUNT BY TYPE
                if (selectedOffer != null)
                {
                    offerDiscount = manualDiscount;
                }
                else if (manualPromotion.PromotionType.Equals(
                        "Coupon",
                        StringComparison.OrdinalIgnoreCase))
                {
                    couponDiscount = manualDiscount;
                }
                else
                {
                    offerDiscount = manualDiscount;
                }
            }
            else
            {
                throw new Exception("Promotion conditions not met.");
            }
        }

        // ========================================
        // ROUNDING
        // ========================================

        autoDiscount =
            decimal.Round(
                autoDiscount,
                2,
                MidpointRounding.AwayFromZero);

        couponDiscount =
            decimal.Round(
                couponDiscount,
                2,
                MidpointRounding.AwayFromZero);

        offerDiscount =
            decimal.Round(
                offerDiscount,
                2,
                MidpointRounding.AwayFromZero);

        // ========================================
        // RESPONSE DISCOUNT FIELDS
        // ========================================

        response.AutoDiscountAmount =
            autoDiscount;

        response.CouponDiscountAmount =
            couponDiscount;

        response.ManualDiscountAmount =
            offerDiscount;

        var totalDiscount =
            Math.Min(
                autoDiscount +
                couponDiscount +
                offerDiscount,
                subtotal);

        response.CouponAmount =
            totalDiscount;

        response.TotalDiscount =
            totalDiscount;



        // ========================================
        // TAXABLE FARE
        // ========================================

        var taxableFare =
            subtotal - totalDiscount;

        response.TaxableFare =
            decimal.Round(
                taxableFare,
                2);

        // ========================================
        // GST
        // ========================================

        var gstSetting =
            await _db.BusGstSettings
                .AsNoTracking()
                .FirstOrDefaultAsync(x =>
                    x.Status == "Active" &&
                    x.GstCategory == bus.GstCategory);

        response.GstPercent =
            gstSetting?.GstPercent ?? 0m;

        response.GstAmount =
            decimal.Round(
                taxableFare *
                response.GstPercent / 100m,
                2);

        // ========================================
        // CONVENIENCE FEE
        // ========================================

        var convenienceFee =
            await _db.BusConvenienceFees
                .AsNoTracking()
                .Where(x => x.Status == "Active")
                .OrderByDescending(x => x.Id)
                .Select(x => x.FeeInr)
                .FirstOrDefaultAsync();

        response.ConvenienceFee =
            convenienceFee;

        // ========================================
        // GRAND TOTAL
        // ========================================

        response.GrandTotal =
            decimal.Round(
                taxableFare +
                response.GstAmount +
                convenienceFee,
                2);
        response.FinalAmount = response.GrandTotal;

        return response;
    }

    private bool ValidatePromotionConditions(
        BusPromotion promotion,
        BusBooking bus,
        List<BusSeat> seats)
    {
        if (promotion.Conditions == null ||
            promotion.Conditions.Count == 0)
            return true;

        var istDeparture =
            DateTime.SpecifyKind(
                bus.DepartureTime,
                DateTimeKind.Utc)
            .Add(IndiaOffset);

        foreach (var condition in promotion.Conditions)
        {
            switch (condition.ConditionType)
            {
                case "DayOfWeek":

                    if (!istDeparture.DayOfWeek
                        .ToString()
                        .Equals(
                            condition.Value1,
                            StringComparison.OrdinalIgnoreCase))
                    {
                        return false;
                    }

                    break;

                case "SourceCity":

                    if (!bus.FromCity.Equals(
                        condition.Value1,
                        StringComparison.OrdinalIgnoreCase))
                    {
                        return false;
                    }

                    break;

                case "DestinationCity":

                    if (!bus.ToCity.Equals(
                        condition.Value1,
                        StringComparison.OrdinalIgnoreCase))
                    {
                        return false;
                    }

                    break;

                case "SeatType":

                    if (!seats.Any(x =>
                        x.SeatType.Equals(
                            condition.Value1,
                            StringComparison.OrdinalIgnoreCase)))
                    {
                        return false;
                    }

                    break;

                case "BusType":

                    if (!bus.BusType.Equals(
                        condition.Value1,
                        StringComparison.OrdinalIgnoreCase))
                    {
                        return false;
                    }

                    break;

                case "OperatorName":

                    if (!bus.OperatorName.Equals(
                        condition.Value1,
                        StringComparison.OrdinalIgnoreCase))
                    {
                        return false;
                    }

                    break;
                case "MinimumFare":

                    decimal currentFare =
                        seats.Count * bus.PriceInr;

                    decimal value1 =
                        decimal.Parse(condition.Value1);

                    decimal value2 =
                        string.IsNullOrWhiteSpace(condition.Value2)
                        ? 0
                        : decimal.Parse(condition.Value2);

                    switch (condition.ConditionOperator)
                    {
                        case ">":

                            if (!(currentFare > value1))
                                return false;

                            break;

                        case ">=":

                            if (!(currentFare >= value1))
                                return false;

                            break;

                        case "<":

                            if (!(currentFare < value1))
                                return false;

                            break;

                        case "<=":

                            if (!(currentFare <= value1))
                                return false;

                            break;

                        case "Between":

                            if (!(currentFare >= value1 &&
                                  currentFare <= value2))
                            {
                                return false;
                            }

                            break;
                    }

                    break;
            }
        }

        return true;
    }
}