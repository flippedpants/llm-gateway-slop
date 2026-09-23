# LLM Gateway: Database and Configuration Setup

This guide sets up the complete local LLM Gateway: PostgreSQL with pgvector, Redis, FastAPI, local embeddings and models, and the React/Vite portal.

## 1. Prerequisites

Install:

- Docker Engine or Docker Desktop
- Docker Compose v2
- Node.js 20 or newer
- npm

Verify the tools:

```bash
docker --version
docker compose version
node --version
npm --version
```

PostgreSQL and Redis do not need to be installed directly on the host.

## 2. Create the environment file

From the repository root:

```bash
cd /home/daksh/programming/llm-gateway
cp .env.example .env
```

The default configuration is suitable for an offline local demo:

```dotenv
DATABASE_URL=postgresql+asyncpg://gateway:gateway_password@localhost:5433/llm_gateway
REDIS_URL=redis://localhost:6379/0

ADMIN_API_KEY=admin-local-demo
DEMO_API_KEY=gw_demo_local
RATE_LIMIT_DEMO_API_KEY=gw_demo_rate

CACHE_SIMILARITY_THRESHOLD=0.82
EMBEDDING_MODEL=BAAI/bge-small-en-v1.5
EMBEDDING_MODEL_PATH=

LOCAL_TOKEN_DELAY_MS=35
ENABLED_PROVIDERS=local

TOURNAMENT_PROVIDERS=local-concise,local-analytical,local-practical
JUDGE_PROVIDER=local-judge

GEMINI_API_KEY=
GROQ_API_KEY=
CEREBRAS_API_KEY=
```

The demo credentials are intentionally simple. Generate a stronger admin key before exposing the gateway outside your machine:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

Place the result in `.env` as `ADMIN_API_KEY`.

## 3. Host and Docker addresses

Processes running on the host use:

| Service | Address |
| --- | --- |
| PostgreSQL | `localhost:5433` |
| Redis | `localhost:6379` |
| FastAPI | `localhost:8000` |
| Vite frontend | `localhost:5173` |

Containers communicate using Compose service names:

| Service | Address |
| --- | --- |
| PostgreSQL | `postgres:5432` |
| Redis | `redis:6379` |

Consequently, the gateway container uses:

```text
postgresql+asyncpg://gateway:gateway_password@postgres:5432/llm_gateway
redis://redis:6379/0
```

The host-side `.env` uses `localhost:5433` and `localhost:6379`.

## 4. Start the backend stack

Build and start PostgreSQL, Redis, and FastAPI:

```bash
docker compose up --build -d
```

The first build downloads the BGE embedding model and bakes it into the image. Later builds normally reuse Docker's cache.

Check status:

```bash
docker compose ps
```

The `gateway`, `postgres`, and `redis` services should all become healthy. Inspect startup if necessary:

```bash
docker compose logs -f gateway
```

The gateway starts through `python -m scripts.start`. Startup runs `alembic upgrade head`, starts FastAPI, verifies the database and Redis, loads the embedding model, and seeds the local API keys.

## 5. PostgreSQL and pgvector

Compose creates:

```text
Database: llm_gateway
User: gateway
Password: gateway_password
Host port: 5433
Container port: 5432
```

PostgreSQL data persists in the named `postgres_data` Docker volume.

### Schema

Alembic creates:

- `alembic_version`: applied schema revision.
- `gateway_api_keys`: hashed keys, status, and per-key rate limits.
- `semantic_cache_entries`: 384-dimensional embeddings and cached responses.
- `request_logs`: prompt-free request, token, cache, rate-limit, and tournament telemetry.

The semantic cache uses a `vector(384)` column and an HNSW cosine index.

### Inspect the database

Open an interactive PostgreSQL shell:

```bash
docker compose exec postgres psql -U gateway -d llm_gateway
```

Run:

```sql
\dx
\dt
\di
SELECT * FROM alembic_version;

SELECT extname, extversion
FROM pg_extension
WHERE extname = 'vector';

SELECT indexname, indexdef
FROM pg_indexes
WHERE indexname = 'ix_semantic_cache_embedding_hnsw';
```

