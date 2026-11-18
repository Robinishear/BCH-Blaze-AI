# BCH Blaze AI

Pay for focused AI features one request at a time with Bitcoin Cash (BCH). BCH Blaze creates a payment invoice, verifies the payment on-chain, and then returns an AI-generated result. There are no subscriptions or card payments.

> **Mainnet notice:** The Render Blueprint in this repository configures real BCH mainnet payments. Transactions are irreversible. Do not use it for a public demo until the receiving wallet, pricing, domains, and production environment variables have been verified.

## What the project does

BCH Blaze is a full-stack web application and a small HTTP pay-per-request API. Its main user journey is:

1. A user signs in or uses the public API.
2. The user submits a prompt for an available AI feature.
3. The server calculates the BCH amount from the feature price and the current BCH/USD rate, then creates a time-limited invoice with a fresh BCH address.
4. The user pays with a connected BCH wallet or any wallet using the invoice address or QR code.
5. A server-side blockchain watcher verifies the payment.
6. After payment is confirmed, the server calls Gemini, stores the result, and returns it to the user.

The project also includes a user dashboard, an admin dashboard, usage and invoice records, and first-party website activity analytics.

## Features

- **Pay-per-request AI:** The currently configured features are `market-insight` ($0.03) and `prompt-suggest` ($0.02). Prices are configured in cents and converted to sats using the current BCH/USD rate from the configured price provider.
- **BCH invoices:** Each invoice has a fresh receiving address and expires after 15 minutes. The backend derives addresses from an extended public key; it does not need the receiving wallet's private key.
- **Wallet payments:** Users can connect a compatible wallet through WizardConnect or pay an invoice from any BCH wallet.
- **Quick pay:** A user can approve funding once for several runs. The browser then pays later invoices from a separate session wallet and can return its unused balance to the refund address.
- **AI results:** The server calls the configured Gemini model only after an invoice is paid. A result is saved so retrying a paid invoice does not charge the user again.
- **Accounts and history:** Email/password and Google/GitHub sign-in, password-reset email OTP, usage summaries, and request history.
- **Admin tools:** User and invoice management, usage metrics, and activity views for online visitors, events, pages, sessions, users, visitors, and IP addresses.
- **Agent-friendly API:** The public insight endpoint uses HTTP `402 Payment Required` to return payment instructions to scripts and agents without requiring an account.

### AI behavior and limitations

The `market-insight` prompt asks Gemini for a short analysis of a user-provided topic. It explicitly tells the model that it has no live market data and must not present current prices, volumes, or statistics as facts. The output is informational, not financial advice. `prompt-suggest` returns five improved prompts.

Gemini model access and rate limits depend on the API key and Google AI Studio project. Configure a model that is available to that key; do not assume that a free-tier key has unlimited capacity.

## How payment and AI execution work

### Dashboard flow

1. The client requests an invoice from the backend.
2. The backend validates the feature and prompt, fetches or reuses a cached BCH/USD rate, calculates the sats amount, stores the invoice, and derives its receiving address.
3. The client displays the amount and address. The user can approve a transaction in a connected wallet or pay using the QR/address.
4. The backend's chain watcher checks the BCH network and marks the invoice paid or underpaid.
5. The client polls invoice status. Once paid, it requests execution.
6. The backend calls Gemini and stores the prompt, result, token usage, and completed invoice state.

The invoice is tied to its owner (or to an anonymous request for the public API). An unpaid or expired invoice cannot run. A paid invoice with a saved result returns that result on retry.

### Public HTTP payment flow

Send a prompt without an invoice ID:

```http
POST /api/v1/insight
Content-Type: application/json

{"input":"What are the risks and drivers for Bitcoin Cash?"}
```

The API responds with `402 Payment Required` and fields including `invoiceId`, `payTo`, `amountSats`, `amountBch`, and `expiresAt`. Pay the exact amount, then call the same endpoint with the invoice ID:

