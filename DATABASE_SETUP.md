# SUI-FX Database Setup Instructions

## Option 1: Using Docker (Recommended)

1. Install Docker Desktop: https://www.docker.com/products/docker-desktop
2. Run the following commands:

```bash
cd "c:\Users\Charan N\sui-faucet-core\sui-faucet-core"
docker compose -f docker-compose.dev.yml up -d
```

## Option 2: Local PostgreSQL Setup

1. Install PostgreSQL: https://www.postgresql.org/download/windows/
2. Install Redis: https://github.com/microsoftarchive/redis/releases
3. Create database:

```bash
# Connect to PostgreSQL
psql -U postgres
CREATE DATABASE suifx_db;
CREATE USER suifx_user WITH PASSWORD 'suifx_password';
GRANT ALL PRIVILEGES ON DATABASE suifx_db TO suifx_user;
\q

# Initialize database
psql -U suifx_user -d suifx_db -f scripts/init-db.sql
```

## Option 3: SQLite for Development (Quick Start)

For immediate testing, we can modify the system to use SQLite:

1. Install sqlite3: `npm install sqlite3`
2. Update DATABASE_URL in .env: `sqlite:./suifx.db`

## Current Status

Your .env file has been configured with:
- DATABASE_URL: postgresql://suifx_user:suifx_password@localhost:5432/suifx_db
- REDIS_URL: redis://localhost:6379
- API_KEY: suifx-prod-key-2025-secure

Choose an option above to complete database setup!
