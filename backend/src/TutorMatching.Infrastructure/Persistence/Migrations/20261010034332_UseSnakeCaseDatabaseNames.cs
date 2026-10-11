using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TutorMatching.Infrastructure.Persistence.Migrations;

public partial class UseSnakeCaseDatabaseNames : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // PostgreSQL updates FK references, check expressions, filtered indexes and
        // sequence ownership when identifiers are renamed. Never rebuild user data.
        migrationBuilder.Sql("""
            ALTER TABLE "UserAccounts" RENAME TO user_accounts;
            ALTER TABLE "AuditEvents" RENAME TO audit_events;
            ALTER TABLE "TokenSessions" RENAME TO token_sessions;
            ALTER TABLE "SessionRefreshTokens" RENAME TO session_refresh_tokens;
            ALTER TABLE "AspNetRoles" RENAME TO asp_net_roles;
            ALTER TABLE "AspNetRoleClaims" RENAME TO asp_net_role_claims;
            ALTER TABLE "AspNetUserRoles" RENAME TO asp_net_user_roles;
            ALTER TABLE "AspNetUserClaims" RENAME TO asp_net_user_claims;
            ALTER TABLE "AspNetUserLogins" RENAME TO asp_net_user_logins;
            ALTER TABLE "AspNetUserTokens" RENAME TO asp_net_user_tokens;

            DO $rename$
            DECLARE
                item record;
                new_name text;
                owned_tables text[] := ARRAY[
                    'user_accounts', 'audit_events', 'token_sessions', 'session_refresh_tokens',
                    'asp_net_roles', 'asp_net_role_claims', 'asp_net_user_roles',
                    'asp_net_user_claims', 'asp_net_user_logins', 'asp_net_user_tokens'];
            BEGIN
                -- Includes legacy RevokedAt/ConsumedAt columns not in the EF model.
                FOR item IN SELECT table_name, column_name FROM information_schema.columns
                    WHERE table_schema = current_schema() AND table_name = ANY(owned_tables)
                LOOP
                    new_name := lower(regexp_replace(regexp_replace(item.column_name,
                        '([A-Z]+)([A-Z][a-z])', '\1_\2', 'g'), '([a-z0-9])([A-Z])', '\1_\2', 'g'));
                    IF new_name <> item.column_name THEN
                        EXECUTE format('ALTER TABLE %I.%I RENAME COLUMN %I TO %I',
                            current_schema(), item.table_name, item.column_name, new_name);
                    END IF;
                END LOOP;

                -- Canonicalize PK/FK names even when a legacy installation used
                -- PostgreSQL-generated names rather than the EF-generated names.
                FOR item IN
                    SELECT c.oid, c.conname, c.contype, t.relname AS table_name,
                        referenced.relname AS referenced_table,
                        (SELECT string_agg(a.attname, '_' ORDER BY keys.ordinality)
                         FROM unnest(c.conkey) WITH ORDINALITY AS keys(attnum, ordinality)
                         JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = keys.attnum) AS columns
                    FROM pg_constraint c
                    JOIN pg_class t ON t.oid = c.conrelid
                    JOIN pg_namespace n ON n.oid = t.relnamespace
                    LEFT JOIN pg_class referenced ON referenced.oid = c.confrelid
                    WHERE n.nspname = current_schema() AND t.relname = ANY(owned_tables)
                LOOP
                    new_name := CASE item.contype
                        WHEN 'p' THEN 'pk_' || item.table_name
                        WHEN 'f' THEN 'fk_' || item.table_name || '_' || item.referenced_table || '_' || item.columns
                        ELSE lower(regexp_replace(regexp_replace(item.conname,
                            '([A-Z]+)([A-Z][a-z])', '\1_\2', 'g'), '([a-z0-9])([A-Z])', '\1_\2', 'g'))
                    END;
                    IF new_name <> item.conname THEN
                        EXECUTE format('ALTER TABLE %I.%I RENAME CONSTRAINT %I TO %I',
                            current_schema(), item.table_name, item.conname, new_name);
                    END IF;
                END LOOP;

                FOR item IN SELECT indexname FROM pg_indexes
                    WHERE schemaname = current_schema() AND tablename = ANY(owned_tables)
                LOOP
                    new_name := lower(regexp_replace(regexp_replace(item.indexname,
                        '([A-Z]+)([A-Z][a-z])', '\1_\2', 'g'), '([a-z0-9])([A-Z])', '\1_\2', 'g'));
                    IF new_name <> item.indexname THEN
                        EXECUTE format('ALTER INDEX %I.%I RENAME TO %I', current_schema(), item.indexname, new_name);
                    END IF;
                END LOOP;

                FOR item IN
                    SELECT DISTINCT sequence.relname FROM pg_class sequence
                    JOIN pg_namespace n ON n.oid = sequence.relnamespace
                    JOIN pg_depend d ON d.objid = sequence.oid AND d.classid = 'pg_class'::regclass
                        AND d.refclassid = 'pg_class'::regclass AND d.deptype IN ('a', 'i')
                    JOIN pg_class owner_table ON owner_table.oid = d.refobjid
                    WHERE sequence.relkind = 'S' AND n.nspname = current_schema()
                        AND owner_table.relname = ANY(owned_tables)
                LOOP
                    new_name := lower(regexp_replace(regexp_replace(item.relname,
                        '([A-Z]+)([A-Z][a-z])', '\1_\2', 'g'), '([a-z0-9])([A-Z])', '\1_\2', 'g'));
                    IF new_name <> item.relname THEN
                        EXECUTE format('ALTER SEQUENCE %I.%I RENAME TO %I', current_schema(), item.relname, new_name);
                    END IF;
                END LOOP;
            END $rename$;
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder) =>
        throw new NotSupportedException("Use a forward migration; legacy custom identifier names cannot be reconstructed safely.");
}
