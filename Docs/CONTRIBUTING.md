# Contributing

Thanks for taking the time to contribute! This document explains how to work on this project and what to expect when opening a pull request.

---

## Getting started

1. Fork the repository and clone your fork locally.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the environment file and fill in your values:
   ```bash
   cp .env.example .env.local
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

---

## Branch naming

Use the following prefixes depending on the nature of your change:

| Prefix | Use case |
|---|---|
| `Features/` | New feature |
| `Fix/` | Bug fix |
| `Refactor/` | Code refactor without behavior change |
| `UI/` | UI / style changes |
| `DB/` | Database schema or migration changes (need to be in ./docs/Database/migrations) |
| `Docs/` | Documentation only |
| `Chore/` | Config, dependencies, maintenance |

Example: `fix/dashboard-item-count`, `features/shopping-list`

---

## Commit messages

```
<type> <description>

Example:
[ADD] add new field to inventory item
[FIX] correct typo in dashboard title
```

---

## Opening a pull request

The repository includes a PR template (`.github/PULL_REQUEST_TEMPLATE.md`). Please fill it in completely before requesting a review, in particular:

- Check the **type of change** that applies
- Describe **what changed** and **why**
- List any **bug fixes** with the root cause and the fix

---

## Database migrations

If your change involves a schema modification:

- Include the migration file in your PR
- Mention it explicitly in the PR description
- Make sure the migration is applied cleanly on a fresh database before opening the PR

---

## Code style

This project uses ESLint and Prettier. Before pushing, make sure your code passes:

```bash
npm run lint
```

No PR will be merged with linting errors.

---

## Questions

If you are unsure about anything, open a [Discussion](../../discussions) before starting work on a large change. It avoids wasted effort and makes reviews smoother.