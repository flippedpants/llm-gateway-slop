# LLM Gateway Developer Portal

This Vite/React portal is connected to the local Python gateway. It displays only live backend data; legacy mock telemetry and simulated settings have been removed.

## Run locally

Start PostgreSQL, Redis, and FastAPI from the repository root:

    docker compose up --build

Then start Vite:

    cd frontend
    npm install
    npm run dev

Open http://localhost:5173. Requests under /api are proxied to http://127.0.0.1:8000.

## Credentials

The Playground starts without a credential. Enter a PostgreSQL-backed gateway key; the value is retained in localStorage for convenience. The local seeded key is gw_demo_local.

Dashboard, Usage, Cache, and API Keys require the separate admin key. Enter it on Settings. It is stored only in sessionStorage and disappears when the browser session ends. Provider credentials remain server-side and are never exposed to the portal.

## Live pages

- Playground sends non-streaming OpenAI-style completions to /v1/chat/completions and tournament requests to /v1/tournaments. It renders cache, compression, token, candidate, winner, and judge metadata.
- Dashboard shows seven-day traffic, cache behavior, latency, tokens saved, and avoided calls.
- Usage reports measured provider calls, token efficiency, rate limits, compression, and judge statistics. Dollar estimates are intentionally omitted for the free local provider.
- Cache shows the configured threshold/model, similarity distribution, active entries, and prompt-free request activity.
- API Keys creates credentials with per-key token-bucket limits and revokes them.
- Settings tests health, manages the session-only admin key, and displays safe read-only runtime configuration.

## Checks

    npm test
    npm run build
