using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MedicalApi.Data;
using MedicalApi.Models;

namespace MedicalApi.Controllers;

// Sirf patient booking karta / cancel karta hai
[ApiController]
[Authorize(Roles = Roles.Patient)]
[Route("api/[controller]")]
public class AppointmentsController : ControllerBase
{
    private readonly AppDbContext _db;

    public AppointmentsController(AppDbContext db) => _db = db;

    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet("mine")]
    public async Task<ActionResult<IEnumerable<SlotDto>>> GetMine()
    {
        var me = CurrentUserId;

        return await _db.Slots
            .AsNoTracking()
            .Where(s => s.PatientId == me)
            .OrderBy(s => s.Start)
            .Select(SlotDto.Projection)
            .ToListAsync();
    }

    [HttpPost]
    public async Task<IActionResult> Book(BookRequest req)
    {
        var slot = await _db.Slots.FirstOrDefaultAsync(s => s.Id == req.SlotId);
        if (slot is null) return NotFound(new { message = "Slot not found." });

        if (slot.Start <= DateTime.UtcNow)
            return BadRequest(new { message = "This slot is in the past." });

        if (slot.PatientId != null)
            return Conflict(new { message = "Sorry, this slot was just booked by someone else." });

        slot.PatientId = CurrentUserId;
        slot.BookedAt = DateTime.UtcNow;

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            return Conflict(new { message = "Sorry, this slot was just booked by someone else." });
        }

        return Ok(new { message = "Appointment booked." });
    }

    [HttpDelete("{slotId:int}")]
    public async Task<IActionResult> Cancel(int slotId)
    {
        var me = CurrentUserId;
        var slot = await _db.Slots.FirstOrDefaultAsync(s => s.Id == slotId && s.PatientId == me);
        if (slot is null) return NotFound();

        slot.PatientId = null;
        slot.BookedAt = null;
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
