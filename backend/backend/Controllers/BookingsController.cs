using Microsoft.AspNetCore.Mvc;
using PickNBook.Api.Services;

namespace PickNBook.Api.Controllers
{

    [ApiController]
    [Route("api/bookings")]
    public class BookingsController : ControllerBase
    {
        private readonly IBookingHistoryService _bookingHistoryService;

        public BookingsController(
            IBookingHistoryService bookingHistoryService)
        {
            _bookingHistoryService = bookingHistoryService;
        }

        [HttpGet("history")]
        public async Task<IActionResult> GetHistory()
        {
            if (!Request.Headers.TryGetValue("X-User-Id", out var userIdHeader))
            {
                return Unauthorized(new
                {
                    message = "User ID header missing"
                });
            }
            var userId = userIdHeader.ToString();

            var result = await _bookingHistoryService
                .GetBookingHistoryAsync(userId);

            return Ok(result);
        }
    }
}
