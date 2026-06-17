# EthioJobs 🇪🇹 — Telegram Mini App Job Board

EthioJobs is a full-stack Telegram Mini App designed to connect job seekers and employers in Ethiopia. It integrates seamlessly within Telegram, allowing users to browse jobs, apply, and manage their profiles, while employers can post jobs directly via the bot.

## Features
- **Job Seekers:** Browse jobs, filter by categories, apply directly in the app, save jobs, and track applications.
- **Employers:** Post new jobs through the Telegram bot with an interactive conversation flow.
- **Admin:** Approve or reject job postings using an inline keyboard in Telegram.
- **Modern UI:** Built with React, TailwindCSS, and Telegram WebApp SDK for a native feel.
- **Backend:** Fast and asynchronous Python backend using FastAPI and PostgreSQL.
- **Caching:** Redis integration for performant API responses.

## Tech Stack
- **Frontend:** React, Vite, Tailwind CSS, React Router, `@twa-dev/sdk`
- **Backend:** FastAPI, SQLAlchemy (async), Alembic, Pydantic, PostgreSQL
- **Bot:** Python Telegram Bot (`python-telegram-bot`)
- **Infrastructure:** Docker, Docker Compose

## Prerequisites
- Docker and Docker Compose
- Node.js 20+ (for local frontend development)
- Python 3.11+ (for local backend development)
- A Telegram Bot Token from [@BotFather](https://t.me/BotFather)
- Upstash Redis (or local Redis)

## Quick Start (Docker)

1. **Clone the repository and set up `.env`**
   ```bash
   cp .env .env.local
   ```
   Update the variables in `.env` with your `BOT_TOKEN`, `ADMIN_ID`, and database/redis URLs.

2. **Run Docker Compose**
   ```bash
   docker-compose up -d --build
   ```

3. **Database Migrations**
   The backend container will automatically run Alembic migrations on startup, but you can also run them manually:
   ```bash
   docker-compose exec backend alembic upgrade head
   ```

## Development Setup

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Telegram Bot
```bash
cd bot
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

## Available Bot Commands
- `/start` - Launch the Mini App
- `/help` - Show instructions
- `/postjob` - Start the job posting conversation
- `/myjobs` - View jobs you have posted
- `/pendingjobs` - (Admin only) Review and approve/reject pending jobs

## Deployment
EthioJobs includes scripts for production deployment.
1. Build the frontend into the backend's static directory using `./build.bat` (Windows) or `./build.sh` (Linux/Mac).
2. Use `docker-compose.prod.yml` to run the stack using Gunicorn for the backend.
