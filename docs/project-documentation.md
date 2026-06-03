# Freight Matching System - Project Documentation

## 1. Project Purpose

This project is a small MVP prototype for freight matching in road transport.

The goal is to demonstrate the core idea of a freight-matching system without building a production logistics platform. A user selects one truck, checks cargo feasibility, and sees whether the truck can continue with cargo available in arrival cities.

The prototype focuses on:

- selecting a truck
- viewing cargo by selected city
- checking single-cargo feasibility
- finding continuous cargo chains
- detecting repeatable cargo cycles
- explaining why cargo is accepted or rejected

## 2. Technology Stack

| Part | Technology | Purpose |
| --- | --- | --- |
| Frontend | React | One-page user interface |
| Frontend tooling | Vite | Local dev server and production build |
| UI icons | lucide-react | Interface icons |
| Backend | Node.js | JavaScript runtime |
| Backend framework | Express | REST API server |
| ORM | Prisma | Database schema and database access |
| Database | PostgreSQL | Stores cities, routes, cargo, and trucks |
| Backend tests | Vitest | Test runner |
| API tests | Supertest | Express endpoint testing |

## 3. Project Structure

```text
freight-matching-prototype/
  backend/
    prisma/
      schema.prisma
      seed.js
    src/
      app.js
      index.js
      prismaClient.js
      config/
        time.js
      routes/
        cargo.js
        cities.js
        matches.js
        routes.js
        trucks.js
      services/
        matchingService.js
    tests/
      api.test.js

  frontend/
    src/
      App.jsx
      api.js
      main.jsx
      styles.css
      components/
        CargoList.jsx
        CityMap.jsx
        MatchResults.jsx
        TruckList.jsx
      pages/
        HomePage.jsx
      utils/
        date.js
    vite.config.js

  docs/
    project-documentation.md
    testing-report.md

  package.json
  README.md
```

## 4. Backend Overview

The backend is built with Node.js and Express.

Important files:

| File | Purpose |
| --- | --- |
| `backend/src/app.js` | Creates the Express app and registers API routes. |
| `backend/src/index.js` | Starts the backend server. |
| `backend/src/config/time.js` | Provides the fixed matching reference time. |
| `backend/src/prismaClient.js` | Creates the Prisma client. |
| `backend/src/services/matchingService.js` | Contains feasibility, chain, and cycle logic. |
| `backend/prisma/schema.prisma` | Defines the database models. |
| `backend/prisma/seed.js` | Creates deterministic demo data. |
| `backend/tests/api.test.js` | Verifies the main API behavior. |

Backend default URL:

```text
http://localhost:4000
```

## 5. Database

The database is PostgreSQL.

Local workspace database directory:

```text
F:\ThesisProject\.pgdata
```

Connection string:

```text
postgresql://postgres@localhost:5433/freight_matching?schema=public
```

Main models:

| Model | Purpose |
| --- | --- |
| `City` | City name, country, and static map coordinates. |
| `CityRoute` | Static route between two cities, distance, and travel time. |
| `Cargo` | Cargo name, pickup city, destination city, weight, windows, and status. |
| `Truck` | Truck location, movement state, capacity, and availability. |

Calculated matches are not stored in the database. They are calculated live by the backend and returned to the frontend.

## 6. Seed Data

The seed script creates deterministic data for demonstration and tests.

Cities:

- Vaasa
- Seinajoki
- Tampere
- Helsinki
- Turku
- Jyvaskyla
- Oulu

Important routes:

- Vaasa to Seinajoki
- Seinajoki to Tampere
- Tampere to Helsinki
- Tampere to Turku
- Tampere to Jyvaskyla
- Jyvaskyla to Oulu
- Vaasa to Oulu

Routes are created in both directions.

Cargo examples:

- Electronics pallets: Vaasa to Tampere
- Northern medical supplies: Vaasa to Oulu
- Book cartons: Tampere to Helsinki
- Hospital supplies: Helsinki to Jyvaskyla
- Paper reels: Jyvaskyla to Oulu
- Return components: Oulu to Vaasa
- Heavy machinery parts: Turku to Tampere

Truck examples:

- Truck A: parked in Vaasa, available
- Truck B: moving to Tampere, available
- Truck C: parked in Turku, available
- Truck D: parked in Helsinki, unavailable

The data includes this repeatable cargo cycle:

```text
Vaasa -> Tampere -> Helsinki -> Jyvaskyla -> Oulu -> Vaasa
```

When the truck returns to Vaasa, the first cargo in the sequence can be taken again.

