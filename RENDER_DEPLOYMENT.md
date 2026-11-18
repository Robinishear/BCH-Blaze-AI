# Render Deployment Environment Map

এই নোটটি Render-এ `client` ও `server`-কে আলাদা Docker web service হিসেবে deploy করার জন্য। এখানে কোনো বাস্তব secret বা account value রাখা হয়নি।

## Render Blueprint

Root-এর `render.yaml` একই monorepo থেকে `bch-blaze-server` ও `bch-blaze-client` নামে দুটি Free Docker web service তৈরি করে। এটি PostgreSQL বা Redis তৈরি করে না; বিদ্যমান external service-এর URL Render dashboard-এ Backend-এর `DATABASE_URL` ও `REDIS_URL` হিসেবে দিতে হবে। Free service idle থাকলে sleep/cold-start হতে পারে।

Blueprint-এ `sync: false` থাকা variable-গুলো Render dashboard-এ পূরণ করতে হবে। `BETTER_AUTH_SECRET`, `ACCESS_TOKEN_SECRET` ও `REFRESH_TOKEN_SECRET` Blueprint নিজে generate করে।

Deploy-এর পর পাওয়া backend/frontend URL অনুযায়ী:

- Frontend build arg `NEXT_PUBLIC_API_BASE_URL`: `https://<backend-public-url>/api/v1`
- Frontend runtime `BASE_URL`: `https://<backend-public-url>/api/v1` (অথবা Render-এর backend internal URL + `/api/v1`)
- Backend `FRONTEND_ORIGIN`: `https://<frontend-public-url>`
- Backend `BETTER_AUTH_URL`: `https://<backend-public-url>` — `/api/v1` suffix ছাড়া

Render frontend URL-টাই visitors-দের share করবে; backend URL API-ებისთვის.

## 1. Service setup

| Render service | Build context / root directory | Dockerfile |
|---|---|---|
| Frontend | `client/` | `Dockerfile.prod` |
| Backend | `server/` | `Dockerfile.prod` |

Render-এর দেওয়া `PORT` ব্যবহার করতে হবে। Backend config-এ `PORT` আবশ্যক; Render web service-এ এটি স্বয়ংক্রিয়ভাবে সেট হয়। Client-ও `HOSTNAME=0.0.0.0` দিয়ে listen করে।

## 2. আগে URL-গুলো ঠিক করো

নিচের placeholder-গুলো Render service তৈরি হওয়ার পরে পাওয়া URL দিয়ে বদলাবে:

- `<FRONTEND_PUBLIC_URL>`: যেমন `https://<frontend-service>.onrender.com`
- `<BACKEND_PUBLIC_URL>`: যেমন `https://<backend-service>.onrender.com`
- `<BACKEND_INTERNAL_URL>`: Render-এর private network-এ frontend service থেকে backend-এ পৌঁছানোর URL

URL-এ `localhost` ব্যবহার কোরো না। Browser-এর জন্য public backend URL, আর frontend server-এর server-side request-এর জন্য internal backend URL ব্যবহার করো।

## 3. Frontend service variables

`NEXT_PUBLIC_` variable client bundle-এ build-এর সময় বসে। Render-এ এগুলো Docker build-এর সময় build args হিসেবে দিতে হবে; শুধু runtime environment-এ দিলেই পুরোনো bundle বদলাবে না।

| Variable | Value / purpose |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `https://<backend-service>.onrender.com/api/v1` — Dockerfile-এ আবশ্যক build arg |
| `NEXT_PUBLIC_ELECTRUM_WS_URL` | `wss://bch.imaginary.cash:50004` — browser থেকে ব্যবহৃত; Dockerfile-এ এই default আছে, চাইলে build arg দিয়ে override করো |
| `BASE_URL` | `<BACKEND_INTERNAL_URL>/api/v1` — Next.js server থেকে backend call করার runtime variable |
| `NEXT_PUBLIC_BACKEND_URL` | Socket.IO feature ব্যবহার করলে backend-এর public origin, যেমন `https://<backend-service>.onrender.com`; optional |

`NEXT_PUBLIC_API_BASE_URL`-এ `/api/v1` থাকবে। `BASE_URL`-এও `/api/v1` থাকবে। `NEXT_PUBLIC_BACKEND_URL`-এ শুধু origin থাকবে, API path নয়।

## 4. Backend service variables

নিচের তালিকা `server/src/app/config/env.ts`-এর validation অনুযায়ী। Render dashboard-এ Backend service → Environment সেকশনে সেট করো।

