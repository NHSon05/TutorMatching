using Microsoft.AspNetCore.Diagnostics;

namespace TutorMatching.Api.Errors;

public sealed class ApiExceptionHandler(
    ILogger<ApiExceptionHandler> logger
) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken
    )
    {
        if (httpContext.Response.HasStarted || httpContext.RequestAborted.IsCancellationRequested)
        {
            return false;
        }

        logger.LogError(
            "Unhandled exception {ExceptionType}. TraceId: {TraceId}",
            exception.GetType().Name,
            httpContext.TraceIdentifier
        );

        var problem = ApiProblems.Create(
            httpContext,
            StatusCodes.Status500InternalServerError,
            "Đã xảy ra lỗi hệ thống"
        );

        await Results.Problem(problem).ExecuteAsync(httpContext);
        return true;
    }
}