using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.OpenApi;
using TutorMatching.Api.Contracts.Auth;
using TutorMatching.Api.Security;
using TutorMatching.Application.Authentication.Register;

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

                var consumes = context.Description.ActionDescriptor.EndpointMetadata
                    .OfType<ConsumesAttribute>()
                    .LastOrDefault();
                if (consumes is not null && operation.RequestBody?.Content is not null)
                {
                    var declaredContentTypes = consumes.ContentTypes.ToHashSet(StringComparer.OrdinalIgnoreCase);
                    foreach (var contentType in operation.RequestBody.Content.Keys
                                 .Where(contentType => !declaredContentTypes.Contains(contentType))
                                 .ToArray())
                    {
                        operation.RequestBody.Content.Remove(contentType);
                    }
                }
                return Task.CompletedTask;
            });
            options.AddSchemaTransformer((schema, context, _) =>
            {
                if (context.JsonTypeInfo.Type == typeof(LoginRequest))
                {
                    schema.AdditionalPropertiesAllowed = false;
                    if (schema.Properties?["email"] is OpenApiSchema email) email.Format = "email";
                    if (schema.Properties?["password"] is OpenApiSchema password) password.MinLength = 1;
                }
                if (context.JsonTypeInfo.Type == typeof(RegisterRequest))
                {
                    schema.AdditionalPropertiesAllowed = false;
                    schema.Required?.Remove("phoneNumber");
                    if (schema.Properties is not null)
                    {
                        if (schema.Properties["fullName"] is OpenApiSchema fullName)
                        {
                            fullName.MinLength = 2;
                            fullName.MaxLength = 100;
                        }
                        if (schema.Properties["email"] is OpenApiSchema email)
                            email.Format = "email";
                        if (schema.Properties["phoneNumber"] is OpenApiSchema phoneNumber)
                            phoneNumber.MaxLength = 32;
                        if (schema.Properties["password"] is OpenApiSchema password)
                        {
                            password.MinLength = 8;
                            password.MaxLength = RegisterAccountHandler.MaximumPasswordLength;
                        }
                        if (schema.Properties["passwordConfirmation"] is OpenApiSchema passwordConfirmation)
                        {
                            passwordConfirmation.MinLength = 8;
                            passwordConfirmation.MaxLength = RegisterAccountHandler.MaximumPasswordLength;
                        }
                        if (schema.Properties["role"] is OpenApiSchema role)
                            role.Enum = ["LEARNER", "TUTOR"];
                    }
                }
                if (context.JsonTypeInfo.Type == typeof(AccountResponse))
                {
                    schema.AdditionalPropertiesAllowed = false;
                    if (schema.Properties?["email"] is OpenApiSchema accountEmail)
                        accountEmail.Format = "email";
                    if (schema.Properties?["role"] is OpenApiSchema accountRole)
                        accountRole.Type = JsonSchemaType.String;
                    if (schema.Properties?["status"] is OpenApiSchema accountStatus)
                        accountStatus.Type = JsonSchemaType.String;
                }
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
                        Name = JwtCookieTokens.AccessCookie
                    },
                    ["refreshCookie"] = new OpenApiSecurityScheme
                    {
                        Type = SecuritySchemeType.ApiKey,
                        In = ParameterLocation.Cookie,
                        Name = JwtCookieTokens.RefreshCookie
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
                        if (operation.OperationId == "login" && operation.Responses?["200"] is OpenApiResponse loginResponse)
                        {
                            loginResponse.Headers ??= new Dictionary<string, IOpenApiHeader>();
                            loginResponse.Headers["Set-Cookie"] = new OpenApiHeader { Schema = new OpenApiSchema { Type = JsonSchemaType.String } };
                        }
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
                        if (operation.OperationId is "refreshSession" or "logout")
                            requirement[new OpenApiSecuritySchemeReference("refreshCookie", document)] = [];
                        else if (operation.Security is null || operation.Security.Count != 0)
                            requirement[new OpenApiSecuritySchemeReference("cookieAuth", document)] = [];
                        operation.Security = [requirement];
                    }
                return Task.CompletedTask;
            });
        });
        return services;
    }
}
