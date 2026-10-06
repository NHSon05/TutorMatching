using TutorMatching.Infrastructure.Configurations;

namespace TutorMatching.Api.IntegrationTests.Configuration;

[CollectionDefinition("Process environment", DisableParallelization = true)]
public sealed class ProcessEnvironmentCollection;

[Collection("Process environment")]
public sealed class DotEnvLoaderTests
{
    [Theory]
    [InlineData("", true, false)]
    [InlineData("backend", true, false)]
    [InlineData("backend/src/Api", true, false)]
    [InlineData("frontend", true, false)]
    [InlineData("frontend", false, false)]
    [InlineData("backend", true, true)]
    public void LoadsOnlyBackendEnvironmentAndPreservesExistingVariables(
        string workingDirectory, bool hasBackendEnv, bool hasExistingVariable)
    {
        var root = Directory.CreateTempSubdirectory("tutormatching-dotenv-");
        var originalDirectory = Directory.GetCurrentDirectory();
        var key = $"TUTORMATCHING_DOTENV_TEST_{Guid.NewGuid():N}";

        try
        {
            var backend = Directory.CreateDirectory(Path.Combine(root.FullName, "backend"));
            var frontend = Directory.CreateDirectory(Path.Combine(root.FullName, "frontend"));
            File.WriteAllText(Path.Combine(backend.FullName, "TutorMatching.slnx"), "<Solution />");
            File.WriteAllText(Path.Combine(root.FullName, ".env"), $"{key}=wrong-root");
            File.WriteAllText(Path.Combine(frontend.FullName, ".env"), $"{key}=wrong-frontend");

            if (hasBackendEnv)
            {
                File.WriteAllText(Path.Combine(backend.FullName, ".env"), $"{key}=\"backend-value\"");
            }

            if (hasExistingVariable)
            {
                Environment.SetEnvironmentVariable(key, "external-value");
            }

            var start = Directory.CreateDirectory(Path.Combine(root.FullName, workingDirectory));
            Directory.SetCurrentDirectory(start.FullName);

            DotEnvLoader.Load();

            var expected = hasExistingVariable ? "external-value"
                : hasBackendEnv ? "backend-value" : null;
            Assert.Equal(expected, Environment.GetEnvironmentVariable(key));
        }
        finally
        {
            Directory.SetCurrentDirectory(originalDirectory);
            Environment.SetEnvironmentVariable(key, null);
            root.Delete(recursive: true);
        }
    }
}
