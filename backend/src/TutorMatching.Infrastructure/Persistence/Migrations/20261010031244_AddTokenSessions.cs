using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TutorMatching.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddTokenSessions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Some existing databases recorded 20261009000000_AddTokenSessions,
            // which is absent from this repository and used timestamp-based state.
            // Adopt that schema without dropping tables or resurrecting credentials.
            migrationBuilder.Sql("""
                CREATE TABLE IF NOT EXISTS "TokenSessions" (
                    "Id" uuid NOT NULL CONSTRAINT "PK_TokenSessions" PRIMARY KEY,
                    "UserId" uuid NOT NULL CONSTRAINT "FK_TokenSessions_UserAccounts_UserId" REFERENCES "UserAccounts" ("Id") ON DELETE CASCADE,
                    "SecurityStamp" varchar(256) NOT NULL,
                    "Role" varchar(16) NOT NULL,
                    "CreatedAt" timestamptz NOT NULL,
                    "LastRefreshedAt" timestamptz NOT NULL,
                    "AbsoluteExpiresAt" timestamptz NOT NULL,
                    "IsRevoked" boolean NOT NULL
                );
                CREATE TABLE IF NOT EXISTS "SessionRefreshTokens" (
                    "TokenHash" varchar(64) NOT NULL CONSTRAINT "PK_SessionRefreshTokens" PRIMARY KEY,
                    "SessionId" uuid NOT NULL CONSTRAINT "FK_SessionRefreshTokens_TokenSessions_SessionId" REFERENCES "TokenSessions" ("Id") ON DELETE CASCADE,
                    "CreatedAt" timestamptz NOT NULL,
                    "ExpiresAt" timestamptz NOT NULL,
                    "IsUsed" boolean NOT NULL
                );

                DO $upgrade$
                BEGIN
                    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema()
                        AND table_name = 'TokenSessions' AND column_name = 'LastActivityAt') THEN
                        ALTER TABLE "TokenSessions" RENAME COLUMN "LastActivityAt" TO "LastRefreshedAt";
                    END IF;
                    ALTER TABLE "TokenSessions" ADD COLUMN IF NOT EXISTS "IsRevoked" boolean NOT NULL DEFAULT false;
                    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema()
                        AND table_name = 'TokenSessions' AND column_name = 'RevokedAt') THEN
                        UPDATE "TokenSessions" SET "IsRevoked" = "IsRevoked" OR "RevokedAt" IS NOT NULL;
                    END IF;
                    ALTER TABLE "TokenSessions" ALTER COLUMN "IsRevoked" DROP DEFAULT;

                    ALTER TABLE "SessionRefreshTokens" ADD COLUMN IF NOT EXISTS "IsUsed" boolean NOT NULL DEFAULT false;
                    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema()
                        AND table_name = 'SessionRefreshTokens' AND column_name = 'ConsumedAt') THEN
                        UPDATE "SessionRefreshTokens" SET "IsUsed" = "IsUsed" OR "ConsumedAt" IS NOT NULL;
                    END IF;
                    ALTER TABLE "SessionRefreshTokens" ALTER COLUMN "IsUsed" DROP DEFAULT;
                    ALTER TABLE "SessionRefreshTokens" ADD COLUMN IF NOT EXISTS "ExpiresAt" timestamptz;
                    UPDATE "SessionRefreshTokens" AS t
                        SET "ExpiresAt" = LEAST(t."CreatedAt" + INTERVAL '30 minutes', s."AbsoluteExpiresAt")
                        FROM "TokenSessions" AS s WHERE s."Id" = t."SessionId" AND t."ExpiresAt" IS NULL;
                    ALTER TABLE "SessionRefreshTokens" ALTER COLUMN "ExpiresAt" SET NOT NULL;
                END $upgrade$;

                CREATE INDEX IF NOT EXISTS "IX_SessionRefreshTokens_SessionId" ON "SessionRefreshTokens" ("SessionId");
                CREATE INDEX IF NOT EXISTS "IX_TokenSessions_UserId" ON "TokenSessions" ("UserId");
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // This migration can adopt pre-existing tables, so dropping them on
            // rollback would delete sessions it did not create. Use a forward fix.
            throw new NotSupportedException("Session schema adoption cannot be rolled back automatically. Use a forward migration.");
        }
    }
}
