namespace TutorMatching.Domain.Content;

public sealed class Article
{
    public Guid Id { get; set; }
    public Guid AuthorUserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Summary { get; set; }
    public string Content { get; set; } = string.Empty;
    public string StatusCode { get; set; } = "DRAFT";
    public DateTimeOffset? PublishedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
