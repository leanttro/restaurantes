# 🍽️ Reserva de Restaurantes

Sistema completo de reservas de restaurantes com chatbot WhatsApp (Groq + Evolution API), dashboard de gestão e painel administrativo.

---

## 🗂️ Estrutura

```
reserva-restaurantes/
├── backend/           # FastAPI + SQLAlchemy + Alembic + Celery
├── frontend/          # Next.js 14 + Tailwind CSS
├── docker-compose.yml # Orquestração completa
├── nginx.conf         # Reverse proxy (produção)
├── .env.example       # Variáveis de ambiente (template)
└── README.md
```

---

## 🚀 Início rápido

### 1. Clonar e configurar variáveis

```bash
cp .env.example .env
# Edite o .env com suas chaves reais
```

### 2. Subir todos os serviços

```bash
docker-compose up -d
```

### 3. Acessar

| Serviço       | URL                          |
|---------------|------------------------------|
| Frontend      | http://localhost:3000        |
| Backend API   | http://localhost:8000        |
| Swagger Docs  | http://localhost:8000/docs   |
| PostgreSQL    | localhost:5432               |

---

## 🛠️ Comandos úteis

```bash
# Ver logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f celery_worker

# Parar tudo
docker-compose down

# Parar e remover volumes (APAGA O BANCO)
docker-compose down -v

# Recriar apenas um serviço
docker-compose up -d --build backend

# Rodar migrations manualmente
docker-compose exec backend alembic upgrade head

# Abrir shell no container do backend
docker-compose exec backend bash
```

---

## ⚙️ Variáveis de ambiente

| Variável                     | Descrição                          | Obrigatório |
|------------------------------|------------------------------------|-------------|
| `DB_PASSWORD`                | Senha do PostgreSQL                | ✅          |
| `SECRET_KEY`                 | Chave JWT (mín. 32 chars)          | ✅          |
| `GROQ_API_KEY`               | API Key do Groq (chatbot IA)       | ✅          |
| `EVOLUTION_API_URL`          | URL da sua instância Evolution API | ✅          |
| `EVOLUTION_API_TOKEN`        | Token da Evolution API             | ✅          |
| `NEXT_PUBLIC_API_URL`        | URL do backend acessível pelo browser | ✅       |
| `ACCESS_TOKEN_EXPIRE_MINUTES`| Expiração do token (padrão: 15)    | ❌          |
| `REFRESH_TOKEN_EXPIRE_DAYS`  | Expiração do refresh (padrão: 7)   | ❌          |
| `DEBUG`                      | Modo debug (padrão: false)         | ❌          |

---

## 🏗️ Serviços

- **postgres** — banco de dados principal
- **backend** — API FastAPI; roda migrations no boot via `alembic upgrade head`
- **celery_worker** — processamento assíncrono (envio de WhatsApp, lembretes)
- **frontend** — Next.js em modo produção (standalone)
- **nginx** — reverse proxy HTTPS (opcional em dev, recomendado em produção)

---

## 🔒 Produção

1. Apontar domínio para o servidor
2. Gerar certificados SSL (ex: Let's Encrypt / Certbot)
3. Colocar `cert.pem` e `key.pem` na pasta `./certs/`
4. Ajustar `server_name` no `nginx.conf`
5. Setar `ENVIRONMENT=production` e `DEBUG=false` no `.env`
6. `docker-compose up -d`

---

## 📚 Stack

| Camada      | Tecnologia                        |
|-------------|-----------------------------------|
| Backend     | Python 3.11, FastAPI, SQLAlchemy  |
| Banco       | PostgreSQL 15                     |
| Fila        | Celery (broker: PostgreSQL)       |
| IA / Chat   | Groq API                          |
| WhatsApp    | Evolution API                     |
| Frontend    | Next.js 14, React 18, Tailwind    |
| Proxy       | Nginx                             |
| Containers  | Docker + Docker Compose           |
