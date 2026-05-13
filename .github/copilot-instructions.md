# Copilot Instructions

## Important Notes

**Testing**: Do not write or run tests. Skip all test-related tasks entirely.

## Build and Development Commands

### Full Stack (Docker)

```bash
docker compose up --build  # Start API, web, LiveKit, Postgres, Redis, MinIO, monitoring
```

### Backend (ASP.NET Core)

```bash
dotnet build api/LillyRecorder.sln
dotnet run --project api/LillyRecorder/LillyRecorder.csproj  # Runs on port 5001
```

### Frontend (Vite + React)

```bash
cd web && npm install && npm run dev  # Dev server on port 3000
cd web && npm run build               # TypeScript check + production build
```

## Architecture Overview

### Meeting & Recording Flow

```
1. POST /meetings → Create Meeting entity + LiveKit room + JWT tokens per participant
2. Frontend joins via token → LiveKit connection established
3. Webhook (participant_joined) → Set meeting to in_progress, start per-participant recording
4. Webhook (egress_ended) → Update meeting with S3 recording metadata
5. POST /meetings/{roomId}/end → Stop recording, dispatch callback with HMAC signature
```

### Backend Structure (`api/LillyRecorder/`)

- **Controllers**: `MeetingController` (CRUD + end meeting), `WebhookController` (LiveKit events), `HealthController`
- **Services**: Each has interface + implementation (e.g., `IMeetingService` → `MeetingService`)
    - `LiveKitService`: Room creation, JWT generation, egress start/stop
    - `CallbackService`: HMAC-signed webhook dispatch with retry (1min, 5min, 30min)
    - `S3Service`: Presigned URL generation for recordings
- **Jobs**: `SessionCleanupJob` (Hangfire) auto-ends expired meetings every 5 minutes
- **Middleware**: `ApiKeyMiddleware` (Bearer auth), `CorrelationIdMiddleware`, `ExceptionMiddleware`

### Frontend Structure (`web/src/`)

- **Pages**: `CreateMeetingPage` → `MeetingCreatedPage` → `PreJoinPage` → `InCallPage` → `PostCallPage`
- **Key Hooks**:
    - `useLiveKitRoom`: Room lifecycle, participant sync, recording status
    - `useDevices`/`useCameraPreview`: Device enumeration and preview
    - `useParticipantName`: JWT decode for participant identity
- **API Layer** (`api/MeetingApi.ts`): HTTP client with Bearer token injection

### External Integrations

- **LiveKit**: `RoomServiceClient` for rooms, `EgressServiceClient` for recording, `WebhookReceiver` for signature
  verification
- **S3/MinIO**: Recording storage with key pattern `recordings/{roomId}/{timestamp}.mp4`
- **PostgreSQL**: EF Core with entities: `Meeting`, `Participant`, `CallbackAttempt`, `ApiKey`
- **Redis**: Connected for caching; Hangfire uses PostgreSQL backend

## Coding Conventions

### C# (Backend)

- 4-space indentation
- PascalCase for types, DTOs, services, controllers; interfaces prefixed with `I`
- Async methods suffixed with `Async`
- Test naming: `Action_State_ExpectedResult` (e.g., `CreateMeeting_ValidInput_ReturnsRoomId`)
- Error handling via `HttpResponseException<TErrorCode>` with domain-specific error enums

### TypeScript/React (Frontend)

- Single quotes in TS/TSX
- PascalCase for pages/components, `use*` for hooks, camelCase for utilities
- Keep Tailwind-heavy JSX readable; avoid reformat-only diffs

### Commits

Use bracketed prefixes: `[EDIT]`, `[FIX]`, `[DOCS]`, `[FEAT]` followed by imperative mood description.

## Configuration

Use `.env.example` and `web/.env.example` as templates. `docker-compose.yml` is the source of truth for local service
names and ports.

**Key environment variables:**

- `SystemConfiguration__LiveKit__Url/ApiKey/ApiSecret`
- `SystemConfiguration__S3__Endpoint/Bucket/AccessKey/SecretKey`
- `VITE_API_URL`, `VITE_LIVEKIT_URL` (frontend)
