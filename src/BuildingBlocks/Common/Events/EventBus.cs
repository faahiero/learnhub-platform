using System.Collections.Concurrent;
using System.Text.Json;
using Amazon.SQS;
using Amazon.SQS.Model;
using Microsoft.Extensions.Logging;

namespace Common.Events;

public interface IEventBus
{
    void Publish<T>(T @event) where T : IntegrationEvent;
    void Subscribe<T>(Func<T, Task> handler) where T : IntegrationEvent;
}

public class SqsEventBus : IEventBus, IDisposable
{
    private readonly IAmazonSQS _sqsClient;
    private readonly ILogger<SqsEventBus> _logger;
    private readonly ConcurrentDictionary<string, string> _queueUrlCache = new();
    private readonly CancellationTokenSource _cts = new();

    private static readonly Dictionary<string, string> QueueMap = new()
    {
        { nameof(CoursePublishedEvent), "course-events" },
        { nameof(UserEnrolledEvent), "enrollment-events" },
        { nameof(MediaUploadedEvent), "media-events" }
    };

    public SqsEventBus(IAmazonSQS sqsClient, ILogger<SqsEventBus> logger)
    {
        _sqsClient = sqsClient;
        _logger = logger;
    }

    private string GetQueueName(string eventName)
    {
        if (QueueMap.TryGetValue(eventName, out var queueName))
            return queueName;

        return $"{eventName.ToLowerInvariant().Replace("event", "")}-events";
    }

    private string? ResolveQueueUrl(string queueName)
    {
        return _queueUrlCache.GetOrAdd(queueName, qName =>
        {
            try
            {
                var response = _sqsClient.GetQueueUrlAsync(qName).GetAwaiter().GetResult();
                return response.QueueUrl;
            }
            catch (QueueDoesNotExistException)
            {
                try
                {
                    var createResponse = _sqsClient.CreateQueueAsync(new CreateQueueRequest
                    {
                        QueueName = qName
                    }).GetAwaiter().GetResult();
                    _logger.LogInformation("Created SQS queue {QueueName}", qName);
                    return createResponse.QueueUrl;
                }
                catch (Exception createEx)
                {
                    _logger.LogWarning(createEx, "Could not auto-create SQS queue {QueueName}", qName);
                    return string.Empty;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not resolve SQS queue URL for {QueueName}", qName);
                return string.Empty;
            }
        });
    }

    public void Publish<T>(T @event) where T : IntegrationEvent
    {
        var eventName = typeof(T).Name;
        var queueName = GetQueueName(eventName);
        var message = JsonSerializer.Serialize(@event);

        try
        {
            var queueUrl = ResolveQueueUrl(queueName);
            if (!string.IsNullOrEmpty(queueUrl))
            {
                _sqsClient.SendMessageAsync(new SendMessageRequest
                {
                    QueueUrl = queueUrl,
                    MessageBody = message
                }).GetAwaiter().GetResult();

                _logger.LogInformation("Published event {EventName} to SQS queue {QueueName}", eventName, queueName);
            }
            else
            {
                _logger.LogWarning("Queue URL not found for {QueueName}. Event logged: {Message}", queueName, message);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to publish event {EventName} to SQS: {Message}", eventName, message);
        }
    }

    public void Subscribe<T>(Func<T, Task> handler) where T : IntegrationEvent
    {
        var eventName = typeof(T).Name;
        var queueName = GetQueueName(eventName);
        var queueUrl = ResolveQueueUrl(queueName);

        if (string.IsNullOrEmpty(queueUrl))
        {
            _logger.LogWarning("Cannot subscribe to {EventName}: SQS Queue URL not resolved", eventName);
            return;
        }

        Task.Run(async () =>
        {
            _logger.LogInformation("Subscribed to SQS queue {QueueName} for event {EventName}", queueName, eventName);
            while (!_cts.Token.IsCancellationRequested)
            {
                try
                {
                    var receiveRequest = new ReceiveMessageRequest
                    {
                        QueueUrl = queueUrl,
                        MaxNumberOfMessages = 5,
                        WaitTimeSeconds = 10
                    };

                    var response = await _sqsClient.ReceiveMessageAsync(receiveRequest, _cts.Token);
                    foreach (var msg in response.Messages)
                    {
                        try
                        {
                            var @event = JsonSerializer.Deserialize<T>(msg.Body);
                            if (@event != null)
                            {
                                await handler(@event);
                            }

                            await _sqsClient.DeleteMessageAsync(queueUrl, msg.ReceiptHandle, _cts.Token);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Error processing event from SQS queue {QueueName}", queueName);
                        }
                    }
                }
                catch (OperationCanceledException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error polling SQS queue {QueueName}. Waiting before retry...", queueName);
                    await Task.Delay(5000, _cts.Token);
                }
            }
        }, _cts.Token);
    }

    public void Dispose()
    {
        _cts.Cancel();
        _cts.Dispose();
    }
}
