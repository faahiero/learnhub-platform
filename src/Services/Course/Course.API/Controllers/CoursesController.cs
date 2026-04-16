using System.Security.Claims;
using Common.Events;
using Course.API.Data;
using Course.API.DTOs;
using Course.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Course.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CoursesController : ControllerBase
{
    private readonly CourseDbContext _context;
    private readonly IEventBus _eventBus;

    public CoursesController(CourseDbContext context, IEventBus eventBus)
    {
        _context = context;
        _eventBus = eventBus;
    }

    [HttpGet]
    public async Task<ActionResult<List<CourseResponse>>> GetCourses(
        [FromQuery] string? category,
        [FromQuery] string? level,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12)
    {
        var query = _context.Courses
            .Where(c => c.Status == "Published")
            .AsQueryable();

        if (!string.IsNullOrEmpty(category))
            query = query.Where(c => c.Category == category);

        if (!string.IsNullOrEmpty(level))
            query = query.Where(c => c.Level == level);

        if (!string.IsNullOrEmpty(search))
            query = query.Where(c => c.Title.Contains(search) || c.Description.Contains(search));

        var total = await query.CountAsync();
        var courses = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(c => c.Sections)
                .ThenInclude(s => s.Lessons)
            .ToListAsync();

        Response.Headers.Append("X-Total-Count", total.ToString());

        return Ok(courses.Select(MapToResponse));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<CourseResponse>> GetCourse(Guid id)
    {
        var course = await _context.Courses
            .Include(c => c.Sections.OrderBy(s => s.Order))
                .ThenInclude(s => s.Lessons.OrderBy(l => l.Order))
            .FirstOrDefaultAsync(c => c.Id == id);

        if (course == null) return NotFound();

        return Ok(MapToResponse(course));
    }

    [Authorize(Roles = "Instructor,Admin")]
    [HttpPost]
    public async Task<ActionResult<CourseResponse>> CreateCourse([FromBody] CreateCourseRequest request)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userName = User.FindFirst(ClaimTypes.Name)?.Value;
        if (userId == null) return Unauthorized();

        var course = new CourseEntity
        {
            Title = request.Title,
            Description = request.Description,
            ShortDescription = request.ShortDescription,
            InstructorId = Guid.Parse(userId),
            InstructorName = userName ?? "Unknown",
            Category = request.Category,
            Level = request.Level,
            Price = request.Price,
            ThumbnailUrl = request.ThumbnailUrl
        };

        _context.Courses.Add(course);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetCourse), new { id = course.Id }, MapToResponse(course));
    }

    [Authorize(Roles = "Instructor,Admin")]
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<CourseResponse>> UpdateCourse(Guid id, [FromBody] UpdateCourseRequest request)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var course = await _context.Courses.FindAsync(id);
        if (course == null) return NotFound();
        if (course.InstructorId.ToString() != userId) return Forbid();

        if (request.Title != null) course.Title = request.Title;
        if (request.Description != null) course.Description = request.Description;
        if (request.ShortDescription != null) course.ShortDescription = request.ShortDescription;
        if (request.Category != null) course.Category = request.Category;
        if (request.Level != null) course.Level = request.Level;
        if (request.Price.HasValue) course.Price = request.Price.Value;
        if (request.ThumbnailUrl != null) course.ThumbnailUrl = request.ThumbnailUrl;
        course.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(MapToResponse(course));
    }

    [Authorize(Roles = "Instructor,Admin")]
    [HttpPost("{id:guid}/publish")]
    public async Task<ActionResult> PublishCourse(Guid id)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var course = await _context.Courses.FindAsync(id);
        if (course == null) return NotFound();
        if (course.InstructorId.ToString() != userId) return Forbid();

        course.Status = "Published";
        course.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _eventBus.Publish(new CoursePublishedEvent
        {
            CourseId = course.Id,
            Title = course.Title,
            InstructorId = userId!
        });

        return Ok(new { message = "Course published successfully" });
    }

    [Authorize(Roles = "Instructor,Admin")]
    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> DeleteCourse(Guid id)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var course = await _context.Courses.FindAsync(id);
        if (course == null) return NotFound();
        if (course.InstructorId.ToString() != userId) return Forbid();

        _context.Courses.Remove(course);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [Authorize]
    [HttpGet("my-courses")]
    public async Task<ActionResult<List<CourseResponse>>> GetMyCourses()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var courses = await _context.Courses
            .Where(c => c.InstructorId == Guid.Parse(userId))
            .Include(c => c.Sections)
                .ThenInclude(s => s.Lessons)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        return Ok(courses.Select(MapToResponse));
    }

    // Section endpoints
    [Authorize(Roles = "Instructor,Admin")]
    [HttpPost("{courseId:guid}/sections")]
    public async Task<ActionResult<SectionResponse>> CreateSection(Guid courseId, [FromBody] CreateSectionRequest request)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var course = await _context.Courses.FindAsync(courseId);
        if (course == null) return NotFound();
        if (course.InstructorId.ToString() != userId) return Forbid();

        var section = new Section
        {
            Title = request.Title,
            Order = request.Order,
            CourseId = courseId
        };

        _context.Sections.Add(section);
        await _context.SaveChangesAsync();

        return Ok(new SectionResponse
        {
            Id = section.Id,
            Title = section.Title,
            Order = section.Order,
            Lessons = new()
        });
    }

    // Lesson endpoints
    [Authorize(Roles = "Instructor,Admin")]
    [HttpPost("{courseId:guid}/sections/{sectionId:guid}/lessons")]
    public async Task<ActionResult<LessonResponse>> CreateLesson(
        Guid courseId, Guid sectionId, [FromBody] CreateLessonRequest request)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var course = await _context.Courses.FindAsync(courseId);
        if (course == null) return NotFound();
        if (course.InstructorId.ToString() != userId) return Forbid();

        var section = await _context.Sections.FirstOrDefaultAsync(s => s.Id == sectionId && s.CourseId == courseId);
        if (section == null) return NotFound("Section not found");

        var lesson = new Lesson
        {
            Title = request.Title,
            Content = request.Content,
            Type = request.Type,
            VideoUrl = request.VideoUrl,
            DurationMinutes = request.DurationMinutes,
            Order = request.Order,
            IsFree = request.IsFree,
            SectionId = sectionId
        };

        _context.Lessons.Add(lesson);
        await _context.SaveChangesAsync();

        return Ok(new LessonResponse
        {
            Id = lesson.Id,
            Title = lesson.Title,
            Content = lesson.Content,
            Type = lesson.Type,
            VideoUrl = lesson.VideoUrl,
            DurationMinutes = lesson.DurationMinutes,
            Order = lesson.Order,
            IsFree = lesson.IsFree
        });
    }

    [HttpGet("categories")]
    public async Task<ActionResult<List<string>>> GetCategories()
    {
        var categories = await _context.Courses
            .Where(c => c.Status == "Published")
            .Select(c => c.Category)
            .Distinct()
            .ToListAsync();

        return Ok(categories);
    }

    private static CourseResponse MapToResponse(CourseEntity course) => new()
    {
        Id = course.Id,
        Title = course.Title,
        Description = course.Description,
        ShortDescription = course.ShortDescription,
        InstructorId = course.InstructorId,
        InstructorName = course.InstructorName,
        Category = course.Category,
        Level = course.Level,
        Price = course.Price,
        ThumbnailUrl = course.ThumbnailUrl,
        Status = course.Status,
        Rating = course.Rating,
        RatingCount = course.RatingCount,
        EnrollmentCount = course.EnrollmentCount,
        CreatedAt = course.CreatedAt,
        Sections = course.Sections.OrderBy(s => s.Order).Select(s => new SectionResponse
        {
            Id = s.Id,
            Title = s.Title,
            Order = s.Order,
            Lessons = s.Lessons.OrderBy(l => l.Order).Select(l => new LessonResponse
            {
                Id = l.Id,
                Title = l.Title,
                Content = l.Content,
                Type = l.Type,
                VideoUrl = l.VideoUrl,
                DurationMinutes = l.DurationMinutes,
                Order = l.Order,
                IsFree = l.IsFree
            }).ToList()
        }).ToList()
    };
}
