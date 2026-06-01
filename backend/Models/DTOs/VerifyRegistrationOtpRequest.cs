using System.ComponentModel.DataAnnotations;

namespace PickNBook.Api.Models.DTOs
{
    public class VerifyRegistrationOtpRequest
    {

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [StringLength(6)]
        public string Otp { get; set; } = string.Empty;
    }
}
