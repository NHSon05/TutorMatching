using Microsoft.Extensions.Diagnostics.HealthChecks;
using StackExchange.Redis;

namespace TutorMatching.Infrastructure.Storage;

public sealed class RedisHealthCheck(IConnectionMultiplexer multiplexer) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            if (!multiplexer.IsConnected)
            {
                return HealthCheckResult.Unhealthy("Redis connection is not established.");
            }

            var db = multiplexer.GetDatabase();
            var latency = await db.PingAsync();
            return HealthCheckResult.Healthy($"Redis PING succeeded in {latency.TotalMilliseconds:F2}ms.");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("Redis health check failed.", ex);
        }
    }
}
