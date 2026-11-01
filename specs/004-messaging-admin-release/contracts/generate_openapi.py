"""Encode api.md as OpenAPI 3.1; run from any directory with Python 3 (stdlib only)."""
import json
from pathlib import Path


def ref(name):
    return {"$ref": f"#/components/schemas/{name}"}


def string(**constraints):
    return {"type": "string", **constraints}


def nullable(schema):
    if "type" in schema:
        return {**schema, "type": [schema["type"], "null"]}
    return {"oneOf": [schema, {"type": "null"}]}


def obj(properties, optional=()):
    return {"type": "object", "additionalProperties": False, "properties": properties,
            "required": [key for key in properties if key not in optional]}


def array(items, **constraints):
    return {"type": "array", "items": items, **constraints}


def enum(*values):
    return string(enum=list(values))


def page(item, **extra):
    return obj({"items": array(ref(item)), "nextCursor": nullable(string()), **extra})


def parameter(name, schema, location="query", description=None):
    value = {"name": name, "in": location, "required": location == "path", "schema": schema}
    if description:
        value["description"] = description
    return value


uuid = string(format="uuid")
nonempty_uuid = {**uuid, "not": {"const": "00000000-0000-0000-0000-000000000000"}}
utc = string(format="date-time", description="ISO 8601 UTC timestamp.")
count = {"type": "integer", "minimum": 0}
boolean = {"type": "boolean"}
confirmed = {"type": "boolean", "const": True}
text = string(minLength=1, pattern=r"\S")
roles = ["LEARNER", "TUTOR", "ADMIN"]
profile_statuses = ["DRAFT", "PENDING_REVIEW", "APPROVED", "REJECTED"]
hire_statuses = ["PENDING", "NEGOTIATING", "ACCEPTED", "REJECTED", "CANCELLED", "COMPLETED"]
notification_types = ["TUTOR_PROFILE_REVIEWED", "HIRE_REQUEST_CREATED", "HIRE_REQUEST_PROPOSED",
                      "HIRE_REQUEST_ACCEPTED", "HIRE_REQUEST_REJECTED", "HIRE_REQUEST_CANCELLED",
                      "HIRE_REQUEST_COMPLETED", "MESSAGE_CREATED"]
