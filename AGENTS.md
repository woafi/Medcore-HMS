# 🤖 MedCore-HMS — AI Agent Guidelines & Operating Playbook (`AGENTS.md`)

Welcome, Agent. This document defines the operational standards, technical architecture, and step-by-step execution workflows required when modifying, extending, or maintaining the **MedCore-HMS** codebase.

Always follow these protocols to ensure type safety, security, architectural consistency, and zero regressions.

---

## 📌 1. Project Overview & Architecture

**MedCore-HMS** is a production-grade Hospital Management System built with:

- **Framework**: Next.js 16 (App Router, Server Actions, Route Handlers)
- **Runtime**: React 19, Node.js (v18+)
- **Language**: TypeScript (strict configuration)
- **Database & ORM**: PostgreSQL (hosted on Supabase or Local) with Prisma 5 ORM
- **Styling**: Tailwind CSS v4, Lucide React, Next Themes (Light/Dark mode)
- **Security & Auth**: JWT authentication (`jose`), password hashing (`bcrypt` / `bcryptjs`), cookie-based sessions, and edge routing via `proxy.ts`
- **Real-time Engine**: Pusher Channels for real-time dashboard notifications
- **Media Storage**: Cloudinary for patient & doctor avatar image uploads
- **Validation**: Zod schema validation

### System Roles (RBAC)
- `SUPER_ADMIN` / `ADMIN`: Executive hospital operations, staff management, doctor onboarding, system audit logs, and KPI analytics.
- `DOCTOR`: Clinical schedule management, daily consultations, appointment tracking, and patient records access.
- `RECEPTIONIST`: Front desk operations, patient intake/registration, appointment booking, and arrival check-ins.
- `PATIENT`: Medical history and appointment self-service.
- `ACCOUNTANT`: Billing and fee management (reserved).

---

## 🧭 2. Step-by-Step Task Execution Workflow

Whenever you receive a task or feature request, follow this sequential 8-step lifecycle:

```
[1. Context & Discovery] 
       ↓
[2. Architecture & Dependency Planning] 
       ↓
[3. Database Schema & Migration (Prisma)] 
       ↓
[4. Backend: Server Actions & API Handlers] 
       ↓
[5. Frontend: Components & React 19 Hooks] 
       ↓
[6. Real-time & Cross-cutting Updates] 
       ↓
[7. Verification & Type/Lint Testing] 
       ↓
[8. Review & Summary Hand-off]
```

### Step 1: Context & Discovery
- **Locate Relevant Files**: Before editing, examine existing models in `prisma/schema.prisma`, type definitions in `lib/userTypes.ts`, and related server actions in `app/actions/`.
- **Check Route Protections**: Inspect `proxy.ts` to determine which roles have access to the target path.
- **Audit Existing Components**: Look in `components/` for reusable widgets (modals, search bars, KPI cards) to avoid writing duplicate code.

### Step 2: Architecture & Dependency Planning
- Determine data flow: Is this handled via a **Server Action** (`"use server"`), an **API Route** (`app/api/...`), or a **Server Component** fetch?
  - *Standard preference*: Prefer Server Actions in `app/actions/` for mutations and form handling.
  - *API routes*: Use for streaming, webhooks, or public client fetch endpoints.
- Confirm whether real-time updates are needed via Pusher (`lib/pusher.ts`) and audit logging (`lib/dashboardLog.ts`).

### Step 3: Database & Schema Operations (Prisma)
When database schema modifications are required:
1. Update `prisma/schema.prisma` with appropriate models, enums, indices, and cascade rules.
2. Run Prisma generation:
   ```bash
   npx prisma generate
   ```
3. Sync schema with the database:
   - For local development / schema evolution:
     ```bash
     npx prisma db push
     ```
   - For tracked production migrations:
     ```bash
     npx prisma migrate dev --name <descriptive_name>
     ```
4. If seed data is affected, update `prisma/seed.js` or `prisma/patients-seed.js` and test seeding:
   ```bash
   npx prisma db seed
   ```

### Step 4: Backend Implementation (Server Actions & Security)
1. **Always Use the Singleton Client**:
   ```typescript
   import prisma from "@/lib/prisma";
   ```
   *Never instantiate `new PrismaClient()` directly.*
2. **Server Action Conventions**:
   - Mark the file with `"use server";` at top.
   - Enforce standardized response envelopes:
     ```typescript
     type ActionResponse<T> = 
       | { ok: true; data: T; message?: string }
       | { ok: false; error: string };
     ```
   - Validate all untrusted inputs using **Zod**.
   - Verify caller permissions and session identity using `verifyToken` / cookies.
   - Revalidate impacted paths using `revalidatePath("/dashboard/...")`.

### Step 5: Frontend Implementation (React 19 & Next.js 16)
1. **Server vs. Client Components**:
   - Keep page wrappers as Server Components where possible.
   - Add `"use client";` at the top of interactive components (forms, interactive filters, modals, Pusher listeners).