| Variable | Production value / note |
|---|---|
| `NODE_ENV` | `production` — Docker image-এ আগেই সেট |
| `PORT` | Render স্বয়ংক্রিয়ভাবে দেয়; আলাদা করে hard-code কোরো না |
| `DATABASE_URL` | Render/Postgres connection URL |
| `FRONTEND_ORIGIN` | `<FRONTEND_PUBLIC_URL>`; শুধু origin, trailing slash নয় |
| `REDIS_URL` | Optional; না দিলে tracking events সরাসরি database-এ লেখা হয় |
| `CHAIN_MODE` | `real`; production-এ `mock` চলে না |
| `BCH_NETWORK` | Real mainnet deployment-এর জন্য `mainnet` |
| `BCH_XPUB` | Mainnet wallet-এর extended public key; private key নয় |
| `CHAIN_API_URL` | Blockchain data/API provider URL |
| `PRICE_API_URL` | BCH price provider URL |
| `BCH_CHECK_ADDRESS` | Server config-এ required; নির্বাচিত `BCH_XPUB`-এর সঙ্গে মেলে এমন check address |
| `BETTER_AUTH_URL` | `<BACKEND_PUBLIC_URL>`; `/api/v1` যোগ কোরো না |
| `BETTER_AUTH_SECRET` | Backend-only strong random secret |
| `ACCESS_TOKEN_SECRET` | Backend-only strong random secret |
| `REFRESH_TOKEN_SECRET` | Backend-only strong random secret |
| `ACCESS_TOKEN_EXPIRES_IN` | বর্তমান local value অনুযায়ী, যেমন `1d` |
| `REFRESH_TOKEN_EXPIRES_IN` | বর্তমান local value অনুযায়ী, যেমন `7d` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth ব্যবহার করলে Google credentials; server validation-এ দুটোই required |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | OAuth ব্যবহার করলে GitHub credentials; server validation-এ দুটোই required |
| `AI_PROVIDER` | `gemini` |
| `GEMINI_API_KEY` | Backend-only Gemini API key |
| `GEMINI_MODEL` | `gemini-3.5-flash-lite` — বর্তমানে কাজ করা model; deploy-এর সময় free-tier access যাচাই করো |
| `SMTP_HOST` / `SMTP_PORT` | SMTP provider-এর host ও port |
| `SMTP_USER` / `SMTP_PASS` | Backend-only SMTP credentials |
| `SMTP_FROM` | Email sender address |

`GOOGLE_*`, `GITHUB_*` ও `SMTP_*` server startup validation-এ required, যদিও সংশ্লিষ্ট feature ব্যবহার না করলেও। Placeholder বা ফাঁকা value দিলে backend start নাও হতে পারে।

## 5. Deploy checklist

1. Render-এ Postgres তৈরি করে `DATABASE_URL` Backend service-এ যোগ করো। Redis ব্যবহার করলে `REDIS_URL`-ও যোগ করো।
2. Backend Docker service deploy করো; `FRONTEND_ORIGIN` ও `BETTER_AUTH_URL`-এ পরবর্তীতে ব্যবহৃত public domain বসাও।
3. Frontend Docker service-এ `NEXT_PUBLIC_API_BASE_URL` এবং প্রয়োজনে `NEXT_PUBLIC_ELECTRUM_WS_URL` build args হিসেবে সেট করে deploy করো।
4. Frontend-এর runtime `BASE_URL`-এ backend-এর Render internal URL বসাও।
5. OAuth provider-এ callback URL-গুলো public backend domain-এর জন্য configure করো।
6. Deploy-এর পর login, invoice/payment, AI run, email এবং tracking পরীক্ষা করো।

## 6. Secret ও build সতর্কতা

- `NEXT_PUBLIC_` দিয়ে শুরু হওয়া value browser-এ দেখা যায়; সেখানে password, API key বা token secret রেখো না।
- `GEMINI_API_KEY`, database credentials, OAuth secrets, SMTP password, `BETTER_AUTH_SECRET`, `ACCESS_TOKEN_SECRET` ও `REFRESH_TOKEN_SECRET` শুধু Backend service-এ রাখো।
- `client/.env`-এর `JWT_ACCESS_SECRET` client code-এ ব্যবহৃত হচ্ছে না; এটি Frontend service-এ যোগ কোরো না। Backend-এর token secret variable হলো `ACCESS_TOKEN_SECRET` ও `REFRESH_TOKEN_SECRET`।
- `.env` file image বা Git-এ কপি না করে Render Environment settings ব্যবহার করো।
- `NEXT_PUBLIC_` value বদলালে frontend image rebuild/redeploy করো; runtime restart একা যথেষ্ট নয়।
