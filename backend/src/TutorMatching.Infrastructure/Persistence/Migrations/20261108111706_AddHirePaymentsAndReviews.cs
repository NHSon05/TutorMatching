using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TutorMatching.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddHirePaymentsAndReviews : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "average_rating",
                table: "tutor_profiles",
                type: "numeric(3,2)",
                precision: 3,
                scale: 2,
                nullable: false,
                defaultValue: 0.00m);

            migrationBuilder.AddColumn<int>(
                name: "review_count",
                table: "tutor_profiles",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "paid_at",
                table: "hire_requests",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "payment_status_code",
                table: "hire_requests",
                type: "character varying(24)",
                maxLength: 24,
                nullable: false,
                defaultValue: "UNPAID");

            migrationBuilder.CreateTable(
                name: "hire_payments",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    hire_request_id = table.Column<Guid>(type: "uuid", nullable: false),
                    payer_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    idempotency_key = table.Column<Guid>(type: "uuid", nullable: false),
                    unit_price_vnd = table.Column<int>(type: "integer", nullable: false),
                    billing_sessions = table.Column<int>(type: "integer", nullable: false),
                    amount_vnd = table.Column<int>(type: "integer", nullable: false),
                    provider_code = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false, defaultValue: "VIETQR_SANDBOX"),
                    transfer_reference = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    qr_payload = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    status_code = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false, defaultValue: "PENDING"),
                    paid_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_hire_payments", x => x.id);
                    table.CheckConstraint("ck_hire_payment_amounts", "unit_price_vnd > 0 AND billing_sessions > 0 AND amount_vnd = unit_price_vnd * billing_sessions");
                    table.CheckConstraint("ck_hire_payment_status", "status_code IN ('PENDING','PAID','FAILED','CANCELLED','REFUNDED')");
                    table.ForeignKey(
                        name: "fk_hire_payments_hire_requests_hire_request_id",
                        column: x => x.hire_request_id,
                        principalTable: "hire_requests",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_hire_payments_user_accounts_payer_user_id",
                        column: x => x.payer_user_id,
                        principalTable: "user_accounts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "hire_reviews",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    hire_request_id = table.Column<Guid>(type: "uuid", nullable: false),
                    tutor_profile_id = table.Column<Guid>(type: "uuid", nullable: false),
                    reviewer_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    rating = table.Column<int>(type: "integer", nullable: false),
                    comment = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    tutor_reply = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    tutor_replied_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    is_visible = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_hire_reviews", x => x.id);
                    table.CheckConstraint("ck_hire_review_rating", "rating BETWEEN 1 AND 5");
                    table.ForeignKey(
                        name: "fk_hire_reviews_hire_requests_hire_request_id",
                        column: x => x.hire_request_id,
                        principalTable: "hire_requests",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_hire_reviews_tutor_profiles_tutor_profile_id",
                        column: x => x.tutor_profile_id,
                        principalTable: "tutor_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_hire_reviews_user_accounts_reviewer_user_id",
                        column: x => x.reviewer_user_id,
                        principalTable: "user_accounts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.AddCheckConstraint(
                name: "ck_hire_request_payment_status",
                table: "hire_requests",
                sql: "payment_status_code IN ('UNPAID','PENDING','PAID','REFUNDED')");

            migrationBuilder.CreateIndex(
                name: "ix_hire_payments_hire_request_id_created_at",
                table: "hire_payments",
                columns: new[] { "hire_request_id", "created_at" });

            migrationBuilder.CreateIndex(
                name: "ix_hire_payments_payer_user_id_idempotency_key",
                table: "hire_payments",
                columns: new[] { "payer_user_id", "idempotency_key" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_hire_reviews_hire_request_id",
                table: "hire_reviews",
                column: "hire_request_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_hire_reviews_reviewer_user_id",
                table: "hire_reviews",
                column: "reviewer_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_hire_reviews_tutor_profile_id_is_visible_created_at",
                table: "hire_reviews",
                columns: new[] { "tutor_profile_id", "is_visible", "created_at" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "hire_payments");

            migrationBuilder.DropTable(
                name: "hire_reviews");

            migrationBuilder.DropCheckConstraint(
                name: "ck_hire_request_payment_status",
                table: "hire_requests");

            migrationBuilder.DropColumn(
                name: "average_rating",
                table: "tutor_profiles");

            migrationBuilder.DropColumn(
                name: "review_count",
                table: "tutor_profiles");

            migrationBuilder.DropColumn(
                name: "paid_at",
                table: "hire_requests");

            migrationBuilder.DropColumn(
                name: "payment_status_code",
                table: "hire_requests");
        }
    }
}
