using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TutorMatching.Application.Catalog;
using TutorMatching.Application.Abstractions;

namespace TutorMatching.Api.Controllers;

[ApiController]
[Consumes("application/json")]
[ProducesResponseType(typeof(ProblemDetails), 400, "application/problem+json")]
[ProducesResponseType(typeof(ProblemDetails), 404, "application/problem+json")]
public sealed class CatalogController(ICatalogService service, ICurrentUser currentUser) : ControllerBase
{
    private static bool Known(string kind) => kind is "subjects" or "provinces" or "districts" or "teaching-levels";
    [ProducesResponseType(typeof(CatalogItem[]), 200, "application/json")]
    [HttpGet("catalog/{kind}"), AllowAnonymous]
    public async Task<IActionResult> Public(string kind, [FromQuery] string? provinceCode, CancellationToken token)
    {
        Response.Headers.CacheControl = "no-store";
        return Known(kind) ? Ok(await service.ListAsync(kind, false, provinceCode, token)) : NotFound();
    }
    [ProducesResponseType(typeof(CatalogItem[]), 200, "application/json")]
    [ProducesResponseType(typeof(ProblemDetails), 401, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), 403, "application/problem+json")]
    [HttpGet("admin/catalog/{kind}"), Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> Admin(string kind, CancellationToken token)
    {
        Response.Headers.CacheControl = "no-store";
        return Known(kind) ? Ok(await service.ListAsync(kind, true, null, token)) : NotFound();
    }
    [ProducesResponseType(typeof(CatalogItem), 200, "application/json")]
    [ProducesResponseType(typeof(ProblemDetails), 401, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), 403, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), 409, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), 422, "application/problem+json")]
    [HttpPost("admin/catalog/{kind}"), Authorize(Roles = "ADMIN")]
    public Task<IActionResult> Create(string kind, CatalogWrite request, CancellationToken token) => Save(kind, request.Code, request, true, token);
    [ProducesResponseType(typeof(CatalogItem), 200, "application/json")]
    [ProducesResponseType(typeof(ProblemDetails), 401, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), 403, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), 409, "application/problem+json")]
    [ProducesResponseType(typeof(ProblemDetails), 422, "application/problem+json")]
    [HttpPut("admin/catalog/{kind}/{code}"), Authorize(Roles = "ADMIN")]
    public Task<IActionResult> Update(string kind, string code, CatalogWrite request, CancellationToken token) => Save(kind, code, request, false, token);
    private async Task<IActionResult> Save(string kind, string code, CatalogWrite request, bool create, CancellationToken token)
    {
        Response.Headers.CacheControl = "no-store";
        if (!Known(kind)) return NotFound();
        if (currentUser.UserId is not { } actor) return Unauthorized();
        if (string.IsNullOrWhiteSpace(request.Name) || code != request.Code || (kind != "subjects" && code.Length > 32)) return UnprocessableEntity();
        var item = new CatalogItem(code.Trim(), request.Name.Trim(), request.IsActive, request.ProvinceCode);
        var result = await service.SaveAsync(kind, item, create, actor, token);
        return result switch { CatalogResult.Success => Ok(item), CatalogResult.NotFound => NotFound(), CatalogResult.Conflict => Conflict(), _ => UnprocessableEntity() };
    }
}
public sealed record CatalogWrite([Required, MaxLength(64)] string Code, [Required, MaxLength(100)] string Name, bool IsActive, [MaxLength(32)] string? ProvinceCode);
