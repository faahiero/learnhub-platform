using System.Security.Claims;
using Common.Events;
using Media.API.DTOs;
using Media.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Media.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MediaController : ControllerBase
{
    private readonly IStorageService _storageService;
    private readonly IEventBus _eventBus;
    private readonly ILogger<MediaController> _logger;

    private static readonly HashSet<string> AllowedContentTypes = new()
    {
        "image/jpeg", "image/png", "image/gif", "image/webp",
        "video/mp4", "video/webm", "video/quicktime",
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    };

    public MediaController(IStorageService storageService, IEventBus eventBus, ILogger<MediaController> logger)
    {
        _storageService = storageService;
        _eventBus = eventBus;
        _logger = logger;
    }

    [Authorize]
    [HttpPost("upload")]
    [RequestSizeLimit(500_000_000)] // 500MB
    public async Task<ActionResult<UploadResponse>> Upload(IFormFile file, [FromQuery] Guid? courseId)
    {
        if (file.Length == 0)
            return BadRequest(new { message = "File is empty" });

        if (!AllowedContentTypes.Contains(file.ContentType))
            return BadRequest(new { message = $"File type {file.ContentType} is not allowed" });

        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        using var stream = file.OpenReadStream();
        var (url, key) = await _storageService.UploadFileAsync(stream, file.FileName, file.ContentType);

        var mediaId = Guid.NewGuid();

        if (courseId.HasValue)
        {
            _eventBus.Publish(new MediaUploadedEvent
            {
                MediaId = mediaId,
                CourseId = courseId.Value,
                FileName = file.FileName,
                Url = url
            });
        }

        _logger.LogInformation("User {UserId} uploaded file {FileName}", userId, file.FileName);

        return Ok(new UploadResponse
        {
            Id = mediaId,
            FileName = file.FileName,
            Url = url,
            ContentType = file.ContentType,
            Size = file.Length,
            UploadedAt = DateTime.UtcNow
        });
    }

    [Authorize]
    [HttpPost("upload-multiple")]
    [RequestSizeLimit(500_000_000)]
    public async Task<ActionResult<List<UploadResponse>>> UploadMultiple(List<IFormFile> files)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var results = new List<UploadResponse>();

        foreach (var file in files)
        {
            if (file.Length == 0 || !AllowedContentTypes.Contains(file.ContentType))
                continue;

            using var stream = file.OpenReadStream();
            var (url, key) = await _storageService.UploadFileAsync(stream, file.FileName, file.ContentType);

            results.Add(new UploadResponse
            {
                Id = Guid.NewGuid(),
                FileName = file.FileName,
                Url = url,
                ContentType = file.ContentType,
                Size = file.Length,
                UploadedAt = DateTime.UtcNow
            });
        }

        return Ok(results);
    }

    [HttpGet("health")]
    public IActionResult Health()
    {
        return Ok(new { status = "healthy", service = "Media API" });
    }
}
