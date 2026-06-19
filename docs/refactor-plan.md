# Refactor Plan — LAZ Platform: Next.js → NestJS Backend + Vite Frontend

> Status: rencana (belum dieksekusi). Disusun 2026-06-12; direvisi 2026-06-12: backend diganti dari Express ke **NestJS**.

## Konteks

LAZ Platform adalah aplikasi manajemen zakat/donasi multi-tenant untuk LAZ se-Indonesia — **data keuangan sensitif, keamanan prioritas utama**. Saat ini berupa satu aplikasi Next.js 16 (App Router) di mana backend tersebar di server actions (24 action), server components, dan 3 API routes. Refactor ini memisahkannya menjadi backend NestJS dan frontend Vite (React SPA).

**Keputusan arsitektur yang sudah disepakati:**

1. **Monorepo**: folder `backend/` + `frontend/` di repo ini, masing-masing punya `package.json` sendiri (tanpa npm workspaces).
2. **Auth**: session server-side di PostgreSQL (`express-session` + `connect-pg-simple` — NestJS 11 berjalan di atas platform Express 5, jadi keduanya tetap dipakai), cookie httpOnly + secure + sameSite, CSRF protection, rate limiting login. Session bisa di-revoke seketika; permissions dimuat fresh dari DB tiap request. NextAuth dihapus total.
3. **Frontend**: SPA murni — Vite + React + React Router + React Query (tanpa SSR; penurunan SEO halaman publik diterima sebagai trade-off).
4. **Validasi tetap zod** (bukan class-validator): schema sudah ada dan harus dipakai bersama frontend dari `shared/` — dijalankan via `ZodValidationPipe` custom, bukan DTO class-validator.

## Struktur Target

```
laz-platform/
├── package.json              # root: orkestrasi saja (concurrently)
├── docs/refactor-plan.md     # dokumen ini
├── shared/                   # source-only, tanpa package.json (di-resolve via tsconfig paths)
│   ├── constants/permissions.ts        # pindahan src/constants/permissions.ts
│   ├── validations/*.schema.ts         # pindahan semua zod schema dari src/features/*/validations
│   └── types/api.ts                    # response envelope + DTO types (Decimal → string)
├── backend/
│   ├── package.json, tsconfig.json, nest-cli.json, .env.example
│   ├── prisma/               # PINDAHAN dari root (schema, migrations, seed.ts) + prisma.config.ts
│   └── src/
│       ├── main.ts                     # bootstrap: helmet, cors, session, csrf, pipes/filter global
│       ├── app.module.ts               # imports semua modul + ConfigModule + middleware consumer
│       ├── config/env.ts               # zod schema env, dipakai ConfigModule.validate — fail-fast
│       ├── prisma/{prisma.module.ts, prisma.service.ts}   # @Global(); PrismaService extends PrismaClient
│       ├── common/
│       │   ├── guards/{auth.guard.ts, permissions.guard.ts}
│       │   ├── decorators/{public.decorator.ts, optional-auth.decorator.ts,
│       │   │               require-permission.decorator.ts, current-user.decorator.ts}
│       │   ├── pipes/zod-validation.pipe.ts
│       │   ├── filters/all-exceptions.filter.ts
│       │   ├── interceptors/transform.interceptor.ts      # envelope { success, data, meta }
│       │   ├── middlewares/{session.middleware.ts, csrf.middleware.ts}
│       │   └── errors/app.error.ts
│       ├── lib/upload/                 # pindahan verbatim dari src/lib/upload (adaptasi Buffer, lihat bawah)
│       └── modules/<feature>/{<feature>.module.ts, <feature>.controller.ts,
│           │                  <feature>.service.ts, <feature>.repository.ts}
│           # auth, programs, donations, payments, distributions, users,
│           # rbac, laz, audit, analytics, reports, settings, uploads, webhooks
└── frontend/
    ├── package.json, vite.config.ts, index.html, .env.example
    ├── public/               # pindahan dari root public/
    └── src/
        ├── main.tsx, router.tsx
        ├── styles/globals.css            # pindahan src/app/globals.css (Tailwind v4)
        ├── lib/api-client.ts             # fetch wrapper: credentials include, X-CSRF-Token, unwrap envelope
        ├── auth/{AuthProvider, useAuth, ProtectedRoute, usePermission}.tsx
        ├── components/ui/                # pindahan src/components/ui (de-Next-ified)
        ├── layouts/{PublicLayout, AuthLayout, DashboardLayout}.tsx
        ├── pages/                        # 1 file per page.tsx saat ini
        ├── features/<feature>/{components/, api/, types/}   # tanpa actions/repositories/services
        └── stores/, hooks/, constants/nav.ts, providers/breadcrumb-provider.tsx
```