## 7. API Endpoints

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/health` | GET | Checks backend status and returns fixed calculation time. |
| `/api/cities` | GET | Returns all cities. |
| `/api/cities/:id/details` | GET | Returns one city with routes, cargo, and parked trucks. |
| `/api/cargo` | GET | Returns all cargo. |
| `/api/cargo` | POST | Creates new cargo. |
| `/api/trucks` | GET | Returns all trucks. |
| `/api/trucks` | POST | Creates a new truck. |
| `/api/routes` | GET | Returns all static city routes. |
| `/api/trucks/:id/matches` | GET | Calculates matching results for one truck. |

## 8. Matching Logic

Matching is implemented in:

```text
backend/src/services/matchingService.js
```

The backend first resolves the truck effective state:

- parked truck: starts from parking city at the fixed calculation time
- moving truck: starts from arrival city at arrival time

Single cargo feasibility checks:

1. Truck status must be `available`.
2. Cargo status must be `ready_for_loading`.
3. Truck capacity must be greater than or equal to cargo weight.
4. Static route to pickup city must exist.
5. Truck must reach pickup city before pickup window closes.
6. Static route to destination city must exist.
7. Delivery must happen before delivery window closes.

The API returns:

- `matches`: all single cargo items feasible for the selected truck
- `rejected`: all single cargo items that failed one or more checks
- `longestChains`: continuous cargo chains from the truck effective city
- `cycles`: repeatable cargo cycles

## 9. Continuous Chains

A continuous chain is a sequence of cargo legs.

Rules:

- The first cargo must be available in the truck effective city.
- Every next cargo must be picked up in the city where the previous cargo was delivered.
- The search is limited by `MAX_CHAIN_DEPTH` to keep the prototype small and predictable.
- The UI shows the longest chains first.

This is not full vehicle routing optimization. It is a simple feasibility and continuation check.

## 10. Repeatable Cycles

A cycle is not defined as "the truck visited any previous city".

In this prototype, a cycle means:

1. The truck starts a cargo chain from a pickup city.
2. The chain eventually returns to that same first pickup city.
3. The same first cargo can be taken again, so the sequence is repeatable.

Example:

```text
Electronics pallets: Vaasa -> Tampere
Book cartons: Tampere -> Helsinki
Hospital supplies: Helsinki -> Jyvaskyla
Paper reels: Jyvaskyla -> Oulu
Return components: Oulu -> Vaasa
```

After the last leg, the truck is back in Vaasa and can start with Electronics pallets again.

## 11. Frontend Overview

The frontend is a one-page React app.

Important files:

| File | Purpose |
| --- | --- |
| `frontend/src/pages/HomePage.jsx` | Main workflow and shared page state. |
| `frontend/src/api.js` | Backend API wrapper. |
| `frontend/src/components/CityMap.jsx` | Static city map and city selection. |
| `frontend/src/components/TruckList.jsx` | Truck selection. |
| `frontend/src/components/CargoList.jsx` | Cargo for the selected city. |
| `frontend/src/components/MatchResults.jsx` | Chains, cycles, single matches, and rejected cargo. |
| `frontend/src/utils/date.js` | Date formatting helpers. |
| `frontend/src/styles.css` | Application styling. |

Frontend default URL:

```text
http://127.0.0.1:5173
```

## 12. User Interface Behavior

The page contains:

- static city map
- truck list
- selected truck details
- selected city cargo panel
- matching results panel

City cargo panel:

- The panel title shows the selected city, for example `Vaasa cargo`.
- `Available from this city` shows cargo where selected city is the pickup city.
- `Delivered to this city` shows cargo where selected city is the destination city.
- Clicking a city on the map changes this panel.
- Selecting a truck changes this panel to the truck effective city.

Matching results panel:

- `Longest cargo chains` shows continuous chains.
- `Detected cycles` shows repeatable cargo cycles.
- `Single suitable cargo` shows single cargo feasible for the selected truck.
- `Rejected cargo from <city>` shows only rejected cargo whose pickup city is the selected city.

## 13. Fixed Calculation Time

The prototype uses a fixed calculation time so results are repeatable.

Configured value:

```text
2026-05-21T09:00:00+03:00
```

API UTC value:

```text
2026-05-21T06:00:00.000Z
```

The frontend displays this as local time.

## 14. How To Run Locally

Use `npm.cmd` on Windows if PowerShell blocks `npm.ps1`.

Start PostgreSQL:

```powershell
& 'C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe' -D 'F:\ThesisProject\.pgdata' -l 'F:\ThesisProject\.pgdata\postgres.log' -o '"-p 5433"' start
```

Apply schema and seed:

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

## 15. Testing

Run all checks from the repository root:

```cmd
cd /d F:\ThesisProject
npm.cmd test
```

This command runs:

1. Backend seed reset.
2. Backend API tests.
3. Frontend production build.

More details:

```text
docs/testing-report.md
```

## 16. Limitations

The project intentionally does not include:

- authentication
- real GPS
- live map
- payment flow
- contracts
- driver working hours
- machine learning
- real road routing
- full vehicle routing optimization
- production deployment

These limitations keep the project focused on the thesis MVP.

