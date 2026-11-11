using TutorMatching.Application.Authentication.Register;
using TutorMatching.Infrastructure;
using TutorMatching.Infrastructure.Configurations;
using TutorMatching.Api.Security;
using TutorMatching.Api.Errors;
using TutorMatching.Api.OpenApi;
using TutorMatching.Api.Routing;
using Microsoft.AspNetCore.Mvc;

DotEnvLoader.Load();

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers(options =>
{
    options.UseCentralRoutePrefix(new RouteAttribute(ApiRoutes.Prefix));
});
builder.Services.AddApiErrors();
builder.Services.AddScoped<RegisterAccountHandler>();
builder.Services.AddScoped<TutorMatching.Application.Hiring.CreateHireRequest>();
builder.Services.AddScoped<TutorMatching.Application.Hiring.RespondToHireRequest>();
builder.Services.AddScoped<TutorMatching.Application.Hiring.NegotiateHireRequest>();
builder.Services.AddScoped<TutorMatching.Application.Hiring.CloseHireRequest>();
builder.Services.AddScoped<TutorMatching.Application.Hiring.PayHireRequest>();
builder.Services.AddScoped<TutorMatching.Application.Hiring.ReviewHireRequest>();
builder.Services.AddScoped<TutorMatching.Application.Users.Profile.CurrentProfileHandler>();
builder.Services.AddScoped<TutorMatching.Application.Authentication.Sessions.SessionHandler>();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddApiSecurity(builder.Configuration, builder.Environment);
builder.Services.AddVersionedOpenApi();
builder.Services.AddSignalR();
builder.Services.AddSingleton<TutorMatching.Application.Abstractions.IEventPublisher, TutorMatching.Infrastructure.Messaging.SignalREventPublisher<TutorMatching.Api.Hubs.EventsHub>>();
builder.Services.AddHostedService<TutorMatching.Infrastructure.Messaging.MessageNotificationOutboxWorker>();

var app = builder.Build();

app.UseApiErrors();

await app.Services.SeedDevelopmentDataAsync(app.Environment.IsDevelopment() || args.Contains("--seed-only"));

if (args.Contains("--seed-only"))
{
    Console.WriteLine("Development data seeding completed successfully.");
    return;
}

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
app.UseStaticFiles();
app.UseRouting();
app.UseApiSecurity();

app.MapCsrfEndpoint();
app.MapControllers();
app.MapHub<TutorMatching.Api.Hubs.EventsHub>("/api/v1/hubs/events");

app.Run();

public partial class Program { }
