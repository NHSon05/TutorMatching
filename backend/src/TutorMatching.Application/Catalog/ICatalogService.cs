namespace TutorMatching.Application.Catalog;
public sealed record CatalogItem(string Code, string Name, bool IsActive, string? ProvinceCode = null);
public enum CatalogResult { Success, NotFound, Conflict, Invalid }
public interface ICatalogService
{
    Task<IReadOnlyList<CatalogItem>> ListAsync(string kind, bool includeInactive, string? provinceCode, CancellationToken token);
    Task<CatalogResult> SaveAsync(string kind, CatalogItem item, bool create, Guid actor, CancellationToken token);
}
