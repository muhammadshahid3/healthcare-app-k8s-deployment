using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using MedicalApi.Models;

namespace MedicalApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Slot> Slots => Set<Slot>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<Slot>(e =>
        {
            e.HasOne(s => s.Doctor)
                .WithMany()
                .HasForeignKey(s => s.DoctorId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(s => s.Patient)
                .WithMany()
                .HasForeignKey(s => s.PatientId)
                .OnDelete(DeleteBehavior.SetNull);

            // Do patients ek saath same slot book na kar saken:
            // UPDATE ... WHERE Id = @id AND PatientId IS NULL
            e.Property(s => s.PatientId).IsConcurrencyToken();

            e.HasIndex(s => new { s.DoctorId, s.Start });
        });
    }

    // Saari DateTime values UTC mein store/read hoti hain,
    // taake JSON mein "Z" ke saath jaayen aur browser local time dikhaye.
    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        configurationBuilder.Properties<DateTime>().HaveConversion<UtcDateTimeConverter>();
    }
}

public class UtcDateTimeConverter : ValueConverter<DateTime, DateTime>
{
    public UtcDateTimeConverter()
        : base(
            v => v.ToUniversalTime(),
            v => DateTime.SpecifyKind(v, DateTimeKind.Utc))
    { }
}
