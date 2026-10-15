using Microsoft.AspNetCore.Hosting;
using TutorMatching.Application.Abstractions;

namespace TutorMatching.Infrastructure.Storage;

public sealed class LocalFileStorageService(IWebHostEnvironment environment) : IFileStorageService
{
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp", ".pdf"
    };

    public async Task<string> SaveFileAsync(
        Stream fileStream,
        string fileName,
        string folder,
        CancellationToken cancellationToken = default)
    {
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension))
        {
            throw new InvalidOperationException($"File extension '{extension}' is not allowed.");
        }

        var webRoot = environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var sanitizedFolder = string.Join("_", folder.Split(Path.GetInvalidPathChars()));
        var targetDir = Path.Combine(webRoot, "uploads", sanitizedFolder);
        Directory.CreateDirectory(targetDir);

        var uniqueFileName = $"{Guid.NewGuid():N}{extension}";
        var fullPath = Path.Combine(targetDir, uniqueFileName);

        await using var destination = new FileStream(fullPath, FileMode.Create, FileAccess.Write, FileShare.None);
        await fileStream.CopyToAsync(destination, cancellationToken);

        return $"/uploads/{sanitizedFolder}/{uniqueFileName}";
    }

    public Task<bool> DeleteFileAsync(string relativePath, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(relativePath) || !relativePath.StartsWith("/uploads/", StringComparison.OrdinalIgnoreCase))
        {
            return Task.FromResult(false);
        }

        var webRoot = environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var fullPath = Path.Combine(webRoot, relativePath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));

        if (File.Exists(fullPath))
        {
            File.Delete(fullPath);
            return Task.FromResult(true);
        }

        return Task.FromResult(false);
    }
}
