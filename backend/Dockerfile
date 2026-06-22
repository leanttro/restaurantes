FROM python:3.11-slim

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies first (layer cache)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Environment defaults (override at runtime or via docker-compose)
ENV DATABASE_URL=postgresql://user:pass@postgres:5432/reserva
ENV CELERY_BROKER_URL=sqla+postgresql://user:pass@postgres:5432/reserva
ENV CELERY_RESULT_BACKEND=db+postgresql://user:pass@postgres:5432/reserva
ENV EVOLUTION_API_URL=https://your-evolution-api.com
ENV EVOLUTION_API_TOKEN=change_me
ENV GROQ_API_KEY=change_me
ENV SECRET_KEY=change_me_use_long_random_string
ENV DEBUG=false

EXPOSE 8000

# Run migrations then start server
CMD ["sh", "-c", "alembic upgrade head && uvicorn main:app --host 0.0.0.0 --port 8000 --workers 2"]
