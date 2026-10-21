using Microsoft.EntityFrameworkCore;
using TutorMatching.Domain.Tutors;
using TutorMatching.Domain.Users;
using TutorMatching.Infrastructure.Persistence;
namespace TutorMatching.Infrastructure.Tutors;
public static class PublicTutorQueries
{
    public static IQueryable<TutorProfile> PublicTutorProfiles(this ApplicationDbContext db) =>
        db.TutorProfiles.AsNoTracking().Where(profile => profile.Status == TutorProfileStatus.APPROVED &&
            db.Users.Any(user => user.Id == profile.UserId && user.Status == AccountStatus.ACTIVE));
}
