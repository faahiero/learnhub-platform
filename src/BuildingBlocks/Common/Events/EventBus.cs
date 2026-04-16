using System.Text;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace Common.Events;

public interface IEventBus
{
    void Publish<T>(T @event) where T : IntegrationEvent;
    void Subscribe<T>(Func<T, Task> handler) where T : IntegrationEvent;
}

public class RabbitMqEventBus : IEventBus, IDisposable
{
    private readonly IConnection _connection;
    private readonly IModel _channel;
    private readonly ILogger<RabbitMqEventBus> _logger;
    private const string ExchangeName = "learnhub_events";

    public RabbitMqEventBus(string hostName, ILogger<RabbitMqEventBus> logger)
    {
        _logger = logger;
        var factory = new ConnectionFactory
        {
            HostName = hostName,
            DispatchConsumersAsync = true
        };

        try
        {
            _connection = factory.CreateConnection();
            _channel = _connection.CreateModel();
            _channel.ExchangeDeclare(ExchangeName, ExchangeType.Topic, durable: true);
            _logger.LogInformation("Connected to RabbitMQ at {Host}", hostName);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not connect to RabbitMQ. Events will be logged only.");
            _connection = null!;
            _channel = null!;
        }
    }

    public void Publish<T>(T @event) where T : IntegrationEvent
    {
        var eventName = typeof(T).Name;
        var message = JsonSerializer.Serialize(@event);
        var body = Encoding.UTF8.GetBytes(message);

        if (_channel != null)
        {
            _channel.BasicPublish(
                exchange: ExchangeName,
                routingKey: eventName,
                basicProperties: null,
                body: body);
            _logger.LogInformation("Published event {EventName}: {Message}", eventName, message);
        }
        else
        {
            _logger.LogWarning("RabbitMQ not available. Event {EventName} logged: {Message}", eventName, message);
        }
    }

    public void Subscribe<T>(Func<T, Task> handler) where T : IntegrationEvent
    {
        if (_channel == null) return;

        var eventName = typeof(T).Name;
        var queueName = $"{eventName}_queue";

        _channel.QueueDeclare(queueName, durable: true, exclusive: false, autoDelete: false);
        _channel.QueueBind(queueName, ExchangeName, eventName);

        var consumer = new AsyncEventingBasicConsumer(_channel);
        consumer.Received += async (_, ea) =>
        {
            var message = Encoding.UTF8.GetString(ea.Body.ToArray());
            var @event = JsonSerializer.Deserialize<T>(message);
            if (@event != null)
            {
                await handler(@event);
            }
            _channel.BasicAck(ea.DeliveryTag, false);
        };

        _channel.BasicConsume(queueName, false, consumer);
        _logger.LogInformation("Subscribed to event {EventName}", eventName);
    }

    public void Dispose()
    {
        _channel?.Dispose();
        _connection?.Dispose();
    }
}
