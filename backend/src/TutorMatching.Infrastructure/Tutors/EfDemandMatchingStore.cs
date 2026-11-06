using Microsoft.EntityFrameworkCore;
using TutorMatching.Application.Abstractions;
using TutorMatching.Domain.Catalog;
using TutorMatching.Domain.Content;
using TutorMatching.Domain.Locations;
using TutorMatching.Domain.Notifications;
using TutorMatching.Domain.Tutors;
using TutorMatching.Domain.Users;
using TutorMatching.Infrastructure.Persistence;

namespace TutorMatching.Infrastructure.Tutors;

public sealed class EfDemandMatchingStore(ApplicationDbContext dbContext) : IDemandMatchingStore
{
    private (IReadOnlyList<Subject> Subjects, IReadOnlyList<Province> Provinces, IReadOnlyList<District> Districts)? cachedCatalog;

    public async Task<(IReadOnlyList<Subject> Subjects, IReadOnlyList<Province> Provinces, IReadOnlyList<District> Districts)> LoadCatalogAsync(
        CancellationToken cancellationToken = default)
    {
        if (cachedCatalog.HasValue)
        {
            return cachedCatalog.Value;
        }

        var subjects = await dbContext.Subjects
            .AsNoTracking()
            .Where(s => s.IsActive)
            .ToListAsync(cancellationToken);

        var provinces = await dbContext.Provinces
            .AsNoTracking()
            .Where(p => p.IsActive)
            .ToListAsync(cancellationToken);

        var districts = await dbContext.Districts
            .AsNoTracking()
            .Where(d => d.IsActive)
            .ToListAsync(cancellationToken);

        cachedCatalog = (subjects, provinces, districts);
        return cachedCatalog.Value;
    }

    public async Task<IReadOnlyList<PublicTutorCandidate>> LoadPublicTutorCandidatesAsync(
        CancellationToken cancellationToken = default)
    {
        var (_, provinces, districts) = await LoadCatalogAsync(cancellationToken);

        var provincesByCode = provinces
            .ToDictionary(p => p.ProvinceCode, p => p.ProvinceName, StringComparer.OrdinalIgnoreCase);

        var districtsByCode = districts
            .ToDictionary(d => d.DistrictCode, d => d.DistrictName, StringComparer.OrdinalIgnoreCase);

        var rows = await (
            from tp in dbContext.TutorProfiles.AsNoTracking()
            join u in dbContext.Users.AsNoTracking() on tp.UserId equals u.Id
            where tp.Status == TutorProfileStatus.APPROVED && u.Status == AccountStatus.ACTIVE
            select new
            {
                Profile = tp,
                User = u,
            })
            .ToListAsync(cancellationToken);

        if (rows.Count == 0)
        {
            return [];
        }

        var approvedTutorIds = rows.Select(r => r.Profile.Id).ToList();

        var tutorSubjectMappings = await (
            from ts in dbContext.TutorSubjects.AsNoTracking()
            join s in dbContext.Subjects.AsNoTracking() on ts.SubjectId equals s.Id
            where s.IsActive && approvedTutorIds.Contains(ts.TutorProfileId)
            select new { ts.TutorProfileId, s.Id, s.Name })
            .ToListAsync(cancellationToken);

        var subjectsByProfile = tutorSubjectMappings
            .GroupBy(x => x.TutorProfileId)
            .ToDictionary(
                g => g.Key,
                g => (
                    Ids: (IReadOnlyList<Guid>)g.Select(x => x.Id).Distinct().ToList(),
                    Names: (IReadOnlyList<string>)g.Select(x => x.Name).Distinct().ToList()));

        var candidates = new List<PublicTutorCandidate>(rows.Count);
        foreach (var row in rows)
        {
            var tp = row.Profile;
            var u = row.User;

            var mappedSubjects = subjectsByProfile.TryGetValue(tp.Id, out var found)
                ? found
                : (Ids: (IReadOnlyList<Guid>)[], Names: (IReadOnlyList<string>)tp.Subjects);

            var subjectNames = mappedSubjects.Names.Count > 0 ? mappedSubjects.Names : tp.Subjects;
            var provinceName = tp.ProvinceCode is not null && provincesByCode.TryGetValue(tp.ProvinceCode, out var pName)
                ? pName
                : null;
            var districtName = tp.DistrictCode is not null && districtsByCode.TryGetValue(tp.DistrictCode, out var dName)
                ? dName
                : null;

            candidates.Add(new PublicTutorCandidate(
                TutorProfileId: tp.Id,
                DisplayName: u.FullName,
                AvatarUrl: tp.AvatarUrl ?? u.AvatarUrl,
                Headline: tp.Degree ?? tp.Specialization ?? tp.SchoolName,
                ProfileStatus: tp.Status,
                AccountStatus: u.Status,
                SubjectIds: mappedSubjects.Ids,
                SubjectNames: subjectNames,
                TeachingLevels: tp.TeachingLevels,
                ListedPriceVnd: tp.SessionRateVnd ?? tp.HourlyRateVnd ?? 0,
                IsNegotiable: tp.IsNegotiable,
                TeachingModes: tp.TeachingModes,
                ProvinceCode: tp.ProvinceCode,
                ProvinceName: provinceName,
                DistrictCode: tp.DistrictCode,
                DistrictName: districtName,
                SchoolName: tp.SchoolName,
                Degree: tp.Degree,
                Specialization: tp.Specialization,
                EducationType: tp.EducationType,
                Bio: tp.Bio,
                ExperienceYears: tp.ExperienceYears,
                TeachingMethodology: tp.TeachingMethodology,
                AchievementsAndResults: tp.AchievementsAndResults,
                HourlyRateVnd: tp.HourlyRateVnd,
                SessionRateVnd: tp.SessionRateVnd,
                MonthlyRateVnd: tp.MonthlyRateVnd));
        }

        return candidates;
    }

