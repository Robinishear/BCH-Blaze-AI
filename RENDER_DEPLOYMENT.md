# Render Deployment Environment Map

This document explains how to deploy the `client` and `server` as separate Docker web services on Render. No actual secrets or account-specific values are included.

## Render Blueprint

The root-level `render.yaml` creates two Free Docker web services from the same monorepo:

- `bch-blaze-server`
- `bch-blaze-client`

It does not create PostgreSQL or Redis instances. You must provide the URLs of your existing external services in the Backend service's Render dashboard as `DATABASE_URL` and `REDIS_URL`.

**Note:** Free services may spin down when idle, resulting in cold starts.

Variables marked as `sync: false` in the Blueprint must be configured manually in the Render dashboard. The Blueprint automatically generates `BETTER_AUTH_SECRET`, `ACCESS_TOKEN_SECRET`, and `REFRESH_TOKEN_SECRET`.

After deployment, configure the URLs using the public URLs assigned to your Render services:

- Frontend build argument `NEXT_PUBLIC_API_BASE_URL`: `https://<backend-public-url>/api/v1`
- Frontend runtime `BASE_URL`: `https://<backend-public-url>/api/v1` (or the Render backend internal URL + `/api/v1`)
- Backend `FRONTEND_ORIGIN`: `https://<frontend-public-url>`
- Backend `BETTER_AUTH_URL`: `https://<backend-public-url>` — without the `/api/v1` suffix.

Share the Render frontend URL with visitors. The backend URL is used for API requests.

## 1. Service Setup

| Render Service | Build Context / Root Directory | Dockerfile        |
| -------------- | ------------------------------ | ----------------- |
| Frontend       | `client/`                      | `Dockerfile.prod` |
| Backend        | `server/`                      | `Dockerfile.prod` |

Both services must use the `PORT` provided by Render.

The backend configuration requires `PORT`, which Render automatically assigns to web services. The client must also listen on `0.0.0.0` using `HOSTNAME=0.0.0.0`.

## 2. Configure the URLs First

Replace the following placeholders with the actual URLs assigned after creating your Render services:

- `<FRONTEND_PUBLIC_URL>`: For example, `https://<frontend-service>.onrender.com`
- `<BACKEND_PUBLIC_URL>`: For example, `https://<backend-service>.onrender.com`
- `<BACKEND_INTERNAL_URL>`: The private network URL used by the frontend service to communicate with the backend within Render.

**Do not use `localhost` in production URLs.**

Use the public backend URL for browser-side requests and the internal backend URL for server-side requests originating from the frontend service.

## 3. Frontend Service Environment Variables

Variables prefixed with `NEXT_PUBLIC_` are embedded into the client bundle at build time.

Therefore, these values must be provided as Docker build arguments in Render. Setting them only as runtime environment variables will not update an already-built bundle.

| Variable                      | Value / Purpose                                                                                                                                             |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL`    | `https://<backend-service>.onrender.com/api/v1` — Required Docker build argument                                                                            |
| `NEXT_PUBLIC_ELECTRUM_WS_URL` | `wss://bch.imaginary.cash:50004` — Used by the browser. This default is already configured in the Dockerfile, but can be overridden using a build argument. |
| `BASE_URL`                    | `<BACKEND_INTERNAL_URL>/api/v1` — Runtime variable used by Next.js server-side requests to communicate with the backend.                                    |
| `NEXT_PUBLIC_BACKEND_URL`     | Backend public origin, for example, `https://<backend-service>.onrender.com`. Optional; required only if the Socket.IO feature is used.                     |

**Important URL rules:**

- `NEXT_PUBLIC_API_BASE_URL` must include `/api/v1`.
- `BASE_URL` must also include `/api/v1`.
- `NEXT_PUBLIC_BACKEND_URL` must contain only the backend origin, without the API path.

## 4. Backend Service Environment Variables

The following list is based on the validation rules defined in `server/src/app/config/env.ts`.

Configure these variables under:

**Render Dashboard → Backend Service → Environment**

