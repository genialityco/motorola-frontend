# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev     # Dev server on http://localhost:3000
npm run build   # Production build
npm run lint    # ESLint
```

No test runner is configured.

## Important: Next.js 16 Breaking Changes

**Read `node_modules/next/dist/docs/` before writing any Next.js-specific code.** APIs, file conventions, and routing behavior may differ from earlier versions. Heed deprecation notices.

## Environment

Copy `.env.example` if present; otherwise `.env` is committed with non-secret public Firebase config. Set `NEXT_PUBLIC_BACKEND_URL` to point at the NestJS API (default `http://localhost:3001`).

## Architecture

Next.js App Router. All admin pages live under `src/app/admin/` and are protected by `src/app/admin/layout.tsx`, which gates on Firebase Auth (email/password). Unauthenticated users are redirected to login.

**Key abstractions:**

- `src/lib/firebase.ts` — Firebase client initialization (Auth, Firestore, Storage); switches to emulators via `NEXT_PUBLIC_USE_EMULATORS`.
- `src/services/api.client.ts` — Thin HTTP client that auto-injects the current Firebase ID token. All ticket/host/bot-config mutations go through this.
- `src/hooks/` — Custom React hooks that encapsulate data fetching (`useTickets`, `useTicketDetail`, `useBotConfig`, `useHosts`, `useWhatsappSessions`, `useWhatsappHistory`, `useSimulator`). Prefer these over direct fetch calls.
- `src/types/index.ts` — Shared TypeScript interfaces (`Ticket`, `BotField`, `User`, etc.). Keep in sync with backend types manually.

**Main pages:**

- `/admin/dashboard` — Ticket list table with sorting, filtering, status transitions, inline editing, and Excel import.
- `/admin/dashboard/tickets/[id]` — Ticket detail with status history.
- `/admin/dashboard/chats` — WhatsApp session chat history viewer.
- `/admin/dev/simulator` — WhatsApp bot simulator (uses `POST /api/whatsapp/simulate`; hidden from nav).

**UI stack:** Mantine 9 (component library) + Tailwind CSS 4 (utilities). Use Mantine components for interactive elements; use Tailwind for layout and spacing. Do not mix Mantine's `sx` prop with Tailwind on the same element.