```http
POST /api/v1/insight
Content-Type: application/json
X-Invoice-Id: <invoiceId>
```

While payment is pending, the API continues to return payment status. After the invoice is paid, it returns the AI result. This public endpoint currently creates `market-insight` invoices.

### Quick-pay wallet safety

The optional multi-run feature creates a separate BCH session wallet in the browser. Its private key is stored in that browser's `localStorage`; it is not the connected wallet's key and is not stored by the backend. The user approves the initial funding transaction once, and later runs are signed from that local session wallet without another wallet prompt.

Only set aside an amount you are comfortable keeping in that browser. Clearing browser data, losing access to the browser profile, or malicious browser code could make the local key or funds inaccessible or unsafe. Use the withdraw action to return unused funds before clearing browser data or switching devices.

## Architecture

| Component | Responsibility |
|---|---|
| `client/` | Next.js App Router frontend: public pages, authentication UI, user dashboard, wallet payments, and admin dashboard. |
| `server/` | Express API: authentication, invoices, pricing, BCH payment monitoring, Gemini calls, usage, admin operations, and activity tracking. |
| PostgreSQL | Persists users, invoices, usage results, wallet/auth records, and activity sessions/events through Prisma. |
| Redis (optional) | Queues tracking work. If `REDIS_URL` is unset, tracking falls back to direct database writes. |
| BCH network | Receives payments and provides transaction/address data through Electrum-compatible services. |
| Gemini API | Generates the paid AI result after the backend confirms payment. |
| External services | BCH/USD price data, email delivery, OAuth providers, and the configured blockchain data provider. |

### Repository layout

```text
client/                       Next.js frontend and production Dockerfile
  src/app/                    Public, user, and admin routes
  src/features/               Auth, invoices, quick-pay, usage, tracking, admin
server/                       Express API and production Dockerfile
  prisma/                     Prisma schema and database migrations
  src/app/modules/            Auth, invoices, pricing, AI, chain, tracking, admin
.github/workflows/cicd.yml    GitHub Actions build checks
render.yaml                   Render Blueprint for the frontend and backend
RENDER_DEPLOYMENT.md          Render environment and deployment checklist
```

## API overview

The backend API is mounted under `/api/v1`.

| Endpoint | Purpose |
|---|---|
| `POST /api/v1/insight` | Public, account-free `402` invoice flow for market insights. |
| `POST /api/v1/invoices` | Create an authenticated invoice for an available feature. |
| `GET /api/v1/invoices/:id` | Read invoice/payment status. |
| `POST /api/v1/invoices/:id/run` | Run or retry a paid invoice. |
| `GET /api/v1/usage` and `GET /api/v1/usage/summary` | Read the signed-in user's usage. |
| `/api/v1/admin/*` | Admin-only user, invoice, and analytics operations. |
| `POST /api/v1/track` | Ingest browser activity events. |
| `/api/v1/track/*` | Admin-only online, event, page, session, visitor, user, and IP activity views. |
| `/api/auth/*` | Better Auth endpoints for sessions and social sign-in. |

Authentication and rate limits apply to the relevant routes. The public insight endpoint is designed for machine callers as well as the website.

## Technology

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS, Axios, Socket.IO client, and WizardConnect.
- **Backend:** Node.js 22, Express 5, TypeScript, Prisma 7, PostgreSQL, optional Redis/BullMQ, Better Auth, and the Google GenAI/Gemini API.
- **Payments:** Bitcoin Cash mainnet integration using BCH address derivation, wallet signing, and Electrum-compatible connections.
- **CI:** GitHub Actions checks the server Prisma generation/build and the client type-check/production build.

## Local development

### Requirements

- Node.js 22.
- pnpm 12.11.2 for `server/`; pnpm 10.20.0 is used by the client Docker build.
- A PostgreSQL database.
- A Redis URL if queued tracking is desired; it is optional.
- Server-side credentials and provider URLs listed below.

### Configure environment