Stack backend: NestJS 11 (`@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express` — Express 5), `@nestjs/config`, express-session + connect-pg-simple, csrf-csrf (double-submit), `@nestjs/throttler` (rate limit), helmet, multer via `FileInterceptor` bawaan `@nestjs/platform-express`, nestjs-pino (pino-http), Prisma 7 (pindahan verbatim), bcryptjs, cloudinary. Logger pino yang ada di `src/lib/logger.ts` digantikan nestjs-pino (konfigurasi redact sama).

Root `package.json`: script `dev` menjalankan keduanya via `concurrently` (`npm --prefix backend run start:dev` + `npm --prefix frontend run dev`).

## Desain Backend

### Bootstrap `main.ts` + `AppModule` (urutan penting)

Di `main.ts` (urutan `app.use` tetap menentukan, sama seperti Express):

1. `app.set('trust proxy', 1)` (via `app.getHttpAdapter().getInstance()`) → 2. logger nestjs-pino (`bufferLogs: true`, redact cookie/password) → 3. helmet → 4. `app.enableCors({ origin: CORS_ORIGIN allowlist, credentials: true })` → 5. `express.json({ limit: '1mb' })` → 6. global filter `AllExceptionsFilter` + global interceptor `TransformInterceptor`.

Session & CSRF **bukan** di `main.ts` melainkan via `MiddlewareConsumer` di `AppModule.configure()` agar webhook bisa dikecualikan secara deklaratif:

```ts
consumer.apply(SessionMiddleware, CsrfMiddleware)
  .exclude('api/webhooks/midtrans', 'api/health')
  .forRoutes('*path');   // Express 5: pakai named wildcard, BUKAN '*' gaya v4
```

`GET` otomatis lolos CSRF (csrf-csrf hanya memeriksa metode mutasi). Guard global: `APP_GUARD` → `AuthGuard` lalu `PermissionsGuard` (urutan registrasi di provider menentukan urutan eksekusi).

### Auth & session

- Session hanya menyimpan `{ userId }`. `AuthGuard` (global) memuat user + role + permissions fresh dari DB tiap request (memakai repository auth yang sudah ada), menempelkannya ke `req.user` → perubahan role/revoke langsung efektif; revoke semua session milik satu user = `DELETE FROM session WHERE sess->>'userId' = $1` (dilakukan saat ganti password / ganti role).
- Decorator:
  - `@Public()` — skip AuthGuard total (login, register, csrf, halaman publik, webhook, health).
  - `@OptionalAuth()` — AuthGuard tidak menolak request anonim, tapi tetap memuat `req.user` jika session ada (dipakai `POST /api/donations/public`).
  - `@RequirePermission('programs.create')` — dibaca `PermissionsGuard` via `Reflector`; helper `hasPermission` yang sudah ada di `src/features/rbac` dipakai ulang. Tanpa decorator = cukup login.
  - `@CurrentUser()` — param decorator pengganti akses `req.user` manual di controller.
- Cookie: `laz.sid`, httpOnly, secure (prod), sameSite=lax, maxAge 8 jam rolling.
- `POST /api/auth/login`: `loginSchema` (ZodValidationPipe) → `authService.signIn` (bcrypt, pesan error seragam "Email atau password salah") → **`req.session.regenerate()`** (anti session-fixation) → set userId, update `lastLoginAt`, audit log LOGIN dengan `req.ip`/user-agent.
- **Tenant scoping**: `lazId` selalu diambil dari `req.user.lazId`, tidak pernah dari body; platform admin boleh filter via query `?lazId=` (meniru perilaku dashboard sekarang).

