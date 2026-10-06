using TutorMatching.Infrastructure;
using TutorMatching.Infrastructure.Configurations;
using TutorMatching.Api.Security;
using TutorMatching.Api.Errors;

DotEnvLoader.Load();

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
builder.Services.AddApiErrors();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddApiSecurity(builder.Configuration, builder.Environment);
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

app.UseApiErrors();

await app.Services.SeedDevelopmentDataAsync(app.Environment.IsDevelopment());

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi().AllowAnonymous();
}

app.UseHttpsRedirection();
app.UseRouting();
app.UseApiSecurity();

app.MapCsrfEndpoint();
app.MapControllers();

app.Run();
