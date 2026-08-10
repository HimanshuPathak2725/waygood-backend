# Waygood Study Abroad Candidate Evaluation Starter

This repository is a starter assignment for backend-focused MERN candidates interviewing with Waygood.

Waygood's public website positions the business around helping students discover universities, compare options, plan budgets, and navigate their study-abroad journey with AI-assisted tools and partner networks. This starter mirrors that business context by focusing on student discovery, recommendation, and application tracking.

## Business Scenario

You are joining the engineering team working on a study-abroad platform for students and counselors.

The product already has:

- a basic university and program catalog
- seeded sample data for students, universities, programs, and applications
- a minimal React dashboard shell
- starter backend architecture with Express, Mongoose, controllers, services, and middleware

The product is still missing critical engineering work needed for a real candidate-ready release.

## Your Assignment

Build on top of this starter and complete the platform features below.

### Required Tasks

1. Implement secure authentication

- Complete `POST /api/auth/register`
- Complete `POST /api/auth/login`
- Add a protected `GET /api/auth/me`
- Use JWT-based authentication
- Store passwords securely using hashing
- Support roles for `student` and `counselor`

2. Complete advanced university and program discovery

- Extend `GET /api/universities` and `GET /api/programs`
- Add filtering by country, intake, degree level, budget, scholarship availability, and search term
- Add pagination metadata and sorting options
- Make the response format consistent and frontend-friendly

3. Build a recommendation engine using MongoDB aggregation

- Improve `GET /api/recommendations/:studentId`
- Use MongoDB aggregation to recommend relevant programs for a student
- Consider preferred countries, budget, field of interest, intake, and IELTS score
- Return top matches with a short explanation of why each result matched

4. Implement the application workflow

- Complete `POST /api/applications`
- Complete `PATCH /api/applications/:id/status`
- Prevent duplicate applications for the same student, program, and intake
- Enforce valid status transitions
- Record a timeline/history entry when status changes

5. Add caching and performance improvements

- Cache `GET /api/universities/popular` and/or dashboard summary responses
- You may use Redis or improve the provided in-memory cache
- Add or document MongoDB indexes that improve the most important queries
- Keep performance tradeoffs clear in code comments or README notes

6. Add testing and developer documentation

- Add tests for at least 2 important API flows
- Include at least 1 edge-case test
- Update this README with any assumptions, setup steps, and architecture notes needed to review your submission

### Bonus Tasks

- Integrate an AI endpoint for study-plan suggestions, SOP helper prompts, or shortlist summaries
- Dockerize the backend and database setup
- Improve the React dashboard to consume your new APIs cleanly
- Add rate limiting, request logging, or role-based access improvements

## What We Will Evaluate

- Backend architecture and code organization
- API design, validation, and error handling
- MongoDB query quality, aggregation usage, and indexing awareness
- Performance thinking, including caching and response design
- Code readability, maintainability, and naming
- Testing depth and practical engineering judgment
- How well your solution reflects a real study-abroad product workflow

## Suggested Timebox

A strong submission can usually be completed in 6-8 focused hours. We care more about thoughtful engineering tradeoffs than feature volume.

## Suggested Submission Expectations

- Keep the solution realistic and production-minded
- Favor clean, explainable code over unnecessary complexity
- If you make assumptions, document them
- If you skip a bonus feature, that is okay
- Share your repository, setup instructions, and any sample credentials or environment notes needed to review

## Starter Project Structure

