using System.Globalization;
using System.Text.RegularExpressions;

namespace TutorMatching.Infrastructure.Extraction;

public sealed record RegexExtractedEntities(
    string? SubjectNameRaw,
    int? GradeLevel,
    int TuitionFeeVnd,
    string FeePeriod,
    bool IsFeeNegotiable,
    int? SessionsPerWeek,
    string TeachingMode,
    string? ScheduleNotes);

public sealed partial class RegexEntityExtractor
{
    private static readonly (string CanonicalName, string[] Keywords)[] SubjectLexicon =
    [
        ("Tiếng Anh", ["tiếng anh", "anh văn", "ielts", "toeic", "môn anh"]),
        ("Ngữ Văn", ["ngữ văn", "môn văn", "văn học", "tiếng việt"]),
        ("Toán", ["toán học", "môn toán", "toán"]),
        ("Vật Lý", ["vật lý", "vật lí", "môn lý", "môn lí", "lý lớp", "lí lớp"]),
        ("Hóa học", ["hóa học", "hoá học", "môn hóa", "môn hoá", "hóa lớp", "hoá lớp"]),
        ("Sinh học", ["sinh học", "môn sinh"]),
        ("Tin học", ["tin học", "lập trình"]),
    ];

    public RegexExtractedEntities Extract(string? rawContent)
    {
        if (string.IsNullOrWhiteSpace(rawContent))
        {
            return new RegexExtractedEntities(
                SubjectNameRaw: null,
                GradeLevel: null,
                TuitionFeeVnd: 0,
                FeePeriod: "PER_SESSION",
                IsFeeNegotiable: false,
                SessionsPerWeek: null,
                TeachingMode: "OFFLINE",
                ScheduleNotes: null);
        }

        var lower = rawContent.Trim().ToLowerInvariant();

        var subject = ExtractSubject(lower);
        var grade = ExtractGradeLevel(lower);
        var (feeVnd, feePeriod, isNegotiable) = ExtractTuitionFee(lower);
        var sessionsPerWeek = ExtractSessionsPerWeek(lower);
        var teachingMode = ExtractTeachingMode(lower);
        var scheduleNotes = ExtractScheduleNotes(rawContent);

        return new RegexExtractedEntities(
            SubjectNameRaw: subject,
            GradeLevel: grade,
            TuitionFeeVnd: feeVnd,
            FeePeriod: feePeriod,
            IsFeeNegotiable: isNegotiable,
            SessionsPerWeek: sessionsPerWeek,
            TeachingMode: teachingMode,
            ScheduleNotes: scheduleNotes);
    }

    private static string? ExtractSubject(string lowerText)
    {
        foreach (var (canonical, keywords) in SubjectLexicon)
        {
            foreach (var kw in keywords)
            {
                if (lowerText.Contains(kw, StringComparison.Ordinal))
                {
                    return canonical;
                }
            }
        }

        return null;
    }

    private static int? ExtractGradeLevel(string lowerText)
    {
        if (ExamInto10Regex().IsMatch(lowerText))
        {
            return 9;
        }

        if (UniversityExamRegex().IsMatch(lowerText))
        {
            return 12;
        }

        var gradeMatch = ExplicitGradeRegex().Match(lowerText);
        if (gradeMatch.Success &&
            int.TryParse(gradeMatch.Groups["grade"].Value, NumberStyles.Integer, CultureInfo.InvariantCulture, out var grade) &&
            grade is >= 1 and <= 12)
        {
            return grade;
        }

        return null;
    }

    private static (int TuitionFeeVnd, string FeePeriod, bool IsNegotiable) ExtractTuitionFee(string lowerText)
    {
        if (lowerText.Contains("thỏa thuận", StringComparison.Ordinal) ||
            lowerText.Contains("thoả thuận", StringComparison.Ordinal) ||
            lowerText.Contains("thương lượng", StringComparison.Ordinal))
        {
            return (0, "PER_SESSION", true);
        }

        // Pattern 1: "1tr6/8b", "1.6tr/8 buổi", "1tr600/8b"
        var packageMatch = MillionPackageRegex().Match(lowerText);
        if (packageMatch.Success)
        {
            var millions = int.Parse(packageMatch.Groups["m"].Value, CultureInfo.InvariantCulture);
            var hundredThousandsStr = packageMatch.Groups["ht"].Value;
            var totalVnd = millions * 1_000_000;
            if (!string.IsNullOrEmpty(hundredThousandsStr))
            {
                var scale = hundredThousandsStr.Length == 1 ? 100_000 : (hundredThousandsStr.Length == 2 ? 10_000 : 1_000);
                totalVnd += int.Parse(hundredThousandsStr, CultureInfo.InvariantCulture) * scale;
            }

            var sessions = int.Parse(packageMatch.Groups["sessions"].Value, CultureInfo.InvariantCulture);
            if (sessions > 0)
            {
                return (totalVnd / sessions, "PER_SESSION", false);
            }
        }

        // Pattern 2: "250k/b", "250k/buổi", "250k"
        var kMatch = ThousandKRegex().Match(lowerText);
        if (kMatch.Success &&
            int.TryParse(kMatch.Groups["k"].Value, NumberStyles.Integer, CultureInfo.InvariantCulture, out var kValue))
        {
            return (kValue * 1_000, "PER_SESSION", false);
        }

        // Pattern 3: "300.000đ/buổi", "250,000đ"
        var dottedVndMatch = DottedVndRegex().Match(lowerText);
        if (dottedVndMatch.Success)
        {
            var digitsOnly = dottedVndMatch.Groups["amount"].Value.Replace(".", string.Empty).Replace(",", string.Empty);
            if (int.TryParse(digitsOnly, NumberStyles.Integer, CultureInfo.InvariantCulture, out var vnd))
            {
                return (vnd, "PER_SESSION", false);
            }
        }

        return (0, "PER_SESSION", false);
    }

