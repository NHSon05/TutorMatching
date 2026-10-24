using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TutorMatching.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddDiscoveryPerformanceIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "ix_tutor_profiles_status_approved_at",
                table: "tutor_profiles",
                columns: new[] { "status", "approved_at" });

            migrationBuilder.CreateIndex(
                name: "ix_availability_slots_search",
                table: "availability_slots",
                columns: new[] { "day_of_week", "tutor_profile_id", "start_time", "end_time" },
                filter: "is_active AND availability_type = 'WEEKLY'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_tutor_profiles_status_approved_at",
                table: "tutor_profiles");

            migrationBuilder.DropIndex(
                name: "ix_availability_slots_search",
                table: "availability_slots");
        }
    }
}
