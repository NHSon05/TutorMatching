using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TutorMatching.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class TutorReviewDecisions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_tutor_profile_reviews_tutor_profile_id",
                table: "tutor_profile_reviews");

            migrationBuilder.AddColumn<string>(
                name: "action",
                table: "tutor_profile_reviews",
                type: "character varying(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "reviewed_version",
                table: "tutor_profile_reviews",
                type: "uuid",
                nullable: true);

            // Preserve the original decision and reason; a pre-versioning UUID cannot be recovered.
            migrationBuilder.Sql("""
                UPDATE tutor_profile_reviews SET action = CASE to_status_code
                    WHEN 'APPROVED' THEN 'APPROVE'
                    WHEN 'REJECTED' THEN 'REJECT'
                    WHEN 'DRAFT' THEN 'REQUEST_CHANGES'
                    ELSE 'LEGACY_REVIEW' END;
                """);

            migrationBuilder.CreateIndex(
                name: "ix_tutor_profile_reviews_tutor_profile_id_reviewed_at",
                table: "tutor_profile_reviews",
                columns: new[] { "tutor_profile_id", "reviewed_at" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_tutor_profile_reviews_tutor_profile_id_reviewed_at",
                table: "tutor_profile_reviews");

            migrationBuilder.DropColumn(
                name: "action",
                table: "tutor_profile_reviews");

            migrationBuilder.DropColumn(
                name: "reviewed_version",
                table: "tutor_profile_reviews");

            migrationBuilder.CreateIndex(
                name: "ix_tutor_profile_reviews_tutor_profile_id",
                table: "tutor_profile_reviews",
                column: "tutor_profile_id");
        }
    }
}
