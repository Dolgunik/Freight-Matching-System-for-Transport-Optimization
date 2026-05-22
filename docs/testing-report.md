# Testing Report

This MVP uses automated tests to verify the main freight-matching workflow.

## Test Command

```bash
npm test
```

The command runs:

1. Backend seed reset with deterministic test data.
2. Backend API tests with Vitest and Supertest.
3. Frontend production build with Vite.

## Test Scope

| Area | Test Case | Expected Result |
| --- | --- | --- |
| Health endpoint | `GET /api/health` | API returns `status: ok` and fixed calculation time. |
| Static city network | `GET /api/cities` and `GET /api/routes` | Seven cities are returned and Vaasa to Oulu exists in both route directions. |
| City cargo view | `GET /api/cities/:id/details` | Selected city returns related pickup cargo, including Vaasa cargo to Tampere and Oulu. |
| Matching logic | `GET /api/trucks/1/matches` | Truck A receives feasible matches, including Vaasa to Oulu cargo, with explanatory reasons. |
| Rejection logic | `GET /api/trucks/4/matches` | Unavailable Truck D receives no matches and cargo is rejected with status reason. |
| Frontend build | `npm --prefix frontend run build` | React application builds successfully for production. |

## Latest Local Result

```text
Backend test files: 1 passed
Backend tests: 5 passed
Frontend build: passed
```

## Notes

The tests use seeded prototype data and a fixed calculation timestamp. This keeps results repeatable and suitable for thesis reporting. The tests verify the MVP behavior, not a full production logistics system.

