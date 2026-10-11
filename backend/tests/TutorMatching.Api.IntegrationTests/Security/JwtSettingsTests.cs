using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using TutorMatching.Api.Security;

namespace TutorMatching.Api.IntegrationTests.Security;

public sealed class JwtSettingsTests
{
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData("this-is-not-base64-but-is-at-least-32-bytes")]
    [InlineData("c2hvcnQ=")]
    public void RejectsMissingMalformedOrShortKeys(string? key)
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(
            new Dictionary<string, string?> { ["Jwt:SigningKey"] = key }).Build();
        Assert.Throws<InvalidOperationException>(() => JwtSettings.Load(configuration, CookieSecurePolicy.Always));
    }

    [Fact]
    public void AcceptsRandom256BitBase64Key()
    {
        var bytes = System.Security.Cryptography.RandomNumberGenerator.GetBytes(32);
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(
            new Dictionary<string, string?> { ["Jwt:SigningKey"] = Convert.ToBase64String(bytes) }).Build();
        Assert.Equal(bytes, JwtSettings.Load(configuration, CookieSecurePolicy.Always).SigningKey);
    }
}
