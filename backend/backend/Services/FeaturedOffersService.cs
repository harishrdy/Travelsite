using Microsoft.EntityFrameworkCore;
using PickNBook.Api.Data;
using PickNBook.Api.Models;
using PickNBook.Api.Models.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PickNBook.Api.Services
{
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
            var offers = await _context.FeaturedOffers
                .Include(x => x.Promotion)
                .Include(x => x.Conditions)
                .Where(x => x.IsActive)
                .OrderBy(x => x.DisplayOrder)
                .ToListAsync();

            return offers
                .Select(x => MapOfferToDto(x))
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

            if (!int.TryParse(request.OfferId, out var offerId))
            {
                return new ApplyOfferCouponResponse
                {
                    IsSuccess = false,
                    Message = "Invalid Offer ID format."
                };
            }

            var offer = await _context.FeaturedOffers
                .Include(x => x.Promotion)
                .FirstOrDefaultAsync(x => x.Id == offerId && x.IsActive);

            if (offer == null)
            {
                return new ApplyOfferCouponResponse
                {
                    IsSuccess = false,
                    Message = "Offer not found."
                };
            }

            if (offer.Promotion == null || !offer.Promotion.IsActive)
            {
                return new ApplyOfferCouponResponse
                {
                    IsSuccess = false,
                    Message = "The promotion associated with this offer is inactive or invalid."
                };
            }

            if (!string.Equals(offer.Promotion.Code, request.CouponCode, StringComparison.OrdinalIgnoreCase))
            {
                return BuildFailedCouponResponse(offer, "Invalid coupon for selected offer.");
            }

            var now = DateTime.UtcNow;
            if (offer.Promotion.StartDateUtc.HasValue && offer.Promotion.StartDateUtc > now)
            {
                return BuildFailedCouponResponse(offer, "Promotion has not started yet.");
            }

            if (offer.Promotion.EndDateUtc.HasValue && offer.Promotion.EndDateUtc < now)
            {
                return BuildFailedCouponResponse(offer, "Promotion has expired.");
            }

            if (offer.Promotion.MaxUsage.HasValue && offer.Promotion.UsedCount >= offer.Promotion.MaxUsage.Value)
            {
                return BuildFailedCouponResponse(offer, "Promotion usage limit has been reached.");
            }

            var originalPrice = request.CurrentPrice.GetValueOrDefault(1000m);
            if (originalPrice <= 0)
            {
                return BuildFailedCouponResponse(offer, "Price must be greater than zero.");
            }

            var isPercentage = offer.Promotion.DiscountType.Equals("Percentage", StringComparison.OrdinalIgnoreCase);
            var discountAmount = CalculateDiscountAmount(
                originalPrice,
                isPercentage,
                offer.Promotion.DiscountValue);

            if (offer.Promotion.MaxDiscountAmount.HasValue)
            {
                discountAmount = Math.Min(discountAmount, offer.Promotion.MaxDiscountAmount.Value);
            }

            var finalPrice = Math.Round(
                Math.Max(0m, originalPrice - discountAmount),
                2,
                MidpointRounding.AwayFromZero);

            // Real-time update inside the transaction (atomic increment)
            var strategy = _context.Database.CreateExecutionStrategy();
            await strategy.ExecuteAsync(async () =>
            {
                await using var tx = await _context.Database.BeginTransactionAsync();
                try
                {
                    var rowsUpdated = await _context.Database.ExecuteSqlInterpolatedAsync($@"
                        UPDATE buspromotions
                        SET UsedCount = UsedCount + 1
                        WHERE Id = {offer.Promotion.Id}
                        AND (MaxUsage IS NULL OR UsedCount < MaxUsage)
                    ");

                    if (rowsUpdated == 0)
                    {
                        throw new Exception("Promotion usage limit reached concurrently.");
                    }

                    _context.CouponRedemptions.Add(new CouponRedemption
                    {
                        FeaturedOfferId = offer.Id,
                        OfferCode = offer.Id.ToString(),
                        CouponCode = offer.Promotion.Code,
                        OriginalPrice = Math.Round(originalPrice, 2, MidpointRounding.AwayFromZero),
                        DiscountAmount = discountAmount,
                        FinalPrice = finalPrice,
                        RedeemedAtUtc = now
                    });

                    await _context.SaveChangesAsync();
                    await tx.CommitAsync();
                }
                catch
                {
                    await tx.RollbackAsync();
                    throw;
                }
            });

            return new ApplyOfferCouponResponse
            {
                IsSuccess = true,
                Message = "Coupon applied successfully.",
                OfferId = offer.Id.ToString(),
                CouponCode = offer.Promotion.Code,
                CouponExpiresAtUtc = offer.Promotion.EndDateUtc ?? DateTime.MaxValue,
                MaxCouponUsage = offer.Promotion.MaxUsage ?? 0,
                CouponUsedCount = offer.Promotion.UsedCount + 1,
                RemainingCouponUsage = Math.Max(0, (offer.Promotion.MaxUsage ?? 0) - (offer.Promotion.UsedCount + 1)),
                OriginalPrice = Math.Round(originalPrice, 2, MidpointRounding.AwayFromZero),
                DiscountAmount = discountAmount,
                FinalPrice = finalPrice
            };
        }

        private ApplyOfferCouponResponse BuildFailedCouponResponse(FeaturedOffer offer, string message)
        {
            var code = offer.Promotion?.Code ?? string.Empty;
            var maxUsage = offer.Promotion?.MaxUsage ?? 0;
            var used = offer.Promotion?.UsedCount ?? 0;
            var expires = offer.Promotion?.EndDateUtc ?? DateTime.MaxValue;

            return new ApplyOfferCouponResponse
            {
                IsSuccess = false,
                Message = message,
                OfferId = offer.Id.ToString(),
                CouponCode = code,
                CouponExpiresAtUtc = expires,
                MaxCouponUsage = maxUsage,
                CouponUsedCount = used,
                RemainingCouponUsage = Math.Max(0, maxUsage - used),
                OriginalPrice = 1000m,
                DiscountAmount = 0m,
                FinalPrice = 1000m
            };
        }

        private FeaturedOfferDto MapOfferToDto(FeaturedOffer offer)
        {
            var promo = offer.Promotion;
            decimal previewFinalPrice = 0m;
            decimal discountValue = 0m;
            bool isPercentage = false;
            decimal basePrice = 1000m;

            if (promo != null)
            {
                discountValue = promo.DiscountValue;
                isPercentage = promo.DiscountType.Equals("Percentage", StringComparison.OrdinalIgnoreCase);
                var discountAmount = CalculateDiscountAmount(basePrice, isPercentage, discountValue);
                if (promo.MaxDiscountAmount.HasValue)
                {
                    discountAmount = Math.Min(discountAmount, promo.MaxDiscountAmount.Value);
                }
                previewFinalPrice = Math.Round(
                    Math.Max(0m, basePrice - discountAmount),
                    2,
                    MidpointRounding.AwayFromZero);
            }

            return new FeaturedOfferDto
            {
                OfferId = offer.Id,
                Title = offer.Title,
                Subtitle = offer.Subtitle,
                Description = offer.Description,
                ImageUrl = ResolveImageUrl(offer.ImageUrl),
                BookingType = offer.BookingType,
                PromotionId = offer.PromotionId,
                PromotionCode = promo?.Code ?? string.Empty,
                PromotionTitle = promo?.Title ?? string.Empty,
                PromotionType = promo?.PromotionType ?? string.Empty,
                DiscountType = promo?.DiscountType ?? string.Empty,
                DiscountValue = discountValue,
                MaxDiscountAmount = promo?.MaxDiscountAmount,
                MinBookingAmount = promo?.MinBookingAmount ?? 0m,
                PreviewFinalPrice = previewFinalPrice,
                Conditions = offer.Conditions
                    .Where(c => c.IsActive)
                    .Select(c => new FeaturedOfferConditionDto
                    {
                        ConditionType = c.ConditionType,
                        Value1 = c.Value1,
                        Value2 = c.Value2
                    })
                    .ToList()
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
}