Create local environment files; never commit them.

The client needs:

- `NEXT_PUBLIC_API_BASE_URL`, normally `http://localhost:5000/api/v1`.
- `NEXT_PUBLIC_ELECTRUM_WS_URL` if overriding the default public Electrum WebSocket URL.
- `BASE_URL` is optional locally; it is used by Next.js server-side requests and should point to the backend API base.

The server requires database, auth, token, OAuth, BCH, AI, and SMTP settings. See `server/src/app/config/env.ts` for the validated names and [server/docs/BCH_Environment.md](server/docs/BCH_Environment.md) for BCH-specific configuration. `REDIS_URL` is optional. The server currently validates Google and GitHub OAuth variables and SMTP variables at startup, so configure them even if a particular sign-in or email feature is not being demonstrated.

Never put an API key, password, token secret, or wallet private key in a `NEXT_PUBLIC_` variable. Anything with that prefix is visible to browser code.

### Start the backend

From the repository root:

```bash
cd server
pnpm install --frozen-lockfile
pnpm generate
pnpm exec prisma migrate dev
pnpm dev
```

The API listens on the configured `PORT` (commonly `5000` locally).

### Start the frontend

In another terminal:

```bash
cd client
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://localhost:3000`. The client uses `NEXT_PUBLIC_API_BASE_URL` for browser-visible API calls; set `BASE_URL` when the Next.js server needs a different backend address.

## Production and Render deployment

The root `render.yaml` defines two Docker web services: `bch-blaze-server` and `bch-blaze-client`. It does not create PostgreSQL or Redis; set the URLs of your existing services in Render. The Blueprint uses Free web services, which can sleep when idle and have a cold start.

To deploy:

1. Push the repository to GitHub and create a Render Blueprint from the repository.
2. Fill the `sync: false` variables in the Render dashboard. Put database, Redis, OAuth, Gemini, SMTP, and server auth secrets on the backend only.
3. Before the backend serves traffic, apply the checked-in Prisma migrations to the production database from a trusted environment that can connect to it:

   ```bash
   cd server
   pnpm install --frozen-lockfile
   pnpm exec prisma migrate deploy
   ```

   The Render Blueprint does not run database migrations automatically. Use `migrate deploy`, not `migrate dev`, for production.
4. Set the frontend's `NEXT_PUBLIC_API_BASE_URL` to the public backend URL ending in `/api/v1`. It must be available to the Docker build because Next.js embeds `NEXT_PUBLIC_` values at build time.
5. Set the frontend runtime `BASE_URL` to the backend API base (public or Render internal URL). Set backend `FRONTEND_ORIGIN` and `BETTER_AUTH_URL` to the deployed origins.
6. Configure OAuth callback URLs and verify payment, email, AI, and tracking flows.
7. Share the **frontend** Render URL with visitors.

The Blueprint selects `CHAIN_MODE=real` and `BCH_NETWORK=mainnet`. This enables real, irreversible BCH payments. Verify the receiving xpub/address and all production settings before sharing the site.

See [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md) for the full Render variable map. Production Docker builds are also defined in `client/Dockerfile.prod` and `server/Dockerfile.prod`.

## CI

The workflow in `.github/workflows/cicd.yml` runs for pull requests and pushes to `main`. It installs dependencies with the package-manager versions used by each project, generates the Prisma client and builds the server, then type-checks and builds the client. The workflow does not run unit tests. To prevent a failing build from being merged, make the `server` and `client` checks required in GitHub branch protection or a ruleset for `main`.

## Operational and privacy notes

- Website activity analytics can record visitor/session IDs, paths, timestamps, user-agent/device details, and IP-derived location data. Review the data collection and retention policy before public launch.
- Use strong, unique secrets and HTTPS in production. Keep `.env` files out of Git and Docker build contexts.
- A free Render service may sleep; the first request after inactivity can be delayed.
- Market insights are generated text, not live financial data or financial advice.