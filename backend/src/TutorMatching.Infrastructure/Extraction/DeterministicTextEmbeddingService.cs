using System.Text;
using TutorMatching.Application.Abstractions;

namespace TutorMatching.Infrastructure.Extraction;

/// <summary>
/// Offline, dependency-free embedding generator based on signed feature hashing.
/// Text is lower-cased, stripped of Vietnamese diacritics, tokenized, filtered for generic request
/// filler words, then unigrams (weight 1.0) and bigrams (weight 0.5) are hashed (FNV-1a 64-bit)
/// into <see cref="ITextEmbeddingService.Dimensions"/> buckets and L2-normalized.
/// The output is stable across processes/machines, so persisted vectors stay comparable and can later be
/// swapped for a model-backed implementation that writes the same 1536-dimension column.
/// </summary>
public sealed class DeterministicTextEmbeddingService : ITextEmbeddingService
{
    private const float UnigramWeight = 1.0f;
    private const float BigramWeight = 0.5f;
    private const ulong FnvOffsetBasis = 14695981039346656037UL;
    private const ulong FnvPrime = 1099511628211UL;

    // Generic words present in almost every tutoring request; they carry no matching signal.
    private static readonly HashSet<string> StopWords = new(StringComparer.Ordinal)
    {
        "can", "tim", "gia", "su", "day", "cho", "o", "tai", "va", "voi", "la", "nhe", "nha", "a", "oi",
        "ak", "ah", "em", "minh", "toi", "con", "chau", "be", "mot", "nguoi", "hoc", "sinh",
    };

    public Task<float[]> GenerateAsync(string text, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var vector = new float[ITextEmbeddingService.Dimensions];
        var tokens = Tokenize(text);

        for (var i = 0; i < tokens.Count; i++)
        {
            Accumulate(vector, tokens[i], UnigramWeight);
            if (i + 1 < tokens.Count)
            {
                Accumulate(vector, $"{tokens[i]}_{tokens[i + 1]}", BigramWeight);
            }
        }

        Normalize(vector);
        return Task.FromResult(vector);
    }

    private static List<string> Tokenize(string? text)
    {
        var normalized = VietnamLandmarkGazetteer.RemoveDiacritics(text ?? string.Empty);
        var tokens = new List<string>();
        var current = new StringBuilder();

        foreach (var ch in normalized)
        {
            if (char.IsLetterOrDigit(ch))
            {
                current.Append(ch);
                continue;
            }

            Flush(current, tokens);
        }

        Flush(current, tokens);
        return tokens;
    }

    private static void Flush(StringBuilder current, List<string> tokens)
    {
        if (current.Length == 0)
        {
            return;
        }

        var token = current.ToString();
        current.Clear();
        if (!StopWords.Contains(token))
        {
            tokens.Add(token);
        }
    }

    private static void Accumulate(float[] vector, string feature, float weight)
    {
        var hash = Fnv1a64(feature);
        var index = (int)(hash % (ulong)vector.Length);
        var sign = (hash >> 63) == 0 ? 1f : -1f;
        vector[index] += sign * weight;
    }

    private static ulong Fnv1a64(string value)
    {
        var hash = FnvOffsetBasis;
        foreach (var b in Encoding.UTF8.GetBytes(value))
        {
            hash ^= b;
            hash *= FnvPrime;
        }

        return hash;
    }

    private static void Normalize(float[] vector)
    {
        double sumSquares = 0;
        foreach (var v in vector)
        {
            sumSquares += (double)v * v;
        }

        if (sumSquares == 0)
        {
            return;
        }

        var norm = (float)Math.Sqrt(sumSquares);
        for (var i = 0; i < vector.Length; i++)
        {
            vector[i] /= norm;
        }
    }
}
