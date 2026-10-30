using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MedicalApi.Data;
using MedicalApi.Models;

namespace MedicalApi.Controllers;

// Sirf doctor apne slots manage karta hai
[ApiController]
[Authorize(Roles = Roles.Doctor)]
[Route("api/[controller]")]
public class SlotsController : ControllerBase
{
    private readonly AppDbContext _db;

    public SlotsController(AppDbContext db) => _db = db;

    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet("mine")]
    public async Task<ActionResult<IEnumerable<SlotDto>>> GetMine()
    {
        var me = CurrentUserId;
        var since = DateTime.UtcNow.AddDays(-1);

        return await _db.Slots
            .AsNoTracking()
            .Where(s => s.DoctorId == me && s.End > since)
            .OrderBy(s => s.Start)
            .Select(SlotDto.Projection)
            .ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult<SlotDto>> Create(CreateSlotRequest req)
    {
        var me = CurrentUserId;
        var start = req.Start.ToUniversalTime();
        var end = req.End.ToUniversalTime();

        if (end <= start)
            return BadRequest(new { message = "End time must be after start time." });

        if (start <= DateTime.UtcNow)
            return BadRequest(new { message = "Slot must be in the future." });

        var overlaps = await _db.Slots.AnyAsync(s => s.DoctorId == me && s.Start < end && s.End > start);
        if (overlaps)
            return Conflict(new { message = "This time overlaps with another slot." });

        var slot = new Slot { DoctorId = me, Start = start, End = end };
        _db.Slots.Add(slot);
        await _db.SaveChangesAsync();

        var dto = await _db.Slots.AsNoTracking()
            .Where(s => s.Id == slot.Id)
            .Select(SlotDto.Projection)
            .FirstAsync();

        return Ok(dto);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var slot = await _db.Slots.FirstOrDefaultAsync(s => s.Id == id && s.DoctorId == CurrentUserId);
        if (slot is null) return NotFound();

        if (slot.PatientId != null)
            return Conflict(new { message = "A patient has already booked this slot." });

        _db.Slots.Remove(slot);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
