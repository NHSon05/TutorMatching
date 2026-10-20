using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace TutorMatching.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class MergeUserRolesIntoUserAccounts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "role",
                table: "user_accounts",
                type: "character varying(16)",
                maxLength: 16,
                nullable: false,
                defaultValue: "LEARNER");

            migrationBuilder.Sql("""
                DO $backfill$
                BEGIN
                    IF to_regclass('asp_net_user_roles') IS NOT NULL AND to_regclass('asp_net_roles') IS NOT NULL THEN
                        UPDATE user_accounts u
                        SET role = r.name
                        FROM asp_net_user_roles ur
                        JOIN asp_net_roles r ON ur.role_id = r.id
                        WHERE u.id = ur.user_id AND r.name IS NOT NULL;
                    END IF;
                END $backfill$;
                """);

            migrationBuilder.Sql("UPDATE user_accounts SET role = 'LEARNER' WHERE role IS NULL OR role = '' OR role NOT IN ('ADMIN', 'LEARNER', 'TUTOR');");

            migrationBuilder.AddCheckConstraint(
                name: "ck_user_accounts_role_canonical",
                table: "user_accounts",
                sql: "role IN ('ADMIN', 'LEARNER', 'TUTOR')");

            migrationBuilder.DropTable(
                name: "asp_net_role_claims");

            migrationBuilder.DropTable(
                name: "asp_net_user_roles");

            migrationBuilder.DropTable(
                name: "asp_net_roles");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "asp_net_roles",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    concurrency_stamp = table.Column<string>(type: "text", nullable: true),
                    name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    normalized_name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_asp_net_roles", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "asp_net_role_claims",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    claim_type = table.Column<string>(type: "text", nullable: true),
                    claim_value = table.Column<string>(type: "text", nullable: true),
                    role_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_asp_net_role_claims", x => x.id);
                    table.ForeignKey(
                        name: "fk_asp_net_role_claims_asp_net_roles_role_id",
                        column: x => x.role_id,
                        principalTable: "asp_net_roles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "asp_net_user_roles",
                columns: table => new
                {
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    role_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_asp_net_user_roles", x => new { x.user_id, x.role_id });
                    table.ForeignKey(
                        name: "fk_asp_net_user_roles_asp_net_roles_role_id",
                        column: x => x.role_id,
                        principalTable: "asp_net_roles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_asp_net_user_roles_user_accounts_user_id",
                        column: x => x.user_id,
                        principalTable: "user_accounts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "asp_net_roles",
                columns: new[] { "id", "concurrency_stamp", "name", "normalized_name" },
                values: new object[,]
                {
                    { new Guid("11111111-1111-1111-1111-111111111111"), "11111111111111111111111111111111", "ADMIN", "ADMIN" },
                    { new Guid("22222222-2222-2222-2222-222222222222"), "22222222222222222222222222222222", "LEARNER", "LEARNER" },
                    { new Guid("33333333-3333-3333-3333-333333333333"), "33333333333333333333333333333333", "TUTOR", "TUTOR" }
                });

            migrationBuilder.Sql("""
                DO $restore$
                BEGIN
                    INSERT INTO asp_net_user_roles (user_id, role_id)
                    SELECT u.id, r.id
                    FROM user_accounts u
                    JOIN asp_net_roles r ON r.name = u.role
                    ON CONFLICT DO NOTHING;
                END $restore$;
                """);

            migrationBuilder.CreateIndex(
                name: "ix_asp_net_role_claims_role_id",
                table: "asp_net_role_claims",
                column: "role_id");

            migrationBuilder.CreateIndex(
                name: "role_name_index",
                table: "asp_net_roles",
                column: "normalized_name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_asp_net_user_roles_role_id",
                table: "asp_net_user_roles",
                column: "role_id");

            migrationBuilder.CreateIndex(
                name: "ux_asp_net_user_roles_user_id",
                table: "asp_net_user_roles",
                column: "user_id",
                unique: true);

            migrationBuilder.DropCheckConstraint(
                name: "ck_user_accounts_role_canonical",
                table: "user_accounts");

            migrationBuilder.DropColumn(
                name: "role",
                table: "user_accounts");
        }
    }
}
