namespace TutorMatching.Domain.Hiring;

public sealed class HirePayment
{
    public Guid Id { get; set; }
    public Guid HireRequestId { get; set; }
    public Guid PayerUserId { get; set; }
    public Guid IdempotencyKey { get; set; }
    public int UnitPriceVnd { get; set; }
    public int BillingSessions { get; set; }
    public int AmountVnd { get; set; }
    public string ProviderCode { get; set; } = "VIETQR_SANDBOX";
    public string TransferReference { get; set; } = string.Empty;
    public string QrPayload { get; set; } = string.Empty;
    public string StatusCode { get; set; } = "PENDING";
    public DateTimeOffset? PaidAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public HireRequest? HireRequest { get; set; }
}
