# Freight Matching Prototype

Small MVP for a thesis freight-matching prototype.

The app shows a static Finnish city network, trucks, cargo available in the selected city, and matching results for one selected truck. The backend checks single-cargo feasibility, builds continuous cargo chains, and detects repeatable cargo cycles.

Detailed documentation: [docs/project-documentation.md](docs/project-documentation.md)

## Stack

- Backend: Node.js, Express
- ORM: Prisma
- Database: PostgreSQL
- Frontend: React, Vite
- Tests: Vitest, Supertest, frontend production build

## Current MVP

Included:

- static city map and static route network
- city-focused cargo panel
- truck list and truck selection
- single-cargo feasibility check
- longest continuous cargo chains
- repeatable cargo cycle detection
- rejected cargo reasons filtered by selected city
- fixed calculation time for repeatable tests

Not included:

- login
- real GPS
- live map
- payments
- contracts
- driver working hours
- machine learning
- real route calculation
- full vehicle routing optimization

## Project Structure

```text
backend/
  prisma/
    schema.prisma
    seed.js
  src/
    app.js
    index.js
    prismaClient.js
    config/
    routes/
    services/
  tests/

frontend/
  src/
    api.js
    components/
    pages/
    utils/
    styles.css

docs/
  project-documentation.md
  testing-report.md
```

## Local Run Commands

Use `npm.cmd` on Windows if PowerShell blocks `npm.ps1`.

Start PostgreSQL from the project root:

```powershell
& 'C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe' -D 'F:\ThesisProject\.pgdata' -l 'F:\ThesisProject\.pgdata\postgres.log' -o '"-p 5433"' start
```

Apply schema and seed data:

```cmd
cd /d F:\ThesisProject\backend
npm.cmd run db:push
npm.cmd run db:seed
```

Start backend:

```cmd
cd /d F:\ThesisProject\backend
npm.cmd run start
```

Start frontend:

```cmd
cd /d F:\ThesisProject\frontend
npm.cmd run dev
```

Open:

```text
http://127.0.0.1:5173
```

Stop PostgreSQL:

```powershell
& 'C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe' -D 'F:\ThesisProject\.pgdata' stop
```

## Testing

Run all checks from the repository root:

```cmd
cd /d F:\ThesisProject
npm.cmd test
```

This runs:

1. backend seed reset
2. backend API tests
3. frontend production build

More details: [docs/testing-report.md](docs/testing-report.md)

## API

- `GET /api/health`
- `GET /api/cities`
- `GET /api/cities/:id/details`
- `GET /api/cargo`
- `POST /api/cargo`
- `GET /api/trucks`
- `POST /api/trucks`
- `GET /api/routes`
- `GET /api/trucks/:id/matches`

