using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TutorMatching.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddExternalLoginUniqueness : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_asp_net_user_logins_user_id",
                table: "asp_net_user_logins");

            migrationBuilder.CreateIndex(
                name: "ux_asp_net_user_logins_user_id_login_provider",
                table: "asp_net_user_logins",
                columns: new[] { "user_id", "login_provider" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ux_asp_net_user_logins_user_id_login_provider",
                table: "asp_net_user_logins");

            migrationBuilder.CreateIndex(
                name: "ix_asp_net_user_logins_user_id",
                table: "asp_net_user_logins",
                column: "user_id");
        }
    }
}
