using Amazon;
using Amazon.SQS;
using Common.Events;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Common.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddEventBus(this IServiceCollection services, string? serviceUrl = null, string region = "us-east-1")
    {
        services.AddSingleton<IAmazonSQS>(sp =>
        {
            if (!string.IsNullOrEmpty(serviceUrl))
            {
                var config = new AmazonSQSConfig
                {
                    ServiceURL = serviceUrl,
                    UseHttp = true,
                    AuthenticationRegion = region
                };
                return new AmazonSQSClient("test", "test", config);
            }

            return new AmazonSQSClient(RegionEndpoint.GetBySystemName(region));
        });

        services.AddSingleton<IEventBus>(sp =>
        {
            var sqsClient = sp.GetRequiredService<IAmazonSQS>();
            var logger = sp.GetRequiredService<ILogger<SqsEventBus>>();
            return new SqsEventBus(sqsClient, logger);
        });

        return services;
    }
}
