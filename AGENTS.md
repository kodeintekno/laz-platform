# LAZ Platform — Agent & Contributor Guide

## Project Structure

```
laz-platform/
├── backend/          # NestJS 11 API server (Express adapter)
│   ├── src/          # Application source
│   ├── prisma/       # Schema, migrations, seed
│   └── dist/         # Compiled output (rootDir=.., so: dist/backend/src/)
├── frontend/         # Vite 7 + React 19 SPA
│   └── src/
│       ├── compat/   # Shims: next/link, next/image, next/navigation, next-auth/react, @prisma/client
│       ├── features/ # Feature slices (programs, donations, distributions, lembaga, volunteers, users, rbac, settings, auth)
│       ├── pages/    # Route page components (public + dashboard + volunteer)
│       ├── layouts/  # PublicLayout, AuthLayout, DashboardLayout, VolunteerLayout
│       └── lib/      # api-client, query-client, logger, upload/uploadService
└── shared/           # Shared TypeScript types (api.ts, constants/)
```

## Business Domain

- **Tenant terminology**: a tenant is called **Lembaga** everywhere (UI, routes, permissions) — the Prisma model is `Lembaga` (not `Laz`/`Tenant`). Every tenant-scoped row carries `lembagaId`.
- **Roles**: `SUPER_ADMIN` (platform-wide administration), `FINANCE_PLATFORM` (platform-wide finance and read-only cross-Lembaga accounting), and `LEMBAGA_ADMIN` (tenant staff) exist in the `Role`/RBAC table. Platform roles use `lembagaId: null`. There is no `DONATUR` or `RELAWAN` role.
- **Lembaga onboarding**: public self-service registration (`POST /api/lembaga/register`) creates a `Lembaga` with `status: PENDING` plus its first `LEMBAGA_ADMIN` user — no auto-login. `AuthService.signIn()` blocks login with `LEMBAGA_PENDING`/`LEMBAGA_REJECTED` until a `SUPER_ADMIN` approves via `PATCH /api/lembaga/:id/approve`.
- **Donors never have accounts.** `Donation` has no `userId`/`user` relation — identity is free-text `donorName`/`donorPhone` (required, validated) / `donorEmail` (optional) directly on the row. Donation history is looked up publicly and cross-tenant via `GET /api/donations/history?phone=`.
- **Volunteers are a separate principal**, not a `User`/RBAC role — model `Volunteer` + join `VolunteerApplication`. They authenticate via their own session key (`req.session.volunteerId`, guarded by `VolunteerAuthGuard`, never the global `AuthGuard`/`PermissionsGuard`) and their own frontend context (`VolunteerAuthProvider`/`useVolunteerAuth`, parallel to `AuthProvider`/`useAuth` — do not reuse `usePermission()` for volunteer routes). Volunteers are global (not tenant-scoped) and can apply to programs across different Lembaga; each `VolunteerApplication` denormalizes `lembagaId` from its `Program` and is reviewed by that Lembaga's admin (`api/lembaga/volunteer-applications`).

## Development

```bash
npm run dev       # Starts both backend (port 4000) and frontend (port 5173) via concurrently
npm run build     # tsc backend + vite build frontend
```

Backend start after build: `node dist/backend/src/main.js` (NOT `dist/main.js`).

## Backend (NestJS)

- **Session**: `express-session` + `connect-pg-simple`. Cookie: `laz.sid`.
- **CSRF**: `csrf-csrf` double-submit. Token endpoint: `GET /api/auth/csrf` → `{ data: { token } }`.
  Mutations must send `X-CSRF-Token` header.
- **Auth guard**: `SessionGuard` checks `req.session.userId`. `@Public()` skips it.
- **Throttling**: `@nestjs/throttler` global.
- **Logging**: `nestjs-pino`.
- **Response envelope**: All endpoints return `{ success: true, data: T, meta?: PaginationMeta }`.
  Errors return `{ error: { code, message, details? } }`.

## Frontend (Vite + React)

- **Routing**: React Router v7 `createBrowserRouter`.
- **Data fetching**: React Query v5 (`useQuery`, `queryClient.invalidateQueries`).
- **API client** (`src/lib/api-client.ts`):
  - `api.get<T>(path, params?)` → `Promise<ApiResult<T>>` where `ApiResult<T> = { data: T, meta?: PaginationMeta }`.
  - Pages must access `result?.data` (not `result` directly) for the items array.
  - `api.post/patch/put/delete` for mutations.
- **Actions** (`features/*/actions/*.actions.ts`): Replace Next.js server actions. Use `asAction(api.post(...))` to return `ActionResult`.
- **ActionResult**: Flat optional type — `{ success?: boolean; error?: string; details?; } & Partial<Extra>`. Access `.error` / `.success` directly without narrowing.
- **Compat shims**: Aliased in `vite.config.ts` AND `tsconfig.json`. Do not import from Next.js or Prisma — use shims.
- **Upload**: `handleUpload(file, opts?)` in `src/lib/upload/uploadService.ts`. Calls `POST /api/upload`.

## Key Conventions

- Pagination data: always provide a default when `result?.meta` is undefined — e.g. `result?.meta ? { ... } : { currentPage: 1, totalPages: 1, totalCount: 0, pageSize: limit }`.
- `HeroSection` uses a default export — re-export as `export { default as HeroSection }`.
- Backend compiled path: `dist/backend/src/main.js` (due to `rootDir: ".."` in tsconfig.build.json).
- **File uploads in forms** (logo, documents, photos): always upload-then-submit-JSON — the `FileUpload` component uploads immediately to the generic `POST /api/upload` (via `handleUpload` in `src/lib/upload/uploadService.ts`), returning `{ url, publicId }`, which the form then submits as plain string fields in its JSON/FormData body. Do not build bespoke multipart endpoints (e.g. `FileFieldsInterceptor`) for new registration/profile forms — keep this one convention.