2. **Next.js 16 Dynamic Route Parameters**:
   - In Next.js 15+, `params` and `searchParams` in server components/pages are **Promises**. Always await them:
     ```typescript
     export default async function Page({
       params,
     }: {
       params: Promise<{ doctorId: string }>;
     }) {
       const { doctorId } = await params;
       // ...
     }
     ```
3. **React 19 & ESLint State Rules (CRITICAL)**:
   - **Never call `setState` synchronously inside a `useEffect`** body (causes cascading renders and ESLint failure `react-hooks/set-state-in-effect`).
   - Derive state during render instead of syncing via effects when possible:
     ```typescript
     // ❌ BAD:
     useEffect(() => { setFiltered(items.filter(...)); }, [items]);

     // ✅ GOOD:
     const filtered = useMemo(() => items.filter(...), [items]);
     ```
   - For asynchronous data fetching, wrap calls in clean handlers or React 19 `useActionState` / `startTransition`.

### Step 6: Real-time & Cross-cutting Updates
- When state mutations occur (e.g. appointment booked, doctor status changed, patient checked in):
  - Broadcast Pusher events:
    ```typescript
    await notifyAdminDashboard({ type: "APPOINTMENT_CREATED", payload: ... });
    await notifyDoctorDashboard(doctorId, { ... });
    await notifyReceptionDashboard({ ... });
    ```
  - Record audit log entries using `createAppointmentDashboardLog(...)`.
  - Clean up client subscriptions in `useEffect` cleanup blocks to prevent memory leaks.

### Step 7: Verification & Quality Assurance
Run quality checks before completing the task:
```bash
# 1. Type check
npx tsc --noEmit

# 2. Linting (enforces React 19 hook safety & typescript standards)
npm run lint

# 3. Production build test
npm run build
```
Resolve all TypeScript errors and linting warnings before reporting the task as finished.

### Step 8: Review & Hand-off
- Verify that secret keys or credentials are never exposed in client components or commits.
- Ensure all comments and documentation remain intact.
- Provide a concise summary of files modified, database changes applied, and manual verification steps for the user.

---

## 🛡️ 3. Security & Access Control Rules

1. **Route Protection**: All route-level authorization is managed by `proxy.ts`. When introducing new routes under `/admin`, `/doctor`, `/receptionist`, `/patientprofile`, ensure `ROLE_ROUTES` in `proxy.ts` accounts for them.
2. **Never Trust Client Role Claims**: Validate the JWT token stored in `cookies().get("accessToken")` on the server before performing administrative or clinical operations.
3. **Password Security**: Passwords must always be hashed with `hashPassword` (bcrypt, cost factor 12) from `lib/auth.ts`.
4. **Environment Variables**:
   - Public client variables MUST start with `NEXT_PUBLIC_` (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_PUSHER_KEY`, `NEXT_PUBLIC_PUSHER_CLUSTER`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`).
   - Private server credentials (`DATABASE_URL`, `JWT_SECRET`, `PUSHER_SECRET`, `CLOUDINARY_API_SECRET`) must never leak to client bundles.

---

## 💻 4. Command Reference Playbook

| Action | Command | Notes |
| :--- | :--- | :--- |
| **Start Dev Server** | `npm run dev` | Runs Next.js at `http://localhost:3000` |
| **Build Project** | `npm run build` | Tests production compilation |
| **Lint Check** | `npm run lint` | ESLint 9 + Next.js configuration |
| **Type Check** | `npx tsc --noEmit` | Strict TypeScript compiler check |
| **Prisma Client Gen** | `npx prisma generate` | Regenerates `@prisma/client` |
| **Prisma Push** | `npx prisma db push` | Pushes schema directly without migration file |
| **Prisma Migration** | `npx prisma migrate dev` | Generates SQL migration for schema change |
| **Prisma Studio** | `npx prisma studio` | Visual database browser at `http://localhost:5555` |
| **Seed Database** | `npx prisma db seed` | Seeds demo admin, doctors, patients, receptionists |

---

## 📋 5. Agent Verification Checklist

Before finishing any task, confirm each item on this checklist:

- [ ] Schema changes reflected in `prisma/schema.prisma` and client generated (`npx prisma generate`).
- [ ] No direct `new PrismaClient()` calls; imported from `@/lib/prisma`.
- [ ] Next.js 16 async route parameters properly awaited (`const { id } = await params`).
- [ ] No synchronous `setState` in `useEffect` (clean React 19 lifecycle).
- [ ] Role-based access verified in `proxy.ts` and server actions.
- [ ] Pusher events fired for real-time dashboard listeners where appropriate.
- [ ] Server actions return consistent `{ ok: boolean, data?: ..., error?: string }` responses.
- [ ] `npm run lint` and `npx tsc --noEmit` execute with zero blocking errors.
- [ ] No confidential credentials or tokens committed to git or printed in logs.

