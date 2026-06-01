using System;
using System.Collections.Generic;

namespace PickNBook.Api.Models
{
    public class FeaturedOffer
    {
        public int Id { get; set; }

        public string Title { get; set; } = string.Empty;
        public string Subtitle { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public string BookingType { get; set; } = string.Empty;
        public int DisplayOrder { get; set; }
        public bool IsActive { get; set; } = true;

        public int PromotionId { get; set; }
        public BusPromotion? Promotion { get; set; }

        public ICollection<FeaturedOfferCondition> Conditions { get; set; }
            = new List<FeaturedOfferCondition>();
    }
}
