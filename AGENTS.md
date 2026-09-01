# Repository Guidelines

## Project Structure & Module Organization

This repository contains a Spring Boot backend in `api_java/` and an Angular frontend in `web-angular/`. Backend code lives under `api_java/src/main/java/com/lilly/recorder/`, organized by `controller`, `service`, `repository`, `entity`, `dto`, `mapper`, `security`, and `config`; resources are in `api_java/src/main/resources/`. Frontend source is in `web-angular/src/`, split into `pages`, `core`, `models` and `shared`. Root infrastructure includes `docker-compose.yml`, `livekit.yaml`, `.env.example`, and UML/specification assets.

## Build, Test, and Development Commands

- `docker compose up --build` starts API, web, LiveKit, egress, Postgres, Redis, and MinIO.
- `cd api_java && mvn spring-boot:run` runs the backend locally using `application.yml` and environment overrides.
- `cd api_java && mvn -DskipTests package` builds the backend JAR.
- `cd web && npm install` installs frontend dependencies from `package-lock.json`.
- `cd web && npm run dev` starts the Vite dev server.
- `cd web && npm run build` runs TypeScript checks and creates the production bundle.
- `cd web && npm run preview` serves the built frontend locally.

## Coding Style & Naming Conventions

Use Java 21 and Spring Boot conventions: 4-space indentation, constructor injection, PascalCase classes, camelCase members, and suffixes such as `Controller`, `Service`, `Repository`, `Dto`, and `Mapper`. Keep packages under `com.lilly.recorder`.

For React/TypeScript, follow the existing style: 4-space indentation, single quotes, no semicolons, PascalCase component/page filenames, and `use*` hook names. Keep API calls in `web/src/api/` and shared types in `web/src/types/`.

Do not put comments in the code, unless absolutely necessary.If you do need to write comments, write them in a human-like manner, same as a real human developer would do it.

## Testing Guidelines

Manually verify meeting creation, pre-join, in-call controls, recording behavior, and post-call flows. No automated unit, integration, or end-to-end tests are needed. Never write tests of any kind.

## Commit & Pull Request Guidelines

Recent commits use bracketed prefixes such as `[EDIT]` and `[DELETE]`. Continue that pattern with short imperative subjects, for example `[EDIT] Update meeting cleanup logic`. PRs should describe scope, config changes, and verification steps. Include screenshots or recordings for UI changes.

## Security & Configuration Tips

Use `.env.example` and `web-angular/.env.example` as templates only. Do not commit real API keys, LiveKit secrets, JWT secrets, database passwords, or S3 credentials. Treat `docker-compose.yml` as the source of truth for local service names and ports.
