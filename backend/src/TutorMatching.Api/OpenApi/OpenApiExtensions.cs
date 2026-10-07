using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.OpenApi;
using TutorMatching.Api.Security;

namespace TutorMatching.Api.OpenApi;

public static class OpenApiExtensions
{
    public static IServiceCollection AddVersionedOpenApi(this IServiceCollection services)
    {
        services.AddOpenApi("v1", options =>
        {
            options.OpenApiVersion = OpenApiSpecVersion.OpenApi3_1;
            options.ShouldInclude = description =>
                description.RelativePath?.StartsWith("api/v1/", StringComparison.Ordinal) == true;
            options.AddOperationTransformer((operation, context, _) =>
            {
                if (context.Description.ActionDescriptor.EndpointMetadata.OfType<IAllowAnonymous>().Any())
                    operation.Security = [];
                return Task.CompletedTask;
            });
            options.AddSchemaTransformer((schema, context, _) =>
            {
                if (context.JsonTypeInfo.Type == typeof(CsrfTokenResponse) && schema.Properties is not null)
                    schema.Properties["headerName"] = new OpenApiSchema
                    {
                        Type = JsonSchemaType.String,
                        Const = ApiSecurityExtensions.CsrfHeader
                    };
                if (context.JsonTypeInfo.Type == typeof(ProblemDetails))
                {
                    // Error middleware emits these fields without explicit null values.
                    schema.Properties ??= new Dictionary<string, IOpenApiSchema>();
                    foreach (var field in new[] { "type", "title", "detail", "traceId" })
                        schema.Properties[field] = new OpenApiSchema { Type = JsonSchemaType.String };
                    schema.Properties["status"] = new OpenApiSchema { Type = JsonSchemaType.Integer };
                }
                return Task.CompletedTask;
            });
            options.AddDocumentTransformer((document, context, _) =>
            {
                var cookieName = context.ApplicationServices.GetRequiredService<IConfiguration>()["Cookie:Name"]
                    ?? "tutormatch_session";
                document.Info.Title = "TutorMatching Foundation and Accounts API";
                document.Info.Version = "1.0.0";
                document.Servers = [new OpenApiServer { Url = "/" }];
                document.Components ??= new OpenApiComponents();
                document.Components.SecuritySchemes = new Dictionary<string, IOpenApiSecurityScheme>
                {
                    ["cookieAuth"] = new OpenApiSecurityScheme
                    {
                        Type = SecuritySchemeType.ApiKey,
                        In = ParameterLocation.Cookie,
                        Name = cookieName
                    },
                    ["csrfHeader"] = new OpenApiSecurityScheme
                    {
                        Type = SecuritySchemeType.ApiKey,
                        In = ParameterLocation.Header,
                        Name = ApiSecurityExtensions.CsrfHeader
                    },
                    ["csrfCookie"] = new OpenApiSecurityScheme
                    {
                        Type = SecuritySchemeType.ApiKey,
                        In = ParameterLocation.Cookie,
                        Name = $"{cookieName}_csrf"
                    }
                };
                document.Security = [new OpenApiSecurityRequirement
                {
                    [new OpenApiSecuritySchemeReference("cookieAuth", document)] = []
                }];
                foreach (var path in document.Paths.Values)
                    foreach (var pair in path.Operations ?? [])
                    {
                        var operation = pair.Value;
                        if (operation.Responses?.TryGetValue("429", out var limited) == true && limited is OpenApiResponse response)
                        {
                            response.Headers ??= new Dictionary<string, IOpenApiHeader>();
                            response.Headers["Retry-After"] = new OpenApiHeader
                            {
                                Description = "Seconds to wait before retrying",
                                Schema = new OpenApiSchema { Type = JsonSchemaType.Integer }
                            };
                        }
                        if (pair.Key == HttpMethod.Get || pair.Key == HttpMethod.Head || pair.Key == HttpMethod.Options)
                            continue;
                        var requirement = new OpenApiSecurityRequirement
                        {
                            [new OpenApiSecuritySchemeReference("csrfHeader", document)] = [],
                            [new OpenApiSecuritySchemeReference("csrfCookie", document)] = []
                        };
                        if (operation.Security is null || operation.Security.Count != 0)
                            requirement[new OpenApiSecuritySchemeReference("cookieAuth", document)] = [];
                        operation.Security = [requirement];
                    }
                return Task.CompletedTask;
            });
        });
        return services;
    }
}
