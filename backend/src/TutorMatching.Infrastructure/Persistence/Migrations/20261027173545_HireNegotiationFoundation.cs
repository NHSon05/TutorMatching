using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TutorMatching.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class HireNegotiationFoundation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Fail before DDL if historical agreement facts cannot be recovered without guessing.
            migrationBuilder.Sql("""
                LOCK TABLE hire_requests, negotiations, request_status_history, request_schedules, negotiation_schedules IN ACCESS EXCLUSIVE MODE;
                DO $$ BEGIN
                  IF EXISTS (SELECT 1 FROM hire_requests WHERE status_code IN ('ACCEPTED','COMPLETED') OR accepted_at IS NOT NULL OR agreed_price_vnd IS NOT NULL)
                    OR EXISTS (SELECT 1 FROM request_status_history WHERE from_status_code='ACCEPTED' OR to_status_code IN ('ACCEPTED','COMPLETED'))
                    OR EXISTS (SELECT 1 FROM negotiations WHERE response_status_code='ACCEPTED') THEN
                    RAISE EXCEPTION 'HIRE_LEGACY_REVIEW_REQUIRED: accepted history needs verified price, schedule, location and actor snapshots before upgrade';
                  END IF;
                  IF EXISTS (SELECT 1 FROM hire_requests r WHERE NOT EXISTS (SELECT 1 FROM request_schedules s WHERE s.hire_request_id=r.id)
                      OR sessions_per_week NOT BETWEEN 1 AND 21 OR duration_minutes NOT BETWEEN 30 AND 240 OR proposed_price_vnd <= 0
                      OR teaching_mode_code NOT IN ('ONLINE','OFFLINE','HYBRID')
                      OR (teaching_mode_code IN ('OFFLINE','HYBRID') AND (province_code IS NULL OR district_code IS NULL))
                      OR status_code NOT IN ('PENDING','NEGOTIATING','REJECTED','CANCELLED'))
                    OR EXISTS (SELECT 1 FROM request_schedules WHERE day_of_week NOT BETWEEN 1 AND 7 OR start_time >= end_time)
                    OR EXISTS (SELECT 1 FROM negotiation_schedules WHERE day_of_week NOT BETWEEN 1 AND 7 OR start_time >= end_time)
                    OR EXISTS (SELECT 1 FROM negotiations WHERE proposed_price_vnd <= 0) THEN
                    RAISE EXCEPTION 'HIRE_LEGACY_REVIEW_REQUIRED: invalid or incomplete original terms; repair from verified records before upgrade';
                  END IF;
                END $$;
                """);


            migrationBuilder.DropForeignKey(
                name: "fk_request_status_history_user_accounts_actor_user_id",
                table: "request_status_history");

            migrationBuilder.DropIndex(
                name: "ix_request_status_history_hire_request_id",
                table: "request_status_history");

            migrationBuilder.DropIndex(
                name: "ix_negotiations_hire_request_id",
                table: "negotiations");

            migrationBuilder.DropIndex(
                name: "ix_hire_requests_requester_user_id",
                table: "hire_requests");

            migrationBuilder.DropIndex(
                name: "ix_hire_requests_tutor_profile_id",
                table: "hire_requests");

            migrationBuilder.AddColumn<bool>(
                name: "is_legacy",
                table: "request_status_history",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "sequence",
                table: "request_status_history",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "is_legacy",
                table: "negotiations",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "sequence",
                table: "negotiations",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "terms",
                table: "negotiations",
                type: "jsonb",
                nullable: false,
                defaultValue: "{}");

            migrationBuilder.AddColumn<string>(
                name: "final_agreement",
                table: "hire_requests",
                type: "jsonb",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "initial_terms",
                table: "hire_requests",
                type: "jsonb",
                nullable: false,
                defaultValue: "{}");

            migrationBuilder.AddColumn<bool>(
                name: "is_legacy",
                table: "hire_requests",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "latest_proposal_sequence",
                table: "hire_requests",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "listed_price_vnd",
                table: "hire_requests",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "next_event_sequence",
                table: "hire_requests",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Guid>(
                name: "version",
                table: "hire_requests",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateTable(
                name: "hire_create_operations",
                columns: table => new
                {
                    learner_id = table.Column<Guid>(type: "uuid", nullable: false),
                    idempotency_key = table.Column<Guid>(type: "uuid", nullable: false),
                    request_id = table.Column<Guid>(type: "uuid", nullable: false),
                    payload_fingerprint = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    outcome = table.Column<string>(type: "jsonb", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_hire_create_operations", x => new { x.learner_id, x.idempotency_key });
                    table.CheckConstraint("ck_hire_operation_fingerprint", "payload_fingerprint ~ '^[0-9a-f]{64}$'");
                    table.ForeignKey(
                        name: "fk_hire_create_operations_hire_requests_request_id",
                        column: x => x.request_id,
                        principalTable: "hire_requests",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_hire_create_operations_user_accounts_learner_id",
                        column: x => x.learner_id,
                        principalTable: "user_accounts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.Sql("""
                UPDATE hire_requests SET version=gen_random_uuid(), is_legacy=true, next_event_sequence=1;
                WITH ranked AS (SELECT id, row_number() OVER (PARTITION BY hire_request_id ORDER BY created_at,id)::int AS n FROM request_status_history)
                UPDATE request_status_history e SET sequence=ranked.n,is_legacy=true FROM ranked WHERE e.id=ranked.id;
                WITH ranked AS (SELECT id, row_number() OVER (PARTITION BY hire_request_id ORDER BY created_at,id)::int AS n FROM negotiations)
                UPDATE negotiations e SET sequence=ranked.n,is_legacy=true FROM ranked WHERE e.id=ranked.id;
                DO $$ DECLARE r record; n record; effective jsonb; windows jsonb; BEGIN
                  FOR r IN SELECT * FROM hire_requests LOOP
                    SELECT jsonb_agg(jsonb_build_object('dayOfWeek',day_of_week,'startTime',to_char(start_time,'HH24:MI:SS'),'endTime',to_char(end_time,'HH24:MI:SS')) ORDER BY day_of_week,start_time,id)
                      INTO windows FROM request_schedules WHERE hire_request_id=r.id;
                    effective := jsonb_build_object('startDate',r.start_date,'sessionsPerWeek',r.sessions_per_week,'durationMinutes',r.duration_minutes,
                      'teachingMode',r.teaching_mode_code,'provinceCode',r.province_code,'districtCode',r.district_code,'locationDetail',r.location_detail,
                      'priceVnd',r.proposed_price_vnd,'schedules',windows);
                    UPDATE hire_requests SET initial_terms=effective,
                      next_event_sequence=1+(SELECT COALESCE(MAX(sequence),0) FROM request_status_history WHERE hire_request_id=r.id),
                      latest_proposal_sequence=(SELECT COALESCE(MAX(sequence),0) FROM negotiations WHERE hire_request_id=r.id) WHERE id=r.id;
                    FOR n IN SELECT * FROM negotiations WHERE hire_request_id=r.id ORDER BY sequence LOOP
                      IF n.proposed_price_vnd IS NOT NULL THEN effective := jsonb_set(effective,'{priceVnd}',to_jsonb(n.proposed_price_vnd)); END IF;
                      SELECT jsonb_agg(jsonb_build_object('dayOfWeek',day_of_week,'startTime',to_char(start_time,'HH24:MI:SS'),'endTime',to_char(end_time,'HH24:MI:SS')) ORDER BY day_of_week,start_time,id)
                        INTO windows FROM negotiation_schedules WHERE negotiation_id=n.id;
                      IF windows IS NOT NULL THEN effective := jsonb_set(effective,'{schedules}',windows); END IF;
                      UPDATE negotiations SET terms=effective WHERE id=n.id;
                    END LOOP;
                  END LOOP;
                END $$;
                ALTER TABLE hire_requests ALTER COLUMN initial_terms DROP DEFAULT, ALTER COLUMN version DROP DEFAULT;
                ALTER TABLE negotiations ALTER COLUMN terms DROP DEFAULT;
                """);

            migrationBuilder.CreateIndex(
                name: "ix_request_status_history_hire_request_id_sequence",
                table: "request_status_history",
                columns: new[] { "hire_request_id", "sequence" },
                unique: true);

            migrationBuilder.AddCheckConstraint(
                name: "ck_hire_event_sequence_actor",
                table: "request_status_history",
                sql: "sequence > 0 AND (is_legacy OR actor_user_id IS NOT NULL)");

            migrationBuilder.AddCheckConstraint(
                name: "ck_requestschedule_window",
                table: "request_schedules",
                sql: "day_of_week BETWEEN 1 AND 7 AND start_time < end_time");

            migrationBuilder.CreateIndex(
                name: "ix_negotiations_hire_request_id_sequence",
                table: "negotiations",
                columns: new[] { "hire_request_id", "sequence" },
                unique: true);

            migrationBuilder.AddCheckConstraint(
                name: "ck_negotiation_sequence",
                table: "negotiations",
                sql: "sequence > 0 AND (proposed_price_vnd IS NULL OR proposed_price_vnd > 0)");

            migrationBuilder.AddCheckConstraint(
                name: "ck_negotiationschedule_window",
                table: "negotiation_schedules",
                sql: "day_of_week BETWEEN 1 AND 7 AND start_time < end_time");

            migrationBuilder.CreateIndex(
                name: "ix_hire_requests_requester_user_id_status_code_created_at_id",
                table: "hire_requests",
                columns: new[] { "requester_user_id", "status_code", "created_at", "id" });

            migrationBuilder.CreateIndex(
                name: "ix_hire_requests_tutor_profile_id_status_code_created_at_id",
                table: "hire_requests",
                columns: new[] { "tutor_profile_id", "status_code", "created_at", "id" });

            migrationBuilder.AddCheckConstraint(
                name: "ck_hire_request_mode",
                table: "hire_requests",
                sql: "teaching_mode_code IN ('ONLINE','OFFLINE','HYBRID')");

            migrationBuilder.AddCheckConstraint(
                name: "ck_hire_request_snapshot",
                table: "hire_requests",
                sql: "initial_terms IS NOT NULL AND (is_legacy OR listed_price_vnd IS NOT NULL) AND (status_code NOT IN ('ACCEPTED','COMPLETED') OR final_agreement IS NOT NULL)");

            migrationBuilder.AddCheckConstraint(
                name: "ck_hire_request_status",
                table: "hire_requests",
                sql: "status_code IN ('PENDING','NEGOTIATING','ACCEPTED','REJECTED','CANCELLED','COMPLETED')");

            migrationBuilder.AddCheckConstraint(
                name: "ck_hire_request_values",
                table: "hire_requests",
                sql: "sessions_per_week BETWEEN 1 AND 21 AND duration_minutes BETWEEN 30 AND 240 AND proposed_price_vnd > 0 AND (listed_price_vnd IS NULL OR listed_price_vnd > 0) AND latest_proposal_sequence >= 0 AND next_event_sequence > 0");

            migrationBuilder.CreateIndex(
                name: "ix_hire_create_operations_request_id",
                table: "hire_create_operations",
                column: "request_id",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "fk_request_status_history_user_accounts_actor_user_id",
                table: "request_status_history",
                column: "actor_user_id",
                principalTable: "user_accounts",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DO $$ BEGIN
                  IF EXISTS (SELECT 1 FROM hire_create_operations)
                    OR EXISTS (SELECT 1 FROM hire_requests WHERE NOT is_legacy OR final_agreement IS NOT NULL)
                    OR EXISTS (SELECT 1 FROM negotiations WHERE NOT is_legacy)
                    OR EXISTS (SELECT 1 FROM request_status_history WHERE NOT is_legacy) THEN
                    RAISE EXCEPTION 'HIRE_DOWNGRADE_BLOCKED: new hiring data cannot be represented by the old schema';
                  END IF;
                END $$;
                """);
            migrationBuilder.DropForeignKey(
                name: "fk_request_status_history_user_accounts_actor_user_id",
                table: "request_status_history");

            migrationBuilder.DropTable(
                name: "hire_create_operations");

            migrationBuilder.DropIndex(
                name: "ix_request_status_history_hire_request_id_sequence",
                table: "request_status_history");

            migrationBuilder.DropCheckConstraint(
                name: "ck_hire_event_sequence_actor",
                table: "request_status_history");

            migrationBuilder.DropCheckConstraint(
                name: "ck_requestschedule_window",
                table: "request_schedules");

            migrationBuilder.DropIndex(
                name: "ix_negotiations_hire_request_id_sequence",
                table: "negotiations");

            migrationBuilder.DropCheckConstraint(
                name: "ck_negotiation_sequence",
                table: "negotiations");

            migrationBuilder.DropCheckConstraint(
                name: "ck_negotiationschedule_window",
                table: "negotiation_schedules");

            migrationBuilder.DropIndex(
                name: "ix_hire_requests_requester_user_id_status_code_created_at_id",
                table: "hire_requests");

            migrationBuilder.DropIndex(
                name: "ix_hire_requests_tutor_profile_id_status_code_created_at_id",
                table: "hire_requests");

            migrationBuilder.DropCheckConstraint(
                name: "ck_hire_request_mode",
                table: "hire_requests");

            migrationBuilder.DropCheckConstraint(
                name: "ck_hire_request_snapshot",
                table: "hire_requests");

            migrationBuilder.DropCheckConstraint(
                name: "ck_hire_request_status",
                table: "hire_requests");

            migrationBuilder.DropCheckConstraint(
                name: "ck_hire_request_values",
                table: "hire_requests");

            migrationBuilder.DropColumn(
                name: "is_legacy",
                table: "request_status_history");

            migrationBuilder.DropColumn(
                name: "sequence",
                table: "request_status_history");

            migrationBuilder.DropColumn(
                name: "is_legacy",
                table: "negotiations");

            migrationBuilder.DropColumn(
                name: "sequence",
                table: "negotiations");

            migrationBuilder.DropColumn(
                name: "terms",
                table: "negotiations");

            migrationBuilder.DropColumn(
                name: "final_agreement",
                table: "hire_requests");

            migrationBuilder.DropColumn(
                name: "initial_terms",
                table: "hire_requests");

            migrationBuilder.DropColumn(
                name: "is_legacy",
                table: "hire_requests");

            migrationBuilder.DropColumn(
                name: "latest_proposal_sequence",
                table: "hire_requests");

            migrationBuilder.DropColumn(
                name: "listed_price_vnd",
                table: "hire_requests");

            migrationBuilder.DropColumn(
                name: "next_event_sequence",
                table: "hire_requests");

            migrationBuilder.DropColumn(
                name: "version",
                table: "hire_requests");

            migrationBuilder.CreateIndex(
                name: "ix_request_status_history_hire_request_id",
                table: "request_status_history",
                column: "hire_request_id");

            migrationBuilder.CreateIndex(
                name: "ix_negotiations_hire_request_id",
                table: "negotiations",
                column: "hire_request_id");

            migrationBuilder.CreateIndex(
                name: "ix_hire_requests_requester_user_id",
                table: "hire_requests",
                column: "requester_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_hire_requests_tutor_profile_id",
                table: "hire_requests",
                column: "tutor_profile_id");

            migrationBuilder.AddForeignKey(
                name: "fk_request_status_history_user_accounts_actor_user_id",
                table: "request_status_history",
                column: "actor_user_id",
                principalTable: "user_accounts",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
