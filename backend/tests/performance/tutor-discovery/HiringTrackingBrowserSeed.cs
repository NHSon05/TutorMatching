using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TutorMatching.Domain.Hiring;
using TutorMatching.Domain.Messaging;
using TutorMatching.Domain.Tutors;
using TutorMatching.Domain.Users;
using TutorMatching.Infrastructure.Persistence;

internal static class HiringTrackingBrowserSeed
{
    public static async Task Seed(IServiceProvider services, string password, CancellationToken ct)
    {
        await using var scope = services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var manager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        foreach (var role in new[] { AccountRole.LEARNER, AccountRole.TUTOR })
        {
            var email = $"other-{role.ToString().ToLowerInvariant()}@example.test";
            var result = await manager.CreateAsync(new ApplicationUser { Id = Guid.NewGuid(), Email = email,
                UserName = email, FullName = "Unrelated " + role, Role = role, Status = AccountStatus.ACTIVE }, password);
            if (!result.Succeeded) throw new InvalidOperationException("Tracking account fixture failed.");
        }
        var learner = await db.Users.SingleAsync(u => u.Email == "learner@example.test", ct);
        var tutor = await db.TutorProfiles.SingleAsync(ct);
        var subject = await db.TutorSubjects.Where(s => s.TutorProfileId == tutor.Id).Select(s => s.SubjectId).SingleAsync(ct);
        var now = DateTimeOffset.UtcNow;
        var statuses = new[] { "PENDING", "NEGOTIATING", "ACCEPTED", "REJECTED", "CANCELLED", "COMPLETED" };
        for (var i = 0; i < 24; i++)
        {
            var id = Guid.NewGuid();
            var status = statuses[i % 6];
            var initial = new HireTerms(DateOnly.FromDateTime(now.AddDays(7).UtcDateTime), 1, 60, "ONLINE", null, null, null, 150000,
                [new WeeklyWindow(1, new TimeOnly(18, 0), new TimeOnly(19, 0))]);
            var negotiated = initial with { PriceVnd = 175000 };
            var hasProposal = status is "NEGOTIATING" or "ACCEPTED" or "COMPLETED";
            var request = new HireRequest { Id = id, RequesterUserId = learner.Id, TutorProfileId = tutor.Id, SubjectId = subject,
                StatusCode = status, StartDate = initial.StartDate, SessionsPerWeek = 1, DurationMinutes = 60,
                ListedPriceVnd = 150000, ProposedPriceVnd = 150000, InitialTerms = initial, CreatedAt = now.AddMinutes(-i),
                UpdatedAt = now, NextEventSequence = 3, LatestProposalSequence = hasProposal ? 1 : 0 };
            if (status is "ACCEPTED" or "COMPLETED")
            {
                request.FinalAgreement = new FinalAgreement(negotiated, learner.Id, now, 1, null, null);
                request.AgreedPriceVnd = 175000; request.AcceptedAt = now;
            }
            request.Schedules.Add(new RequestSchedule { Id = Guid.NewGuid(), HireRequestId = id, DayOfWeek = 1, StartTime = new(18,0), EndTime = new(19,0) });
            if (hasProposal) request.Negotiations.Add(new Negotiation { Id = Guid.NewGuid(), HireRequestId = id, Sequence = 1,
                SenderUserId = tutor.UserId, Terms = negotiated, ProposedPriceVnd = 175000, Note = "Điều chỉnh học phí", CreatedAt = now });
            db.HireRequests.Add(request);
            db.Conversations.Add(new Conversation { Id = Guid.NewGuid(), HireRequestId = id, CreatedAt = now });
            db.RequestStatusHistories.Add(new RequestStatusHistory { Id = Guid.NewGuid(), HireRequestId = id, Sequence = 1,
                ActorUserId = learner.Id, ToStatusCode = "PENDING", CreatedAt = now.AddMinutes(-i) });
            if (status != "PENDING") db.RequestStatusHistories.Add(new RequestStatusHistory { Id = Guid.NewGuid(), HireRequestId = id,
                Sequence = 2, ActorUserId = tutor.UserId, FromStatusCode = "PENDING", ToStatusCode = status,
                Reason = status is "REJECTED" or "CANCELLED" ? "Không phù hợp lịch học" : null, CreatedAt = now });
        }
        await db.SaveChangesAsync(ct);
    }
}
