namespace PickNBook.Api.Models;

public class FeaturedOffer
{
    public int Id { get; set; }

    public string OfferCode { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Subtitle { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int? CouponId { get; set; }
    public string CouponCode { get; set; } = string.Empty;
    public decimal BasePrice { get; set; }
    public bool IsPercentageDiscount { get; set; }
    public decimal DiscountValue { get; set; }
    public DateTime CouponExpiresAtUtc { get; set; }
    public int MaxCouponUsage { get; set; }
    public int CouponUsedCount { get; set; }
    public bool IsActive { get; set; } = true;
    public string ImageUrl { get; set; } = string.Empty;
    public string BookingType { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    public ICollection<CouponRedemption> CouponRedemptions { get; set; } = new List<CouponRedemption>();
    public int? PromotionId { get; set; }

    public BusPromotion? Promotion { get; set; }

    

    public int DisplayOrder { get; set; }

    public DateTime? StartDateUtc { get; set; }
    public DateTime? EndDateUtc { get; set; }
}
