using System.ComponentModel.DataAnnotations;

namespace Enrollment.API.DTOs;

public class EnrollRequest
{
    [Required]
    public Guid CourseId { get; set; }

    [MaxLength(200)]
    public string CourseTitle { get; set; } = string.Empty;

    public int TotalLessons { get; set; }
}

public class EnrollmentResponse
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid CourseId { get; set; }
    public string CourseTitle { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public double ProgressPercent { get; set; }
    public DateTime EnrolledAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public List<LessonProgressResponse> LessonProgresses { get; set; } = new();
}

public class LessonProgressResponse
{
    public Guid Id { get; set; }
    public Guid LessonId { get; set; }
    public bool IsCompleted { get; set; }
    public int WatchedSeconds { get; set; }
    public DateTime? CompletedAt { get; set; }
}

public class UpdateProgressRequest
{
    [Required]
    public Guid LessonId { get; set; }

    public bool IsCompleted { get; set; }
    public int WatchedSeconds { get; set; }
}

public class CreateReviewRequest
{
    [Required]
    public Guid CourseId { get; set; }

    [Range(1, 5)]
    public int Rating { get; set; }

    [MaxLength(1000)]
    public string? Comment { get; set; }
}

public class ReviewResponse
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public Guid CourseId { get; set; }
    public int Rating { get; set; }
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; }
}
