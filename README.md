# Ctrl-Alt-Elite Login Tests

## Structure

- [pages/LoginPage.ts](pages/LoginPage.ts): browser locators and login/logout actions.
- [pages/loginApi.ts](pages/loginApi.ts): JSON requests to the backend login API.
- [fixtures/testFixtures.ts](fixtures/testFixtures.ts): typed `loginPage`,
    `loginApi`, `loginEmail`, `loginCredentials`, `customerUser`, `adminUser`,
    `customerServiceUser`, and `inventoryManagementUser` fixtures, plus `test` and `expect`.
- [tests/login.spec.ts](tests/login.spec.ts): browser login and session tests.
- [tests/loginApi.spec.ts](tests/loginApi.spec.ts): backend login response tests.
- [pages/AdminOrdersApi.ts](pages/AdminOrdersApi.ts): logs in through the API and calls the admin orders and sales report endpoints.
- [pages/AdminPortalPage.ts](pages/AdminPortalPage.ts): locators for the admin Orders, Reports and Dashboard pages.
- [tests/adminOrdersApi.spec.ts](tests/adminOrdersApi.spec.ts): API tests for `/api/admin/orders` and `/api/admin/reports/sales`.
- [tests/adminOrders.spec.ts](tests/adminOrders.spec.ts): browser tests for the admin Orders, Reports and Dashboard pages.

Browser tests run in Chromium, Firefox, and WebKit, each with a fresh context.
API tests run once in the `api` project and do not launch a browser.

## Setup

Use Node.js 22.9 or later. Start the frontend, backend, and database first.
The frontend needs `BACKEND_ORIGIN` pointing to the backend and a valid
`JWT_SECRET`. Tests use real services: they do not create accounts, seed data,
or mock login responses. Use existing test accounts for customer, admin,
customer service, and inventory management, not production accounts. Each named
user fixture must be configured with an account that has the corresponding role.

```sh
npm ci
npx playwright install
```

For a new checkout, copy `.env.example` to `.env`. Do not overwrite an existing
local `.env`. Set these variables there:

| Variable | Value |
| --- | --- |
| `BASE_URL` | Frontend origin, default `http://127.0.0.1:3000` |
| `API_BASE_URL` | Backend origin, default `http://127.0.0.1:3001` |
| `LOGIN_EMAIL` | Existing CUSTOMER test account email |
| `LOGIN_PASSWORD` | That account's correct password |
| `CUSTOMER_EMAIL` / `CUSTOMER_PASSWORD` | Customer test account credentials |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Admin test account credentials |
| `CUSTOMER_SERVICE_EMAIL` / `CUSTOMER_SERVICE_PASSWORD` | Customer service test account credentials |
| `INVENTORY_MANAGEMENT_EMAIL` / `INVENTORY_MANAGEMENT_PASSWORD` | Inventory management test account credentials |

The Playwright configuration loads `.env` automatically, including when tests
are launched from VS Code. No terminal `source` command is needed. Quote values
containing spaces or `#`. Existing environment variables take precedence, so CI
can supply credentials without an environment file. Never commit `.env` or
credentials.

Wrong-password tests require only `LOGIN_EMAIL`. Successful-login tests also
require `LOGIN_PASSWORD`. Missing values fail with a setup message rather than
silently skipping coverage. The configured password must differ from the
deliberately wrong password used in the tests.

The named user fixtures load credentials only when requested by a test. Missing
role-account credentials fail with a setup message. Customer login checks the
homepage; staff login checks the authenticated profile without assuming a
role-specific dashboard redirect. The inventory dashboard tests also use
`inventoryManagementUser`.

`LOGIN_EMAIL` and `LOGIN_PASSWORD` remain independent of the named user fixtures.
The existing customer retry/session browser tests use them, while API login
tests accept any valid account and do not assert its role.

## Commands

```sh
npm run typecheck
npm test
npm run test:login
npm run test:login:api
npm run test:login:browser -- --project=chromium
npm run test:login -- --project=chromium --project=api
npm run test:login:ui
npx playwright show-report
```

`test:login` runs all login tests: API checks once and browser checks in all three
browsers. `test:login:ui` opens Playwright's interactive test runner.

Admin orders and reports tests:

```sh
npm run test:orders
npm run test:orders:api
npm run test:orders:browser -- --project=chromium
```

## Coverage

### Admin orders and reports

These 10 tests need the `ADMIN`, `CUSTOMER_SERVICE` and `CUSTOMER` accounts from
`.env`. They read the existing data and do not create orders, so they pass
whether or not any orders exist.

API tests (4, `api` project): requests without a valid token get 401 on every
endpoint; customers get 403, customer service can read orders but not reports,
and admins can read both; the order list returns the documented fields, pages
correctly, returns an empty page with real totals past the end, and the order
detail leaks no credentials; invalid query values, invalid report ranges, a
non-UUID order id (400) and an unknown order id (404) return a `message`.

Browser tests (6): the admin Orders page shows a total; filtering by status;
the empty state and "Clear filters" for a search with no matches; running a
sales report for a date range; customer service sees Orders but no Reports link
and is denied the Reports page; the dashboard Orders card matches the API total.

### Login

Browser tests check accessible form fields, password masking/show/hide, native
input validation, unknown accounts, incorrect passwords, successful login,
login for all four user types, retry after rejection, profile authorization, session persistence after reload,
and logout through the homepage account dropdown.

API tests send JSON to `POST /api/auth/login`. Success returns HTTP 200 with
`userId`, `email`, and `token`; the tests do not require or check a role. Incorrect passwords and unknown accounts
return HTTP 401 with `{ "message": "Incorrect email or password." }`. A backend
outage is not accepted as a passing rejected-login test.

Traces are disabled because requests contain passwords and responses can contain
tokens or session cookies. Treat reports as private too; they can contain the
test email. Screenshots, video, and saved login state are not enabled.
