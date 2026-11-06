namespace TutorMatching.Application.Abstractions;

/// <summary>
/// Port for turning free-form demand text into a fixed-size, L2-normalized embedding vector.
/// Implementations may be deterministic (feature hashing) or backed by an external model,
/// but must always return <see cref="Dimensions"/> components so stored vectors stay comparable.
/// </summary>
public interface ITextEmbeddingService
{
    /// <summary>Embedding size shared by every implementation (OpenAI text-embedding-3-small compatible).</summary>
    const int Dimensions = 1536;

    int VectorDimensions => Dimensions;

    /// <summary>Returns a unit-length vector, or an all-zero vector when the text has no usable tokens.</summary>
    Task<float[]> GenerateAsync(string text, CancellationToken cancellationToken = default);
}

/// <summary>A persisted demand detail ranked by cosine similarity to a query vector.</summary>
public sealed record SimilarDemandDetailDto(
    Guid ExtractedDemandDetailId,
    Guid DemandPostId,
    string? SubjectNameRaw,
    int? GradeLevel,
    string TeachingMode,
    double Similarity);

public static class VectorMath
{
    /// <summary>Cosine similarity in [-1, 1]; returns 0 when either vector has zero magnitude.</summary>
    public static double CosineSimilarity(IReadOnlyList<float> left, IReadOnlyList<float> right)
    {
        ArgumentNullException.ThrowIfNull(left);
        ArgumentNullException.ThrowIfNull(right);
        if (left.Count != right.Count)
        {
            throw new ArgumentException(
                $"Vectors must have the same length ({left.Count} vs {right.Count}).", nameof(right));
        }

        double dot = 0, leftNorm = 0, rightNorm = 0;
        for (var i = 0; i < left.Count; i++)
        {
            dot += (double)left[i] * right[i];
            leftNorm += (double)left[i] * left[i];
            rightNorm += (double)right[i] * right[i];
        }

        if (leftNorm == 0 || rightNorm == 0)
        {
            return 0d;
        }

        return Math.Clamp(dot / (Math.Sqrt(leftNorm) * Math.Sqrt(rightNorm)), -1d, 1d);
    }
}
