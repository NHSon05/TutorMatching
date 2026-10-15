using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TutorMatching.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddTutorProfiles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "tutor_profiles",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    current_step = table.Column<int>(type: "integer", nullable: false),
                    subjects = table.Column<string>(type: "jsonb", nullable: false),
                    languages = table.Column<string>(type: "jsonb", nullable: false),
                    teaching_levels = table.Column<string>(type: "jsonb", nullable: false),
                    avatar_url = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    has_certifications = table.Column<bool>(type: "boolean", nullable: false),
                    certifications = table.Column<string>(type: "jsonb", nullable: false),
                    education_type = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    school_name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    degree = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    specialization = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    year_of_study = table.Column<int>(type: "integer", nullable: true),
                    bio = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    experience_years = table.Column<int>(type: "integer", nullable: true),
                    teaching_methodology = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    achievements_and_results = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    hourly_rate_vnd = table.Column<int>(type: "integer", nullable: true),
                    session_rate_vnd = table.Column<int>(type: "integer", nullable: true),
                    monthly_rate_vnd = table.Column<int>(type: "integer", nullable: true),
                    is_negotiable = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    submitted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    approved_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_tutor_profiles", x => x.id);
                    table.ForeignKey(
                        name: "fk_tutor_profiles_user_accounts_user_id",
                        column: x => x.user_id,
                        principalTable: "user_accounts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_tutor_profiles_user_id",
                table: "tutor_profiles",
                column: "user_id",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tutor_profiles");
        }
    }
}
