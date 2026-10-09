using TutorMatching.Application.Authentication.Register;
using TutorMatching.Infrastructure;
using TutorMatching.Infrastructure.Configurations;
using TutorMatching.Api.Security;
using TutorMatching.Api.Errors;
using TutorMatching.Api.OpenApi;

DotEnvLoader.Load();

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
builder.Services.AddApiErrors();
builder.Services.AddScoped<RegisterAccountHandler>();
builder.Services.AddScoped<TutorMatching.Application.Authentication.Sessions.SessionHandler>();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddApiSecurity(builder.Configuration, builder.Environment);
builder.Services.AddVersionedOpenApi();

var app = builder.Build();

app.UseApiErrors();

await app.Services.SeedDevelopmentDataAsync(app.Environment.IsDevelopment());

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment() || app.Environment.IsEnvironment("Testing"))
{
    app.MapOpenApi().AllowAnonymous();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/openapi/v1.json", "TutorMatching API v1");
        options.RoutePrefix = "swagger";
    });
}

app.UseHttpsRedirection();
app.UseRouting();
app.UseApiSecurity();

app.MapCsrfEndpoint();
app.MapControllers();

app.Run();

public partial class Program { }