article_fields = {"title": {**text, "maxLength": 256},
                  "slug": string(minLength=1, maxLength=256, pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"),
                  "summary": nullable(string(maxLength=1000)),
                  "content": {**text, "maxLength": 50000, "description": "Plain text; never render as HTML."}}
article_summary = {"id": uuid, "title": article_fields["title"], "slug": article_fields["slug"],
                   "summary": article_fields["summary"], "publishedAt": utc, "createdAt": utc, "updatedAt": utc}
catalog_fields = {"code": string(minLength=1, maxLength=64, description="Subjects use UUID codes; other kinds at most 32 characters."),
                  "name": {**text, "maxLength": 100}, "isActive": boolean,
                  "provinceCode": nullable(string(maxLength=32))}
admin_user = {"id": uuid, "fullName": string(), "email": string(format="email"),
              "role": ref("AccountRole"), "status": ref("AccountStatus"),
              "tutorProfileId": nullable(uuid), "tutorProfileStatus": nullable(ref("TutorProfileStatus")), "version": uuid}
monitor_summary = {"id": uuid, "status": ref("HireRequestStatus"), "learner": ref("Identity"),
                   "tutor": ref("Identity"), "subject": ref("NamedSubject"), "createdAt": utc}

schemas = {
    "AccountRole": enum(*roles), "AccountStatus": enum("ACTIVE", "LOCKED", "INACTIVE"),
    "TutorProfileStatus": enum(*profile_statuses), "HireRequestStatus": enum(*hire_statuses),
    "ArticleStatus": enum("DRAFT", "PUBLISHED", "HIDDEN"), "NotificationType": enum(*notification_types),
    "Identity": obj({"id": uuid, "displayName": string()}),
    "NamedSubject": obj({"id": uuid, "name": string()}),
    "Conversation": obj({"id": uuid, "hireRequestId": uuid, "requestStatus": ref("HireRequestStatus"),
                         "otherParticipant": ref("Identity"), "createdAt": utc, "closedAt": nullable(utc),
                         "unreadCount": count, "canSend": boolean}),
    "ConversationPage": page("Conversation"),
    "Message": obj({"id": uuid, "conversationId": uuid, "sender": ref("Identity"),
                    "content": {**text, "maxLength": 4000, "x-maxUtf16Length": 4000},
                    "sentAt": utc, "readAt": nullable(utc), "clientMessageId": nullable(uuid)}),
    "MessagePage": page("Message"),
    "SendMessage": obj({"clientMessageId": nonempty_uuid, "content": {
        **text, "maxLength": 4000, "x-maxUtf16Length": 4000,
        "description": "Trim before validation and replay comparison; 1–4000 UTF-16 code units. JSON Schema maxLength counts Unicode code points; server must additionally enforce UTF-16 length."}}),
    "MarkMessagesRead": obj({"messageIds": array(nonempty_uuid, minItems=1, maxItems=100)}),
    "MessagesReadResult": obj({"readAt": utc, "changedCount": count}),
    "Notification": obj({"id": uuid, "type": ref("NotificationType"), "title": string(),
                         "body": nullable(string(description="Owner-only text; never log or audit.")),
                         "createdAt": utc, "isRead": boolean, "readAt": nullable(utc)}, optional=("body",)),
    "NotificationPage": page("Notification", unreadCount=count, readAllBoundary=string(minLength=1,
        description="Opaque server-issued owner-bound initial snapshot token; do not construct client-side.")),
    "UnreadNotificationCount": obj({"unreadCount": count, "asOf": utc}),
    "ReadAllNotifications": obj({"boundary": string(minLength=1)}),
    "ReadAllNotificationsResult": obj({"changedCount": count, "unreadCount": count}),
    "NotificationTarget": obj({"kind": enum("HIRE_REQUEST", "TUTOR_PROFILE", "CONVERSATION"), "id": uuid,
                               "hireRequestId": uuid}, optional=("hireRequestId",)),
    "OpenNotificationResult": obj({"notification": ref("Notification"),
                                   "target": nullable(ref("NotificationTarget")), "unavailable": boolean}),
    "AdminUser": obj(admin_user),
    "AdminUsersPage": obj({"items": array(ref("AdminUser")), "totalCount": count,
                           "page": {"type": "integer", "minimum": 1}, "pageSize": {"type": "integer", "minimum": 1, "maximum": 100}}),
    "UpdateUserStatus": obj({"expectedVersion": nonempty_uuid, "confirmed": confirmed, "status": enum("ACTIVE", "LOCKED")}),
    "CreateArticle": obj(article_fields, optional=("summary",)),
    "UpdateArticle": obj({"expectedVersion": nonempty_uuid, **article_fields}, optional=("summary",)),
    "ConfirmedVersion": obj({"expectedVersion": nonempty_uuid, "confirmed": confirmed}),
    "Article": obj({"id": uuid, "authorId": uuid, **article_fields, "status": ref("ArticleStatus"),
                    "publishedAt": nullable(utc), "createdAt": utc, "updatedAt": utc, "version": uuid}, optional=("summary",)),
    "ArticlePage": page("Article"),
    "PublicArticleSummary": obj(article_summary, optional=("summary",)),
    "PublicArticle": obj({**article_summary, "content": article_fields["content"]}, optional=("summary",)),
    "PublicArticlePage": page("PublicArticleSummary"),
    "CatalogKind": enum("subjects", "provinces", "districts", "teaching-levels"),
    "AdminCatalogItem": obj({**catalog_fields, "version": uuid}),
    "CreateCatalogItem": obj(catalog_fields, optional=("provinceCode",)),
    "UpdateCatalogItem": {**obj({**catalog_fields, "expectedVersion": nonempty_uuid, "confirmed": confirmed}, optional=("confirmed", "provinceCode")),
                          "if": {"properties": {"isActive": {"const": False}}, "required": ["isActive"]},
                          "then": {"required": ["confirmed"]}},
    "Schedule": obj({"dayOfWeek": {"type": "integer", "minimum": 1, "maximum": 7},
                     "startTime": string(pattern="^([01][0-9]|2[0-3]):[0-5][0-9]$"),
                     "endTime": string(pattern="^([01][0-9]|2[0-3]):[0-5][0-9]$")}),
    "OperationalTerms": obj({"startDate": string(format="date"), "sessionsPerWeek": {"type": "integer", "minimum": 1, "maximum": 21},
                             "durationMinutes": {"type": "integer", "minimum": 30, "maximum": 240},
                             "teachingMode": enum("ONLINE", "OFFLINE", "HYBRID"),
                             "priceVnd": {"type": "integer", "minimum": 1, "maximum": 2147483647},
                             "schedules": array(ref("Schedule"), minItems=1, maxItems=147)}),
    "AdminHireRequestSummary": obj(monitor_summary),
    "AdminHireRequest": obj({**monitor_summary, "initialTerms": ref("OperationalTerms"),
                             "currentTerms": ref("OperationalTerms"), "finalAgreement": nullable(ref("OperationalTerms"))}),
    "AdminHireRequestPage": page("AdminHireRequestSummary"),
    "UsersByRole": obj({key: count for key in roles}),
    "TutorProfilesByStatus": obj({key: count for key in profile_statuses}),
    "HireRequestsByStatus": obj({key: count for key in hire_statuses}),
    "DashboardSnapshot": obj({"asOf": utc, "usersByRole": ref("UsersByRole"),
                              "tutorProfilesByStatus": ref("TutorProfilesByStatus"), "hireRequestsByStatus": ref("HireRequestsByStatus")}),
    "AuditEvent": obj({"id": uuid, "actorId": nullable(uuid), "action": string(maxLength=100), "entityType": string(maxLength=100),
                       "entityId": nullable(string(maxLength=200, description="UUID text or catalog code, matching the existing audit store.")),
                       "createdAt": utc}, optional=("actorId", "entityId")),
    "AuditPage": page("AuditEvent"),
    "ProblemDetails": obj({"type": string(), "title": string(), "status": {"type": "integer", "minimum": 400, "maximum": 599},
                           "detail": nullable(string()), "instance": nullable(string()), "traceId": string(), "code": string(),
                           "errors": {"type": "object", "additionalProperties": array(string())}},
                          optional=("type", "detail", "instance", "traceId", "code", "errors")),
}

no_store = {"Cache-Control": {"description": "Private response must not be cached.", "schema": {"type": "string", "const": "no-store"}}}
error_descriptions = {400: "Malformed body/parameters/cursor. Existing middleware also uses 400 for invalid CSRF (see x-contract-issues).",
                      401: "Unauthenticated, invalid/revoked session or locked account.",
                      403: "Wrong role or forbidden operation; planning api.md also lists CSRF here.",
                      404: "Missing or inaccessible resource; no ownership enumeration.",
                      409: "Stale version/state, duplicate normalized identity/slug, or changed idempotent replay payload.",
                      422: "Semantic validation failure with field errors when available.",
                      429: "Rate limit exceeded."}
responses = {f"Error{code}": {"description": description, "headers": no_store,
              "content": {"application/problem+json": {"schema": ref("ProblemDetails")}}}
             for code, description in error_descriptions.items()}
cursor_parameters = [parameter("cursor", string(), description="Opaque cursor binds owner/query filters, initial upper boundary and last (time,id)."),
                     parameter("pageSize", {"type": "integer", "minimum": 1, "maximum": 100, "default": 20})]
paths = {}


def operation(method, path, operation_id, response, *, request=None, parameters=(), public=False,
              status=200, description="", replay=False):
    parameters = list(parameters)
    for name in ("id", "slug", "kind", "code"):
        if "{" + name + "}" in path:
            schema = {"id": uuid, "slug": article_fields["slug"], "kind": ref("CatalogKind"), "code": catalog_fields["code"]}[name]
            parameters.insert(0, parameter(name, schema, "path"))
    success = {"description": "Success", "content": {"application/json": {"schema": ref(response) if isinstance(response, str) else response}}}
    if not public:
        success["headers"] = no_store
    op_responses = {str(status): success}
    if replay:
        op_responses["200"] = {**success, "description": "Identical clientMessageId/content replay returns the original committed message."}
    errors = [400, 404, 429] if public else ([400, 401, 403, 404, 429] if method == "get" else list(error_descriptions))
    op_responses.update({str(code): {"$ref": f"#/components/responses/Error{code}"} for code in errors})
    security = [] if public else [{"cookieAuth": [], **({"csrfHeader": [], "csrfCookie": []} if method != "get" else {})}]
    op = {"operationId": operation_id, "summary": operation_id, "description": description,
          "tags": ["Articles" if public else ("Administration" if path.startswith("/admin") or path == "/users" else path.split('/')[1].title())],
          "security": security, "responses": op_responses}
    if parameters:
        op["parameters"] = parameters
    if request:
        op["requestBody"] = {"required": True, "content": {"application/json": {"schema": ref(request)}}}
    if not public:
        op["x-authorization"] = "ADMIN, active account" if path.startswith("/admin") or path == "/users" else (
            "Active LEARNER/TUTOR request participant; ADMIN has no override; outsider 404" if path.startswith("/conversations") else "Active authenticated notification owner; outsider 404")
    paths.setdefault(path, {})[method] = op


operation("get", "/conversations", "GetConversations", "ConversationPage", parameters=cursor_parameters,
          description="Participant-scoped, ordered (createdAt,id) DESC. No arbitrary conversation creation.")
operation("get", "/conversations/{id}", "GetConversation", "Conversation", description="Recheck membership; canSend derives from current request/account state.")
operation("get", "/conversations/{id}/messages", "GetConversationMessages", "MessagePage", parameters=cursor_parameters,
          description="Stable (sentAt,id) DESC keyset pages; client displays chronological order and reconciles every missed page after reconnect.")
operation("post", "/conversations/{id}/messages", "SendMessage", "Message", request="SendMessage", status=201, replay=True,
          description="Commit message and notification outbox intent atomically. Replay key is (conversation,sender,clientMessageId); same canonical content returns200, mismatch409. Worker failure does not roll back message. Post-commit events only.")
operation("post", "/conversations/{id}/read", "MarkMessagesRead", "MessagesReadResult", request="MarkMessagesRead",
          description="Only caller-received IDs in this conversation; ignore missing/sender-owned IDs. Preserve first ReadAt on retries; publish hint after commit.")
operation("get", "/notifications", "GetNotifications", "NotificationPage", parameters=[parameter("unreadOnly", {"type": "boolean", "default": False}), *cursor_parameters],
          description="Owner-only newest (createdAt,id) DESC; unreadCount and readAllBoundary from initial snapshot.")
operation("get", "/notifications/unread-count", "GetUnreadNotificationCount", "UnreadNotificationCount")
operation("post", "/notifications/{id}/read", "MarkNotificationRead", "Notification", description="Empty body; owner-only; preserve first ReadAt.")
operation("post", "/notifications/read-all", "MarkAllNotificationsRead", "ReadAllNotificationsResult", request="ReadAllNotifications",
          description="Validate owner-bound snapshot token; change only unread items at or before its boundary. Later arrivals and existing ReadAt remain untouched.")
operation("post", "/notifications/{id}/open", "OpenNotification", "OpenNotificationResult",
          description="Empty body. Mark owned item read; recheck current target existence/authorization. Unavailable returns200 with target:null and unavailable:true. No arbitrary redirect URL.")
user_parameters = [parameter("page", {"type": "integer", "minimum": 1, "maximum": 1000000, "default": 1}), cursor_parameters[1],
                   parameter("q", string(maxLength=100)), parameter("role", ref("AccountRole")), parameter("status", enum("ACTIVE", "LOCKED"))]
for path, name in [("/admin/users", "GetAdminUsers"), ("/users", "GetAdminUsersCompatibilityAlias")]:
    operation("get", path, name, "AdminUsersPage", parameters=user_parameters,
              description="Existing numbered pagination and identity fields retained; deterministic order. Email is restricted to authorized account administration.")
operation("get", "/admin/users/{id}", "GetAdminUser", "AdminUser", description="Safe identity and tutor profile ID/status summary plus version; never tokens, password or stamps.")
operation("post", "/admin/users/{id}/status", "UpdateUserStatus", "AdminUser", request="UpdateUserStatus",
          description="Reject self-lock/invalid source state/unusable admin access. Account, session revocation and audit are atomic; rotate version and stamp on lock. Unlock never revives old sessions. Stale version409.")
operation("get", "/admin/articles", "GetAdminArticles", "ArticlePage", parameters=[parameter("status", ref("ArticleStatus")), *cursor_parameters])
operation("post", "/admin/articles", "CreateArticle", "Article", request="CreateArticle", status=201, description="Create DRAFT with server-derived author; slug collision409; transactional audit. Create has no prior version.")
operation("get", "/admin/articles/{id}", "GetAdminArticle", "Article")
operation("put", "/admin/articles/{id}", "UpdateArticle", "Article", request="UpdateArticle", description="Compare version, rotate on change and record audit atomically; no publication state changes through edit.")
for action in ("publish", "hide"):
    operation("post", f"/admin/articles/{{id}}/{action}", action.title() + "Article", "Article", request="ConfirmedVersion",
              description="Explicit confirmation and expectedVersion; actual change rotates version and writes audit atomically. Same terminal state may no-op only at matching version.")
operation("get", "/articles", "GetPublishedArticles", "PublicArticlePage", public=True, parameters=cursor_parameters,
          description="Published-only summaries, without content, admin version or private author data.")
operation("get", "/articles/{slug}", "GetPublishedArticle", "PublicArticle", public=True, description="Draft/hidden/missing slug404; plain-text published content only.")
operation("get", "/admin/hire-requests", "GetAdminHireRequests", "AdminHireRequestPage",
          parameters=[parameter("status", ref("HireRequestStatus")), parameter("learnerId", uuid), parameter("tutorId", uuid), *cursor_parameters])
operation("get", "/admin/hire-requests/{id}", "GetAdminHireRequest", "AdminHireRequest",
          description="Read-only operational summary and frozen terms. No exact location, message bodies, private notes or mutation/action controls.")
operation("get", "/admin/catalog/{kind}", "GetAdminCatalog", array(ref("AdminCatalogItem")), description="Include inactive values and version; public catalog DTO remains unchanged.")
operation("post", "/admin/catalog/{kind}", "CreateAdminCatalogItem", "AdminCatalogItem", request="CreateCatalogItem",
          description="Retains existing 200 success and kind/code vocabulary. No prior expectedVersion on create. Duplicate normalized identity409; transactional audit.")
operation("put", "/admin/catalog/{kind}/{code}", "UpdateAdminCatalogItem", "AdminCatalogItem", request="UpdateCatalogItem",
          description="Body code must equal path code. Compare version and rotate on change. isActive:false requires confirmed:true; soft deactivation preserves references; transactional audit.")
operation("get", "/admin/dashboard", "GetAdminDashboard", "DashboardSnapshot",
          description="One consistent database snapshot; every canonical role/profile/request status is present including zeros. No fabricated trends.")
operation("get", "/admin/audit", "GetAdminAudit", "AuditPage", parameters=[*cursor_parameters, parameter("actorId", uuid),
          parameter("action", string(maxLength=100)), parameter("entityType", string(maxLength=100)), parameter("entityId", string(maxLength=200)), parameter("from", utc), parameter("to", utc)],
          description="Newest (createdAt,id) DESC; validate UTC from<=to. Safe projection only: no IP, diff, personal contact, notes, messages or raw request bodies.")

document = {
    "openapi": "3.1.0", "jsonSchemaDialect": "https://json-schema.org/draft/2020-12/schema",
    "info": {"title": "TutorMatching Messaging and Administration", "version": "1.0.0",
             "description": "Sprint 4 planning contract encoded from api.md. Validation is not runtime parity; story checkpoints must compare implemented endpoints. Existing Sprint 1–3 unchanged routes remain governed by their contracts."},
    "servers": [{"url": "/api/v1"}],
    "x-contract-issues": [
        "api.md lists CSRF403, but existing middleware returns400. Both are documented; runtime behavior is not changed by this planning document.",
        "tasks T039 names PENDING_TUTOR_RESPONSE and omits DRAFT. Existing canonical source/Sprint3 contract use PENDING and include DRAFT; this contract preserves those values.",
        "MESSAGE_CREATED and notification target kinds HIRE_REQUEST/TUTOR_PROFILE/CONVERSATION are new design vocabulary encoded here; existing seven notification type codes are retained.",
        "Audit entityId is nullable string rather than universally UUID: existing catalog audit events store province/district/teaching-level codes. The query filter retains these identifiers.",
        "Admin detail reuses existing safe tutorProfileId/tutorProfileStatus as profile summary. Monitoring summary/terms fields explicitly exclude participant location and actions. Verify these projections at story parity gates."
    ],
    "x-signalr": {"endpoint": "/api/v1/hubs/events", "schemaVersion": 1,
                  "description": "SignalR protocol, not a REST business operation. Authenticated server-derived user channels only; recheck session/account/membership for dispatch and revoke live connections. Hints follow commit and clients reconcile via REST.",
                  "events": {"MessageCreated": ["schemaVersion", "eventId", "conversationId", "messageId"],
                             "MessagesRead": ["schemaVersion", "eventId", "conversationId"],
                             "NotificationsChanged": ["schemaVersion", "eventId"]}},
    "paths": paths,
    "components": {"schemas": schemas, "responses": responses,
                   "securitySchemes": {"cookieAuth": {"type": "apiKey", "in": "cookie", "name": "accessToken"},
                                       "csrfHeader": {"type": "apiKey", "in": "header", "name": "X-CSRF-TOKEN"},
                                       "csrfCookie": {"type": "apiKey", "in": "cookie", "name": "tutormatch_session_csrf"}}}
}
if __name__ == "__main__":
    destination = Path(__file__).with_name("openapi.json")
    destination.write_text(json.dumps(document, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Generated {len(paths)} paths / {sum(len(p) for p in paths.values())} operations / {len(schemas)} schemas: {destination}")
