# Repository Guidelines

## Project Structure & Module Organization

`api/LillyRecorder/` contains the ASP.NET Core backend, organized by `Controller`, `Service`, `Repository`, `Converter`,
`Model`, `Middlewares`, and `Jobs`. `api/LillyRecorder.Tests/` holds xUnit tests for backend behavior. `web/src/` is the
Vite React client, split into `pages`, `components`, `hooks`, `api`, `types`, and `styles`. Infrastructure and local ops
live in `docker-compose.yml`, `livekit.yaml`, and `monitoring/`.

## Build, Test, and Development Commands

- `docker compose up --build` - start the full local stack: API, web, LiveKit, Postgres, Redis, MinIO, and monitoring.
- `dotnet build api/LillyRecorder.sln` - compile the backend and test projects.
- `dotnet run --project api/LillyRecorder/LillyRecorder.csproj` - run the API locally on port `5001`.
- `dotnet test api/LillyRecorder.sln --collect:"XPlat Code Coverage"` - run xUnit tests and write coverage artifacts.
- `cd web && npm install && npm run dev` - start the frontend dev server on port `3000`.
- `cd web && npm run build` - run TypeScript checks and produce the production bundle.

## Coding Style & Naming Conventions

Use 4 spaces in C#. In TypeScript and TSX, keep spacing consistent with the file you are editing and avoid reformat-only
diffs. C# types, DTOs, services, and controllers use PascalCase; interfaces start with `I`; async methods end with
`Async`. React pages and components use PascalCase filenames, hooks use `use*`, and shared helpers use descriptive
camelCase names. Prefer single quotes in TS/TSX and keep Tailwind-heavy JSX readable.

## Testing Guidelines

Backend tests use xUnit and Moq under `api/LillyRecorder.Tests/`. Name test files `*Tests.cs` and use method names like
`Action_State_ExpectedResult`. Add or update tests when changing controllers, converters, services, or webhook/recording
flows. No frontend test suite is committed yet, so PRs that touch UI flows should include manual verification for
meeting creation, pre-join, in-call, and recording behavior.

## Commit & Pull Request Guidelines

Recent history uses bracketed prefixes such as `[EDIT]`, `[FIX]`, and `[DOCS]`; keep that pattern and write the
remainder in imperative mood. PRs should describe scope, linked issue or task, config changes, and exact verification
steps. Include screenshots or short recordings for UI changes, and call out any Docker or environment updates reviewers
must apply.

## Configuration & Secrets

Use `.env.example` and `web/.env.example` as templates. Do not commit real API keys, LiveKit secrets, database
passwords, or S3 credentials. For local setup, treat `docker-compose.yml` as the source of truth for service names,
ports, and default development wiring.