    public async Task<IReadOnlyList<TutorMatchingProfile>> LoadActiveTutorMatchingProfilesAsync(
        CancellationToken cancellationToken = default)
    {
        return await (
            from mp in dbContext.TutorMatchingProfiles.AsNoTracking()
            join tp in dbContext.TutorProfiles.AsNoTracking() on mp.TutorProfileId equals tp.Id
            join u in dbContext.Users.AsNoTracking() on tp.UserId equals u.Id
            where mp.IsActive && tp.Status == TutorProfileStatus.APPROVED && u.Status == AccountStatus.ACTIVE
            select mp)
            .ToListAsync(cancellationToken);
    }

    public async Task SaveDemandAndNotificationsAsync(
        DemandPost post,
        ExtractedDemandDetail? detail,
        IReadOnlyList<PostMatchNotification> notifications,
        CancellationToken cancellationToken = default)
    {
        dbContext.DemandPosts.Add(post);
        if (detail is not null)
        {
            dbContext.ExtractedDemandDetails.Add(detail);
        }

        if (notifications.Count > 0)
        {
            dbContext.PostMatchNotifications.AddRange(notifications);
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<Guid?> GetApprovedTutorProfileIdForUserAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        return await dbContext.TutorProfiles
            .AsNoTracking()
            .Where(tp => tp.UserId == userId && tp.Status == TutorProfileStatus.APPROVED)
            .Select(tp => (Guid?)tp.Id)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<TutorMatchingProfileDto> GetOrCreateTutorMatchingProfileAsync(
        Guid tutorProfileId,
        CancellationToken cancellationToken = default)
    {
        var existing = await dbContext.TutorMatchingProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.TutorProfileId == tutorProfileId, cancellationToken);

        if (existing is not null)
        {
            return MapToDto(existing);
        }

        var tutorProfile = await dbContext.TutorProfiles
            .AsNoTracking()
            .FirstAsync(x => x.Id == tutorProfileId, cancellationToken);

        var subjectIds = await dbContext.TutorSubjects
            .AsNoTracking()
            .Where(x => x.TutorProfileId == tutorProfileId)
            .Select(x => x.SubjectId)
            .ToListAsync(cancellationToken);

        var created = TutorMatchingProfile.Create(
            tutorProfileId: tutorProfileId,
            preferredSubjects: subjectIds,
            preferredGrades: [6, 7, 8, 9, 10, 11, 12],
            minTuitionFeeVnd: Math.Max(0, tutorProfile.SessionRateVnd ?? 0),
            maxTuitionFeeVnd: null,
            preferredProvinceCode: tutorProfile.ProvinceCode,
            preferredDistrictCodes: string.IsNullOrWhiteSpace(tutorProfile.DistrictCode) ? [] : [tutorProfile.DistrictCode],
            receiveAllDistricts: false,
            teachingModes: tutorProfile.TeachingModes.Count > 0 ? tutorProfile.TeachingModes : ["OFFLINE", "ONLINE"],
            isActive: true);

        dbContext.TutorMatchingProfiles.Add(created);
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
            return MapToDto(created);
        }
        catch (DbUpdateException)
        {
            dbContext.Entry(created).State = EntityState.Detached;
            var concurrentWinner = await dbContext.TutorMatchingProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.TutorProfileId == tutorProfileId, cancellationToken);

            if (concurrentWinner is not null)
            {
                return MapToDto(concurrentWinner);
            }

            throw;
        }
    }

    public async Task<TutorMatchingProfileDto> UpsertTutorMatchingProfileAsync(
        Guid tutorProfileId,
        UpdateTutorMatchingProfileCommand command,
        CancellationToken cancellationToken = default)
    {
        var existing = await dbContext.TutorMatchingProfiles
            .FirstOrDefaultAsync(x => x.TutorProfileId == tutorProfileId, cancellationToken);

        if (existing is null)
        {
            var created = TutorMatchingProfile.Create(
                tutorProfileId: tutorProfileId,
                preferredSubjects: command.PreferredSubjects,
                preferredGrades: command.PreferredGrades,
                minTuitionFeeVnd: command.MinTuitionFeeVnd,
                maxTuitionFeeVnd: command.MaxTuitionFeeVnd,
                preferredProvinceCode: command.PreferredProvinceCode,
                preferredDistrictCodes: command.PreferredDistrictCodes,
                receiveAllDistricts: command.ReceiveAllDistricts,
                teachingModes: command.TeachingModes,
                isActive: command.IsActive);
            dbContext.TutorMatchingProfiles.Add(created);

            try
            {
                await dbContext.SaveChangesAsync(cancellationToken);
                return MapToDto(created);
            }
            catch (DbUpdateException)
            {
                dbContext.Entry(created).State = EntityState.Detached;
                existing = await dbContext.TutorMatchingProfiles
                    .FirstAsync(x => x.TutorProfileId == tutorProfileId, cancellationToken);
            }
        }

        existing.Update(
            preferredSubjects: command.PreferredSubjects,
            preferredGrades: command.PreferredGrades,
            minTuitionFeeVnd: command.MinTuitionFeeVnd,
            maxTuitionFeeVnd: command.MaxTuitionFeeVnd,
            preferredProvinceCode: command.PreferredProvinceCode,
            preferredDistrictCodes: command.PreferredDistrictCodes,
            receiveAllDistricts: command.ReceiveAllDistricts,
            teachingModes: command.TeachingModes,
            isActive: command.IsActive);

        await dbContext.SaveChangesAsync(cancellationToken);
        return MapToDto(existing);
    }

    public async Task<PaginatedMatchedPostsDto> GetMatchedPostsForTutorAsync(
        Guid tutorProfileId,
        int page,
        int pageSize,
        bool unreadOnly,
        CancellationToken cancellationToken = default)
    {
        var safePage = Math.Max(1, page);
        var safePageSize = Math.Clamp(pageSize, 1, 100);

        var baseQuery =
            from n in dbContext.PostMatchNotifications.AsNoTracking()
            join d in dbContext.ExtractedDemandDetails.AsNoTracking() on n.ExtractedDemandDetailId equals d.Id
            join p in dbContext.DemandPosts.AsNoTracking() on d.DemandPostId equals p.Id
            where n.TutorProfileId == tutorProfileId && (!unreadOnly || !n.IsRead)
            orderby n.CreatedAt descending
            select new
            {
                Notification = n,
                Detail = d,
                Post = p,
            };

        var totalCount = await baseQuery.CountAsync(cancellationToken);
        var rows = await baseQuery
            .Skip((safePage - 1) * safePageSize)
            .Take(safePageSize)
            .ToListAsync(cancellationToken);

        var provincesByCode = await dbContext.Provinces
            .AsNoTracking()
            .ToDictionaryAsync(p => p.ProvinceCode, p => p.ProvinceName, StringComparer.OrdinalIgnoreCase, cancellationToken);

        var districtsByCode = await dbContext.Districts
            .AsNoTracking()
            .ToDictionaryAsync(d => d.DistrictCode, d => d.DistrictName, StringComparer.OrdinalIgnoreCase, cancellationToken);

        var items = rows.Select(r =>
        {
            var pName = r.Detail.ProvinceCode is not null && provincesByCode.TryGetValue(r.Detail.ProvinceCode, out var pn)
                ? pn
                : (r.Detail.ProvinceCode ?? "Toàn quốc");
            var dName = r.Detail.DistrictCode is not null && districtsByCode.TryGetValue(r.Detail.DistrictCode, out var dn)
                ? dn
                : null;

            return new MatchedPostNotificationItemDto(
                NotificationId: r.Notification.Id,
                DemandPostId: r.Post.Id,
                SubjectName: r.Detail.SubjectNameRaw ?? "Chưa rõ môn",
                GradeLevel: r.Detail.GradeLevel ?? 0,
                TuitionFeeVnd: r.Detail.TuitionFeeVnd,
                FeePeriod: r.Detail.FeePeriod,
                TeachingMode: r.Detail.TeachingMode,
                ProvinceName: pName,
                DistrictName: dName,
                RawAddress: r.Detail.RawAddress,
                RawContent: r.Post.RawContent,
                IsLocationAmbiguous: r.Detail.IsLocationAmbiguous,
                MatchScore: r.Notification.MatchScore,
                CreatedAt: r.Notification.CreatedAt,
                IsRead: r.Notification.IsRead);
        }).ToList();

        return new PaginatedMatchedPostsDto(
            Items: items,
            TotalCount: totalCount,
            Page: safePage,
            PageSize: safePageSize);
    }

    private static TutorMatchingProfileDto MapToDto(TutorMatchingProfile profile) => new(
        Id: profile.Id,
        PreferredSubjects: profile.PreferredSubjects,
        PreferredGrades: profile.PreferredGrades,
        MinTuitionFeeVnd: profile.MinTuitionFeeVnd,
        MaxTuitionFeeVnd: profile.MaxTuitionFeeVnd,
        PreferredProvinceCode: profile.PreferredProvinceCode,
        PreferredDistrictCodes: profile.PreferredDistrictCodes,
        ReceiveAllDistricts: profile.ReceiveAllDistricts,
        TeachingModes: profile.TeachingModes,
        IsActive: profile.IsActive);

    public async Task<IReadOnlyList<SimilarDemandDetailDto>> FindSimilarDemandDetailsAsync(
        float[] queryVector,
        int topK,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(queryVector);
        if (queryVector.Length != ITextEmbeddingService.Dimensions)
        {
            throw new ArgumentException(
                $"Query vector must have {ITextEmbeddingService.Dimensions} dimensions.", nameof(queryVector));
        }

        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(topK);
        ArgumentOutOfRangeException.ThrowIfGreaterThan(topK, 200);

        var queryJson = System.Text.Json.JsonSerializer.Serialize(queryVector);
        var dimensions = ITextEmbeddingService.Dimensions;

        // Cosine similarity over the jsonb embedding column, restricted to non-expired demands.
        // Readiness implementation (sequential scan); swap for a pgvector HNSW index when volume requires it.
        var rows = await dbContext.Database.SqlQuery<SimilarDemandRow>($"""
            SELECT d.id AS "Id",
                   d.demand_post_id AS "DemandPostId",
                   d.subject_name_raw AS "SubjectNameRaw",
                   d.grade_level AS "GradeLevel",
                   d.teaching_mode AS "TeachingMode",
                   sims.dot / NULLIF(sqrt(sims.dn) * sqrt(sims.qn), 0) AS "Similarity"
            FROM extracted_demand_details d
            JOIN demand_posts p ON p.id = d.demand_post_id
            CROSS JOIN LATERAL (
                SELECT SUM(e.v::float8 * q.v::float8) AS dot,
                       SUM(e.v::float8 * e.v::float8) AS dn,
                       SUM(q.v::float8 * q.v::float8) AS qn
                FROM jsonb_array_elements_text(d.embedding) WITH ORDINALITY AS e(v, i)
                JOIN jsonb_array_elements_text(CAST({queryJson} AS jsonb)) WITH ORDINALITY AS q(v, i) ON q.i = e.i
            ) sims
            WHERE d.embedding IS NOT NULL
              AND jsonb_typeof(d.embedding) = 'array'
              AND jsonb_array_length(d.embedding) = {dimensions}
              AND p.expires_at > now()
            ORDER BY "Similarity" DESC NULLS LAST
            LIMIT {topK}
            """).ToListAsync(cancellationToken);

        return rows
            .Where(r => r.Similarity.HasValue)
            .Select(r => new SimilarDemandDetailDto(
                ExtractedDemandDetailId: r.Id,
                DemandPostId: r.DemandPostId,
                SubjectNameRaw: r.SubjectNameRaw,
                GradeLevel: r.GradeLevel,
                TeachingMode: r.TeachingMode,
                Similarity: r.Similarity!.Value))
            .ToList();
    }

    private sealed class SimilarDemandRow
    {
        public Guid Id { get; set; }
        public Guid DemandPostId { get; set; }
        public string? SubjectNameRaw { get; set; }
        public int? GradeLevel { get; set; }
        public string TeachingMode { get; set; } = "OFFLINE";
        public double? Similarity { get; set; }
    }
}
