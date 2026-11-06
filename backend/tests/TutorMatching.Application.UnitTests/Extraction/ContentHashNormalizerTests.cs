using TutorMatching.Application.Tutors;

namespace TutorMatching.Application.UnitTests.Extraction;

public sealed class ContentHashNormalizerTests
{
    [Fact]
    public void Normalize_TrimsLowercasesAndCollapsesWhitespaceAndPunctuation()
    {
        var input1 = "  Cần tìm   GIA SƯ Toán lớp 9,  khu vực Cầu Giấy!! ";
        var input2 = "cần tìm gia sư toán lớp 9 khu vực cầu giấy";

        var normalized1 = ContentHashNormalizer.Normalize(input1);
        var normalized2 = ContentHashNormalizer.Normalize(input2);

        Assert.Equal("cần tìm gia sư toán lớp 9 khu vực cầu giấy", normalized1);
        Assert.Equal(normalized2, normalized1);
    }

    [Fact]
    public void ComputeSha256_IdenticalMeaningWithDifferentWhitespaceAndPunctuation_ProducesSame64HexHash()
    {
        var raw1 = "Tìm gia sư Tiếng Anh lớp 7 tại Đống Đa, Hà Nội - 250k/buổi.";
        var raw2 = "  tìm   gia sư tiếng anh lớp 7 tại đống đa hà nội 250k/buổi! ";

        var hash1 = ContentHashNormalizer.ComputeSha256(raw1);
        var hash2 = ContentHashNormalizer.ComputeSha256(raw2);

        Assert.Equal(64, hash1.Length);
        Assert.Equal(hash1, hash2);
    }

    [Fact]
    public void ComputeSimHash_NearDuplicateVietnameseTexts_HaveSmallHammingDistance()
    {
        var text1 = "Cần tìm gia sư dạy Toán lớp 9 ôn thi vào 10 tại quận Cầu Giấy Hà Nội học phí 250k/buổi tuần 2 buổi";
        var text2 = "Cần tìm gia sư dạy Toán lớp 9 ôn thi vào 10 tại quận Cầu Giấy Hà Nội học phí 250k/buổi tuần 2 buổi nhé";
        var completelyDifferent = "Tuyển giáo viên dạy đàn Piano cơ bản tại nhà quận 1 TP Hồ Chí Minh cuối tuần";

        var sim1 = ContentHashNormalizer.ComputeSimHash(text1);
        var sim2 = ContentHashNormalizer.ComputeSimHash(text2);
        var simDifferent = ContentHashNormalizer.ComputeSimHash(completelyDifferent);

        var nearDistance = ContentHashNormalizer.HammingDistance(sim1, sim2);
        var farDistance = ContentHashNormalizer.HammingDistance(sim1, simDifferent);

        Assert.True(nearDistance <= 3, $"Expected near-duplicate Hamming distance <= 3, got {nearDistance}");
        Assert.True(ContentHashNormalizer.IsNearDuplicate(sim1, sim2));
        Assert.True(farDistance > 10, $"Expected different text Hamming distance > 10, got {farDistance}");
        Assert.False(ContentHashNormalizer.IsNearDuplicate(sim1, simDifferent));
    }
}
