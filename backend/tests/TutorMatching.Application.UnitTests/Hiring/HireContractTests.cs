using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using TutorMatching.Application.Hiring;

namespace TutorMatching.Application.UnitTests.Hiring;

public sealed class HireContractTests
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    [Fact]
    public void RequiresVersionAndProposalSequenceAndRejectsUnknownProperties()
    {
        Assert.Throws<JsonException>(() => JsonSerializer.Deserialize<AcceptHireRequestCommand>("{}", Json));
        var version = Guid.NewGuid();
        var command = JsonSerializer.Deserialize<AcceptHireRequestCommand>($$"""{"expectedVersion":"{{version}}","proposalSequence":null}""", Json)!;
        Assert.Equal(version, command.ExpectedVersion);
        Assert.Null(command.ProposalSequence);
        Assert.Throws<JsonException>(() => JsonSerializer.Deserialize<AcceptHireRequestCommand>($$"""{"expectedVersion":"{{version}}","proposalSequence":null,"actorId":"{{Guid.NewGuid()}}"}""", Json));
    }

    [Theory]
    [InlineData(false, false)] [InlineData(true, true)]
    public void ConfirmationMustBeExplicitlyTrue(bool confirmed, bool valid)
    {
        var command = new CloseHireRequestCommand { ExpectedVersion = Guid.NewGuid(), Confirmed = confirmed };
        Assert.Equal(valid, Validate(command).Count == 0);
    }

    [Fact]
    public void ProposalRequiresAtLeastOneBoundedTermAndMinutePrecisionWindows()
    {
        Assert.NotEmpty(Validate(new ProposeHireRequestCommand { ExpectedVersion = Guid.NewGuid() }));
        Assert.NotEmpty(Validate(new ProposeHireRequestCommand { ExpectedVersion = Guid.NewGuid(), PriceVnd = 0 }));
        Assert.Empty(Validate(new ProposeHireRequestCommand { ExpectedVersion = Guid.NewGuid(), PriceVnd = int.MaxValue }));
        Assert.NotEmpty(Validate(new HireSchedule { DayOfWeek = 1, StartTime = "18:00:00", EndTime = "19:00" }));
        Assert.Empty(Validate(new HireSchedule { DayOfWeek = 1, StartTime = "18:00", EndTime = "19:00" }));
        Assert.Throws<JsonException>(() => JsonSerializer.Deserialize<ProposeHireRequestCommand>($$"""{"expectedVersion":"{{Guid.NewGuid()}}","priceVnd":2147483648}""", Json));
        Assert.Throws<JsonException>(() => JsonSerializer.Deserialize<ProposeHireRequestCommand>($$"""{"expectedVersion":"{{Guid.NewGuid()}}","priceVnd":1.5}""", Json));
        Assert.Throws<JsonException>(() => JsonSerializer.Deserialize<ProposeHireRequestCommand>($$"""{"expectedVersion":"{{Guid.NewGuid()}}","priceVnd":null}""", Json));
    }

    [Fact]
    public void LegacyActorNullSurvivesSerializationWhileRequiredFieldMustExist()
    {
        var payload = """{"sequence":1,"actorId":null,"fromStatus":null,"toStatus":"PENDING","reason":null,"createdAt":"2026-10-28T00:00:00Z"}""";
        var history = JsonSerializer.Deserialize<HireEvent>(payload, Json)!;
        Assert.Null(history.ActorId);
        Assert.Empty(Validate(history));
        Assert.Contains("\"actorId\":null", JsonSerializer.Serialize(history, Json));
        Assert.Throws<JsonException>(() => JsonSerializer.Deserialize<HireEvent>(payload.Replace("\"actorId\":null,", ""), Json));
    }

    private static List<ValidationResult> Validate(object value)
    {
        var results = new List<ValidationResult>();
        Validator.TryValidateObject(value, new ValidationContext(value), results, true);
        return results;
    }
}
