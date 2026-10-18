using TutorMatching.Application.Abstractions;
using TutorMatching.Domain.Users;

namespace TutorMatching.Application.Users.Profile;

public sealed record UpdateProfileCommand(string? FullName, string? PhoneNumber = null,
    DateOnly? DateOfBirth = null, string? AvatarUrl = null);

public sealed record ProfileResult(AccountProfile? Account, AccountFailure? Failure = null,
    IReadOnlyDictionary<string, string[]>? Errors = null);

public sealed class CurrentProfileHandler(IAccountService accounts, ICurrentUser currentUser, IClock clock)
{
    public async Task<ProfileResult> GetAsync(CancellationToken cancellationToken = default)
    {
        if (!currentUser.IsAuthenticated || currentUser.UserId is not { } id)
            return new(null, AccountFailure.InvalidCredentials);

        var account = await accounts.GetProfileAsync(id, cancellationToken);
        return account is null || account.Status != AccountStatus.ACTIVE
            ? new(null, AccountFailure.InvalidCredentials)
            : new(account);
    }

    public async Task<ProfileResult> UpdateAsync(UpdateProfileCommand command,
        CancellationToken cancellationToken = default)
    {
        var current = await GetAsync(cancellationToken);
        if (current.Failure is not null) return current;
        if (current.Account!.Role is not (AccountRole.LEARNER or AccountRole.TUTOR))
            return new(null, AccountFailure.Forbidden);

        var errors = new Dictionary<string, string[]>();
        var name = command.FullName?.Trim() ?? string.Empty;
        var phone = string.IsNullOrWhiteSpace(command.PhoneNumber) ? null : command.PhoneNumber.Trim();
        var avatar = string.IsNullOrWhiteSpace(command.AvatarUrl) ? null : command.AvatarUrl.Trim();
        if (name.Length is < 2 or > 100)
            errors["fullName"] = ["Full name must be between 2 and 100 characters."];
        if (phone is { Length: > 32 })
            errors["phoneNumber"] = ["Phone number must not exceed 32 characters."];
        if (command.DateOfBirth is { } date && date >= DateOnly.FromDateTime(clock.UtcNow.UtcDateTime))
            errors["dateOfBirth"] = ["Date of birth must be in the past."];
        if (avatar is not null && (avatar.Length > 2048 || !IsAvatarUrl(avatar)))
            errors["avatarUrl"] = ["Avatar must be an HTTP(S) URL or local upload path, at most 2,048 characters."];
        if (errors.Count != 0) return new(null, AccountFailure.InvalidInput, errors);

        var result = await accounts.UpdateProfileAsync(current.Account.Id,
            new ProfileUpdate(name, phone, command.DateOfBirth, avatar), cancellationToken);
        return new(result.Account, result.Failure);
    }

    private static bool IsAvatarUrl(string value)
    {
        if (value.Any(char.IsControl) || value.Contains('\\')) return false;
        if (value.StartsWith("/uploads/avatars/", StringComparison.Ordinal))
            return !value.Contains("..", StringComparison.Ordinal) && !value.Contains('%') &&
                !value.Contains('?') && !value.Contains('#');
        return Uri.TryCreate(value, UriKind.Absolute, out var uri) &&
            uri.Scheme is "http" or "https" && string.IsNullOrEmpty(uri.UserInfo);
    }
}
