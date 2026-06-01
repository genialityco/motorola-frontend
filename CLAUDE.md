# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Dev server on port 3000 with hot reload
npm run build    # Optimized production build
npm start        # Serve production build
npm run lint     # ESLint check
```

No test runner is configured.

## Environment Setup

Copy `.env.local.example` to `.env.local`. Key variables:

```
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001   # NestJS backend
NEXT_PUBLIC_USE_EMULATORS=false                 # true = Firebase emulators
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

Firebase emulators run on the same ports as the backend (`firebase emulators:start`). All `NEXT_PUBLIC_` vars are exposed to the browser at runtime.

## Architecture

Next.js 15 App Router. All pages and hooks use `"use client"` — there are no server components with data fetching. Styling via Mantine UI + Tailwind CSS 4.

**Three-layer pattern: hooks → services → API client**

```
Firestore (real-time) ──→ hooks ──→ pages/components
Component actions ──→ hooks ──→ services ──→ api.client.ts ──→ NestJS backend
```

**`src/lib/firebase.ts`** — Initializes Firebase app once. Connects to emulators when `NEXT_PUBLIC_USE_EMULATORS=true`. Exports `auth`, `db`, `storage` and a `COLLECTIONS` constant — all Firestore collection names go through it (`COLLECTIONS.TICKETS`, `SESSIONS`, `HOSTS`, `BOT_CONFIG`, `GESTORS`). Never hardcode collection strings.

**`src/services/api.client.ts`** — Fetch-based HTTP client (no axios). Injects `Authorization: Bearer <token>` from `auth.currentUser?.getIdToken()` on every request. Has `get`, `post`, `patch`, `delete`, `postForm` methods. Throws with the backend's error message on non-2xx responses.

**Service files** are thin wrappers over `apiClient` with typed return values:
- `tickets.service.ts` — transitions, photo upload/delete, field updates, Excel import
- `whatsapp.service.ts` — send messages, toggle bot, simulator, request-field-update
- `hosts.service.ts` — update contact name
- `config.service.ts` — persist bot messages, fields, settings

### Auth Flow

`src/app/admin/layout.tsx` is the auth gate. It subscribes to `onAuthStateChanged()` and renders a login form until a session exists. Once authenticated, it wraps children in the sidebar nav. All child routes (`/admin/**`) are protected by this single layout.

### Hooks

Each hook owns one domain and is the single source of truth for that data. They open Firestore `onSnapshot` listeners in `useEffect` and clean them up on unmount. Service calls are called from inside the hook; components never call services directly.

| Hook | Firestore source | Key output |
|------|-----------------|------------|
| `useTickets` | `COLLECTIONS.TICKETS` (`eventos_ACE`) | `tickets[]` real-time |
| `useTicketDetail` | single ticket doc + `statusHistory` subcollection | `ticket`, `history`, action methods |
| `useWhatsappSessions` | `COLLECTIONS.SESSIONS` (`whatsapp_sessions_ACE`) | `sessions[]`, `messages[]`, `handleSend()`, `handleToggleBot()` |
| `useSimulator` | session doc + polling | `messages[]`, `handleSend()`, `handleReset()` |
| `useBotConfig` | `COLLECTIONS.BOT_CONFIG` docs: `messages`, `ticket_fields`, `settings` | config state + field CRUD methods |
| `useHosts` | `COLLECTIONS.HOSTS` (`hosts_ACE`) | `hosts[]`, `saveHostNombre()` |

### Pages

**`/admin/dashboard`** — Main ticket table with real-time updates and a tab panel for bot configuration (messages templates, field schema, system field visibility, session timeout). All config changes write back to Firestore via `configService`.

**`/admin/dashboard/chats`** — Split-pane chat interface. Left: session list sorted by recency. Right: conversation thread with color-coded source (user/bot/admin). Admin can send messages and toggle bot per session.

**`/admin/dashboard/tickets/[id]`** — Ticket detail. Shows dynamic fields from bot config, a status timeline built from `statusHistory`, photo accordions with upload/delete, inline field editing, and a modal to send a WhatsApp field-update request to the reporter.

**`/admin/dev/simulator`** — Dev-only tool. Sends messages/files to `POST /api/whatsapp/simulate` and polls the session doc every 2 s to show bot responses. Used for testing the WhatsApp state machine without a real phone.

### Key Types (`src/types/index.ts`)

```typescript
TicketStatus: 'SOLICITUD_RECIBIDA' | 'APROBACION_PIEZAS' | 'EN_MONTAJE' | 'ENLACE_PUBLICADO' | 'PRODUCCION_PREVIA' | 'PRODUCCION_POSTERIOR' | 'FINALIZADO' | 'ARCHIVADO'
FieldType:    'string' | 'numeric' | 'date' | 'photo' | 'video' | 'boolean' | 'list'
FieldSource:  'bot' | 'admin' | 'auto'

BotField: { key, label, question, order, type, source, required, visible, excel, options, allowOther }
```

The backend auto-transitions a ticket from `SOLICITUD_RECIBIDA` to `APROBACION_PIEZAS` when an admin/gestor uploads a photo. The frontend should not try to enforce or duplicate that logic.

Field keys support dot-notation (e.g. `photos.evidence`, `novelty.type`) matching the backend's nested field storage.

### Toast Notifications

`ToastProvider` in `src/components/toast-provider.tsx` wraps the root layout and renders a fixed portal. Import `useAppToast()` anywhere to call `.success()`, `.error()`, or `.info()`. Auto-dismisses after 3.2 s.

### Bot Config Defaults

`useBotConfig` merges Firestore data with hardcoded defaults so fields and messages are always complete even when the Firestore doc is empty or missing keys. When adding a new configurable message or field property, add its default there first.
