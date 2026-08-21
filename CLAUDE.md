# Project instructions

NestJS boilerplate with relational (TypeORM/PostgreSQL) persistence.

## When adding entities or properties

Use the `generate` skill (auto-loaded from [.claude/skills/generate/SKILL.md](.claude/skills/generate/SKILL.md)). It documents the project's CLI generators (`npm run generate:resource:relational`, `npm run add:property:to-relational`) which keep DTOs, modules, and migrations in sync. Do not hand-write entity files.
