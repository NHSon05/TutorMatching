using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using Testcontainers.PostgreSql;
using TutorMatching.Infrastructure.Persistence;

namespace TutorMatching.Api.IntegrationTests.Fixtures;

[CollectionDefinition("PostgreSQL API", DisableParallelization = true)]
public sealed class PostgreSqlCollection : ICollectionFixture<PostgreSqlFixture>;

public sealed class PostgreSqlFixture : IAsyncLifetime
{
    private readonly PostgreSqlContainer container = new PostgreSqlBuilder("postgres:17.6-alpine")
        .WithDatabase("fixture_admin")
        .WithUsername("fixture_user")
        .WithPassword(Guid.NewGuid().ToString("N"))
        .Build();

    public Task InitializeAsync() => container.StartAsync();
    public Task DisposeAsync() => container.DisposeAsync().AsTask();

    public async Task<ApiWebApplicationFactory> CreateFactoryAsync()
    {
        // Generated names only; no user input or shared database is accepted.
        var name = $"test_{Guid.NewGuid():N}";
        await using (var connection = new NpgsqlConnection(container.GetConnectionString()))
        {
            await connection.OpenAsync();
            await using var command = new NpgsqlCommand($"CREATE DATABASE \"{name}\"", connection);
            await command.ExecuteNonQueryAsync();
        }

        var connectionString = new NpgsqlConnectionStringBuilder(container.GetConnectionString())
        {
            Database = name,
            Pooling = false
        }.ConnectionString;
        var factory = new ApiWebApplicationFactory(connectionString);
        try
        {
            await using var scope = factory.Services.CreateAsyncScope();
            await scope.ServiceProvider.GetRequiredService<ApplicationDbContext>().Database.MigrateAsync();
            return factory;
        }
        catch
        {
            await factory.DisposeAsync();
            throw;
        }
    }
}
