using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace TutorMatching.Infrastructure.Persistence.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20261029090000_BackfillHireConversations")]
public sealed class BackfillHireConversations : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Legacy requests may predate conversation creation. Preserve existing conversations/messages.
        migrationBuilder.Sql("""
            INSERT INTO conversations (id, hire_request_id, created_at)
            SELECT gen_random_uuid(), r.id, CURRENT_TIMESTAMP
            FROM hire_requests r
            WHERE NOT EXISTS (SELECT 1 FROM conversations c WHERE c.hire_request_id = r.id)
            ON CONFLICT (hire_request_id) DO NOTHING;
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Keep conversations: they may have received messages since the backfill.
    }
}
