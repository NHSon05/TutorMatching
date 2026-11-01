using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TutorMatching.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class MessagingAdminReleaseFoundation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_notifications_user_id",
                table: "notifications");

            migrationBuilder.DropIndex(
                name: "ix_messages_conversation_id",
                table: "messages");

            migrationBuilder.AddColumn<Guid>(
                name: "concurrency_version",
                table: "user_accounts",
                type: "uuid",
                nullable: false,
                defaultValueSql: "gen_random_uuid()");

            migrationBuilder.AddColumn<Guid>(
                name: "client_message_id",
                table: "messages",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "version",
                table: "articles",
                type: "uuid",
                nullable: false,
                defaultValueSql: "gen_random_uuid()");

            migrationBuilder.Sql("UPDATE user_accounts SET concurrency_version = gen_random_uuid() WHERE concurrency_version = '00000000-0000-0000-0000-000000000000';");
            migrationBuilder.Sql("UPDATE articles SET version = gen_random_uuid() WHERE version = '00000000-0000-0000-0000-000000000000';");

            migrationBuilder.CreateTable(
                name: "message_notification_outboxes",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    message_id = table.Column<Guid>(type: "uuid", nullable: false),
                    recipient_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    attempt_count = table.Column<int>(type: "integer", nullable: false),
                    next_attempt_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    delivered_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_message_notification_outboxes", x => x.id);
                    table.ForeignKey(
                        name: "fk_message_notification_outboxes_messages_message_id",
                        column: x => x.message_id,
                        principalTable: "messages",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_message_notification_outboxes_user_accounts_recipient_user_id",
                        column: x => x.recipient_user_id,
                        principalTable: "user_accounts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_notifications_user_id_created_at_id",
                table: "notifications",
                columns: new[] { "user_id", "created_at", "id" },
                filter: "\"is_read\" = false");

            migrationBuilder.CreateIndex(
                name: "ix_notifications_user_id_message_id",
                table: "notifications",
                columns: new[] { "user_id", "message_id" },
                unique: true,
                filter: "\"message_id\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "ix_messages_conversation_id_sender_user_id_client_message_id",
                table: "messages",
                columns: new[] { "conversation_id", "sender_user_id", "client_message_id" },
                unique: true,
                filter: "\"client_message_id\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "ix_messages_conversation_id_sender_user_id_read_at",
                table: "messages",
                columns: new[] { "conversation_id", "sender_user_id", "read_at" });

            migrationBuilder.CreateIndex(
                name: "ix_messages_conversation_id_sent_at_id",
                table: "messages",
                columns: new[] { "conversation_id", "sent_at", "id" });

            migrationBuilder.CreateIndex(
                name: "ix_message_notification_outboxes_message_id_recipient_user_id",
                table: "message_notification_outboxes",
                columns: new[] { "message_id", "recipient_user_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_message_notification_outboxes_recipient_user_id",
                table: "message_notification_outboxes",
                column: "recipient_user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "message_notification_outboxes");

            migrationBuilder.DropIndex(
                name: "ix_notifications_user_id_created_at_id",
                table: "notifications");

            migrationBuilder.DropIndex(
                name: "ix_notifications_user_id_message_id",
                table: "notifications");

            migrationBuilder.DropIndex(
                name: "ix_messages_conversation_id_sender_user_id_client_message_id",
                table: "messages");

            migrationBuilder.DropIndex(
                name: "ix_messages_conversation_id_sender_user_id_read_at",
                table: "messages");

            migrationBuilder.DropIndex(
                name: "ix_messages_conversation_id_sent_at_id",
                table: "messages");

            migrationBuilder.DropColumn(
                name: "concurrency_version",
                table: "user_accounts");

            migrationBuilder.DropColumn(
                name: "client_message_id",
                table: "messages");

            migrationBuilder.DropColumn(
                name: "version",
                table: "articles");

            migrationBuilder.CreateIndex(
                name: "ix_notifications_user_id",
                table: "notifications",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_messages_conversation_id",
                table: "messages",
                column: "conversation_id");
        }
    }
}
