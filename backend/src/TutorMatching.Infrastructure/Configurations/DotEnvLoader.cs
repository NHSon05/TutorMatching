namespace TutorMatching.Infrastructure.Configurations;

public static class DotEnvLoader
{
    public static void Load()
    {
        var envFilePath = FindDotEnvFile();
        if (envFilePath is null)
        {
            return;
        }

        foreach (var rawLine in File.ReadAllLines(envFilePath))
        {
            var line = rawLine.Trim();
            if (line.Length == 0 || line.StartsWith('#'))
            {
                continue;
            }

            var separatorIndex = line.IndexOf('=');
            if (separatorIndex <= 0)
            {
                continue;
            }

            var key = line[..separatorIndex].Trim();
            if (Environment.GetEnvironmentVariable(key) is not null)
            {
                continue;
            }

            var value = line[(separatorIndex + 1)..].Trim();
            if (value.Length >= 2 &&
                ((value[0] == '"' && value[^1] == '"') ||
                 (value[0] == '\'' && value[^1] == '\'')))
            {
                value = value[1..^1];
            }

            Environment.SetEnvironmentVariable(key, value);
        }
    }

    private static string? FindDotEnvFile()
    {
        var directory = new DirectoryInfo(Directory.GetCurrentDirectory());

        while (directory is not null)
        {
            // Only trust the backend identified by its solution file, not an
            // arbitrary .env in the working directory or a parent directory.
            if (File.Exists(Path.Combine(directory.FullName, "TutorMatching.slnx")))
            {
                var envPath = Path.Combine(directory.FullName, ".env");
                return File.Exists(envPath) ? envPath : null;
            }

            var backendPath = Path.Combine(directory.FullName, "backend");
            if (File.Exists(Path.Combine(backendPath, "TutorMatching.slnx")))
            {
                var envPath = Path.Combine(backendPath, ".env");
                return File.Exists(envPath) ? envPath : null;
            }

            directory = directory.Parent;
        }

        return null;
    }
}
