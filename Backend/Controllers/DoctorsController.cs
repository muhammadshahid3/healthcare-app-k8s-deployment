using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MedicalApi.Data;
using MedicalApi.Models;

namespace MedicalApi.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class DoctorsController : ControllerBase
{
    private readonly AppDbContext _db;

    public DoctorsController(AppDbContext db) => _db = db;

    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // Patient ke liye: saare doctors + kitne slots khali hain
    [HttpGet]
    public async Task<ActionResult<IEnumerable<DoctorDto>>> GetAll()
    {
        var now = DateTime.UtcNow;

        return await _db.Users
            .AsNoTracking()
            .Where(u => u.Role == Roles.Doctor)
            .OrderBy(u => u.FullName)
            .Select(u => new DoctorDto
            {
                Id = u.Id,
                FullName = u.FullName,
                Education = u.Education,
                Specialization = u.Specialization,
                About = u.About,
                AvailableSlots = _db.Slots.Count(s => s.DoctorId == u.Id && s.PatientId == null && s.Start > now)
            })
            .ToListAsync();
    }

    // Kisi doctor ke khali (bookable) slots
    [HttpGet("{id:int}/slots")]
    public async Task<ActionResult<IEnumerable<SlotDto>>> GetAvailableSlots(int id)
    {
        var now = DateTime.UtcNow;

        return await _db.Slots
            .AsNoTracking()
            .Where(s => s.DoctorId == id && s.PatientId == null && s.Start > now)
            .OrderBy(s => s.Start)
            .Select(SlotDto.Projection)
            .ToListAsync();
    }

    // Doctor apni education / specialization update kare
    [HttpPut("me")]
    [Authorize(Roles = Roles.Doctor)]
    public async Task<ActionResult<UserDto>> UpdateMyProfile(UpdateProfileRequest req)
    {
        var user = await _db.Users.FindAsync(CurrentUserId);
        if (user is null) return NotFound();

        user.FullName = req.FullName.Trim();
        user.Education = req.Education.Trim();
        user.Specialization = req.Specialization.Trim();
        user.About = req.About?.Trim();

        await _db.SaveChangesAsync();
        return UserDto.From(user);
    }
}
