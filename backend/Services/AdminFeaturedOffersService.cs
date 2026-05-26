using Microsoft.EntityFrameworkCore;
using PickNBook.Api.Data;
using PickNBook.Api.Models;
using PickNBook.Api.Models.DTOs;

namespace PickNBook.Api.Services
{
    public class AdminFeaturedOffersService
     : IAdminFeaturedOffersService
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _environment;

        public AdminFeaturedOffersService(
     AppDbContext context,
     IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        public async Task<List<FeaturedOffer>> GetAllAsync()
        {
            return await _context.FeaturedOffers
                .AsNoTracking()
                .OrderByDescending(x => x.CreatedAtUtc)
                .ToListAsync();
        }

        public async Task<FeaturedOffer?> GetByIdAsync(int id)
        {
            return await _context.FeaturedOffers
                .FirstOrDefaultAsync(x => x.Id == id);
        }

        public async Task<FeaturedOffer> CreateAsync(
     AdminFeaturedOfferRequestDto request)
        {
            var exists = await _context.FeaturedOffers
                .AnyAsync(x =>
                    x.OfferCode == request.OfferCode);

            if (exists)
            {
                throw new Exception(
                    "OfferCode already exists.");
            }

            string imageUrl = string.Empty;

            if (request.Image != null)
            {
                imageUrl =
                    await SaveImageAsync(request.Image);
            }

            var offer = new FeaturedOffer
            {
                OfferCode = request.OfferCode,
                Title = request.Title,
                Subtitle = request.Subtitle,
                Description = request.Description,
                CouponId = request.CouponId,
                CouponCode = null,
                //CouponCode = request.CouponCode,
                BasePrice = request.BasePrice,
                IsPercentageDiscount =
                    request.IsPercentageDiscount,
                DiscountValue =
                    request.DiscountValue,
                CouponExpiresAtUtc =
                    request.CouponExpiresAtUtc,
                MaxCouponUsage =
                    request.MaxCouponUsage,
                CouponUsedCount =
                    request.CouponUsedCount,
                IsActive =
                    request.IsActive,
                PromotionId = request.PromotionId,
                BookingType =
                    request.BookingType,
                ImageUrl = imageUrl,
                CreatedAtUtc = DateTime.UtcNow,
                UpdatedAtUtc = DateTime.UtcNow,
                DisplayOrder = request.DisplayOrder,
                StartDateUtc = request.StartDateUtc,
                EndDateUtc = request.EndDateUtc,
            };
            if (!request.CouponId.HasValue)
            {
                throw new Exception(
                    "Featured offer must be linked to a coupon");
            }

            var coupon = await _context.BusCoupons
                .FirstOrDefaultAsync(x =>
                    x.Id == request.CouponId.Value);

            if (coupon == null)
            {
                throw new Exception(
                    "Invalid coupon selected");
            }

            offer.CouponCode =
                coupon.CouponCode;
            _context.FeaturedOffers.Add(offer);

            await _context.SaveChangesAsync();

            return offer;
        }

        public async Task<FeaturedOffer?> UpdateAsync(
     int id,
     AdminFeaturedOfferRequestDto request)
        {
            var offer = await _context.FeaturedOffers
                .FirstOrDefaultAsync(x => x.Id == id);

            if (offer == null)
            {
                return null;
            }

            offer.OfferCode = request.OfferCode;
            offer.Title = request.Title;
            offer.Subtitle = request.Subtitle;
            offer.Description = request.Description;
            offer.CouponId = request.CouponId;

            offer.CouponCode = null;

            if (!request.CouponId.HasValue)
            {
                throw new Exception(
                    "Featured offer must be linked to a coupon");
            }

            offer.CouponId = request.CouponId;

            offer.CouponCode = null;

            var coupon = await _context.BusCoupons
                .FirstOrDefaultAsync(x =>
                    x.Id == request.CouponId.Value);

            if (coupon == null)
            {
                throw new Exception(
                    "Invalid coupon selected");
            }

            offer.CouponCode =
                coupon.CouponCode;
            offer.BasePrice = request.BasePrice;

            offer.IsPercentageDiscount =
                request.IsPercentageDiscount;

            offer.DiscountValue =
                request.DiscountValue;

            offer.CouponExpiresAtUtc =
                request.CouponExpiresAtUtc;

            offer.MaxCouponUsage =
                request.MaxCouponUsage;

            offer.CouponUsedCount =
                request.CouponUsedCount;

            offer.IsActive =
                request.IsActive;

            offer.PromotionId = request.PromotionId;

            offer.BookingType =
                request.BookingType;
            offer.DisplayOrder = request.DisplayOrder;
            offer.StartDateUtc = request.StartDateUtc;
            offer.EndDateUtc = request.EndDateUtc;

            if (request.Image != null)
            {
                offer.ImageUrl =
                    await SaveImageAsync(request.Image);
            }

            offer.UpdatedAtUtc = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return offer;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var offer = await _context.FeaturedOffers
                .FirstOrDefaultAsync(x => x.Id == id);

            if (offer == null)
            {
                return false;
            }

            _context.FeaturedOffers.Remove(offer);

            await _context.SaveChangesAsync();

            return true;
        }
        private async Task<string> SaveImageAsync(
    IFormFile file)
        {
            var uploadsFolder = Path.Combine(
                _environment.WebRootPath,
                "offers");

            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(
                    uploadsFolder);
            }

            var uniqueFileName =
                Guid.NewGuid().ToString() +
                Path.GetExtension(file.FileName);

            var filePath = Path.Combine(
                uploadsFolder,
                uniqueFileName);

            using var stream =
                new FileStream(filePath, FileMode.Create);

            await file.CopyToAsync(stream);

            return $"/offers/{uniqueFileName}";
        }
    }
    }