    private static int? ExtractSessionsPerWeek(string lowerText)
    {
        var match1 = SessionsPerWeekFirstRegex().Match(lowerText);
        if (match1.Success &&
            int.TryParse(match1.Groups["n"].Value, NumberStyles.Integer, CultureInfo.InvariantCulture, out var n1) &&
            n1 is >= 1 and <= 21)
        {
            return n1;
        }

        var match2 = SessionsPerWeekSecondRegex().Match(lowerText);
        if (match2.Success &&
            int.TryParse(match2.Groups["n"].Value, NumberStyles.Integer, CultureInfo.InvariantCulture, out var n2) &&
            n2 is >= 1 and <= 21)
        {
            return n2;
        }

        return null;
    }

    private static string ExtractTeachingMode(string lowerText)
    {
        var hasOnline = lowerText.Contains("online", StringComparison.Ordinal) ||
                        lowerText.Contains("trực tuyến", StringComparison.Ordinal) ||
                        lowerText.Contains("qua zoom", StringComparison.Ordinal) ||
                        lowerText.Contains("google meet", StringComparison.Ordinal);

        var hasOffline = lowerText.Contains("offline", StringComparison.Ordinal) ||
                         lowerText.Contains("tại nhà", StringComparison.Ordinal) ||
                         lowerText.Contains("trực tiếp", StringComparison.Ordinal);

        if (lowerText.Contains("hybrid", StringComparison.Ordinal) ||
            lowerText.Contains("kết hợp", StringComparison.Ordinal) ||
            (hasOnline && hasOffline))
        {
            return "HYBRID";
        }

        if (hasOnline)
        {
            return "ONLINE";
        }

        return "OFFLINE";
    }

    private static string? ExtractScheduleNotes(string rawContent)
    {
        var match = ScheduleNoteRegex().Match(rawContent);
        return match.Success ? match.Value.Trim() : null;
    }

    [GeneratedRegex(@"(?:ôn\s+thi\s+vào\s+(?:lớp\s+)?10|luyện\s+thi\s+vào\s+10|thi\s+chuyển\s+cấp\s+lên\s+10)", RegexOptions.CultureInvariant)]
    private static partial Regex ExamInto10Regex();

    [GeneratedRegex(@"(?:ôn\s+thi\s+(?:đh|đại\s+học|thpt\s*qg|thptqg)|luyện\s+thi\s+(?:đh|đại\s+học|thpt\s*qg|thptqg))", RegexOptions.CultureInvariant)]
    private static partial Regex UniversityExamRegex();

    [GeneratedRegex(@"\blớp\s*(?<grade>1[0-2]|[1-9])\b", RegexOptions.CultureInvariant)]
    private static partial Regex ExplicitGradeRegex();

    [GeneratedRegex(@"\b(?<m>[1-9])\s*(?:tr|triệu)\s*(?<ht>\d{1,3})?\s*/\s*(?<sessions>\d{1,2})\s*(?:b|buổi)\b", RegexOptions.CultureInvariant)]
    private static partial Regex MillionPackageRegex();

    [GeneratedRegex(@"\b(?<k>\d{2,4})\s*k(?:\s*/\s*(?:b|buổi|h|giờ))?\b", RegexOptions.CultureInvariant)]
    private static partial Regex ThousandKRegex();

    [GeneratedRegex(@"\b(?<amount>\d{3}[.,]\d{3})\s*(?:đ|vnđ|vnd)?(?:\s*/\s*(?:b|buổi|h|giờ))?", RegexOptions.CultureInvariant)]
    private static partial Regex DottedVndRegex();

    [GeneratedRegex(@"\btuần\s*(?<n>\d{1,2})\s*(?:b|buổi)\b", RegexOptions.CultureInvariant)]
    private static partial Regex SessionsPerWeekFirstRegex();

    [GeneratedRegex(@"\b(?<n>\d{1,2})\s*(?:b|buổi)\s*/\s*tuần\b", RegexOptions.CultureInvariant)]
    private static partial Regex SessionsPerWeekSecondRegex();

    [GeneratedRegex(@"(?:tối|sáng|chiều|cuối\s+tuần)\s+thứ\s+[2-7](?:\s*(?:,|và|-)\s*(?:thứ\s+)?[2-7cn]|(?:\s+chủ\s+nhật))*", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex ScheduleNoteRegex();
}
