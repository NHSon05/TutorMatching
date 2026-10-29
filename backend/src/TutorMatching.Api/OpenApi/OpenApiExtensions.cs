using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.OpenApi;
using TutorMatching.Api.Contracts.Auth;
using TutorMatching.Api.Routing;
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
                description.RelativePath?.StartsWith(ApiRoutes.Prefix + "/", StringComparison.Ordinal) == true;
            options.AddOperationTransformer((operation, context, _) =>
            {
                operation.OperationId ??= context.Description.HttpMethod!.ToLowerInvariant() + "_" + System.Text.RegularExpressions.Regex.Replace(context.Description.RelativePath!, "[^a-zA-Z0-9]+", "_").Trim('_');
                if (context.Description.ActionDescriptor.EndpointMetadata.OfType<IAllowAnonymous>().Any())
                    operation.Security = [];

                if (context.Description.RelativePath == ApiRoutes.Prefix + "/tutors")
                {
                    foreach (var parameter in operation.Parameters ?? [])
                    {
                        if (parameter is not OpenApiParameter p) continue;
                        if (p.Name is "minPrice" or "maxPrice" or "sessionsPerWeek" or "durationMinutes" or "page" or "pageSize")
                            p.Schema = new OpenApiSchema { Type = JsonSchemaType.Integer, Description = "Validated integer query; invalid values return 400." };
                        if (p.Name == "subjectId")
                            p.Schema = new OpenApiSchema { Type = JsonSchemaType.Array, Items = new OpenApiSchema { Type = JsonSchemaType.String, Format = "uuid" } };
                    }
                }
                if (context.Description.RelativePath == ApiRoutes.Prefix + "/hire-requests")
                {
                    if (context.Description.HttpMethod == "POST")
                    {
                        operation.OperationId = "createHireRequest";
                        foreach (var parameter in operation.Parameters ?? [])
                            if (parameter is OpenApiParameter { Name: "Idempotency-Key" } identity)
                            {
                                identity.Required = true;
                                identity.Schema = new OpenApiSchema { Type = JsonSchemaType.String, Format = "uuid" };
                            }
                    }
                    else if (context.Description.HttpMethod == "GET")
                    {
                        operation.OperationId = "listHireRequests";
                    }
                }
                else if (context.Description.RelativePath == ApiRoutes.Prefix + "/hire-requests/{id}" && context.Description.HttpMethod == "GET")
                {
                    operation.OperationId = "getHireRequest";
                }
                else if (context.Description.RelativePath == ApiRoutes.Prefix + "/hire-requests/{id}/accept" && context.Description.HttpMethod == "POST")
                {
                    operation.OperationId = "acceptHireRequest";
                }
                else if (context.Description.RelativePath == ApiRoutes.Prefix + "/hire-requests/{id}/reject" && context.Description.HttpMethod == "POST")
                {
                    operation.OperationId = "rejectHireRequest";
                }
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
                if (context.JsonTypeInfo.Type.Namespace == "TutorMatching.Application.Hiring")
                {
                    schema.AdditionalPropertiesAllowed = false;
                    if (schema.Properties?.TryGetValue("teachingMode", out var modeProperty) == true && modeProperty is OpenApiSchema mode)
                        mode.Enum = ["ONLINE", "OFFLINE", "HYBRID"];
                    if (schema.Properties?.TryGetValue("status", out var statusProperty) == true && statusProperty is OpenApiSchema status)
                        status.Enum = ["PENDING", "NEGOTIATING", "ACCEPTED", "REJECTED", "CANCELLED", "COMPLETED"];
                    foreach (var field in new[] { "provinceCode", "districtCode", "locationDetail", "note", "courseId" })
                        if (schema.Properties?.TryGetValue(field, out var property) == true && property is OpenApiSchema optional)
                        {
                            optional.Type = JsonSchemaType.String;
                            if (field == "courseId") optional.Format = "uuid";
                        }
                }
                if (new[] { typeof(TutorMatching.Application.Tutors.PublicTutorSummary), typeof(TutorMatching.Application.Tutors.PublicTutorDetail),
                    typeof(TutorMatching.Application.Tutors.PublicTutorPage), typeof(TutorMatching.Application.Tutors.PublicSubject),
                    typeof(TutorMatching.Application.Tutors.PublicAvailability), typeof(TutorMatching.Application.Tutors.PublicCourse) }.Contains(context.JsonTypeInfo.Type))
                    schema.AdditionalPropertiesAllowed = false;
                if (context.JsonTypeInfo.Type == typeof(TutorMatching.Api.Controllers.AvailabilityRequest) ||
                    context.JsonTypeInfo.Type == typeof(TutorMatching.Api.Controllers.AvailabilityResponse))
                {
                    if (schema.Properties?["dayOfWeek"] is OpenApiSchema day)
                    {
                        day.Type = JsonSchemaType.Integer;
                        day.Minimum = "1";
                        day.Maximum = "7";
                    }
                    foreach (var field in new[] { "startTime", "endTime" })
                        if (schema.Properties?[field] is OpenApiSchema time)
                            time.Pattern = "^([01][0-9]|2[0-3]):[0-5][0-9]$";
                    if (schema.Properties?.TryGetValue("timeZone", out var timeZone) == true && timeZone is OpenApiSchema zone)
                        zone.Const = "Asia/Ho_Chi_Minh";
                }
                if (context.JsonTypeInfo.Type == typeof(TutorMatching.Domain.Users.AccountRole) ||
                    context.JsonTypeInfo.Type == typeof(TutorMatching.Domain.Users.AccountStatus))
                    schema.Type = JsonSchemaType.String;
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
                if (context.JsonTypeInfo.Type == typeof(TutorMatching.Api.Contracts.Users.UpdateProfileRequest))
                {
                    schema.AdditionalPropertiesAllowed = false;
                    schema.Required = new HashSet<string> { "fullName" };
                    if (schema.Properties?["fullName"] is OpenApiSchema name)
                    {
                        name.Type = JsonSchemaType.String;
                        name.MinLength = 2;
                        name.MaxLength = 100;
                    }
                    if (schema.Properties?["phoneNumber"] is OpenApiSchema phone) phone.MaxLength = 32;
                    if (schema.Properties?["avatarUrl"] is OpenApiSchema avatar) avatar.MaxLength = 2048;
                }
                if (context.JsonTypeInfo.Type == typeof(PersonalProfileResponse))
                {
                    schema.AdditionalPropertiesAllowed = false;
                    schema.Required = new HashSet<string>
                    {
                        "id", "email", "fullName", "role", "status", "phoneNumber", "dateOfBirth", "avatarUrl", "tutorProfileStatus"
                    };
                    if (schema.Properties?["email"] is OpenApiSchema email) email.Format = "email";
                    if (schema.Properties?["role"] is OpenApiSchema role)
                    {
                        role.Type = JsonSchemaType.String;
                        role.Enum = ["LEARNER", "TUTOR", "ADMIN"];
                    }
                    if (schema.Properties?.TryGetValue("status", out var statusProperty) == true && statusProperty is OpenApiSchema status)
                    {
                        status.Type = JsonSchemaType.String;
                        status.Enum = ["ACTIVE", "LOCKED", "INACTIVE"];
                    }
                    if (schema.Properties?.ContainsKey("tutorProfileStatus") == true)
                    {
                        schema.Properties["tutorProfileStatus"] = new OpenApiSchema
                        {
                            Type = JsonSchemaType.String | JsonSchemaType.Null
                        };
                    }
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
                document.Info.Title = "TutorMatching API";
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
