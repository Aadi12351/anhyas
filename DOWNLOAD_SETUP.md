# Downloaded source: MPSC Abhyas

Extract this ZIP and open the mpsc-abhyas folder in VS Code or another editor.

## Requirements and first commands
Node.js 22.13 or later; pnpm version from package.json; Cloudflare D1/Workers-compatible hosting for the existing runtime.

    pnpm install --frozen-lockfile
    pnpm dev

The development script normally selects port 5173. This source uses the Sites/Vinext Cloudflare runtime; it is not a single HTML file. Authentication and data features require database migrations and runtime secrets before they can work. Use HTTPS for the Secure authentication cookie.

## Database and secrets
Bind a D1 database as DB and apply drizzle/0000 through 0002 in order to your own database. Configure AUTH_JWT_SECRET and AUTH_PASSWORD_PEPPER in your host secret manager using independently generated cryptographically random values. .env.example lists the required names only; it does not configure hosting bindings automatically. Existing production secrets and user data are intentionally absent. Do not change the pepper on an existing database without an account migration strategy.

The .openai/hosting.json file is the original non-secret project configuration and is included because vite.config.ts imports it. It does not grant access to the hosted project. Moving to a different host requires configuring your own database/deployment bindings and adapting Sites-specific platform identity and access integration. The alternative ChatGPT sign-in depends on that platform.

## Useful checks
    node tests/auth-check.mjs
    node tests/account-check.mjs
    node tests/routes-check.mjs
    node tests/bank-check.mjs
    node tests/quantitative-check.mjs
    node node_modules/typescript/bin/tsc --noEmit

See README.md for app behavior, question-bank coverage, authentication details and current limitations. This export contains source, static assets, tests and migrations, not production accounts, scores, database contents, dependencies or build output.
