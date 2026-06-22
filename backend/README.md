# Reserva de Restaurantes — Backend API

FastAPI backend for a multi-tenant restaurant reservation SaaS with WhatsApp chatbot integration.

## Stack

- **FastAPI** + **SQLAlchemy 2** + **PostgreSQL**
- **Evolution API** — WhatsApp messaging
- **Groq** — AI chatbot with automatic model fallback
- **Celery** — background jobs (reminders), using PostgreSQL as broker (no Redis)
- **Alembic** — database migrations
- **Docker** + **Dokploy** on Contabo VPS

## Quick start (local)

```bash
# 1. Clone and configure
cp .env.example .env
# Fill in GROQ_API_KEY, EVOLUTION_API_*, SECRET_KEY

# 2. Start with Docker Compose
docker compose up --build

# API: http://localhost:8000
# Docs: http://localhost:8000/docs
```

## Manual setup (without Docker)

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start API
uvicorn main:app --reload

# Start Celery worker + beat (separate terminal)
celery -A app.celery_app worker --loglevel=info -B
```

## Migrations

```bash
# Create new migration after model changes
alembic revision --autogenerate -m "describe change"

# Apply migrations
alembic upgrade head

# Rollback one revision
alembic downgrade -1
```

## User Roles

| Role | Access |
|------|--------|
| `super_admin` | All restaurants, analytics, create restaurants |
| `restaurant_admin` | Their own restaurant: reservations, hours, promos, chatbot |
| `client` | Make reservations (guest checkout also supported) |

## API Overview

| Prefix | Description |
|--------|-------------|
| `POST /api/auth/register` | Register user |
| `POST /api/auth/login` | Login → JWT tokens |
| `GET /api/auth/me` | Current user |
| `GET /api/admin/restaurants` | List all restaurants (super_admin) |
| `GET /api/restaurant/{id}/dashboard` | Daily summary |
| `GET /api/restaurant/{id}/reservations` | List reservations |
| `POST /api/reservations/check-availability` | Check slots |
| `POST /api/reservations/create` | Create reservation (guest) |
| `POST /api/chatbot/message` | AI chatbot message |
| `POST /api/whatsapp/webhook` | Evolution API webhook |
| `GET /health` | Health check |

## WhatsApp Setup

1. Deploy Evolution API separately (see Evolution API docs)
2. Connect each restaurant's WhatsApp via Evolution API QR code
3. Save the `instance_id` in `restaurant.evolution_instance_id`
4. Configure the webhook URL in Evolution API → `https://your-api.com/api/whatsapp/webhook`

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SECRET_KEY` | JWT signing secret (keep long and random) |
| `GROQ_API_KEY` | Groq API key |
| `EVOLUTION_API_URL` | Evolution API base URL |
| `EVOLUTION_API_TOKEN` | Evolution API bearer token |
| `DEBUG` | Enable debug logging (`true`/`false`) |
