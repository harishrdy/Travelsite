namespace PickNBook.Api.Models.DTOs
{
    public class AdminFeaturedOfferRequestDto
    {
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

        public bool IsActive { get; set; }

        public int? PromotionId { get; set; }

        public string BookingType { get; set; } = string.Empty;

        public IFormFile? Image { get; set; }
        public int DisplayOrder { get; set; }

        public DateTime? StartDateUtc { get; set; }

        public DateTime? EndDateUtc { get; set; }
    }
}
