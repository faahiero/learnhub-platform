using System.ComponentModel.DataAnnotations;

namespace Enrollment.API.Models;

public class EnrollmentEntity
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid UserId { get; set; }

    [Required]
    public Guid CourseId { get; set; }

    [MaxLength(200)]
    public string CourseTitle { get; set; } = string.Empty;

    [MaxLength(20)]
    public string Status { get; set; } = "Active"; // Active, Completed, Cancelled

    public int TotalLessons { get; set; }

    public double ProgressPercent { get; set; }

    public DateTime EnrolledAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<LessonProgress> LessonProgresses { get; set; } = new List<LessonProgress>();
}

public class LessonProgress
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid EnrollmentId { get; set; }
    public EnrollmentEntity Enrollment { get; set; } = null!;

    [Required]
    public Guid LessonId { get; set; }

    public bool IsCompleted { get; set; }
    public int WatchedSeconds { get; set; }

    public DateTime? CompletedAt { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class Review
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid UserId { get; set; }

    [MaxLength(100)]
    public string UserName { get; set; } = string.Empty;

    [Required]
    public Guid CourseId { get; set; }

    [Range(1, 5)]
    public int Rating { get; set; }

    [MaxLength(1000)]
    public string? Comment { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
