using System.ComponentModel.DataAnnotations;

namespace Course.API.DTOs;

public class CreateCourseRequest
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string Description { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? ShortDescription { get; set; }

    [MaxLength(50)]
    public string Category { get; set; } = string.Empty;

    [MaxLength(20)]
    public string Level { get; set; } = "Beginner";

    public decimal Price { get; set; }

    [MaxLength(500)]
    public string? ThumbnailUrl { get; set; }
}

public class UpdateCourseRequest
{
    [MaxLength(200)]
    public string? Title { get; set; }

    [MaxLength(2000)]
    public string? Description { get; set; }

    [MaxLength(500)]
    public string? ShortDescription { get; set; }

    [MaxLength(50)]
    public string? Category { get; set; }

    [MaxLength(20)]
    public string? Level { get; set; }

    public decimal? Price { get; set; }

    [MaxLength(500)]
    public string? ThumbnailUrl { get; set; }
}

public class CourseResponse
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? ShortDescription { get; set; }
    public Guid InstructorId { get; set; }
    public string InstructorName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Level { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string? ThumbnailUrl { get; set; }
    public string Status { get; set; } = string.Empty;
    public double Rating { get; set; }
    public int RatingCount { get; set; }
    public int EnrollmentCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<SectionResponse> Sections { get; set; } = new();
}

public class SectionResponse
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public int Order { get; set; }
    public List<LessonResponse> Lessons { get; set; } = new();
}

public class LessonResponse
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Content { get; set; }
    public string Type { get; set; } = string.Empty;
    public string? VideoUrl { get; set; }
    public int DurationMinutes { get; set; }
    public int Order { get; set; }
    public bool IsFree { get; set; }
}

public class CreateSectionRequest
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    public int Order { get; set; }
}

public class CreateLessonRequest
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(5000)]
    public string? Content { get; set; }

    [MaxLength(20)]
    public string Type { get; set; } = "Video";

    [MaxLength(500)]
    public string? VideoUrl { get; set; }

    public int DurationMinutes { get; set; }
    public int Order { get; set; }
    public bool IsFree { get; set; }
}