| Variable                                    | Production Value / Notes                                                                             |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `NODE_ENV`                                  | `production` — Already configured in the Docker image.                                               |
| `PORT`                                      | Automatically provided by Render. Do not hard-code it.                                               |
| `DATABASE_URL`                              | PostgreSQL connection URL.                                                                           |
| `FRONTEND_ORIGIN`                           | `<FRONTEND_PUBLIC_URL>` — Origin only, without a trailing slash.                                     |
| `REDIS_URL`                                 | Optional. If omitted, tracking events are written directly to the database.                          |
| `CHAIN_MODE`                                | `real` — Production does not support `mock` mode.                                                    |
| `BCH_NETWORK`                               | `mainnet` for a real mainnet deployment.                                                             |
| `BCH_XPUB`                                  | Extended public key of the mainnet wallet. Never use a private key.                                  |
| `CHAIN_API_URL`                             | Blockchain data/API provider URL.                                                                    |
| `PRICE_API_URL`                             | BCH price provider URL.                                                                              |
| `BCH_CHECK_ADDRESS`                         | Required by the server configuration. Must match an address derived from the selected `BCH_XPUB`.    |
| `BETTER_AUTH_URL`                           | `<BACKEND_PUBLIC_URL>` — Do not append `/api/v1`.                                                    |
| `BETTER_AUTH_SECRET`                        | Strong random secret. Backend only.                                                                  |
| `ACCESS_TOKEN_SECRET`                       | Strong random secret. Backend only.                                                                  |
| `REFRESH_TOKEN_SECRET`                      | Strong random secret. Backend only.                                                                  |
| `ACCESS_TOKEN_EXPIRES_IN`                   | Use the current local value, for example, `1d`.                                                      |
| `REFRESH_TOKEN_EXPIRES_IN`                  | Use the current local value, for example, `7d`.                                                      |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth credentials. Both are required by server validation.                                    |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | GitHub OAuth credentials. Both are required by server validation.                                    |
| `AI_PROVIDER`                               | `gemini`.                                                                                            |
| `GEMINI_API_KEY`                            | Gemini API key. Backend only.                                                                        |
| `GEMINI_MODEL`                              | `gemini-3.5-flash-lite` — Currently working model. Verify free-tier availability at deployment time. |
| `SMTP_HOST` / `SMTP_PORT`                   | SMTP provider hostname and port.                                                                     |
| `SMTP_USER` / `SMTP_PASS`                   | SMTP credentials. Backend only.                                                                      |
| `SMTP_FROM`                                 | Email sender address.                                                                                |

**Important:** `GOOGLE_*`, `GITHUB_*`, and `SMTP_*` variables are required by the server startup validation, even if you do not use the corresponding features.

Leaving these values empty or using placeholders may prevent the backend from starting.

## 5. Deployment Checklist

1. Create a PostgreSQL database on Render and add its connection URL as `DATABASE_URL` to the Backend service. If you use Redis, also configure `REDIS_URL`.
2. Deploy the Backend Docker service. Configure `FRONTEND_ORIGIN` and `BETTER_AUTH_URL` using the appropriate public service URLs.
3. Configure `NEXT_PUBLIC_API_BASE_URL` and, if necessary, `NEXT_PUBLIC_ELECTRUM_WS_URL` as Docker build arguments for the Frontend service. Then deploy it.
4. Set the Frontend runtime `BASE_URL` to the backend's Render internal URL, including `/api/v1`.
5. Configure the OAuth callback URLs in your Google and GitHub OAuth provider settings to use the public backend domain.
6. After deployment, test the following features:
   - User login and authentication
   - Invoice creation and payment processing
   - AI requests and responses
   - Email delivery
   - Tracking functionality

## 6. Secrets and Build Considerations

- Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. Never store passwords, API keys, or token secrets in them.
- Keep `GEMINI_API_KEY`, database credentials, OAuth secrets, SMTP passwords, `BETTER_AUTH_SECRET`, `ACCESS_TOKEN_SECRET`, and `REFRESH_TOKEN_SECRET` exclusively in the Backend service.
- `JWT_ACCESS_SECRET` in `client/.env` is not used by the client code. Do not add it to the Frontend service. The backend token secret variables are `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET`.
- Do not copy `.env` files into Docker images or commit them to Git. Use Render Environment settings instead.
- Whenever a `NEXT_PUBLIC_` variable changes, rebuild and redeploy the frontend image. Restarting the service alone is not sufficient.
