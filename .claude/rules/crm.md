---
paths:
  - "crm/**/*.{ts,tsx,js,json,css,cjs}"
---

# CRM Rules

- Use `npm` inside `crm`.
- Stack: Vite + React + TypeScript + Tailwind.
- API base URL comes from `VITE_API_URL`; use `crm/.env.example` for the expected variable shape.
- When changing layout or UI primitives, keep `src/components/ui/*` usage patterns consistent across pages.
- Prefer `npm run build` as the main validation command for CRM changes.
