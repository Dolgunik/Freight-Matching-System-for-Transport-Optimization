# Freight Matching Prototype

Small MVP for a thesis freight-matching prototype.

The app shows Finnish cities, cargo, and trucks. A user selects one truck and asks the backend to find feasible cargo matches. The backend returns suitable cargo and rejected cargo with clear reasons.

## Stack

- Backend: Node.js, Express, Prisma
- Database: PostgreSQL
- Frontend: React, Vite

## Project Structure

```text
backend/
  prisma/
    schema.prisma
    seed.js
  src/
    index.js
    prismaClient.js
    routes/
    services/
frontend/
  src/
    App.jsx
    api.js
    components/
    pages/
```

## Local Setup

1. Install backend dependencies:

```bash
cd backend
npm install
```

2. Install frontend dependencies:

```bash
cd frontend
npm install
```

3. Start PostgreSQL locally and create the database.

The default backend `.env` expects:

```text
DATABASE_URL="postgresql://postgres@localhost:5433/freight_matching?schema=public"
```

On Windows, PostgreSQL can be started manually as follows:

```powershell
& 'C:\Program Files\PostgreSQL\18\bin\initdb.exe' -D '.\.pgdata' -A trust -U postgres -E UTF8
& 'C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe' -D '.\.pgdata' -l '.\.pgdata\postgres.log' -o '"-p 5433"' start
& 'C:\Program Files\PostgreSQL\18\bin\createdb.exe' -h localhost -p 5433 -U postgres freight_matching
```

If `.pgdata` already exists, only run the `pg_ctl` command.

4. Push the Prisma schema and seed data:

```bash
cd backend
npm run db:push
npm run db:seed
```

5. Start the backend:

```bash
npm run dev
```

6. Start the frontend:

```bash
cd frontend
npm run dev
```

## Testing

The project includes automated backend API tests and a frontend production build check.

From the repository root:

```bash
npm test
```

Backend tests reseed the local PostgreSQL database, then verify:

- health endpoint and fixed calculation time
- city list and Vaasa to Oulu static route
- cargo visible for a selected city
- successful Truck A matches, including Vaasa to Oulu
- rejected cargo for unavailable Truck D

You can also run only one side:

```bash
npm run test:backend
npm run test:frontend
```

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

## Scope

Included:

- Static city list and map coordinates
- Cargo list
- Truck list
- Truck selection
- Feasibility-based matching
- Match and rejection reasons

Not included:

- Login
- Real GPS
- Live map
- Payments
- Contracts
- Driver working hours
- Machine learning
- Real route calculation
- Full vehicle routing optimization
