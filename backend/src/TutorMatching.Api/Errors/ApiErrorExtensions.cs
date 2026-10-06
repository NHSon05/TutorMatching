using Microsoft.AspNetCore.Mvc;

namespace TutorMatching.Api.Errors;

public static class ApiErrorExtensions
{
    public static IServiceCollection AddApiErrors(
        this IServiceCollection services)
    {
        services.AddProblemDetails(options =>
        {
            options.CustomizeProblemDetails = context =>
            {
                context.ProblemDetails.Extensions["traceId"] =
                    context.HttpContext.TraceIdentifier;

                if (context.ProblemDetails.Status >= 500)
                {
                    context.ProblemDetails.Title =
                        "Đã xảy ra lỗi hệ thống.";

                    context.ProblemDetails.Detail = null;
                }
            };
        });

        services.AddExceptionHandler<ApiExceptionHandler>();

        services.Configure<ApiBehaviorOptions>(options =>
        {
            options.InvalidModelStateResponseFactory = context =>
            {
                var errors = context.ModelState
                    .Where(entry => entry.Value is { Errors.Count: > 0 })
                    .ToDictionary(
                        entry => entry.Key,
                        entry => new[]
                        {
                            "Giá trị không hợp lệ hoặc thiếu trường bắt buộc."
                        });

                var problem = new ValidationProblemDetails(errors)
                {
                    Type = "about:blank",
                    Status = StatusCodes.Status422UnprocessableEntity,
                    Title = "Dữ liệu không hợp lệ."
                };

                problem.Extensions["traceId"] =
                    context.HttpContext.TraceIdentifier;

                return ApiProblems.ToResult(problem);
            };
        });

        return services;
    }

    public static IApplicationBuilder UseApiErrors(
        this IApplicationBuilder app)
    {
        app.UseExceptionHandler();

        app.UseStatusCodePages(async statusContext =>
        {
            var context = statusContext.HttpContext;
            var status = context.Response.StatusCode;

            var title = status switch
            {
                400 => "Yêu cầu không hợp lệ.",
                401 => "Bạn cần đăng nhập để tiếp tục.",
                403 => "Bạn không có quyền thực hiện thao tác này.",
                404 => "Không tìm thấy tài nguyên.",
                405 => "Phương thức không được hỗ trợ.",
                409 => "Dữ liệu bị xung đột.",
                422 => "Dữ liệu không hợp lệ.",
                429 => "Quá nhiều yêu cầu. Vui lòng thử lại sau.",
                >= 500 => "Đã xảy ra lỗi hệ thống.",
                _ => "Không thể xử lý yêu cầu."
            };

            await Results.Problem(
                ApiProblems.Create(context, status, title)
            ).ExecuteAsync(context);
        });

        return app;
    }
}