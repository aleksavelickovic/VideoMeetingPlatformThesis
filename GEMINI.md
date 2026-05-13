# GEMINI.md - Project Context: Lilly Video Meeting Platform (Lilly-vmp)

This project is a comprehensive video meeting platform named **Lilly-vmp**. It leverages **LiveKit** for real-time WebRTC communication and provides a robust management layer for meetings, participants, and recordings.

## Project Overview

- **Architecture:** Monorepo-style structure with a .NET backend and a React frontend, orchestrated by Docker Compose.
- **Backend (`/api`):** A .NET Core 8 Web API (`LillyRecorder`) responsible for business logic, meeting orchestration, participant management, and integration with LiveKit/S3.
- **Frontend (`/web`):** A modern React application built with Vite and TypeScript, providing the user interface for meeting rooms and management.
- **Infrastructure:** Utilizes LiveKit for video/audio, PostgreSQL for persistence, Redis for state/LiveKit, and a complete monitoring stack (Prometheus, Loki, Grafana).

## Tech Stack

### Backend (`api/LillyRecorder`)
- **Framework:** .NET Core 8
- **Database:** PostgreSQL (with Entity Framework Core)
- **Caching & Messaging:** Redis
- **Background Jobs:** Hangfire (PostgreSQL storage)
- **Object Storage:** Amazon S3 / MinIO (for meeting recordings)
- **LiveKit Integration:** `Livekit.Server.Sdk.Dotnet`
- **Validation:** FluentValidation
- **Logging:** Serilog (writing to Grafana Loki)
- **Metrics:** Prometheus (`prometheus-net`)
- **Documentation:** Swagger / OpenAPI

### Frontend (`web`)
- **Framework:** React 18+
- **Build Tool:** Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS, PostCSS
- **Real-time Communication:** `livekit-client`, `@livekit/components-react`
- **Icons:** `lucide-react`
- **Animations:** `motion` (formerly Framer Motion)

### Infrastructure & Monitoring
- **Real-time Server:** LiveKit Server
- **Recording Service:** LiveKit Egress
- **Orchestration:** Docker Compose
- **Observability:**
  - **Prometheus:** Metrics collection.
  - **Loki:** Log aggregation.
  - **Promtail:** Log shipping.
  - **Grafana:** Visualization and dashboards.

## Key Features
- **Meeting Orchestration:** Automated room creation and token generation for participants.
- **Real-time Video/Audio:** High-quality WebRTC communication via LiveKit.
- **Meeting Recording:** Support for recording meetings, with files automatically saved to S3-compatible storage.
- **Participant Management:** Role-based access and token-based join links.
- **Automated Cleanup:** Background jobs (Hangfire) for cleaning up expired sessions.
- **Full Observability:** Integrated logging and metrics for monitoring system health.

## Building and Running

### Prerequisites
- Docker and Docker Compose
- .NET 8 SDK (for local backend development)
- Node.js 18+ (for local frontend development)

### Running the Entire Stack (Docker)
The easiest way to get the project running is via Docker Compose:

```bash
docker-compose up -d
```

- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **API Swagger:** [http://localhost:5001/swagger](http://localhost:5001/swagger)
- **Grafana:** [http://localhost:3001](http://localhost:3001)
- **Hangfire Dashboard:** [http://localhost:5001/hangfire](http://localhost:5001/hangfire)
- **MinIO Console:** [http://localhost:9001](http://localhost:9001)

### Local Development

#### Backend
```bash
cd api/LillyRecorder
dotnet restore
dotnet run
```
*Note: Requires PostgreSQL, Redis, and MinIO to be running (e.g., via Docker).*

#### Frontend
```bash
cd web
npm install
npm run dev
```
*Note: Connects to the API at [http://localhost:5001](http://localhost:5001) by default.*

## Development Conventions

- **API Design:** RESTful controllers with DTO-based requests and responses.
- **Error Handling:** Centralized exception handling via `ExceptionMiddleware` using `HttpResponseException<TErrorCode>`.
- **Validation:** Requests are validated using FluentValidation before reaching the controller logic.
- **Logging:** Use structured logging with Serilog. Important events should be logged with appropriate context.
- **Metrics:** App-specific metrics are managed in `AppMetrics.cs`.
- **Frontend State:** Leverages React hooks and LiveKit context providers for real-time room state.
- **Styling:** Adheres to a consistent theme defined in `web/src/styles/theme.css` and Tailwind configuration.

## Key Files & Directories
- `api/LillyRecorder/Program.cs`: Backend entry point and dependency injection.
- `web/src/App.tsx`: Frontend routing and main entry.
- `docker-compose.yml`: Infrastructure orchestration.
- `livekit.yaml`: LiveKit server configuration.
- `monitoring/`: Configuration files for Prometheus, Loki, and Grafana.