```text
.
|-- backend
|   |-- src
|   |   |-- config
|   |   |-- controllers
|   |   |-- data
|   |   |-- middleware
|   |   |-- models
|   |   |-- routes
|   |   |-- scripts
|   |   |-- services
|   |   `-- utils
|-- frontend
|   `-- src
`-- docs
```

## Getting Started

### 1. Backend setup

```bash
cd backend
npm install
copy .env.example .env
npm run seed
npm run dev
```

### 2. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

On macOS or Linux, use `cp .env.example .env` instead of `copy`.

## Environment Variables

See `backend/.env.example`.

## Seeded Data Included

The seed script creates sample:

- students with profile preferences
- universities across key study-abroad destinations
- programs with tuition, intake, and IELTS requirements
- applications with mixed statuses

## Sample Seed Credentials

After running the seed script, you can use:

- `aarav@example.com` / `Candidate123!`
- `sara@example.com` / `Candidate123!`
- `counselor@example.com` / `Candidate123!`

## Notes For Candidates

- Some routes are intentionally incomplete
- Some services are intentionally simple and should be improved
- The codebase is structured to show expected engineering direction, not to be finished
- You can refactor any part of the starter if your approach is better

## Candidate-Friendly Deliverables

Along with this README, a Word assignment brief is available at:

- `docs/Waygood_Candidate_Assignment.docx`

## Reference Context Used For This Assignment Design

- Waygood website: student discovery, AI tools, calculators, and partner-university positioning
- Job description: backend APIs, MongoDB aggregation, performance optimization, caching, and AI integration

---

# Submission Notes (Completed Implementation)

Everything below documents what was built on top of the starter, and why.

## 1. Authentication & Security

- `POST /api/auth/register` — validates `fullName`/`email`/`password`, enforces an 8-char
  minimum password length, restricts `role` to `student`/`counselor`, and returns `409`
  on a duplicate email instead of a raw Mongo error.
- `POST /api/auth/login` — verifies credentials with `bcrypt.compare` (via `Student.comparePassword`,
  already defined on the model) and returns a generic `401` on any failure so we don't leak
  whether an email is registered.
- `GET /api/auth/me` — protected by the existing `requireAuth` middleware; returns the
  password-free user document attached to `req.user`.
- Passwords are hashed with bcrypt in a Mongoose `pre("save")` hook (already present in the
  starter `Student` model) — hashing happens once, on save, not duplicated in controllers.
- JWTs are signed with `sub` (user id) and `role`, so downstream handlers can do
  role checks without an extra DB round trip if needed later.
- **Bonus implemented:** rate limiting — `express-rate-limit` caps `/api/auth/*` at
  20 requests / 15 min per IP (brute-force/credential-stuffing guard) and all other
  `/api/*` routes at 120 requests / min per IP.

## 2. University & Program Discovery

The starter's `programController` and `universityController` already implemented filtering,
pagination, sorting, and a consistent `{ success, data, meta }` response shape — these were
left largely as-is since they matched the assignment spec. No changes were required here beyond
what shipped in the starter.

## 3. Recommendation Engine (MongoDB Aggregation)

`recommendationService.js` was rewritten to score and rank candidates entirely inside MongoDB
via `Program.aggregate(...)`, instead of the starter's "fetch candidates, score in JS" approach:

- `$match` narrows to programs matching the student's target countries **or** interested fields
  first, so the pipeline can use the existing `country`/`field` indexes instead of a full scan.
- `$addFields` computes five boolean match flags (country, field, budget, intake, IELTS) using
  `$in`, `$lte`, `$gte`, and a `$regexMatch` for case-insensitive field matching.
- A second `$addFields` turns those flags into a weighted `matchScore` (country 35, field 30,
  budget 20, intake 10, IELTS 5 — same weights as the starter's JS version, so results are
  comparable).
- `$match: { matchScore: { $gt: 0 } }` drops non-matches, then `$sort` + `$limit(5)` return only
  the top 5 — the smallest amount of data possible is shipped out of MongoDB.
- The Node layer only turns the boolean flags back into human-readable `reasons` strings for the
  API response; no scoring happens outside the database.

## 4. Application Workflow

- `POST /api/applications` — validates the student and program exist, validates the requested
  `intake` is actually offered by the program, and creates the application. Duplicate
  (student, program, intake) submissions rely on the **existing unique compound index** on
  `Application` (`{ student, program, intake }`) — the controller catches Mongo's `11000`
  duplicate-key error and turns it into a friendly `409`, rather than re-implementing the
  uniqueness check as a separate `findOne` (which would race under concurrent requests).
- `PATCH /api/applications/:id/status` — status transitions are validated against the
  `validStatusTransitions` map already defined in `config/constants.js` (e.g. `draft` → only
  `submitted`; `submitted` → `under-review` or `rejected`, etc.). Invalid transitions (including
  no-op transitions to the current status) return `409`. Every accepted transition pushes a new
  entry onto `application.timeline` with the note and timestamp, so the full history is
  reconstructable from a single document — no separate audit collection needed at this scale.

## 5. Performance & Caching

- The starter's in-memory `cacheService` (TTL-based `Map`) is used as-is for
  `GET /api/universities/popular` and `GET /api/dashboard/overview`, both already wired up.
  A single-process in-memory cache was kept rather than swapping in Redis, since this is a
  single-instance deployment for the assignment — the code is written so `cacheService` could be
  swapped for a Redis-backed implementation later without touching the controllers (same
  `get`/`set`/`delete` interface).
- **Indexing strategy** (all already declared on the models, confirmed/kept as-is):
  - `Program`: individual indexes on `country`, `field`, `degreeLevel`, `tuitionFeeUsd`, plus a
    compound `{ country, degreeLevel, field, tuitionFeeUsd }` index that covers the most common
    discovery-page filter combination without needing separate single-field indexes hit one at a
    time.
  - `University`: index on `country` and `popularScore` (used by `/popular` and default sort),
    plus a `text` index on `name`/`country`/`city` for the `q` search parameter.
  - `Application`: indexes on `student`, `program`, `status`, `intake`, and a **unique compound
    index** on `{ student, program, intake }`, which is what powers duplicate-application
    prevention.
  - `Student`: unique index on `email` (used for both registration checks and login lookups).
  - Tradeoff note: every extra index speeds up reads but costs write throughput and disk. Given
    this is a read-heavy discovery/recommendation workload with comparatively rare
    writes (applications, registrations), the write cost was judged worth it.

## 6. Testing & Documentation

- `backend/tests/auth.test.js` — registration, login, `/me`, plus edge cases: wrong password
  (`401`) and duplicate email registration (`409`).
- `backend/tests/application.test.js` — full create → status-transition flow with timeline
  assertions, plus edge cases: duplicate application (`409` via the unique index) and an invalid
  status transition, e.g. `draft` → `enrolled` (`409`).
- Tests use `mongodb-memory-server` (an ephemeral, real MongoDB instance) via
  `backend/tests/setup.js`, so they exercise the actual Mongoose models/indexes rather than
  mocks. Run with `npm test` from `backend/`.
- **Note:** `mongodb-memory-server` downloads a real `mongod` binary on first run, which
  requires outbound internet access. If your environment blocks that, either allow it once (the
  binary is cached afterwards) or point `MONGODB_URI` at a local/Dockerized MongoDB instance and
  adapt `tests/setup.js` to use it instead of an in-memory server.

## Assumptions Made

- `role` is restricted to `student` and `counselor` per the assignment's auth requirement;
  counselor-only endpoints (e.g. viewing all students' applications) were not explicitly
  requested, so `GET /api/applications` currently returns all applications when queried without
  a `studentId` filter rather than adding a new role-gated route — flagged here as something to
  revisit with the team.
- The recommendation engine's weights (35/30/20/10/5) were kept identical to the starter's JS
  version so results are directly comparable before/after the aggregation rewrite.
- Rate limiting and in-memory caching are process-local; in a multi-instance deployment these
  would need to move to Redis (both were written behind a stable interface to make that swap
  straightforward later).

## Setup (Recap)

```bash
cd backend
npm install
cp .env.example .env
npm run seed
npm run dev      # starts the API on http://localhost:4000
npm test         # runs the Jest/Supertest suite against an in-memory MongoDB
```
