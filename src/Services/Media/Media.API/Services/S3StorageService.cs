using Amazon.S3;
using Amazon.S3.Model;

namespace Media.API.Services;

public interface IStorageService
{
    Task<(string url, string key)> UploadFileAsync(Stream fileStream, string fileName, string contentType);
    Task<Stream> GetFileAsync(string key);
    Task DeleteFileAsync(string key);
}

public class S3StorageService : IStorageService
{
    private readonly IAmazonS3 _s3Client;
    private readonly string _bucketName;
    private readonly string _publicServiceUrl;
    private readonly ILogger<S3StorageService> _logger;

    public S3StorageService(IAmazonS3 s3Client, IConfiguration configuration, ILogger<S3StorageService> logger)
    {
        _s3Client = s3Client;
        _bucketName = configuration["AWS:BucketName"] ?? "learnhub-media";
        _publicServiceUrl = configuration["AWS:PublicServiceURL"] ?? "http://localhost:4566";
        _logger = logger;

        EnsureBucketExists().GetAwaiter().GetResult();
    }

    private async Task EnsureBucketExists()
    {
        try
        {
            var buckets = await _s3Client.ListBucketsAsync();
            if (!buckets.Buckets.Any(b => b.BucketName == _bucketName))
            {
                await _s3Client.PutBucketAsync(new PutBucketRequest { BucketName = _bucketName });
                _logger.LogInformation("Created S3 bucket: {BucketName}", _bucketName);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not ensure S3 bucket exists. Will try on upload.");
        }
    }

    public async Task<(string url, string key)> UploadFileAsync(Stream fileStream, string fileName, string contentType)
    {
        var key = $"{Guid.NewGuid()}/{fileName}";

        var request = new PutObjectRequest
        {
            BucketName = _bucketName,
            Key = key,
            InputStream = fileStream,
            ContentType = contentType
        };

        await _s3Client.PutObjectAsync(request);

        var url = $"{_publicServiceUrl}/{_bucketName}/{key}";
        _logger.LogInformation("Uploaded file {FileName} to {Url}", fileName, url);

        return (url, key);
    }

    public async Task<Stream> GetFileAsync(string key)
    {
        var response = await _s3Client.GetObjectAsync(_bucketName, key);
        return response.ResponseStream;
    }

    public async Task DeleteFileAsync(string key)
    {
        await _s3Client.DeleteObjectAsync(_bucketName, key);
        _logger.LogInformation("Deleted file {Key}", key);
    }
}