### CSRF, rate limit, hardening

- csrf-csrf double-submit, dibungkus `CsrfMiddleware` (NestMiddleware); SPA mengambil token via `GET /api/auth/csrf` saat boot **dan setelah login** (regenerate session merotasi token). Hanya webhook (dan health) yang exempt via `.exclude()`.
- Rate limit: `@nestjs/throttler` — `ThrottlerGuard` global dengan limit `/api` ~300/menit, lalu override per-route via `@Throttle`: login/register 5 req/15 menit/IP, ganti password 5/15 menit, donasi publik 10/menit/IP. Webhook & health `@SkipThrottle()`.
- helmet defaults, `x-powered-by` off (`app.getHttpAdapter().getInstance().disable('x-powered-by')`).

### Tabel endpoint REST (pemetaan dari 24 server action)

Kontrak REST **tidak berubah** dari rencana sebelumnya — hanya implementasinya yang jadi controller NestJS.

Legend: 🌐 publik (`@Public()`) · 🔓 auth · 🔑 `@RequirePermission`. Semua mutasi wajib CSRF kecuali webhook.

| Endpoint | Menggantikan | Akses |
|---|---|---|
| POST /api/auth/login, /register | loginAction, registerAction | 🌐 rate-limited |
| POST /api/auth/logout · GET /api/auth/me · GET /api/auth/csrf | signOut / useSession / baru | 🔓 / 🔓 / 🌐 |
| GET /api/public/programs, /public/programs/:slug, /public/stats | fetch server-component homepage & halaman publik | 🌐 |
| POST /api/donations/public | createDonationAction (guest + login) | 🌐 `@OptionalAuth()`, rate-limited |
| GET /api/dashboard/overview | analyticsService.getDashboardOverview | 🔓 tenant-scoped |
| GET/POST /api/programs · PATCH/DELETE /api/programs/:id · GET /api/programs/:slug | programs.actions (create/update/delete) + getDashboardPrograms | 🔑 programs.* |
| GET/POST /api/donations · GET/PATCH /api/donations/:id · POST /api/donations/:id/mock-webhook | donations.actions (admin create/update, mock webhook) | 🔑 donations.* / payments.manage |
| GET /api/payments | paymentsService.getPayments | 🔑 payments.read |
| GET/POST /api/distributions · POST /api/distributions/:id/approve, /:id/reject | distributions.actions (create/approve/reject) | 🔑 distributions.* |
| GET/POST /api/users · GET/PATCH/DELETE /api/users/:id · PATCH /api/users/:id/role | users.actions (CRUD + changeRole) | 🔑 users.* |
| GET /api/roles · GET /api/rbac/matrix · PUT /api/rbac/roles/:roleId/permissions | rbacService + saveRolePermissionsAction | 🔑 roles.* |
| GET/POST /api/laz · PATCH/DELETE /api/laz/:id · GET /api/laz/options | laz.actions (createLazAction, EditLazAction, deleteLazAction) | 🔑 laz.manage (options: 🔓) |
| GET /api/audit | auditService.getLogs | 🔑 audit.read |
| GET /api/reports/summary, /donation-trend, /top-programs | reportsService | 🔑 reports.read |
| PATCH /api/settings/profile, /notifications · POST /api/settings/password · PUT /api/settings/avatar | settings.actions + avatar.actions | 🔓 (self); password rate-limited + revoke session lain |
| POST /api/upload (multipart, `FileInterceptor` + `ParseFilePipe` 5MB image-only) · DELETE /api/upload?publicId= | src/app/api/upload/route.ts | 🔓 + CSRF |
| POST /api/webhooks/midtrans | webhook route (signature SHA512, idempotent — verbatim) | 🌐 tanpa CSRF/session |
| GET /api/health | baru (`@nestjs/terminus` opsional, atau handler polos) | 🌐 |

### Validasi, error handling & response envelope

