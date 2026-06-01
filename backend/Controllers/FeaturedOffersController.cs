using Microsoft.AspNetCore.Mvc;
using PickNBook.Api.Models.DTOs;
using PickNBook.Api.Services;

namespace PickNBook.Api.Controllers;

public class FeaturedOffersController : BaseApiController
{
    private readonly IFeaturedOffersService _featuredOffersService;
    private readonly IExclusiveOfferSubscriptionService _subscriptionService;

    public FeaturedOffersController(
        IFeaturedOffersService featuredOffersService,
        IExclusiveOfferSubscriptionService subscriptionService)
    {
        _featuredOffersService = featuredOffersService;
        _subscriptionService = subscriptionService;
    }

    [HttpGet]
    public async Task<IActionResult> GetFeaturedOffers()
    {
        var offers = await _featuredOffersService.GetFeaturedOffersAsync();

        return Ok(new
        {
            count = offers.Count,
            offers
        });
    }

    [HttpPost("apply-coupon")]
    public async Task<IActionResult> ApplyCoupon([FromBody] ApplyOfferCouponRequest request)
    {
        if (request == null ||
            string.IsNullOrWhiteSpace(request.OfferId) ||
            string.IsNullOrWhiteSpace(request.CouponCode))
        {
            return BadRequest("OfferId and CouponCode are required.");
        }

        var result = await _featuredOffersService.ApplyCouponAsync(request);

        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    [HttpPost("subscribe")]
    public async Task<IActionResult> SubscribeToExclusiveOffers([FromBody] ExclusiveOfferSubscriptionRequest request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest("Email is required.");
        }

        var response = await _subscriptionService.SubscribeAsync(request);
        if (!response.IsSuccess)
        {
            return StatusCode(502, response);
        }

        return Ok(response);
    }
}
