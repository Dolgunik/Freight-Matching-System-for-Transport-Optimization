# Testing Report

This MVP uses automated checks to verify the main freight-matching workflow.

## Test Command

Run from the repository root:

```cmd
cd /d F:\ThesisProject
npm.cmd test
```

The local PostgreSQL database must be running on port `5433`.

## What The Command Runs

1. Backend seed reset with deterministic demo data.
2. Backend API tests with Vitest and Supertest.
3. Frontend production build with Vite.

## Test Scope

| Area | Test Case | Expected Result |
| --- | --- | --- |
| Health endpoint | `GET /api/health` | API returns `status: ok` and fixed calculation time. |
| Static city network | `GET /api/cities` and `GET /api/routes` | Seven cities are returned and Vaasa to Oulu exists in both route directions. |
| City details | `GET /api/cities/:id/details` | Selected city returns pickup cargo, including Vaasa cargo to Tampere and Oulu. |
| Single matching | `GET /api/trucks/1/matches` | Truck A receives feasible single-cargo matches with reasons. |
| Continuous chain | `GET /api/trucks/1/matches` | Truck A receives a five-leg chain from Vaasa back to Vaasa. |
| Repeatable cycle | `GET /api/trucks/1/matches` | The cycle reports that Electronics pallets can start the same sequence again. |
| Rejection logic | `GET /api/trucks/4/matches` | Unavailable Truck D receives no matches and cargo is rejected with status reason. |
| Frontend build | `npm --prefix frontend run build` | React application builds successfully for production. |

## Manual UI Checks

The automated test command does not interact with the browser. During local development, the UI was also checked manually:

- selecting a city changes the cargo panel title and cargo rows
- selecting a truck changes the selected city to the truck effective city
- `Rejected cargo from <city>` shows only rejected cargo whose pickup city is the selected city
- `Detected cycles` shows repeatable cargo cycles with a repeat reason

## Latest Local Result

```text
Backend test files: 1 passed
Backend tests: 5 passed
Frontend build: passed
```

## Notes

The tests use seeded prototype data and a fixed calculation timestamp. This keeps results repeatable and suitable for thesis reporting. The tests verify the MVP behavior, not a full production logistics system.