- **ZodValidationPipe** custom (constructor menerima schema dari `shared/validations`), dipakai per-route: `@Body(new ZodValidationPipe(loginSchema))`. Tidak memakai class-validator/`ValidationPipe` bawaan — schema harus tetap satu sumber dengan frontend.
- Sukses: `TransformInterceptor` membungkus return value controller menjadi `{ success: true, data, meta? }` (pakai shape `metadata` pagination repository yang ada; controller me-return `{ data, meta }` atau data polos).
- Error: `{ success: false, error: { code, message, details? } }` — `details` = `zodError.flatten()` agar form tetap mengonsumsi shape yang sama.
- `AppError extends HttpException` membawa `code`; `AllExceptionsFilter` terpusat: ZodError→422, Prisma P2002→409, P2025→404, HttpException→status-nya, lainnya→500 generik (jangan bocorkan internal).
- Controller menserialisasi Prisma `Decimal` → **string** (DTO mapper per modul, dipanggil di service/controller — bukan interceptor global, agar eksplisit per tipe).

### Pola modul

Tiap modul fitur = `Module` berisi controller tipis + service + repository (keduanya `@Injectable()`, DI via constructor). Services/repositories yang ada di `src/features/*` **pindah nyaris verbatim** — perubahan hanya: tambah decorator `@Injectable()`, `prisma` di-inject sebagai `PrismaService` (bukan import singleton), dan pemanggil `auth()` NextAuth diganti parameter `user` yang dioper controller dari `@CurrentUser()`.

### Catatan upload & webhook

- `CloudinaryProvider.upload(file: File)` diadaptasi menerima `Buffer` dari multer (`Express.Multer.File.buffer` → `upload_stream`) — satu-satunya kode service-layer yang tidak bisa pindah verbatim.
- Webhook Midtrans: controller `@Public()` + di-exclude dari session/CSRF middleware; logika signature SHA512 + idempotency pindah verbatim.
- Tabel session connect-pg-simple dibuat lewat **migration Prisma** (raw SQL sesuai `table.sql` connect-pg-simple), `createTableIfMissing: false`.

## Desain Frontend

*(Tidak berubah dari rencana sebelumnya — backend swap Express→NestJS tidak menyentuh kontrak API.)*

### Routing (createBrowserRouter)

Mirror halaman sekarang: `/`, `/programs`, `/programs/:slug`, `/donate/:slug` (PublicLayout); `/login`, `/register` (AuthLayout, redirect ke /dashboard jika sudah login); `/dashboard/*` dibungkus `<ProtectedRoute><DashboardLayout/></ProtectedRoute>` — overview, programs (+new/:slug/edit/:slug/distributions/new), donations (+new/:id/edit), payments, distributions, audit, reports, users (+new/:id/edit), laz (+new/:id/edit), rbac, settings; `/forbidden`, `*` not-found.

- `ProtectedRoute`: pakai `useAuth()`; saat loading render LoadingSpinner yang ada; 401 → `<Navigate to="/login">`.
- Guard permission level route `<RequirePermission permission="...">` menggantikan logika `src/proxy.ts`; `usePermission()` ditulis ulang di atas AuthProvider dengan API sama (`can/canAll/canAny`).

### API client + React Query

- `api-client.ts`: fetch wrapper — `credentials:'include'`, base `VITE_API_URL ?? '/api'`, header `X-CSRF-Token` (di-cache, refetch setelah login/logout atau saat 403 CSRF), unwrap envelope, lempar `ApiError`.
- Per feature: folder `api/` berisi query/mutation hooks menggantikan server actions; `invalidateQueries` menggantikan semua `revalidatePath()`. Form tetap react-hook-form + zodResolver dengan schema dari `shared/`; `details` dari 422 dipetakan ke `setError`. Filter tabel tetap di URL via `useSearchParams` (jangan dipindah ke Zustand).
- `AuthProvider` berbasis `useQuery(['auth','me'])`, expose `{ user, permissions, isLoading, login, logout }`.

### Aturan porting komponen

