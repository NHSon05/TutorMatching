using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TutorMatching.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddDemandMatchingAndRetentionTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "demand_posts",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    requester_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    actor_fingerprint = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    content_hash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    raw_content = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false, defaultValue: "PENDING"),
                    expires_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_demand_posts", x => x.id);
                    table.CheckConstraint("ck_demand_posts_raw_content_len", "char_length(raw_content) BETWEEN 10 AND 2000");
                    table.CheckConstraint("ck_demand_posts_status", "status IN ('PENDING', 'EXTRACTED', 'FAILED', 'DUPLICATE', 'REJECTED')");
                    table.ForeignKey(
                        name: "fk_demand_posts_user_accounts_requester_user_id",
                        column: x => x.requester_user_id,
                        principalTable: "user_accounts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "retention_cleanup_logs",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    cleanup_date = table.Column<DateOnly>(type: "date", nullable: false),
                    posts_deleted_count = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    notifications_deleted_count = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    duration_ms = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    error_message = table.Column<string>(type: "text", nullable: true),
                    executed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_retention_cleanup_logs", x => x.id);
                    table.CheckConstraint("ck_retention_cleanup_logs_status", "status IN ('SUCCESS', 'FAILED')");
                });

            migrationBuilder.CreateTable(
                name: "tutor_matching_profiles",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    tutor_profile_id = table.Column<Guid>(type: "uuid", nullable: false),
                    preferred_subjects = table.Column<List<Guid>>(type: "uuid[]", nullable: false),
                    preferred_grades = table.Column<List<int>>(type: "integer[]", nullable: false),
                    min_tuition_fee_vnd = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    max_tuition_fee_vnd = table.Column<int>(type: "integer", nullable: true),
                    preferred_province_code = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    preferred_district_codes = table.Column<List<string>>(type: "varchar(32)[]", nullable: false),
                    receive_all_districts = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    teaching_modes = table.Column<List<string>>(type: "varchar(20)[]", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_tutor_matching_profiles", x => x.id);
                    table.CheckConstraint("ck_tutor_matching_profiles_max_fee", "max_tuition_fee_vnd IS NULL OR max_tuition_fee_vnd >= min_tuition_fee_vnd");
                    table.CheckConstraint("ck_tutor_matching_profiles_min_fee", "min_tuition_fee_vnd >= 0");
                    table.ForeignKey(
                        name: "fk_tutor_matching_profiles_provinces",
                        column: x => x.preferred_province_code,
                        principalTable: "provinces",
                        principalColumn: "province_code",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_tutor_matching_profiles_tutor_profiles",
                        column: x => x.tutor_profile_id,
                        principalTable: "tutor_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "extracted_demand_details",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    demand_post_id = table.Column<Guid>(type: "uuid", nullable: false),
                    subject_id = table.Column<Guid>(type: "uuid", nullable: true),
                    subject_name_raw = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    grade_level = table.Column<int>(type: "integer", nullable: true),
                    tuition_fee_vnd = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    fee_period = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "PER_SESSION"),
                    is_fee_negotiable = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    sessions_per_week = table.Column<int>(type: "integer", nullable: true),
                    teaching_mode = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "OFFLINE"),
                    province_code = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    district_code = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    raw_address = table.Column<string>(type: "text", nullable: true),
                    is_location_ambiguous = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    schedule_notes = table.Column<string>(type: "text", nullable: true),
                    confidence_score = table.Column<decimal>(type: "numeric(3,2)", precision: 3, scale: 2, nullable: false, defaultValue: 0.00m),
                    extracted_json = table.Column<string>(type: "jsonb", nullable: false),
                    embedding = table.Column<string>(type: "jsonb", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_extracted_demand_details", x => x.id);
                    table.CheckConstraint("ck_extracted_demand_details_confidence", "confidence_score BETWEEN 0.00 AND 1.00");
                    table.CheckConstraint("ck_extracted_demand_details_fee_period", "fee_period IN ('PER_SESSION', 'PER_MONTH', 'TOTAL')");
                    table.CheckConstraint("ck_extracted_demand_details_grade_level", "grade_level IS NULL OR (grade_level BETWEEN 1 AND 12)");
                    table.CheckConstraint("ck_extracted_demand_details_sessions", "sessions_per_week IS NULL OR (sessions_per_week BETWEEN 1 AND 21)");
                    table.CheckConstraint("ck_extracted_demand_details_teaching_mode", "teaching_mode IN ('ONLINE', 'OFFLINE', 'HYBRID')");
                    table.CheckConstraint("ck_extracted_demand_details_tuition_fee", "tuition_fee_vnd >= 0");
                    table.ForeignKey(
                        name: "fk_extracted_demand_details_demand_posts",
                        column: x => x.demand_post_id,
                        principalTable: "demand_posts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_extracted_demand_details_districts",
                        column: x => x.district_code,
                        principalTable: "districts",
                        principalColumn: "district_code",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_extracted_demand_details_provinces",
                        column: x => x.province_code,
                        principalTable: "provinces",
                        principalColumn: "province_code",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_extracted_demand_details_subjects",
                        column: x => x.subject_id,
                        principalTable: "subjects",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "post_match_notifications",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    extracted_demand_detail_id = table.Column<Guid>(type: "uuid", nullable: false),
                    tutor_profile_id = table.Column<Guid>(type: "uuid", nullable: false),
                    match_score = table.Column<decimal>(type: "numeric(3,2)", precision: 3, scale: 2, nullable: false, defaultValue: 1.00m),
                    is_read = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    sent_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    read_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_post_match_notifications", x => x.id);
                    table.CheckConstraint("ck_post_match_notifications_score", "match_score BETWEEN 0.00 AND 1.00");
                    table.ForeignKey(
                        name: "fk_post_match_notifications_extracted_demand_details",
                        column: x => x.extracted_demand_detail_id,
                        principalTable: "extracted_demand_details",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_post_match_notifications_tutor_profiles",
                        column: x => x.tutor_profile_id,
                        principalTable: "tutor_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "idx_demand_posts_actor_hash",
                table: "demand_posts",
                columns: new[] { "actor_fingerprint", "content_hash", "created_at" });

            migrationBuilder.CreateIndex(
                name: "idx_demand_posts_created_at",
                table: "demand_posts",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "idx_demand_posts_expires_at",
                table: "demand_posts",
                column: "expires_at");

            migrationBuilder.CreateIndex(
                name: "idx_demand_posts_status",
                table: "demand_posts",
                columns: new[] { "status", "created_at" });

            migrationBuilder.CreateIndex(
                name: "ix_demand_posts_requester_user_id",
                table: "demand_posts",
                column: "requester_user_id");

            migrationBuilder.CreateIndex(
                name: "idx_extracted_demand_details_ambiguous",
                table: "extracted_demand_details",
                column: "is_location_ambiguous");

            migrationBuilder.CreateIndex(
                name: "idx_extracted_demand_details_matching",
                table: "extracted_demand_details",
                columns: new[] { "subject_id", "grade_level", "province_code", "district_code" });

            migrationBuilder.CreateIndex(
                name: "ix_extracted_demand_details_district_code",
                table: "extracted_demand_details",
                column: "district_code");

            migrationBuilder.CreateIndex(
                name: "ix_extracted_demand_details_province_code",
                table: "extracted_demand_details",
                column: "province_code");

            migrationBuilder.CreateIndex(
                name: "uq_extracted_demand_details_post_id",
                table: "extracted_demand_details",
                column: "demand_post_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_post_match_notifications_created",
                table: "post_match_notifications",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "idx_post_match_notifications_tutor",
                table: "post_match_notifications",
                columns: new[] { "tutor_profile_id", "is_read", "created_at" });

            migrationBuilder.CreateIndex(
                name: "uq_post_match_notifications_detail_tutor",
                table: "post_match_notifications",
                columns: new[] { "extracted_demand_detail_id", "tutor_profile_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_tutor_matching_profiles_active",
                table: "tutor_matching_profiles",
                column: "is_active");

            migrationBuilder.CreateIndex(
                name: "ix_tutor_matching_profiles_preferred_province_code",
                table: "tutor_matching_profiles",
                column: "preferred_province_code");

            migrationBuilder.CreateIndex(
                name: "uq_tutor_matching_profiles_tutor",
                table: "tutor_matching_profiles",
                column: "tutor_profile_id",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "post_match_notifications");

            migrationBuilder.DropTable(
                name: "retention_cleanup_logs");

            migrationBuilder.DropTable(
                name: "tutor_matching_profiles");

            migrationBuilder.DropTable(
                name: "extracted_demand_details");

            migrationBuilder.DropTable(
                name: "demand_posts");
        }
    }
}
