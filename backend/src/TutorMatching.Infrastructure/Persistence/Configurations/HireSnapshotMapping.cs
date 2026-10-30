using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace TutorMatching.Infrastructure.Persistence.Configurations;

internal static class HireSnapshotMapping
{
    private static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web);
    internal static string Serialize<T>(T value) => JsonSerializer.Serialize(value, Options);
    internal static T Deserialize<T>(string value) => JsonSerializer.Deserialize<T>(value, Options)!;
    internal static void JsonSnapshot<T>(this PropertyBuilder<T> property)
    {
        property.HasConversion(v => Serialize(v), v => Deserialize<T>(v)).HasColumnType("jsonb");
        property.Metadata.SetValueComparer(new ValueComparer<T>(
            (a, b) => Serialize(a) == Serialize(b), v => Serialize(v).GetHashCode(), v => v));
    }
}
