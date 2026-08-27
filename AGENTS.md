# AGENTS.md

## Project

Cyber Wolf API — NestJS 11 REST backend with TypeORM + PostgreSQL.

## Commands

`npm run start:dev` (local dev), `npm run build`, `npm run start:prod`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run test:e2e`, `npm run migration:run`, `npm run migration:generate`, `npm run seed:run:relational`.

Docker local stack: `docker compose up -d` (Postgres + API). E2E in Docker: `npm run test:e2e:relational:docker`.

## Critical Rules

- **Never hand-write entity files** — use generators (see AI Skills below)
- **Conventional commits** required (commitlint enforced)
- **Pre-commit**: lint-staged (ESLint + Prettier on staged `*.ts` only)
- **CI** (`main` / `develop`): full lint, typecheck, test, build; Docker e2e on push/PR
- **Do not bake `.env` into Docker images** — runtime config via compose / server `.env`
- **Production startup** does not run seeds — migrations + `start:prod` only
- **Node ≥ 16** · **`package-lock.json`** (npm, not pnpm/yarn)

## Environments

| 环境 | 地址 |
| --- | --- |
| 本地 | `http://localhost:3001` |
| 测试 (`develop`) | `https://cyber-wolf-backend-dev.qibmz.com` |
| 正式 (`main`) | `https://cyber-wolf-backend.qibmz.com` |

Swagger: `/docs` · API prefix: `/api/v1/...`

部署：`push main/develop` → GitHub Actions 构建镜像 → 轻量服务器 `docker compose pull && up`。环境变量在服务器 `/opt/cyber-wolf/{prod,dev}/.env`，不进仓库。

CORS：通过 `APP_CORS_ORIGINS`（逗号分隔）放行前端 Origin；Vercel 预览域需单独添加。

## Architecture Essentials

**Config**: `@nestjs/config` + `src/config/`. Copy `env-example-relational` to `.env` for local dev.

**DB**: TypeORM migrations in `src/database/migrations/`. `DATABASE_SYNCHRONIZE=false` in production.

**Auth**: JWT (`AUTH_JWT_*`), refresh tokens, email login, Web3 wallet (SIWE). Role: `admin` / `user`.

**Response shape**: `{ code, msg, data }` via global interceptors in `src/main.ts`.

**Files**: `FILE_DRIVER=local` or S3/R2 (`src/files/`).

## AI Skills

When adding entities or properties, use the `generate` skill:

[.claude/skills/generate/SKILL.md](.claude/skills/generate/SKILL.md)

```bash
npm run generate:resource:relational
npm run add:property:to-relational
```

These keep entities, DTOs, modules, and migrations in sync.
