# Ctrl-Alt-Elite Login Tests

## Structure

- [pages/LoginPage.ts](pages/LoginPage.ts): browser locators and login/logout actions.
- [pages/loginApi.ts](pages/loginApi.ts): JSON requests to the backend login API.
- [fixtures/testFixtures.ts](fixtures/testFixtures.ts): typed `loginPage`,
  `loginApi`, `loginEmail`, and `loginCredentials` fixtures, plus `test` and `expect`.
- [tests/login.spec.ts](tests/login.spec.ts): browser login and session tests.
- [tests/loginApi.spec.ts](tests/loginApi.spec.ts): backend login response tests.

Browser tests run in Chromium, Firefox, and WebKit, each with a fresh context.
API tests run once in the `api` project and do not launch a browser.

## Setup

Use Node.js 22.9 or later. Start the frontend, backend, and database first.
The frontend needs `BACKEND_ORIGIN` pointing to the backend and a valid
`JWT_SECRET`. Tests use real services: they do not create accounts, seed data,
or mock login responses. Use an existing **CUSTOMER test account**, not a
production account.

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

The Playwright configuration loads `.env` automatically, including when tests
are launched from VS Code. No terminal `source` command is needed. Quote values
containing spaces or `#`. Existing environment variables take precedence, so CI
can supply credentials without an environment file. Never commit `.env` or
credentials.

Wrong-password tests require only `LOGIN_EMAIL`. Successful-login tests also
require `LOGIN_PASSWORD`. Missing values fail with a setup message rather than
silently skipping coverage. The configured password must differ from the
deliberately wrong password used in the tests.

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

## Coverage

Browser tests check accessible form fields, password masking/show/hide, native
input validation, unknown accounts, incorrect passwords, successful login,
retry after rejection, profile authorization, session persistence after reload,
and logout through the homepage account dropdown.

API tests send JSON to `POST /api/auth/login`. Success returns HTTP 200 with
`userId`, `email`, `role`, and `token`. Incorrect passwords and unknown accounts
return HTTP 401 with `{ "message": "Incorrect email or password." }`. A backend
outage is not accepted as a passing rejected-login test.

Traces are disabled because requests contain passwords and responses can contain
tokens or session cookies. Treat reports as private too; they can contain the
test email. Screenshots, video, and saved login state are not enabled.