- Hapus `"use client"`; `next/link`→`Link` (prop `to`), `useRouter().push`→`useNavigate()`, `redirect()`→`<Navigate>`, `usePathname()`→`useLocation().pathname`, props `searchParams`/`params`→`useSearchParams()`/`useParams()`.
- `next/image`→`<img>` + Cloudinary transform params (drop `next-cloudinary`); `next/font`→@fontsource atau link Google Fonts di index.html (cek font di `src/app/layout.tsx`).
- Tailwind v4: ganti `@tailwindcss/postcss` dengan plugin `@tailwindcss/vite`; `globals.css` pindah apa adanya.
- `metadata` export → hook `useDocumentTitle` sederhana. Zustand, recharts, use-debounce tidak berubah.

## Urutan Migrasi (per fase, bisa diverifikasi mandiri)

Kerjakan di branch `refactor/nestjs-vite`. App Next.js lama dibekukan begitu `prisma/` pindah (Fase 1) — verifikasi hanya pada stack baru.

- **Fase 0**: buat branch dari kondisi sekarang.
- **Fase 1 — Scaffold backend**: `nest new backend` (hapus boilerplate test/spec), pindahkan prisma/ → `PrismaModule` + `PrismaService` (`onModuleInit` connect, adapter pg yang ada dipertahankan); `ConfigModule.forRoot({ validate })` dengan zod env; main.ts (helmet/cors/json/nestjs-pino) + `AllExceptionsFilter` + `TransformInterceptor`; `GET /api/health` (`@Public()`); `SessionMiddleware` + migration tabel session; `CsrfMiddleware` + endpoint CSRF. *Verifikasi*: curl /api/health, prisma migrate jalan.
- **Fase 2 — Modul auth**: pindahkan services/repositories auth + schema ke shared; `AuthModule` (login/logout/me/register/csrf), `AuthGuard` + `PermissionsGuard` global + decorators, ThrottlerModule + override login, audit log. *Verifikasi curl*: siklus cookie penuh, 429 setelah 5x gagal, mutasi tanpa CSRF → 403, hapus row session → 401.
- **Fase 3 — Modul fitur**: satu per satu (programs → donations → distributions → payments → users → rbac → laz → audit → reports → analytics → settings), services/repositories pindah verbatim (+`@Injectable()`/DI) + controller tipis; lalu uploads (`FileInterceptor`) dan webhook Midtrans. *Verifikasi per modul*: termasuk 403 tanpa permission dan isolasi tenant (user LAZ A tidak bisa membaca data LAZ B). Checklist audit-log per mutasi (rawan terlewat).
- **Fase 4 — Scaffold frontend**: Vite + Router + Query + @tailwindcss/vite; proxy `/api → http://localhost:4000`; api-client, AuthProvider, ProtectedRoute, usePermission; pindahkan components/ui, stores, nav. Root script concurrently. *Verifikasi*: login end-to-end, refresh mempertahankan session.
- **Fase 5 — Halaman publik**: home, /programs, /programs/:slug, /donate/:slug termasuk donasi guest + settlement mock-webhook.
- **Fase 6 — Dashboard**: DashboardLayout (port `src/app/(protected)/layout.tsx`), lalu halaman per halaman mengikuti urutan modul Fase 3; form FormData → JSON mutation. Verifikasi CRUD tiap halaman sebelum lanjut.
- **Fase 7 — Dekomisioning Next.js**: hapus `src/`, `next.config.ts`, `postcss.config.mjs`, `next-env.d.ts`, `src/proxy.ts`; cabut deps next/next-auth/next-cloudinary; root package.json jadi orkestrator; update README, AGENTS.md/CLAUDE.md (peringatan docs Next.js tidak relevan lagi).
- **Fase 8 — Verifikasi penuh** (lihat bawah) + opsional suite e2e `@nestjs/testing` + supertest terhadap `AppModule` (test pertama di repo — Nest menyediakan harness ini bawaan, manfaatkan).

## Environment Variables

`backend/.env.example`: `NODE_ENV`, `PORT=4000`, `DATABASE_URL`, `SESSION_SECRET`, `CSRF_SECRET`, `CORS_ORIGIN=http://localhost:5173`, `MIDTRANS_SERVER_KEY`, `CLOUDINARY_*`, `SEED_ADMIN_*`. Divalidasi zod lewat `ConfigModule.forRoot({ validate })` — crash saat boot jika secret hilang.

