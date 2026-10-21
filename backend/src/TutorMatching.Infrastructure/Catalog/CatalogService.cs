using Microsoft.EntityFrameworkCore;
using Npgsql;
using TutorMatching.Application.Catalog;
using TutorMatching.Domain.Catalog;
using TutorMatching.Domain.Locations;
using TutorMatching.Infrastructure.Auditing;
using TutorMatching.Infrastructure.Persistence;

namespace TutorMatching.Infrastructure.Catalog;
public sealed class CatalogService(ApplicationDbContext db) : ICatalogService
{
    public async Task<IReadOnlyList<CatalogItem>> ListAsync(string kind, bool includeInactive, string? provinceCode, CancellationToken token)
    {
        IQueryable<CatalogItem> query = kind switch
        {
            "subjects" => db.Subjects.Select(x => new CatalogItem(x.Id.ToString(), x.Name, x.IsActive, null)),
            "provinces" => db.Provinces.Select(x => new CatalogItem(x.ProvinceCode, x.ProvinceName, x.IsActive, null)),
            "districts" => db.Districts.Where(x => provinceCode == null || x.ProvinceCode == provinceCode).Select(x => new CatalogItem(x.DistrictCode, x.DistrictName, x.IsActive, x.ProvinceCode)),
            "teaching-levels" => db.Set<TeachingLevel>().Select(x => new CatalogItem(x.Code, x.Name, x.IsActive, null)),
            _ => throw new ArgumentException("Unknown catalog")
        };
        var rows = await query.ToListAsync(token);
        return rows.Where(x => includeInactive || x.IsActive).OrderBy(x => x.Name).ThenBy(x => x.Code).ToList();
    }

    public async Task<CatalogResult> SaveAsync(string kind, CatalogItem item, bool create, Guid actor, CancellationToken token)
    {
        var existing = await ListAsync(kind, true, null, token);
        var old = existing.SingleOrDefault(x => x.Code == item.Code);
        if (create && old != null) return CatalogResult.Conflict;
        if (!create && old == null) return CatalogResult.NotFound;
        if (existing.Any(x => x.Code != item.Code && x.Name.Equals(item.Name, StringComparison.OrdinalIgnoreCase) && (kind != "districts" || x.ProvinceCode == item.ProvinceCode))) return CatalogResult.Conflict;
        var now = DateTimeOffset.UtcNow;
        switch (kind)
        {
            case "subjects":
                if (!Guid.TryParse(item.Code, out var id)) return CatalogResult.Invalid;
                var subject = create ? new Subject { Id = id, CreatedAt = now } : await db.Subjects.SingleAsync(x => x.Id == id, token);
                subject.Name = item.Name; subject.IsActive = item.IsActive; subject.UpdatedAt = now;
                if (create) db.Subjects.Add(subject); break;
            case "provinces":
                var province = create ? new Province { ProvinceCode = item.Code } : await db.Provinces.SingleAsync(x => x.ProvinceCode == item.Code, token);
                province.ProvinceName = item.Name; province.IsActive = item.IsActive;
                if (create) db.Provinces.Add(province); break;
            case "districts":
                if (!await db.Provinces.AnyAsync(x => x.ProvinceCode == item.ProvinceCode && (!item.IsActive || x.IsActive), token)) return CatalogResult.Invalid;
                var district = create ? new District { DistrictCode = item.Code } : await db.Districts.SingleAsync(x => x.DistrictCode == item.Code, token);
                if (!create && district.ProvinceCode != item.ProvinceCode) return CatalogResult.Invalid;
                district.ProvinceCode = item.ProvinceCode!; district.DistrictName = item.Name; district.IsActive = item.IsActive;
                if (create) db.Districts.Add(district); break;
            case "teaching-levels":
                var level = create ? new TeachingLevel { Code = item.Code } : await db.Set<TeachingLevel>().SingleAsync(x => x.Code == item.Code, token);
                level.Name = item.Name; level.IsActive = item.IsActive;
                if (create) db.Add(level); break;
            default: return CatalogResult.Invalid;
        }
        db.AuditEvents.Add(new AuditEvent { Id = Guid.NewGuid(), ActorUserId = actor, Action = create ? "CatalogCreated" : "CatalogUpdated", EntityType = kind, EntityId = item.Code, CreatedAt = now });
        try { await db.SaveChangesAsync(token); return CatalogResult.Success; }
        catch (DbUpdateException e) when (e.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation }) { db.ChangeTracker.Clear(); return CatalogResult.Conflict; }
    }
}
