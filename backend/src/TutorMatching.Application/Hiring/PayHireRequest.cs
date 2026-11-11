using TutorMatching.Application.Abstractions;
using TutorMatching.Domain.Hiring;
using TutorMatching.Domain.Users;

namespace TutorMatching.Application.Hiring;

public sealed class PayHireRequest(IHireRequestStore store, ICurrentUser user, IClock clock)
{
    public async Task<HirePaymentDto> CreateAsync(Guid requestId, Guid idempotencyKey, CancellationToken ct)
    {
        if (user.UserId is not { } actor) throw new HireStoreException("unauthorized");
        if (user.Role is not AccountRole.LEARNER) throw new HireStoreException("forbidden");

        HirePayment? result = null;
        HireRequest? updatedRequest = null;
        await store.ExecuteAsync(
            new(actor, Guid.Empty, Guid.Empty, RequestId: requestId, RequireOffering: false, RequireExpectedVersion: false),
            async (session, token) =>
            {
                var request = session.Request ?? throw new HireStoreException("not_found");
                if (request.RequesterUserId != actor) throw new HireStoreException("forbidden");
                updatedRequest = request;

                var existing = await session.FindPaymentByIdempotencyAsync(idempotencyKey, token);
                if (existing is not null)
                {
                    if (existing.HireRequestId != requestId)
                    {
                        throw new HireStoreException("idempotency_conflict");
                    }

                    result = existing;
                    return;
                }

                if (request.PaymentStatusCode == "PAID") throw new HireStoreException("already_paid");

                // Reuse the outstanding checkout instead of opening a second PENDING payment.
                var pending = request.StatusCode == "ACCEPTED"
                    ? await session.FindPendingPaymentAsync(token)
                    : null;
                if (pending is not null)
                {
                    result = pending;
                    return;
                }

                var now = clock.UtcNow;
                try
                {
                    var payment = request.InitiatePayment(actor, idempotencyKey, now, session.Offering.CourseSessionCount);
                    session.AddPayment(payment);
                    result = payment;
                }
                catch (HireRuleException e)
                {
                    throw new HireStoreException(e.Code);
                }
            },
            ct);

        // Read the version after commit: SaveChanges rotates HireRequest.Version.
        return Map(result!, updatedRequest?.Version);
    }

    public async Task<HirePaymentDto> ConfirmAsync(Guid requestId, Guid paymentId, CancellationToken ct)
    {
        if (user.UserId is not { } actor) throw new HireStoreException("unauthorized");
        if (user.Role is not AccountRole.LEARNER) throw new HireStoreException("forbidden");

        HirePayment? result = null;
        HireRequest? updatedRequest = null;
        await store.ExecuteAsync(
            new(actor, Guid.Empty, Guid.Empty, RequestId: requestId, RequireOffering: false, RequireExpectedVersion: false),
            async (session, token) =>
            {
                var request = session.Request ?? throw new HireStoreException("not_found");
                if (request.RequesterUserId != actor) throw new HireStoreException("forbidden");

                var payment = await session.FindPaymentByIdAsync(paymentId, token)
                    ?? throw new HireStoreException("not_found");

                var now = clock.UtcNow;
                try
                {
                    var history = request.ConfirmPayment(payment, actor, now);
                    session.AddStatusEvent(history);
                    session.NotifyOtherParticipant(
                        "HIRE_PAYMENT_COMPLETED",
                        "Học viên đã hoàn tất thanh toán học phí.",
                        now);
                    result = payment;
                    updatedRequest = request;
                }
                catch (HireRuleException e)
                {
                    throw new HireStoreException(e.Code);
                }
            },
            ct);

        return Map(result!, updatedRequest?.Version);
    }

    internal static HirePaymentDto Map(HirePayment payment, Guid? requestVersion = null) => new()
    {
        Id = payment.Id,
        HireRequestId = payment.HireRequestId,
        UnitPriceVnd = payment.UnitPriceVnd,
        BillingSessions = payment.BillingSessions,
        AmountVnd = payment.AmountVnd,
        ProviderCode = payment.ProviderCode,
        TransferReference = payment.TransferReference,
        QrPayload = payment.QrPayload,
        Status = payment.StatusCode,
        PaidAt = payment.PaidAt,
        CreatedAt = payment.CreatedAt,
        RequestVersion = requestVersion,
    };
}
