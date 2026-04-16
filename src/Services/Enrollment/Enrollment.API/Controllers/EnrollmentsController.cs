using System.Security.Claims;
using Common.Events;
using Enrollment.API.Data;
using Enrollment.API.DTOs;
using Enrollment.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Enrollment.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EnrollmentsController : ControllerBase
{
    private readonly EnrollmentDbContext _context;
    private readonly IEventBus _eventBus;

    public EnrollmentsController(EnrollmentDbContext context, IEventBus eventBus)
    {
        _context = context;
        _eventBus = eventBus;
    }

    [Authorize]
    [HttpPost]
    public async Task<ActionResult<EnrollmentResponse>> Enroll([FromBody] EnrollRequest request)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var userGuid = Guid.Parse(userId);

        var existing = await _context.Enrollments
            .FirstOrDefaultAsync(e => e.UserId == userGuid && e.CourseId == request.CourseId);

        if (existing != null)
            return BadRequest(new { message = "Already enrolled in this course" });

        var enrollment = new EnrollmentEntity
        {
            UserId = userGuid,
            CourseId = request.CourseId,
            CourseTitle = request.CourseTitle,
            TotalLessons = request.TotalLessons
        };

        _context.Enrollments.Add(enrollment);
        await _context.SaveChangesAsync();

        _eventBus.Publish(new UserEnrolledEvent
        {
            EnrollmentId = enrollment.Id,
            UserId = userId,
            CourseId = request.CourseId
        });

        return Ok(MapToResponse(enrollment));
    }

    [Authorize]
    [HttpGet("my-enrollments")]
    public async Task<ActionResult<List<EnrollmentResponse>>> GetMyEnrollments()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var userGuid = Guid.Parse(userId);

        var enrollments = await _context.Enrollments
            .Where(e => e.UserId == userGuid)
            .Include(e => e.LessonProgresses)
            .OrderByDescending(e => e.EnrolledAt)
            .ToListAsync();

        return Ok(enrollments.Select(MapToResponse));
    }

    [Authorize]
    [HttpGet("{courseId:guid}")]
    public async Task<ActionResult<EnrollmentResponse>> GetEnrollment(Guid courseId)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var userGuid = Guid.Parse(userId);

        var enrollment = await _context.Enrollments
            .Include(e => e.LessonProgresses)
            .FirstOrDefaultAsync(e => e.UserId == userGuid && e.CourseId == courseId);

        if (enrollment == null) return NotFound();

        return Ok(MapToResponse(enrollment));
    }

    [Authorize]
    [HttpPost("{enrollmentId:guid}/progress")]
    public async Task<ActionResult<EnrollmentResponse>> UpdateProgress(
        Guid enrollmentId, [FromBody] UpdateProgressRequest request)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var enrollment = await _context.Enrollments
            .Include(e => e.LessonProgresses)
            .FirstOrDefaultAsync(e => e.Id == enrollmentId);

        if (enrollment == null) return NotFound();
        if (enrollment.UserId.ToString() != userId) return Forbid();

        var progress = enrollment.LessonProgresses
            .FirstOrDefault(lp => lp.LessonId == request.LessonId);

        if (progress == null)
        {
            progress = new LessonProgress
            {
                EnrollmentId = enrollmentId,
                LessonId = request.LessonId
            };
            _context.LessonProgresses.Add(progress);
        }

        progress.IsCompleted = request.IsCompleted;
        progress.WatchedSeconds = request.WatchedSeconds;
        progress.UpdatedAt = DateTime.UtcNow;
        if (request.IsCompleted && progress.CompletedAt == null)
            progress.CompletedAt = DateTime.UtcNow;

        // Recalculate progress
        if (enrollment.TotalLessons > 0)
        {
            var completedCount = enrollment.LessonProgresses.Count(lp => lp.IsCompleted);
            enrollment.ProgressPercent = Math.Round((double)completedCount / enrollment.TotalLessons * 100, 1);

            if (enrollment.ProgressPercent >= 100)
            {
                enrollment.Status = "Completed";
                enrollment.CompletedAt ??= DateTime.UtcNow;
            }
        }

        enrollment.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(MapToResponse(enrollment));
    }

    // Reviews
    [Authorize]
    [HttpPost("reviews")]
    public async Task<ActionResult<ReviewResponse>> CreateReview([FromBody] CreateReviewRequest request)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userName = User.FindFirst(ClaimTypes.Name)?.Value;
        if (userId == null) return Unauthorized();

        var userGuid = Guid.Parse(userId);

        var enrolled = await _context.Enrollments
            .AnyAsync(e => e.UserId == userGuid && e.CourseId == request.CourseId);
        if (!enrolled)
            return BadRequest(new { message = "Must be enrolled to review" });

        var existingReview = await _context.Reviews
            .FirstOrDefaultAsync(r => r.UserId == userGuid && r.CourseId == request.CourseId);
        if (existingReview != null)
            return BadRequest(new { message = "Already reviewed this course" });

        var review = new Review
        {
            UserId = userGuid,
            UserName = userName ?? "Anonymous",
            CourseId = request.CourseId,
            Rating = request.Rating,
            Comment = request.Comment
        };

        _context.Reviews.Add(review);
        await _context.SaveChangesAsync();

        return Ok(new ReviewResponse
        {
            Id = review.Id,
            UserId = review.UserId,
            UserName = review.UserName,
            CourseId = review.CourseId,
            Rating = review.Rating,
            Comment = review.Comment,
            CreatedAt = review.CreatedAt
        });
    }

    [HttpGet("reviews/{courseId:guid}")]
    public async Task<ActionResult<List<ReviewResponse>>> GetCourseReviews(Guid courseId)
    {
        var reviews = await _context.Reviews
            .Where(r => r.CourseId == courseId)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new ReviewResponse
            {
                Id = r.Id,
                UserId = r.UserId,
                UserName = r.UserName,
                CourseId = r.CourseId,
                Rating = r.Rating,
                Comment = r.Comment,
                CreatedAt = r.CreatedAt
            })
            .ToListAsync();

        return Ok(reviews);
    }

    private static EnrollmentResponse MapToResponse(EnrollmentEntity enrollment) => new()
    {
        Id = enrollment.Id,
        UserId = enrollment.UserId,
        CourseId = enrollment.CourseId,
        CourseTitle = enrollment.CourseTitle,
        Status = enrollment.Status,
        ProgressPercent = enrollment.ProgressPercent,
        EnrolledAt = enrollment.EnrolledAt,
        CompletedAt = enrollment.CompletedAt,
        LessonProgresses = enrollment.LessonProgresses.Select(lp => new LessonProgressResponse
        {
            Id = lp.Id,
            LessonId = lp.LessonId,
            IsCompleted = lp.IsCompleted,
            WatchedSeconds = lp.WatchedSeconds,
            CompletedAt = lp.CompletedAt
        }).ToList()
    };
}
