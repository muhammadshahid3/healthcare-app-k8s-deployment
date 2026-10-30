using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MedicalApi.Data;
using MedicalApi.Models;
using MedicalApi.Services;

namespace MedicalApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly TokenService _tokens;

    public AuthController(AppDbContext db, TokenService tokens)
    {
        _db = db;
        _tokens = tokens;
    }

    [HttpPost("signup")]
    public async Task<ActionResult<AuthResponse>> Signup(SignupRequest req)
    {
        var role = req.Role.Trim();
        if (!role.Equals(Roles.Doctor, StringComparison.OrdinalIgnoreCase) &&
            !role.Equals(Roles.Patient, StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { message = "Role must be Doctor or Patient." });

        role = role.Equals(Roles.Doctor, StringComparison.OrdinalIgnoreCase) ? Roles.Doctor : Roles.Patient;

        if (role == Roles.Doctor &&
            (string.IsNullOrWhiteSpace(req.Education) || string.IsNullOrWhiteSpace(req.Specialization)))
            return BadRequest(new { message = "Doctor must provide education and specialization." });

        var email = req.Email.Trim().ToLowerInvariant();
        if (await _db.Users.AnyAsync(u => u.Email == email))
            return Conflict(new { message = "This email is already registered." });

        var user = new User
        {
            FullName = req.FullName.Trim(),
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            Role = role,
            Education = role == Roles.Doctor ? req.Education!.Trim() : null,
            Specialization = role == Roles.Doctor ? req.Specialization!.Trim() : null,
            About = role == Roles.Doctor ? req.About?.Trim() : null
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return Ok(new AuthResponse { Token = _tokens.Create(user), User = UserDto.From(user) });
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest req)
    {
        var email = req.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);

        if (user is null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
            return Unauthorized(new { message = "Invalid email or password." });

        return Ok(new AuthResponse { Token = _tokens.Create(user), User = UserDto.From(user) });
    }
}
