using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TutorMatching.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class UseTokenStateTimestamps : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Existing installations may retain these columns from the legacy schema.
            // Keep known times; never reactivate a credential if either old representation
            // marked it revoked/consumed. -infinity means the historical event time is unknown,
            // NOT the time this upgrade ran. New transitions always use an actual UTC time.
            migrationBuilder.Sql("""
                ALTER TABLE token_sessions ADD COLUMN IF NOT EXISTS revoked_at timestamptz;
                ALTER TABLE session_refresh_tokens ADD COLUMN IF NOT EXISTS consumed_at timestamptz;
                UPDATE token_sessions SET revoked_at = '-infinity'::timestamptz
                    WHERE is_revoked AND revoked_at IS NULL;
                UPDATE session_refresh_tokens SET consumed_at = '-infinity'::timestamptz
                    WHERE is_used AND consumed_at IS NULL;
                ALTER TABLE token_sessions DROP COLUMN is_revoked;
                ALTER TABLE session_refresh_tokens DROP COLUMN is_used;
                COMMENT ON COLUMN token_sessions.revoked_at IS
                    'NULL = not revoked; -infinity = revoked at unknown legacy time; otherwise UTC revocation time';
                COMMENT ON COLUMN session_refresh_tokens.consumed_at IS
                    'NULL = unused; -infinity = consumed at unknown legacy time; otherwise UTC consumption time';
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            throw new NotSupportedException(
                "Downgrade would discard token event times. Use a reviewed forward migration instead.");
        }
    }
}
