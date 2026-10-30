namespace TutorMatching.Domain.Hiring;

public sealed class HireRuleException(string code) : Exception(code)
{
    public string Code { get; } = code;
}
