using Microsoft.AspNetCore.Mvc;
using TutorMatching.Application.Abstractions;

namespace TutorMatching.Api.Errors;

public static class ApiProblems
{
    public static ProblemDetails Create(
        HttpContext context,
        int status,
        string title
    )
    {
        var problem = new ProblemDetails
        {
            Type = "about:blank",
            Status = status,
            Title = title
        };

        problem.Extensions["traceId"] = context.TraceIdentifier;

        return problem;
    }

    public static ObjectResult FromFailure(
        HttpContext context,
        AccountFailure failure,
        IReadOnlyDictionary<string, string[]>? errors = null
    )
    {
        var (status, title) = failure switch
        {
            AccountFailure.InvalidInput => (422, "Dữ liệu không hợp lệ"),
            AccountFailure.DuplicateEmail => (409, "Email đã được sử dụng"),
            AccountFailure.DuplicatePhoneNumber => (409, "Điện thoại đã được sử dụng"),
            AccountFailure.InvalidCredentials => (401, "Thông tin đăng nhập không hợp lệ"),
            AccountFailure.Forbidden => (403, "Bạn không có quyền thực hiện thao tác này"),
            AccountFailure.NotFound => (404, "Không tìm thấy dữ liệu"),
            AccountFailure.InvalidResetCredential => (400, "Yêu cầu đặt lại mật khẩu không hợp lệ hoặc đã hết hạn."),
            _ => (500, "Đã xảy ra lỗi hệ thống.")
        };

        var problem = Create(context, status, title);
        if (errors is not null && errors.Count > 0)
        {
            problem.Extensions["errors"] = errors;
        }

        return ToResult(problem);
    }

    public static ObjectResult ToResult(ProblemDetails problem)
    {
        var result = new ObjectResult(problem)
        {
            StatusCode = problem.Status
        };

        result.ContentTypes.Add("application/problem+json");

        return result;
    }
}
