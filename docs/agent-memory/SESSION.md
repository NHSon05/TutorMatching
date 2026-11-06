# Current Session Handoff

Updated: 2026-11-06
Status: Feature `006-crawler-post-matching` Phase 1 (`T001`–`T006`), Phase 2 (`T007`–`T018`), Phase 3 (`T019`–`T024`), Phase 4 (`T025`–`T033`), and Phase 5 (US3 Two-Way Matching & SSE Realtime Delivery, `T034`–`T046`) complete under TDD; Phase 6 (US4 30-Day Data Retention, `T047`–`T054`) next.

## Current scope and evidence

- Completed Phase 1 (`T001`–`T006`): Redis 7.2 Compose service, `StackExchange.Redis`, `Testcontainers.Redis`, `RedisTestFixture`, and `RedisHealthCheck` (`5/5` passed).
- Completed Phase 2 (`T007`–`T018`): Domain entities (`DemandPost`, `ExtractedDemandDetail`, `TutorMatchingProfile`, `PostMatchNotification`, `RetentionCleanupLog`), EF Core configurations (`DemandMatchingEntitiesConfiguration`), and migration `AddDemandMatchingAndRetentionTables` (`25/25` unit tests + `10/10` migration/schema integration tests passed).
- Completed Phase 3 (`T019`–`T024`): `ContentHashNormalizer`, `RedisDeduplicationService`, and `PublicDemandIngestionService` (`7/7` unit tests + `1/1` Redis/PostgreSQL integration test passed).
- Completed Phase 4 (`T025`–`T033`): `RegexEntityExtractor`, `VietnamLandmarkGazetteer`, `AddressResolutionService`, and `HybridExtractionService` (`24/24` unit tests passed in `227 ms`).
- Completed Phase 5 (`T034`–`T046` via TDD Red -> Green -> Refactor):
  - Backend: `IMatchingEngine`, `ISseNotificationPublisher`, `MatchingEngine`, `SubmitPublicTutorDemandHandler`, `EfDemandMatchingStore`, `RedisSseNotificationPublisher`, `PublicTutorDemandsController` (`POST /api/v1/public/tutor-demands/match`), `TutorMatchedPostsSseController` (`GET /api/v1/tutors/me/matched-posts/stream`), and `TutorMatchingProfileController` (`GET & PUT /api/v1/tutors/me/matching-profile`, `GET /api/v1/tutors/me/matched-posts`).
  - Frontend: `PublicSmartDemandSearch.tsx` integrated into `TutorsListClient.tsx`, `LandingDemandChat.tsx` integrated into `LandingView.tsx`, `usePostMatchStream.ts` SSE hook with exponential backoff, and `TutorLiveMatchedPostsFeed.tsx` embedded into `frontend/src/app/(tutor)/tutor/page.tsx`.
  - Code Review P0/P1 hardening: fixed `onHireClick` prop in `PublicSmartDemandSearch.tsx`, subscribed `RedisSseNotificationPublisher.SubscribeAsync` to Redis Pub/Sub with replay-set trimming, validated extraction before registering deduplication keys in `SubmitPublicTutorDemandHandler`, added per-request catalog caching + concurrent SSE publishing + concurrency-safe `TutorMatchingProfile` upserts in `EfDemandMatchingStore`.
  - Verification: `MatchingEngineTests` (`2/2` passed), `PublicTutorDemandMatchApiTests` + `TutorMatchedPostsSseTests` + `TutorMatchingProfileApiTests` (`4/4` passed), and Vitest suites `PublicSmartDemandSearch.test.tsx` + `LandingDemandChat.test.tsx` + `usePostMatchStream.test.ts` + `TutorLiveMatchedPostsFeed.test.tsx` + `TutorsListClient.test.tsx` (`9/9` passed).

## Next executable step

- Execute Phase 6 (`T047`–`T054`) in `specs/006-crawler-post-matching/tasks.md` using TDD:
  - Write failing tests (`T047`–`T049`) for `PostgreSqlDataRetentionService`, `RetentionCleanupWorker`, and `POST /api/v1/admin/demands/cleanup-expired`.
  - Implement `IDataRetentionService`, `PostgreSqlDataRetentionService` (batch size 1,000 + `retention_cleanup_logs`), `RetentionCleanupWorker`, and `AdminDemandsRetentionController` (`T050`–`T054`).

## Retained release dependency

- Sprint 3 final gates (`T046`–`T050`) and Sprint 4 remaining phases remain tracked in their respective `specs/*/tasks.md`.