`frontend/.env.example`: `VITE_API_URL="/api"` (dev pakai proxy Vite; prod idealnya satu origin di belakang reverse proxy agar cookie sederhana).

## Verifikasi End-to-End

1. `prisma migrate reset` + seed.ts yang ada (role, permission, admin, LAZ contoh).
2. **Auth**: login → Set-Cookie; /me; mutasi tanpa token CSRF → 403; login gagal ke-6 → 429; logout → /me 401; hapus row session → 401; ubah role di DB → /me berikutnya menunjukkan permission baru.
3. **RBAC/tenant**: user tanpa permission → 403; admin LAZ A hanya melihat data LAZ A; platform admin bisa filter `?lazId=`.
4. **CRUD tiap modul di browser** + cek invalidasi React Query + row audit log muncul dengan IP/user-agent.
5. **Webhook**: donasi guest → mock-webhook payload → POST ke webhook tanpa cookie → donasi PAID, payment SUCCESS, `currentAmount` naik; signature diubah → 400 tanpa perubahan state; replay → idempoten.
6. **Upload**: gambar program tersimpan ke Cloudinary; >5MB / non-image ditolak; tanpa auth → 401.
7. `npm run build` di root; smoke test `vite preview` + backend `start:prod`.

## Risiko & Gotcha Utama

- **Prisma Decimal → string** di JSON: audit semua konsumen `amount`/`targetAmount` (formatting currency, input recharts).
- Frontend **tidak boleh** import `@prisma/client` — ganti type Prisma di file kolom/komponen dengan DTO di `shared/types`.
- **Cookie dev**: pakai Vite proxy (same-origin) — hindari cross-origin CORS cookie.
- **Lifecycle token CSRF**: regenerate session saat login merotasi token — SPA wajib refetch setelah login, kalau tidak mutasi 403 misterius.
- **Urutan guard global**: `AuthGuard` harus terdaftar sebagai `APP_GUARD` *sebelum* `PermissionsGuard` dan `ThrottlerGuard` harus melindungi route `@Public()` juga (throttler jangan bergantung pada auth). Uji eksplisit di Fase 2.
- **`MiddlewareConsumer.exclude()` + Express 5**: sintaks wildcard berubah dari v4 (`*path`, bukan `*`) — path exclude webhook harus diuji benar-benar melewati session/CSRF (curl tanpa cookie harus tetap 200/400-signature, bukan 403 CSRF).
- **ZodValidationPipe vs ValidationPipe bawaan**: jangan aktifkan `ValidationPipe` global bawaan Nest — tidak dipakai (schema zod), dan whitelist-nya bisa diam-diam membuang field.
- **DI vs singleton**: `src/lib/prisma.ts` sekarang singleton module-level; di Nest jadi `PrismaService` ter-inject. Jangan ada modul yang meng-import instance langsung — semua lewat constructor injection agar testable dan lifecycle (`onModuleDestroy` → `$disconnect`) terkelola.
- `RBACSessionUser` mereferensikan module augmentation NextAuth — buat ulang sebagai plain type di shared (dipakai `AuthGuard`, `@CurrentUser()`, dan frontend).
- connect-pg-simple: pastikan `pruneSessionInterval` aktif agar row kedaluwarsa terbersihkan.
- **Fitur Next yang hilang**: SSR/SEO halaman publik (diterima), optimasi `next/image` (mitigasi via Cloudinary transforms), guard route middleware (dipindah client-side + ditegakkan server-side oleh permissions — penegakan server adalah batas keamanan yang sebenarnya).

## File Kritis Referensi

- `src/lib/auth.ts` — shape session-user yang harus direproduksi `AuthGuard` + `/api/auth/me`
- `prisma/schema.prisma` — pindah ke `backend/prisma`; migration tabel session
- `src/features/donations/actions/donations.actions.ts` — action terkompleks (guest flow, optional auth, mock webhook), template porting controller
- `src/constants/permissions.ts` — kontrak `@RequirePermission` & `usePermission`, pindah ke `shared/`
- `src/app/(protected)/layout.tsx` — sumber DashboardLayout + ProtectedRoute
- `src/proxy.ts` — aturan guard route yang dipindah ke `<RequirePermission>`