Exit with:

```sql
\q
```

A non-interactive migration check is:

```bash
docker compose exec postgres psql \
  -U gateway \
  -d llm_gateway \
  -c "SELECT * FROM alembic_version;"
```

Migrations are automatic during normal gateway startup. To apply them manually from a configured host environment:

```bash
alembic upgrade head
```

## 6. Redis

Redis uses database zero:

```text
redis://redis:6379/0
```

Append-only persistence is stored in the `redis_data` Docker volume. Redis contains token-bucket state, not semantic responses. Bucket keys use:

```text
rate_limit:<database-api-key-id>
```

Verify Redis:

```bash
docker compose exec redis redis-cli ping
```

Expected output:

```text
PONG
```

List bucket records safely:

```bash
docker compose exec redis redis-cli --scan --pattern 'rate_limit:*'
```

Inspect a bucket:

```bash
docker compose exec redis redis-cli HGETALL 'rate_limit:<key-id>'
```

Each bucket records its remaining fractional `tokens` and Redis-server `updated_at` timestamp. The Lua script performs refill and consumption atomically.

## 7. Credentials and API keys

### Gateway keys

Gateway keys authenticate:

- `POST /v1/chat/completions`
- `POST /v1/tournaments`
- `POST /v1/tools/compress`

Use either:

```http
X-Gateway-API-Key: gw_demo_local
```

or:

```http
Authorization: Bearer gw_demo_local
```

The seeded local key is `gw_demo_local`.

The seeded rate-limit demonstration key is `gw_demo_rate`. It has capacity 3 and refills at 0.2 requests per second, so four immediate requests trigger a 429 response.

### Admin key

The admin key is a separate environment secret, not a gateway key stored in PostgreSQL. Send it as:

```http
X-Admin-Key: admin-local-demo
```

It protects usage, runtime configuration, cache administration, and API-key lifecycle endpoints.

### Create a key

```bash
curl -X POST http://localhost:8000/v1/api-keys \
  -H "X-Admin-Key: admin-local-demo" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Local Client",
    "rate_limit_capacity": 20,
    "refill_rate_per_second": 1.0
  }'
```

The raw `key` is returned only once. PostgreSQL stores its SHA-256 hash.

List keys:

```bash
curl http://localhost:8000/v1/api-keys \
  -H "X-Admin-Key: admin-local-demo"
```

## 8. Embedding and semantic-cache settings

The default model is:

```text
BAAI/bge-small-en-v1.5
```

It produces 384-dimensional vectors. Docker stores the downloaded model under `/models/fastembed`.

The cache threshold is controlled by:

```dotenv
CACHE_SIMILARITY_THRESHOLD=0.82
```

A lookup is a cache hit when cosine similarity is greater than or equal to this threshold. Higher values require closer matches; lower values increase reuse but risk false matches.

Do not change `EMBEDDING_DIMENSIONS` or use a model with a different vector size without also changing the SQLAlchemy `Vector(384)` column, creating an Alembic migration, and rebuilding existing cache data and its index.

After changing runtime settings, recreate the gateway:

```bash
docker compose up -d --force-recreate gateway
```

## 9. Provider configuration

The offline default is:

```dotenv
ENABLED_PROVIDERS=local
TOURNAMENT_PROVIDERS=local-concise,local-analytical,local-practical
JUDGE_PROVIDER=local-judge
```

Registered provider names are:

- `local`
- `gemini`
- `groq`
- `cerebras`
- `local-concise`
- `local-analytical`
- `local-practical`
- `local-judge`

Docker Compose registers `gemini,groq,cerebras,local` automatically. Each cloud adapter checks only whether its matching API key is non-empty; adapters without a key disable themselves, and `local` remains the final fallback. You do not need to set `ENABLED_PROVIDERS` when running with Docker Compose.

`ENABLED_PROVIDERS` remains useful only when starting Python directly on the host. Expose other optional settings in Compose when you need to override their defaults:

