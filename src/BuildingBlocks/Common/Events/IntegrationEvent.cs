namespace Common.Events;

public abstract class IntegrationEvent
{
    public Guid Id { get; } = Guid.NewGuid();
    public DateTime CreatedAt { get; } = DateTime.UtcNow;
    public string EventType => GetType().Name;
}

public class CoursePublishedEvent : IntegrationEvent
{
    public Guid CourseId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string InstructorId { get; set; } = string.Empty;
}

public class UserEnrolledEvent : IntegrationEvent
{
    public Guid EnrollmentId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public Guid CourseId { get; set; }
}

public class MediaUploadedEvent : IntegrationEvent
{
    public Guid MediaId { get; set; }
    public Guid CourseId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
}
