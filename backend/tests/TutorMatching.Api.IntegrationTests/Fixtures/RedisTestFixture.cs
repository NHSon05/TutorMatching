using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using StackExchange.Redis;
using Testcontainers.Redis;

namespace TutorMatching.Api.IntegrationTests.Fixtures;

[CollectionDefinition("Redis API", DisableParallelization = true)]
public sealed class RedisCollection : ICollectionFixture<PostgreSqlFixture>, ICollectionFixture<RedisTestFixture>;

public sealed class RedisTestFixture : IAsyncLifetime
{
    private readonly RedisContainer container = new RedisBuilder("redis:7.2-alpine")
        .Build();

    public string ConnectionString => container.GetConnectionString();

    public Task InitializeAsync() => container.StartAsync();

    public Task DisposeAsync() => container.DisposeAsync().AsTask();

    public async Task<IConnectionMultiplexer> CreateConnectionAsync()
    {
        var options = ConfigurationOptions.Parse(ConnectionString);
        options.AllowAdmin = true;
        options.AbortOnConnectFail = false;
        return await ConnectionMultiplexer.ConnectAsync(options);
    }

    public async Task FlushDatabaseAsync()
    {
        using var multiplexer = await CreateConnectionAsync();
        foreach (var endpoint in multiplexer.GetEndPoints())
        {
            var server = multiplexer.GetServer(endpoint);
            if (!server.IsReplica)
            {
                await server.FlushAllDatabasesAsync();
            }
        }
    }
}

[Collection("Redis API")]
public sealed class RedisTestFixtureTests(PostgreSqlFixture postgresFixture, RedisTestFixture redisFixture)
{
    [Fact]
    public async Task RedisContainerAndHealthCheckSucceedInWebApplicationFactory()
    {
        await redisFixture.FlushDatabaseAsync();
        await using var factory = await postgresFixture.CreateFactoryAsync(
            redisConnectionString: redisFixture.ConnectionString);

        await using var scope = factory.Services.CreateAsyncScope();
        var multiplexer = scope.ServiceProvider.GetRequiredService<IConnectionMultiplexer>();
        Assert.True(multiplexer.IsConnected);

        var db = multiplexer.GetDatabase();
        var key = $"test:phase1:{Guid.NewGuid():N}";
        Assert.True(await db.StringSetAsync(key, "1", TimeSpan.FromMinutes(1), When.NotExists));
        Assert.False(await db.StringSetAsync(key, "1", TimeSpan.FromMinutes(1), When.NotExists));

        var healthCheckService = scope.ServiceProvider.GetRequiredService<HealthCheckService>();
        var report = await healthCheckService.CheckHealthAsync(reg => reg.Name == "redis");
        Assert.Equal(HealthStatus.Healthy, report.Status);
    }
}