```yaml
TOURNAMENT_PROVIDERS: ${TOURNAMENT_PROVIDERS:-local-concise,local-analytical,local-practical}
JUDGE_PROVIDER: ${JUDGE_PROVIDER:-local-judge}
DEFAULT_RATE_CAPACITY: ${DEFAULT_RATE_CAPACITY:-60}
DEFAULT_RATE_REFILL_PER_SECOND: ${DEFAULT_RATE_REFILL_PER_SECOND:-1.0}
COMPRESSION_MIN_TOKENS: ${COMPRESSION_MIN_TOKENS:-30}
COMPRESSION_TARGET_RATIO: ${COMPRESSION_TARGET_RATIO:-0.70}
GEMINI_MODEL: ${GEMINI_MODEL:-gemini-3.6-flash}
GROQ_MODEL: ${GROQ_MODEL:-openai/gpt-oss-20b}
CEREBRAS_MODEL: ${CEREBRAS_MODEL:-qwen-3.8-27b}
```

Example Groq configuration:

```dotenv
GROQ_API_KEY=your-groq-key
GROQ_MODEL=openai/gpt-oss-20b
```

Keeping `local` enabled provides an offline fallback. Rebuild or recreate the gateway after provider changes:

```bash
docker compose up --build -d gateway
```

## 10. Start the frontend

The frontend runs separately:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api/*` to `http://127.0.0.1:8000/*`, so the local setup needs no CORS middleware.

In the portal:

1. Open **Settings**.
2. Enter the admin key and save it for the session.
3. Open **API Keys** to create a key, or use `gw_demo_local`.
4. Open **Playground**.
5. Enter the gateway key manually.
6. Submit a normal request or enable tournament mode.

The admin key is stored only in `sessionStorage`. The gateway key is stored in `localStorage`.

## 11. Verify the installation

Health:

```bash
curl http://localhost:8000/health
```

Readiness:

```bash
curl http://localhost:8000/ready
```

Expected readiness fields are `postgres: ok`, `redis: ok`, and `embedder: ok`.

Send a completion:

```bash
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "X-Gateway-API-Key: gw_demo_local" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gateway-auto",
    "messages": [
      {"role": "user", "content": "Explain semantic caching."}
    ]
  }'
```

Check live telemetry:

```bash
curl http://localhost:8000/usage \
  -H "X-Admin-Key: admin-local-demo"
```

Run the complete CLI demonstration:

```bash
python3 -m scripts.demo all
```

## 12. Run FastAPI outside Docker

To keep only PostgreSQL and Redis in Docker:

```bash
docker compose up -d postgres redis

python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r requirements.txt
cp .env.example .env
python3 -m scripts.start
```

The host connection values are then correct:

```dotenv
DATABASE_URL=postgresql+asyncpg://gateway:gateway_password@localhost:5433/llm_gateway
REDIS_URL=redis://localhost:6379/0
```

## 13. Persistence, backups, and resets

Stop services while preserving data:

```bash
docker compose down
```

Restart with the existing volumes:

```bash
docker compose up -d
```

Clear semantic cache and rate buckets without deleting API keys or usage history:

```bash
curl -X POST http://localhost:8000/v1/admin/reset-demo \
  -H "X-Admin-Key: admin-local-demo"
```

Create a PostgreSQL backup:

```bash
docker compose exec -T postgres pg_dump \
  -U gateway llm_gateway > llm_gateway_backup.sql
```

Completely remove PostgreSQL and Redis data:

```bash
docker compose down -v
```

Warning: `-v` permanently deletes API keys, cache entries, request telemetry, migration state, and Redis bucket state.

## 14. Troubleshooting

### Port conflicts

The local ports are 8000, 5433, 6379, and 5173. Stop the conflicting process or change the left side of the corresponding Compose port mapping.

### Gateway is unhealthy

```bash
docker compose logs gateway
docker compose logs postgres
docker compose logs redis
```

### Database authentication fails

Ensure the PostgreSQL database, user, and password match the credentials embedded in `DATABASE_URL`.

### Admin pages remain locked

Enter the exact `ADMIN_API_KEY` value in frontend Settings. A gateway API key cannot authenticate admin endpoints.

### The embedding build fails

The initial image build needs internet access to download the model. Once the image is built, the default local runtime does not need internet or paid provider credentials.
