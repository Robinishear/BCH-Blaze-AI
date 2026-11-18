# Docker Build and Run Guide

This guide builds and runs the BCH Blaze frontend and backend Docker images on a Linux machine. PostgreSQL and Redis are expected to be already available; this guide does not create database containers.

For a Render deployment, use the [Render deployment guide](./RENDER_DEPLOYMENT.md) instead.

## Before you start

- Install Docker.
- Configure the required backend variables in `server/.env` using `server/src/app/config/env.ts` and [the BCH environment guide](./server/docs/BCH_Environment.md). Do not commit this file.
- Set `PORT=5000`, `FRONTEND_ORIGIN=http://localhost:3000`, and `BETTER_AUTH_URL=http://localhost:5000` for this local setup.
- Make sure PostgreSQL and optional Redis are reachable from inside the backend container. `localhost` inside a container means that container, not your Linux host. For a service running directly on the host, use `host.docker.internal` in its URL; the backend command below maps that name to the host gateway.
- Use external/remote service URLs as provided by their service when PostgreSQL or Redis is hosted elsewhere.

## 1. Apply database migrations

Before the first run, apply the checked-in migrations to the database configured by `server/.env`:

```bash
cd server
pnpm install --frozen-lockfile
pnpm exec prisma migrate deploy
cd ..
```

Run this again after a database schema change. Use `migrate deploy`, not `migrate dev`, against a production database.

## 2. Create a Docker network

Run once:

```bash
docker network create bch-blaze-net
```

The network lets the frontend container reach the backend using the backend container name.

## 3. Build and start the backend

Run from the repository root:

```bash
docker build -f server/Dockerfile.prod -t bch-blaze-server:local ./server

docker run -d \
  --name bch-blaze-server \
  --network bch-blaze-net \
  --add-host=host.docker.internal:host-gateway \
  --env-file ./server/.env \
  -p 5000:5000 \
  --restart unless-stopped \
  bch-blaze-server:local
```

Check that it is running:

```bash
docker logs -f bch-blaze-server
```

The backend health endpoint is `http://localhost:5000/health`.

## 4. Build and start the frontend

The API URL embedded in the browser bundle must be reachable from the browser. For local use, build with `http://localhost:5000/api/v1`:

```bash
docker build -f client/Dockerfile.prod \
  --build-arg NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1 \
  --build-arg NEXT_PUBLIC_ELECTRUM_WS_URL=wss://bch.imaginary.cash:50004 \
  -t bch-blaze-client:local ./client

docker run -d \
  --name bch-blaze-client \
  --network bch-blaze-net \
  -e BASE_URL=http://bch-blaze-server:5000/api/v1 \
  -p 3000:3000 \
  --restart unless-stopped \
  bch-blaze-client:local
```

Open `http://localhost:3000` in a browser. `NEXT_PUBLIC_API_BASE_URL` is a build argument because Next.js embeds it into the client bundle. `BASE_URL` is the backend URL used by the running Next.js server, so it uses the Docker network name `bch-blaze-server`.

## Useful commands

```bash
docker ps
docker logs -f bch-blaze-server
docker logs -f bch-blaze-client
docker stop bch-blaze-client bch-blaze-server
```

When rebuilding an image, stop and remove the old container with the same name before running its replacement. The image build alone does not replace a running container.

## Using a public server

For a real deployment, replace the local URLs:

- Build-time `NEXT_PUBLIC_API_BASE_URL`: the public backend URL ending in `/api/v1`.
- Frontend runtime `BASE_URL`: a backend URL reachable from the frontend container, ending in `/api/v1`.
- Backend `FRONTEND_ORIGIN`: the deployed frontend origin.
- Backend `BETTER_AUTH_URL`: the deployed backend origin, without `/api/v1`.

Do not use the local `localhost` settings above on a remote host. The Render Blueprint selects `CHAIN_MODE=real` and `BCH_NETWORK=mainnet`; BCH mainnet payments are real and irreversible. Verify the receiving wallet and all production settings before accepting payments.
