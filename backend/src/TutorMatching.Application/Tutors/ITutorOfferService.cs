using System.ComponentModel.DataAnnotations;
namespace TutorMatching.Application.Tutors;
public sealed record AvailabilityWrite(int DayOfWeek, TimeOnly StartTime, TimeOnly EndTime);
public sealed record AvailabilityData(Guid Id, int DayOfWeek, TimeOnly StartTime, TimeOnly EndTime, string TimeZone = "Asia/Ho_Chi_Minh");
public sealed record CourseWrite(Guid SubjectId, [Required, MaxLength(200)] string Name, [Required, MaxLength(4000)] string Content, [Range(1,int.MaxValue)] int SessionCount, [Range(1,int.MaxValue)] int PricePerSessionVnd, [Required, RegularExpression("^(ACTIVE|HIDDEN)$")] string Status);
public sealed record CourseData(Guid Id, Guid SubjectId, string Name, string Content, int? SessionCount, int? PricePerSessionVnd, string Status);
public enum OfferFailure { NotFound, Invalid, Conflict }
public sealed record OfferResult<T>(T? Data, OfferFailure? Failure = null);
public interface ITutorOfferService
{
    Task<IReadOnlyList<AvailabilityData>> AvailabilityAsync(Guid userId, CancellationToken token);
    Task<OfferResult<AvailabilityData>> SaveAvailabilityAsync(Guid userId, Guid? id, AvailabilityWrite data, CancellationToken token);
    Task<OfferFailure?> DeleteAvailabilityAsync(Guid userId, Guid id, CancellationToken token);
    Task<IReadOnlyList<CourseData>> CoursesAsync(Guid userId, CancellationToken token);
    Task<OfferResult<CourseData>> SaveCourseAsync(Guid userId, Guid? id, CourseWrite data, CancellationToken token);
    Task<OfferFailure?> DeleteCourseAsync(Guid userId, Guid id, CancellationToken token);
}
