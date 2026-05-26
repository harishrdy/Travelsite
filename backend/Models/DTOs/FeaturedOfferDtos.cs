namespace PickNBook.Api.Models.DTOs;

public class FeaturedOfferDto
{
    public string OfferId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Subtitle { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string CouponCode { get; set; } = string.Empty;
    public decimal BasePrice { get; set; }
    public bool IsPercentageDiscount { get; set; }
    public decimal DiscountValue { get; set; }
    public DateTime CouponExpiresAtUtc { get; set; }
    public int MaxCouponUsage { get; set; }
    public int CouponUsedCount { get; set; }
    public int RemainingCouponUsage { get; set; }
    public bool IsCouponActive { get; set; }
    public int? PromotionId { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string BookingType { get; set; } = string.Empty;
    public decimal PreviewFinalPrice { get; set; }
}

public class ApplyOfferCouponRequest
{
    public string OfferId { get; set; } = string.Empty;
    public string CouponCode { get; set; } = string.Empty;
    public decimal? CurrentPrice { get; set; }
}

public class ApplyOfferCouponResponse
{
    public bool IsSuccess { get; set; }
    public string Message { get; set; } = string.Empty;
    public string OfferId { get; set; } = string.Empty;
    public string CouponCode { get; set; } = string.Empty;
    public DateTime CouponExpiresAtUtc { get; set; }
    public int MaxCouponUsage { get; set; }
    public int RemainingCouponUsage { get; set; }
    public decimal OriginalPrice { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal FinalPrice { get; set; }
    public int CouponUsedCount { get; set; }
}

public class ExclusiveOfferSubscriptionRequest
{
    public string Email { get; set; } = string.Empty;
    public string? WhatsAppNumber { get; set; }
}

public class ExclusiveOfferSubscriptionResponse
{
    public bool IsSuccess { get; set; }
    public string Message { get; set; } = string.Empty;
    public bool AlreadySubscribed { get; set; }
    public bool EmailSent { get; set; }
    public bool WhatsAppSent { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? WhatsAppNumber { get; set; }
    public int OffersIncluded { get; set; }
    public DateTime SubscribedAtUtc { get; set; }
}
