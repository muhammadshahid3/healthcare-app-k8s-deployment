using System.ComponentModel.DataAnnotations;
using System.Linq.Expressions;

namespace MedicalApi.Models;

public class SignupRequest
{
    [Required, MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    [Required, EmailAddress, MaxLength(150)]
    public string Email { get; set; } = string.Empty;

    [Required, MinLength(6), MaxLength(100)]
    public string Password { get; set; } = string.Empty;

    // "Doctor" ya "Patient"
    [Required]
    public string Role { get; set; } = string.Empty;

    [MaxLength(300)]
    public string? Education { get; set; }

    [MaxLength(150)]
    public string? Specialization { get; set; }

    [MaxLength(1000)]
    public string? About { get; set; }
}

public class LoginRequest
{
    [Required]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}

public class UpdateProfileRequest
{
    [Required, MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    [Required, MaxLength(300)]
    public string Education { get; set; } = string.Empty;

    [Required, MaxLength(150)]
    public string Specialization { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? About { get; set; }
}

public class CreateSlotRequest
{
    public DateTime Start { get; set; }
    public DateTime End { get; set; }
}

public class BookRequest
{
    public int SlotId { get; set; }
}

public class UserDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string? Education { get; set; }
    public string? Specialization { get; set; }
    public string? About { get; set; }

    public static UserDto From(User u) => new()
    {
        Id = u.Id,
        FullName = u.FullName,
        Email = u.Email,
        Role = u.Role,
        Education = u.Education,
        Specialization = u.Specialization,
        About = u.About
    };
}

public class AuthResponse
{
    public string Token { get; set; } = string.Empty;
    public UserDto User { get; set; } = null!;
}

public class DoctorDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Education { get; set; }
    public string? Specialization { get; set; }
    public string? About { get; set; }
    public int AvailableSlots { get; set; }
}

public class SlotDto
{
    public int Id { get; set; }
    public int DoctorId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public string? Specialization { get; set; }
    public DateTime Start { get; set; }
    public DateTime End { get; set; }
    public bool IsBooked { get; set; }
    public string? PatientName { get; set; }

    // EF Core is expression ko SQL mein translate kar deta hai
    public static readonly Expression<Func<Slot, SlotDto>> Projection = s => new SlotDto
    {
        Id = s.Id,
        DoctorId = s.DoctorId,
        DoctorName = s.Doctor.FullName,
        Specialization = s.Doctor.Specialization,
        Start = s.Start,
        End = s.End,
        IsBooked = s.PatientId != null,
        PatientName = s.Patient == null ? null : s.Patient.FullName
    };
}
