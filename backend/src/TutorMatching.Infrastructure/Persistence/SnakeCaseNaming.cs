using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;

namespace TutorMatching.Infrastructure.Persistence;

public static partial class SnakeCaseNaming
{
    public static string Convert(string name) => WordBoundary().Replace(
        AcronymBoundary().Replace(name, "$1_$2"), "$1_$2").ToLowerInvariant();

    public static void Apply(ModelBuilder builder)
    {
        // Capture relational names before changing tables/columns, so conventional
        // names and explicitly configured names follow the same transformation.
        var entities = builder.Model.GetEntityTypes().ToArray();
        var keys = entities.SelectMany(e => e.GetKeys()).Select(k => (Key: k, Name: k.GetName()!)).ToArray();
        var foreignKeys = entities.SelectMany(e => e.GetForeignKeys()).Select(k => (Key: k, Name: k.GetConstraintName()!)).ToArray();
        var indexes = entities.SelectMany(e => e.GetIndexes()).Select(i => (Index: i, Name: i.GetDatabaseName()!)).ToArray();
        foreach (var entity in entities)
        {
            entity.SetTableName(Convert(entity.GetTableName()!));
            foreach (var property in entity.GetProperties())
                property.SetColumnName(Convert(property.GetColumnName()));
        }
        foreach (var (key, name) in keys) key.SetName(Convert(name));
        foreach (var (key, name) in foreignKeys) key.SetConstraintName(Convert(name));
        foreach (var (index, name) in indexes) index.SetDatabaseName(Convert(name));
    }

    [GeneratedRegex("([A-Z]+)([A-Z][a-z])", RegexOptions.CultureInvariant)]
    private static partial Regex AcronymBoundary();
    [GeneratedRegex("([a-z0-9])([A-Z])", RegexOptions.CultureInvariant)]
    private static partial Regex WordBoundary();
}
