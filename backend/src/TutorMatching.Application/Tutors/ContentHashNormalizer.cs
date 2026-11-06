using System.Buffers.Binary;
using System.Numerics;
using System.Security.Cryptography;
using System.Text;

namespace TutorMatching.Application.Tutors;

public static class ContentHashNormalizer
{
    public const int DefaultNearDuplicateMaxHammingDistance = 3;

    private static readonly HashSet<string> ConversationalParticles = new(StringComparer.Ordinal)
    {
        "ạ",
        "nhé",
        "nha",
        "ơi",
        "ak",
        "ah",
    };

    public static string Normalize(string? rawContent)
    {
        if (string.IsNullOrWhiteSpace(rawContent))
        {
            return string.Empty;
        }

        var unicodeNormalized = rawContent.Trim().Normalize(NormalizationForm.FormC).ToLowerInvariant();
        var sb = new StringBuilder(unicodeNormalized.Length);
        var previousWasSpace = false;

        foreach (var ch in unicodeNormalized)
        {
            if (char.IsLetterOrDigit(ch) || ch == '/')
            {
                sb.Append(ch);
                previousWasSpace = false;
            }
            else if (char.IsWhiteSpace(ch) || char.IsPunctuation(ch) || char.IsSymbol(ch))
            {
                if (!previousWasSpace && sb.Length > 0)
                {
                    sb.Append(' ');
                    previousWasSpace = true;
                }
            }
        }

        if (sb.Length > 0 && sb[^1] == ' ')
        {
            sb.Length -= 1;
        }

        return sb.ToString();
    }

    public static string ComputeSha256(string? rawContent)
    {
        var normalized = Normalize(rawContent);
        var bytes = Encoding.UTF8.GetBytes(normalized);
        var hash = SHA256.HashData(bytes);
        return Convert.ToHexStringLower(hash);
    }

    public static ulong ComputeSimHash(string? rawContent)
    {
        var normalized = Normalize(rawContent);
        if (string.IsNullOrEmpty(normalized))
        {
            return 0UL;
        }

        var words = normalized
            .Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Where(w => !ConversationalParticles.Contains(w))
            .ToArray();

        if (words.Length == 0)
        {
            return 0UL;
        }

        Span<int> bitWeights = stackalloc int[64];

        for (var i = 0; i < words.Length; i++)
        {
            AccumulateFeatureHash(words[i], weight: 2, bitWeights);

            if (i + 1 < words.Length)
            {
                var bigram = string.Concat(words[i], "_", words[i + 1]);
                AccumulateFeatureHash(bigram, weight: 1, bitWeights);
            }
        }

        ulong fingerprint = 0UL;
        for (var bit = 0; bit < 64; bit++)
        {
            if (bitWeights[bit] > 0)
            {
                fingerprint |= 1UL << bit;
            }
        }

        return fingerprint;
    }

    public static int HammingDistance(ulong a, ulong b) =>
        BitOperations.PopCount(a ^ b);

    public static bool IsNearDuplicate(
        ulong a,
        ulong b,
        int maxHammingDistance = DefaultNearDuplicateMaxHammingDistance) =>
        HammingDistance(a, b) <= maxHammingDistance;

    private static void AccumulateFeatureHash(string feature, int weight, Span<int> bitWeights)
    {
        Span<byte> utf8 = stackalloc byte[Encoding.UTF8.GetMaxByteCount(feature.Length)];
        var written = Encoding.UTF8.GetBytes(feature.AsSpan(), utf8);
        Span<byte> digest = stackalloc byte[32];
        SHA256.HashData(utf8[..written], digest);
        var hash64 = BinaryPrimitives.ReadUInt64LittleEndian(digest[..8]);

        for (var bit = 0; bit < 64; bit++)
        {
            if (((hash64 >> bit) & 1UL) != 0)
            {
                bitWeights[bit] += weight;
            }
            else
            {
                bitWeights[bit] -= weight;
            }
        }
    }
}
