using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TutorMatching.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20261019090000_AddDatabaseSchemaEntities")]
    public partial class AddDatabaseSchemaEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "district_code",
                table: "tutor_profiles",
                type: "character varying(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "province_code",
                table: "tutor_profiles",
                type: "character varying(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "articles",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    author_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    title = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    slug = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    summary = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    content = table.Column<string>(type: "text", nullable: false),
                    status_code = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    published_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_articles", x => x.id);
                    table.ForeignKey(
                        name: "fk_articles_user_accounts_author_user_id",
                        column: x => x.author_user_id,
                        principalTable: "user_accounts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "availability_slots",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    tutor_profile_id = table.Column<Guid>(type: "uuid", nullable: false),
                    availability_type = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    day_of_week = table.Column<int>(type: "integer", nullable: true),
                    specific_date = table.Column<DateOnly>(type: "date", nullable: true),
                    start_time = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    end_time = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_availability_slots", x => x.id);
                    table.ForeignKey(
                        name: "fk_availability_slots_tutor_profiles_tutor_profile_id",
                        column: x => x.tutor_profile_id,
                        principalTable: "tutor_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "password_reset_tokens",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    token_hash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    expires_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    used_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_password_reset_tokens", x => x.id);
                    table.ForeignKey(
                        name: "fk_password_reset_tokens_user_accounts_user_id",
                        column: x => x.user_id,
                        principalTable: "user_accounts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "provinces",
                columns: table => new
                {
                    province_code = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    province_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_provinces", x => x.province_code);
                });

            migrationBuilder.CreateTable(
                name: "subjects",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_subjects", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "tutor_profile_reviews",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    tutor_profile_id = table.Column<Guid>(type: "uuid", nullable: false),
                    reviewer_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    from_status_code = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    to_status_code = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    note = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    reviewed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_tutor_profile_reviews", x => x.id);
                    table.ForeignKey(
                        name: "fk_tutor_profile_reviews_tutor_profiles_tutor_profile_id",
                        column: x => x.tutor_profile_id,
                        principalTable: "tutor_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_tutor_profile_reviews_user_accounts_reviewer_user_id",
                        column: x => x.reviewer_user_id,
                        principalTable: "user_accounts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "districts",
                columns: table => new
                {
                    district_code = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    province_code = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    district_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_districts", x => x.district_code);
                    table.ForeignKey(
                        name: "fk_districts_provinces_province_code",
                        column: x => x.province_code,
                        principalTable: "provinces",
                        principalColumn: "province_code",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "courses",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    tutor_profile_id = table.Column<Guid>(type: "uuid", nullable: false),
                    subject_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    description = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    session_count = table.Column<int>(type: "integer", nullable: true),
                    price_per_session_vnd = table.Column<int>(type: "integer", nullable: true),
                    status_code = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    deleted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_courses", x => x.id);
                    table.ForeignKey(
                        name: "fk_courses_subjects_subject_id",
                        column: x => x.subject_id,
                        principalTable: "subjects",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_courses_tutor_profiles_tutor_profile_id",
                        column: x => x.tutor_profile_id,
                        principalTable: "tutor_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "tutor_subjects",
                columns: table => new
                {
                    tutor_profile_id = table.Column<Guid>(type: "uuid", nullable: false),
                    subject_id = table.Column<Guid>(type: "uuid", nullable: false),
                    level_description = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_tutor_subjects", x => new { x.tutor_profile_id, x.subject_id });
                    table.ForeignKey(
                        name: "fk_tutor_subjects_subjects_subject_id",
                        column: x => x.subject_id,
                        principalTable: "subjects",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_tutor_subjects_tutor_profiles_tutor_profile_id",
                        column: x => x.tutor_profile_id,
                        principalTable: "tutor_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "hire_requests",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    requester_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    tutor_profile_id = table.Column<Guid>(type: "uuid", nullable: false),
                    subject_id = table.Column<Guid>(type: "uuid", nullable: false),
                    course_id = table.Column<Guid>(type: "uuid", nullable: true),
                    start_date = table.Column<DateOnly>(type: "date", nullable: false),
                    sessions_per_week = table.Column<int>(type: "integer", nullable: false),
                    duration_minutes = table.Column<int>(type: "integer", nullable: false),
                    teaching_mode_code = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    province_code = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    district_code = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    location_detail = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    proposed_price_vnd = table.Column<int>(type: "integer", nullable: false),
                    agreed_price_vnd = table.Column<int>(type: "integer", nullable: true),
                    status_code = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    note = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    cancel_reason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    accepted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    completed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_hire_requests", x => x.id);
                    table.ForeignKey(
                        name: "fk_hire_requests_courses_course_id",
                        column: x => x.course_id,
                        principalTable: "courses",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_hire_requests_districts_district_code",
                        column: x => x.district_code,
                        principalTable: "districts",
                        principalColumn: "district_code",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_hire_requests_provinces_province_code",
                        column: x => x.province_code,
                        principalTable: "provinces",
                        principalColumn: "province_code",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_hire_requests_subjects_subject_id",
                        column: x => x.subject_id,
                        principalTable: "subjects",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_hire_requests_tutor_profiles_tutor_profile_id",
                        column: x => x.tutor_profile_id,
                        principalTable: "tutor_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_hire_requests_user_accounts_requester_user_id",
                        column: x => x.requester_user_id,
                        principalTable: "user_accounts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "conversations",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    hire_request_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    closed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_conversations", x => x.id);
                    table.ForeignKey(
                        name: "fk_conversations_hire_requests_hire_request_id",
                        column: x => x.hire_request_id,
                        principalTable: "hire_requests",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "negotiations",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    hire_request_id = table.Column<Guid>(type: "uuid", nullable: false),
                    sender_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    proposed_price_vnd = table.Column<int>(type: "integer", nullable: true),
                    note = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    response_status_code = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    responded_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_negotiations", x => x.id);
                    table.ForeignKey(
                        name: "fk_negotiations_hire_requests_hire_request_id",
                        column: x => x.hire_request_id,
                        principalTable: "hire_requests",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_negotiations_user_accounts_sender_user_id",
                        column: x => x.sender_user_id,
                        principalTable: "user_accounts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "request_schedules",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    hire_request_id = table.Column<Guid>(type: "uuid", nullable: false),
                    day_of_week = table.Column<int>(type: "integer", nullable: false),
                    start_time = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    end_time = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_request_schedules", x => x.id);
                    table.ForeignKey(
                        name: "fk_request_schedules_hire_requests_hire_request_id",
                        column: x => x.hire_request_id,
                        principalTable: "hire_requests",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "request_status_history",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    hire_request_id = table.Column<Guid>(type: "uuid", nullable: false),
                    actor_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    from_status_code = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    to_status_code = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    reason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_request_status_history", x => x.id);
                    table.ForeignKey(
                        name: "fk_request_status_history_hire_requests_hire_request_id",
                        column: x => x.hire_request_id,
                        principalTable: "hire_requests",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_request_status_history_user_accounts_actor_user_id",
                        column: x => x.actor_user_id,
                        principalTable: "user_accounts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "messages",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    conversation_id = table.Column<Guid>(type: "uuid", nullable: false),
                    sender_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    content = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                    sent_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    read_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    deleted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_messages", x => x.id);
                    table.ForeignKey(
                        name: "fk_messages_conversations_conversation_id",
                        column: x => x.conversation_id,
                        principalTable: "conversations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_messages_user_accounts_sender_user_id",
                        column: x => x.sender_user_id,
                        principalTable: "user_accounts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "negotiation_schedules",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    negotiation_id = table.Column<Guid>(type: "uuid", nullable: false),
                    day_of_week = table.Column<int>(type: "integer", nullable: false),
                    start_time = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    end_time = table.Column<TimeOnly>(type: "time without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_negotiation_schedules", x => x.id);
                    table.ForeignKey(
                        name: "fk_negotiation_schedules_negotiations_negotiation_id",
                        column: x => x.negotiation_id,
                        principalTable: "negotiations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "notifications",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    type_code = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    title = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    body = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    hire_request_id = table.Column<Guid>(type: "uuid", nullable: true),
                    message_id = table.Column<Guid>(type: "uuid", nullable: true),
                    tutor_profile_id = table.Column<Guid>(type: "uuid", nullable: true),
                    is_read = table.Column<bool>(type: "boolean", nullable: false),
                    read_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_notifications", x => x.id);
                    table.ForeignKey(
                        name: "fk_notifications_hire_requests_hire_request_id",
                        column: x => x.hire_request_id,
                        principalTable: "hire_requests",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_notifications_messages_message_id",
                        column: x => x.message_id,
                        principalTable: "messages",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_notifications_tutor_profiles_tutor_profile_id",
                        column: x => x.tutor_profile_id,
                        principalTable: "tutor_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_notifications_user_accounts_user_id",
                        column: x => x.user_id,
                        principalTable: "user_accounts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_tutor_profiles_district_code",
                table: "tutor_profiles",
                column: "district_code");

            migrationBuilder.CreateIndex(
                name: "ix_tutor_profiles_province_code",
                table: "tutor_profiles",
                column: "province_code");

            migrationBuilder.CreateIndex(
                name: "ix_articles_author_user_id",
                table: "articles",
                column: "author_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_articles_slug",
                table: "articles",
                column: "slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_availability_slots_tutor_profile_id",
                table: "availability_slots",
                column: "tutor_profile_id");

            migrationBuilder.CreateIndex(
                name: "ix_conversations_hire_request_id",
                table: "conversations",
                column: "hire_request_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_courses_subject_id",
                table: "courses",
                column: "subject_id");

            migrationBuilder.CreateIndex(
                name: "ix_courses_tutor_profile_id",
                table: "courses",
                column: "tutor_profile_id");

            migrationBuilder.CreateIndex(
                name: "ix_districts_province_code_district_name",
                table: "districts",
                columns: new[] { "province_code", "district_name" });

            migrationBuilder.CreateIndex(
                name: "ix_hire_requests_course_id",
                table: "hire_requests",
                column: "course_id");

            migrationBuilder.CreateIndex(
                name: "ix_hire_requests_district_code",
                table: "hire_requests",
                column: "district_code");

            migrationBuilder.CreateIndex(
                name: "ix_hire_requests_province_code",
                table: "hire_requests",
                column: "province_code");

            migrationBuilder.CreateIndex(
                name: "ix_hire_requests_requester_user_id",
                table: "hire_requests",
                column: "requester_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_hire_requests_subject_id",
                table: "hire_requests",
                column: "subject_id");

            migrationBuilder.CreateIndex(
                name: "ix_hire_requests_tutor_profile_id",
                table: "hire_requests",
                column: "tutor_profile_id");

            migrationBuilder.CreateIndex(
                name: "ix_messages_conversation_id",
                table: "messages",
                column: "conversation_id");

            migrationBuilder.CreateIndex(
                name: "ix_messages_sender_user_id",
                table: "messages",
                column: "sender_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_negotiation_schedules_negotiation_id",
                table: "negotiation_schedules",
                column: "negotiation_id");

            migrationBuilder.CreateIndex(
                name: "ix_negotiations_hire_request_id",
                table: "negotiations",
                column: "hire_request_id");

            migrationBuilder.CreateIndex(
                name: "ix_negotiations_sender_user_id",
                table: "negotiations",
                column: "sender_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_notifications_hire_request_id",
                table: "notifications",
                column: "hire_request_id");

            migrationBuilder.CreateIndex(
                name: "ix_notifications_message_id",
                table: "notifications",
                column: "message_id");

            migrationBuilder.CreateIndex(
                name: "ix_notifications_tutor_profile_id",
                table: "notifications",
                column: "tutor_profile_id");

            migrationBuilder.CreateIndex(
                name: "ix_notifications_user_id",
                table: "notifications",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_password_reset_tokens_token_hash",
                table: "password_reset_tokens",
                column: "token_hash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_password_reset_tokens_user_id",
                table: "password_reset_tokens",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_provinces_province_name",
                table: "provinces",
                column: "province_name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_request_schedules_hire_request_id",
                table: "request_schedules",
                column: "hire_request_id");

            migrationBuilder.CreateIndex(
                name: "ix_request_status_history_actor_user_id",
                table: "request_status_history",
                column: "actor_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_request_status_history_hire_request_id",
                table: "request_status_history",
                column: "hire_request_id");

            migrationBuilder.CreateIndex(
                name: "ix_subjects_name",
                table: "subjects",
                column: "name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_tutor_profile_reviews_reviewer_user_id",
                table: "tutor_profile_reviews",
                column: "reviewer_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_tutor_profile_reviews_tutor_profile_id",
                table: "tutor_profile_reviews",
                column: "tutor_profile_id");

            migrationBuilder.CreateIndex(
                name: "ix_tutor_subjects_subject_id",
                table: "tutor_subjects",
                column: "subject_id");

            migrationBuilder.AddForeignKey(
                name: "fk_tutor_profiles_districts_district_code",
                table: "tutor_profiles",
                column: "district_code",
                principalTable: "districts",
                principalColumn: "district_code",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "fk_tutor_profiles_provinces_province_code",
                table: "tutor_profiles",
                column: "province_code",
                principalTable: "provinces",
                principalColumn: "province_code",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_tutor_profiles_districts_district_code",
                table: "tutor_profiles");

            migrationBuilder.DropForeignKey(
                name: "fk_tutor_profiles_provinces_province_code",
                table: "tutor_profiles");

            migrationBuilder.DropTable(
                name: "articles");

            migrationBuilder.DropTable(
                name: "availability_slots");

            migrationBuilder.DropTable(
                name: "messages");

            migrationBuilder.DropTable(
                name: "negotiation_schedules");

            migrationBuilder.DropTable(
                name: "notifications");

            migrationBuilder.DropTable(
                name: "password_reset_tokens");

            migrationBuilder.DropTable(
                name: "request_schedules");

            migrationBuilder.DropTable(
                name: "request_status_history");

            migrationBuilder.DropTable(
                name: "tutor_profile_reviews");

            migrationBuilder.DropTable(
                name: "tutor_subjects");

            migrationBuilder.DropTable(
                name: "conversations");

            migrationBuilder.DropTable(
                name: "negotiations");

            migrationBuilder.DropTable(
                name: "hire_requests");

            migrationBuilder.DropTable(
                name: "courses");

            migrationBuilder.DropTable(
                name: "districts");

            migrationBuilder.DropTable(
                name: "subjects");

            migrationBuilder.DropTable(
                name: "provinces");

            migrationBuilder.DropIndex(
                name: "ix_tutor_profiles_district_code",
                table: "tutor_profiles");

            migrationBuilder.DropIndex(
                name: "ix_tutor_profiles_province_code",
                table: "tutor_profiles");

            migrationBuilder.DropColumn(
                name: "district_code",
                table: "tutor_profiles");

            migrationBuilder.DropColumn(
                name: "province_code",
                table: "tutor_profiles");
        }
    }
}
