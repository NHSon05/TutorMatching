using System.Collections.Immutable;
using TutorMatching.Domain.Hiring;
using TutorMatching.Domain.Tutors;

namespace TutorMatching.Application.Hiring;

// ActorId must come from ICurrentUser, never from the HTTP body. The store rechecks account/ownership.
public sealed record HireWriteTarget(Guid ActorId, Guid TutorProfileId, Guid SubjectId, Guid? CourseId = null,
    Guid? RequestId = null, Guid? ExpectedVersion = null, bool RequireOffering = true,
    string? ProvinceCode = null, string? DistrictCode = null);

public sealed record HireOffering(Guid TutorUserId, int? ListedPriceVnd, ImmutableArray<string> Modes,
    ImmutableArray<WeeklyWindow> Availability, bool ValidLocation, string? ProvinceName, string? DistrictName);

public interface IHireRequestStore
{
    Task<HireCreationOutcome> CreateAsync(HireWriteTarget target, Guid key, string fingerprint,
        Func<IHireWriteSession, CancellationToken, Task<HireCreationOutcome>> action, CancellationToken cancellationToken = default);
    // Callback stages only database work; no external effects or SaveChanges. Return projections after commit.
    Task ExecuteAsync(HireWriteTarget target, Func<IHireWriteSession, CancellationToken, Task> action,
        CancellationToken cancellationToken = default);
}

public interface IHireWriteSession
{
    HireRequest? Request { get; }
    HireOffering Offering { get; }
    Task<HireCreateOperation?> FindCreateOperationAsync(Guid key, CancellationToken cancellationToken);
    void AddRequest(HireRequest request);
    void AddProposal(Negotiation proposal);
    void AddStatusEvent(RequestStatusHistory statusEvent);
    Guid AddConversation(DateTimeOffset now);
    void NotifyOtherParticipant(string type, string title, DateTimeOffset now);
    void AddCreateOperation(HireCreateOperation operation);
}

public sealed class HireStoreException(string code) : Exception(code)
{
    public string Code { get; } = code;
}
