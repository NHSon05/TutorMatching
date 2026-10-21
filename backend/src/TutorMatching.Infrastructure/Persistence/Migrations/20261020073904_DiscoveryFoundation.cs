using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TutorMatching.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class DiscoveryFoundation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "normalized_display_name",
                table: "tutor_profiles",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "version",
                table: "tutor_profiles",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateTable(
                name: "teaching_levels",
                columns: table => new
                {
                    code = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_teaching_levels", x => x.code);
                });

            migrationBuilder.CreateTable(
                name: "tutor_subject_levels",
                columns: table => new
                {
                    tutor_profile_id = table.Column<Guid>(type: "uuid", nullable: false),
                    subject_id = table.Column<Guid>(type: "uuid", nullable: false),
                    level_code = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_tutor_subject_levels", x => new { x.tutor_profile_id, x.subject_id, x.level_code });
                    table.ForeignKey(
                        name: "fk_tutor_subject_levels_teaching_levels_level_code",
                        column: x => x.level_code,
                        principalTable: "teaching_levels",
                        principalColumn: "code",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_tutor_subject_levels_tutor_subjects",
                        columns: x => new { x.tutor_profile_id, x.subject_id },
                        principalTable: "tutor_subjects",
                        principalColumns: new[] { "tutor_profile_id", "subject_id" },
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_tutor_subject_levels_level_code",
                table: "tutor_subject_levels",
                column: "level_code");

            migrationBuilder.Sql("""

UPDATE tutor_profiles SET version = gen_random_uuid();
UPDATE tutor_profiles p SET normalized_display_name = translate(lower(trim(u.full_name)), 'àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ', 'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd') FROM user_accounts u WHERE p.user_id=u.id;
INSERT INTO teaching_levels(code,name,is_active) VALUES ('PRIMARY','Tiểu học',true),('SECONDARY','THCS',true),('HIGH_SCHOOL','THPT',true),('UNIVERSITY','Đại học',true) ON CONFLICT DO NOTHING;
INSERT INTO subjects(id,name,is_active,created_at,updated_at) VALUES ('02000000-0000-0000-0000-000000000001','Toán học',true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT DO NOTHING;
INSERT INTO tutor_subjects(tutor_profile_id,subject_id,created_at)
SELECT p.id,s.id,CURRENT_TIMESTAMP FROM tutor_profiles p CROSS JOIN LATERAL jsonb_array_elements_text(p.subjects) v(value) JOIN subjects s ON lower(trim(v.value))=lower(s.name)
ON CONFLICT DO NOTHING;
INSERT INTO tutor_subject_levels(tutor_profile_id,subject_id,level_code)
SELECT DISTINCT t.tutor_profile_id,t.subject_id,CASE lower(v.value) WHEN 'primary' THEN 'PRIMARY' WHEN 'tiểu học' THEN 'PRIMARY' WHEN 'secondary' THEN 'SECONDARY' WHEN 'thcs' THEN 'SECONDARY' WHEN 'highschool' THEN 'HIGH_SCHOOL' WHEN 'thpt' THEN 'HIGH_SCHOOL' WHEN 'university' THEN 'UNIVERSITY' WHEN 'đại học' THEN 'UNIVERSITY' END
FROM tutor_subjects t JOIN tutor_profiles p ON p.id=t.tutor_profile_id CROSS JOIN LATERAL jsonb_array_elements_text(p.teaching_levels) v(value)
WHERE lower(v.value) IN ('primary','tiểu học','secondary','thcs','highschool','thpt','university','đại học') ON CONFLICT DO NOTHING;
INSERT INTO audit_events(id,action,entity_type,entity_id,created_at)
SELECT gen_random_uuid(),'DiscoveryMigrationDrafted','TutorProfile',p.id::text,CURRENT_TIMESTAMP FROM tutor_profiles p
WHERE p.status='APPROVED' AND (p.session_rate_vnd IS NULL OR p.session_rate_vnd<=0 OR NOT EXISTS(SELECT 1 FROM tutor_subject_levels t WHERE t.tutor_profile_id=p.id) OR EXISTS(SELECT 1 FROM jsonb_array_elements_text(p.subjects) v(value) WHERE NOT EXISTS(SELECT 1 FROM subjects s WHERE lower(s.name)=lower(trim(v.value)))));
UPDATE tutor_profiles p SET status='DRAFT',approved_at=NULL WHERE EXISTS(SELECT 1 FROM audit_events a WHERE a.action='DiscoveryMigrationDrafted' AND a.entity_id=p.id::text);
UPDATE courses SET status_code='HIDDEN' WHERE status_code='ACTIVE' AND (session_count IS NULL OR session_count<=0 OR price_per_session_vnd IS NULL OR price_per_session_vnd<=0);
CREATE UNIQUE INDEX IF NOT EXISTS ux_subjects_name_folded ON subjects(lower(name));
CREATE UNIQUE INDEX IF NOT EXISTS ux_levels_name_folded ON teaching_levels(lower(name));
CREATE UNIQUE INDEX IF NOT EXISTS ux_districts_name_folded ON districts(province_code,lower(district_name));
CREATE INDEX IF NOT EXISTS ix_tutor_profiles_status_rate ON tutor_profiles(status,session_rate_vnd,id);
ALTER TABLE availability_slots ADD CONSTRAINT ck_discovery_weekday CHECK (availability_type <> 'WEEKLY' OR (day_of_week BETWEEN 1 AND 7 AND start_time < end_time)) NOT VALID;
ALTER TABLE courses ADD CONSTRAINT ck_discovery_course_positive CHECK (status_code <> 'ACTIVE' OR (session_count > 0 AND session_count IS NOT NULL AND price_per_session_vnd > 0 AND price_per_session_vnd IS NOT NULL)) NOT VALID;
""");

        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            throw new NotSupportedException("Restore a reviewed backup; discovery normalization is not automatically reversible.");

        }
    }
}
