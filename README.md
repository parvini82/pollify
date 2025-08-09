# Pollify
A simple survey builder and analytics platform using Node.js (TypeScript), Express, Prisma, and PostgreSQL.

## Quick start
```bash
docker compose up -d db
cd server
cp .env.example .env
npm ci
npx prisma generate
npm run dev
```
Open http://localhost:3000/health
