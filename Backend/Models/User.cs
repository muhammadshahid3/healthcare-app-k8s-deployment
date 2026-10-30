using System.ComponentModel.DataAnnotations;

namespace MedicalApi.Models;

public static class Roles
{
    public const string Doctor = "Doctor";
    public const string Patient = "Patient";
}

public class User
{
    public int Id { get; set; }

    [Required, MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    [Required, MaxLength(150)]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    // "Doctor" ya "Patient"
    [Required, MaxLength(20)]
    public string Role { get; set; } = Roles.Patient;

    // Sirf doctors ke liye
    [MaxLength(300)]
    public string? Education { get; set; }

    [MaxLength(150)]
    public string? Specialization { get; set; }

    [MaxLength(1000)]
    public string? About { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
