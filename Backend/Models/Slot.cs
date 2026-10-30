namespace MedicalApi.Models;

// Doctor ka ek booking slot. PatientId null ho to slot khali hai.
public class Slot
{
    public int Id { get; set; }

    public int DoctorId { get; set; }
    public User Doctor { get; set; } = null!;

    public DateTime Start { get; set; }
    public DateTime End { get; set; }

    public int? PatientId { get; set; }
    public User? Patient { get; set; }

    public DateTime? BookedAt { get; set; }
}
