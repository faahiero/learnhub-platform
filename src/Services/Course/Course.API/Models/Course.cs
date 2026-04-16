using System.ComponentModel.DataAnnotations;

namespace Course.API.Models;

public class CourseEntity
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string Description { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? ShortDescription { get; set; }

    [Required]
    public Guid InstructorId { get; set; }

    [MaxLength(100)]
    public string InstructorName { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Category { get; set; } = string.Empty;

    [MaxLength(20)]
    public string Level { get; set; } = "Beginner"; // Beginner, Intermediate, Advanced

    public decimal Price { get; set; }

    [MaxLength(500)]
    public string? ThumbnailUrl { get; set; }

    [MaxLength(20)]
    public string Status { get; set; } = "Draft"; // Draft, Published, Archived

    public double Rating { get; set; }
    public int RatingCount { get; set; }
    public int EnrollmentCount { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Section> Sections { get; set; } = new List<Section>();
}

public class Section
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    public int Order { get; set; }

    public Guid CourseId { get; set; }
    public CourseEntity Course { get; set; } = null!;

    public ICollection<Lesson> Lessons { get; set; } = new List<Lesson>();
}

public class Lesson
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(5000)]
    public string? Content { get; set; }

    [MaxLength(20)]
    public string Type { get; set; } = "Video"; // Video, Article, Quiz

    [MaxLength(500)]
    public string? VideoUrl { get; set; }

    public int DurationMinutes { get; set; }
    public int Order { get; set; }
    public bool IsFree { get; set; }

    public Guid SectionId { get; set; }
    public Section Section { get; set; } = null!;
}
