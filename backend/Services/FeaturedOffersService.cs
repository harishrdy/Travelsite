using Microsoft.EntityFrameworkCore;
using PickNBook.Api.Data;
using PickNBook.Api.Models;
using PickNBook.Api.Models.DTOs;

namespace PickNBook.Api.Services;

public interface IFeaturedOffersService
{
    Task<IReadOnlyList<FeaturedOfferDto>> GetFeaturedOffersAsync();
    Task<ApplyOfferCouponResponse> ApplyCouponAsync(ApplyOfferCouponRequest request);
}

public class FeaturedOffersService : IFeaturedOffersService
{
    private readonly AppDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly string? _publicApiBaseUrl;

    public FeaturedOffersService(
        AppDbContext context,
        IHttpContextAccessor httpContextAccessor,
        IConfiguration configuration)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
        _publicApiBaseUrl = configuration["PublicApiBaseUrl"]?.Trim().TrimEnd('/');
    }

    public async Task<IReadOnlyList<FeaturedOfferDto>> GetFeaturedOffersAsync()
    {
        

        var now = DateTime.UtcNow;

        var offers = await _context.FeaturedOffers
            .AsNoTracking()
            .Where(x => x.IsActive)
            .OrderBy(x => x.OfferCode)
            .ToListAsync();

        return offers
            .Select(x => MapOfferToDto(x, now))
            .ToList();
    }

    public async Task<ApplyOfferCouponResponse> ApplyCouponAsync(ApplyOfferCouponRequest request)
    {
       

        if (string.IsNullOrWhiteSpace(request.OfferId) || string.IsNullOrWhiteSpace(request.CouponCode))
        {
            return new ApplyOfferCouponResponse
            {
                IsSuccess = false,
                Message = "OfferId and CouponCode are required."
            };
        }

        var offer = await _context.FeaturedOffers
            .FirstOrDefaultAsync(x => x.OfferCode == request.OfferId);

        if (offer == null)
        {
            return new ApplyOfferCouponResponse
            {
                IsSuccess = false,
                Message = "Offer not found."
            };
        }

        if (!string.Equals(offer.CouponCode, request.CouponCode, StringComparison.OrdinalIgnoreCase))
        {
            return BuildFailedCouponResponse(offer, "Invalid coupon for selected offer.");
        }

        var now = DateTime.UtcNow;
        if (!offer.IsActive || now > offer.CouponExpiresAtUtc)
        {
            return BuildFailedCouponResponse(offer, "Coupon has expired or is inactive.");
        }

        if (offer.CouponUsedCount >= offer.MaxCouponUsage)
        {
            return BuildFailedCouponResponse(offer, "Coupon usage limit has been reached.");
        }

        var originalPrice = request.CurrentPrice.GetValueOrDefault(offer.BasePrice);
        if (originalPrice <= 0)
        {
            return BuildFailedCouponResponse(offer, "Price must be greater than zero.");
        }

        var discountAmount = CalculateDiscountAmount(
            originalPrice,
            offer.IsPercentageDiscount,
            offer.DiscountValue);

        var finalPrice = Math.Round(
            Math.Max(0m, originalPrice - discountAmount),
            2,
            MidpointRounding.AwayFromZero);

        var strategy = _context.Database.CreateExecutionStrategy();

        await strategy.ExecuteAsync(async () =>
        {
            await using var tx = await _context.Database.BeginTransactionAsync();

            var rowsUpdated = await _context.FeaturedOffers
                .Where(x =>
                    x.Id == offer.Id &&
                    x.IsActive &&
                    x.CouponExpiresAtUtc >= now &&
                    x.CouponUsedCount < x.MaxCouponUsage)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(x => x.CouponUsedCount, x => x.CouponUsedCount + 1)
                    .SetProperty(x => x.UpdatedAtUtc, _ => now));

            if (rowsUpdated == 0)
            {
                await tx.RollbackAsync();
                return;
            }

            _context.CouponRedemptions.Add(new CouponRedemption
            {
                FeaturedOfferId = offer.Id,
                OfferCode = offer.OfferCode,
                CouponCode = offer.CouponCode,
                OriginalPrice = Math.Round(originalPrice, 2, MidpointRounding.AwayFromZero),
                DiscountAmount = discountAmount,
                FinalPrice = finalPrice,
                RedeemedAtUtc = now
            });

            await _context.SaveChangesAsync();
            await tx.CommitAsync();
        });

        var updatedOffer = await _context.FeaturedOffers
            .AsNoTracking()
            .FirstAsync(x => x.Id == offer.Id);

        return new ApplyOfferCouponResponse
        {
            IsSuccess = true,
            Message = "Coupon applied successfully.",
            OfferId = updatedOffer.OfferCode,
            CouponCode = updatedOffer.CouponCode,
            CouponExpiresAtUtc = updatedOffer.CouponExpiresAtUtc,
            MaxCouponUsage = updatedOffer.MaxCouponUsage,
            CouponUsedCount = updatedOffer.CouponUsedCount,
            RemainingCouponUsage = Math.Max(0, updatedOffer.MaxCouponUsage - updatedOffer.CouponUsedCount),
            OriginalPrice = Math.Round(originalPrice, 2, MidpointRounding.AwayFromZero),
            DiscountAmount = discountAmount,
            FinalPrice = finalPrice
        };
    }

    private ApplyOfferCouponResponse BuildFailedCouponResponse(FeaturedOffer offer, string message)
    {
        return new ApplyOfferCouponResponse
        {
            IsSuccess = false,
            Message = message,
            OfferId = offer.OfferCode,
            CouponCode = offer.CouponCode,
            CouponExpiresAtUtc = offer.CouponExpiresAtUtc,
            MaxCouponUsage = offer.MaxCouponUsage,
            CouponUsedCount = offer.CouponUsedCount,
            RemainingCouponUsage = Math.Max(0, offer.MaxCouponUsage - offer.CouponUsedCount),
            OriginalPrice = offer.BasePrice,
            DiscountAmount = 0m,
            FinalPrice = offer.BasePrice
        };
    }

    private FeaturedOfferDto MapOfferToDto(FeaturedOffer offer, DateTime now)
    {
        var previewDiscountAmount = CalculateDiscountAmount(
            offer.BasePrice,
            offer.IsPercentageDiscount,
            offer.DiscountValue);

        var remaining = Math.Max(0, offer.MaxCouponUsage - offer.CouponUsedCount);
        var isActive = offer.IsActive && offer.CouponExpiresAtUtc >= now && remaining > 0;

        return new FeaturedOfferDto
        {
            OfferId = offer.OfferCode,
            Title = offer.Title,
            Subtitle = offer.Subtitle,
            Description = offer.Description,
            CouponCode = offer.CouponCode,
            BasePrice = offer.BasePrice,
            IsPercentageDiscount = offer.IsPercentageDiscount,
            DiscountValue = offer.DiscountValue,
            CouponExpiresAtUtc = offer.CouponExpiresAtUtc,
            MaxCouponUsage = offer.MaxCouponUsage,
            CouponUsedCount = offer.CouponUsedCount,
            RemainingCouponUsage = remaining,
            IsCouponActive = isActive,
            PromotionId = offer.PromotionId,
            ImageUrl = ResolveImageUrl(offer.ImageUrl),
            BookingType = offer.BookingType,
            PreviewFinalPrice = Math.Round(
                Math.Max(0m, offer.BasePrice - previewDiscountAmount),
                2,
                MidpointRounding.AwayFromZero)
        };
    }

    private string ResolveImageUrl(string imageUrl)
    {
        if (string.IsNullOrWhiteSpace(imageUrl))
        {
            return string.Empty;
        }

        if (Uri.TryCreate(imageUrl, UriKind.Absolute, out var absolute))
        {
            return absolute.ToString();
        }

        var normalizedPath = imageUrl.StartsWith('/') ? imageUrl : $"/{imageUrl}";

        if (!string.IsNullOrWhiteSpace(_publicApiBaseUrl))
        {
            return $"{_publicApiBaseUrl}{normalizedPath}";
        }

        var request = _httpContextAccessor.HttpContext?.Request;
        if (request == null || !request.Host.HasValue)
        {
            return normalizedPath;
        }

        var host = request.Host.Host;
        var scheme = request.Scheme;

        // Default to HTTPS for non-local hosts to avoid mixed-content issues in browsers.
        if (!string.Equals(host, "localhost", StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(host, "127.0.0.1", StringComparison.OrdinalIgnoreCase))
        {
            scheme = "https";
        }

        return $"{scheme}://{request.Host}{request.PathBase}{normalizedPath}";
    }

    private static decimal CalculateDiscountAmount(decimal originalPrice, bool isPercentage, decimal discountValue)
    {
        if (discountValue <= 0 || originalPrice <= 0)
        {
            return 0m;
        }

        var discount = isPercentage
            ? (originalPrice * discountValue) / 100m
            : discountValue;

        return Math.Round(Math.Min(discount, originalPrice), 2, MidpointRounding.AwayFromZero);
    }

   
}
