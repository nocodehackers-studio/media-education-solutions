# Epic 1: Project Foundation & Core Infrastructure

**Goal:** Deployable application skeleton with database, auth infrastructure, and project structure ready for feature development.

**Requirements:** ARCH1-25, UX1-8, UX20-25, NFR1-2, NFR7-9, NFR14, NFR18, NFR22-23, NFR27-34

---

## Story 1.1: Project Initialization

As a **developer**,
I want **a fully configured React + TypeScript project with Tailwind CSS, shadcn/ui, and routing**,
So that **I have a modern, consistent foundation to build features on**.

**Acceptance Criteria:**

**Given** a fresh development environment
**When** I clone the repository and run `npm install && npm run dev`
**Then** the application starts without errors on localhost
**And** the page displays a placeholder "Media Education Solutions" heading

**Given** the project is initialized
**When** I inspect the dependencies
**Then** I see React 18+, TypeScript, Vite, Tailwind CSS v4, React Router DOM
**And** shadcn/ui is configured with the project's color tokens

**Given** Tailwind is configured
**When** I use responsive classes (sm:, md:, lg:, xl:, 2xl:)
**Then** breakpoints match UX spec (sm:640, md:768, lg:1024, xl:1280, 2xl:1440)

**Given** React Router is configured
**When** I navigate to an undefined route
**Then** I see a NotFound page placeholder

**Requirements:** ARCH1-4, UX1

---

## Story 1.2: Supabase Integration & Base Schema

As a **developer**,
I want **Supabase configured with authentication and the profiles table**,
So that **admin and judge authentication is ready to implement**.

**Acceptance Criteria:**

**Given** Supabase client is configured
**When** I import from `@/lib/supabase`
**Then** I get a typed Supabase client connected to the project

**Given** the database migration runs
**When** I check the schema
**Then** the `profiles` table exists with columns: id (UUID, FK to auth.users), email, role, first_name, last_name, created_at

**Given** a user signs up via Supabase Auth
**When** the auth trigger fires
**Then** a corresponding row is created in the profiles table

**Given** RLS is enabled on profiles
**When** an unauthenticated request tries to read profiles
**Then** the request is denied

**Given** environment variables are set
**When** the app loads
**Then** VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are available to the client

**Requirements:** ARCH7-8, NFR7-8, NFR23

---

## Story 1.3: Feature Architecture & Discoverability

As a **developer or AI agent**,
I want **a well-organized folder structure with discoverability files**,
So that **I can quickly understand and navigate the codebase**.

**Acceptance Criteria:**

**Given** the src folder structure
**When** I inspect the directories
**Then** I see: features/, components/ui/, lib/, pages/, contexts/, types/, router/

**Given** the features folder
**When** I check its contents
**Then** I see placeholder folders for: auth, contests, categories, participants, submissions, reviews, rankings, notifications
**And** each folder has an index.ts with a placeholder export comment

**Given** PROJECT_INDEX.md exists at project root
**When** I read it
**Then** I see a master manifest listing all features, their purpose, and key exports
**And** it follows the LLM discoverability format from architecture

**Given** components/ui/index.ts exists
**When** I check its exports
**Then** it exports Button, Card, Input from shadcn/ui (minimum starter set)

**Given** lib/index.ts exists
**When** I check its exports
**Then** it exports supabase client, cn utility, queryClient

**Requirements:** ARCH12-14, ARCH23-25

---

## Story 1.4: Core UI Components & Patterns

As a **developer**,
I want **core UI patterns established (toasts, loading states, error handling)**,
So that **all features have consistent user feedback**.

**Acceptance Criteria:**

**Given** the toast system is configured
**When** I call `toast.success("Message")`
**Then** a green toast appears top-right and auto-dismisses after 4 seconds

**Given** the toast system is configured
**When** I call `toast.error("Error message")`
**Then** a red toast appears top-right and requires manual dismissal

**Given** lib/errorCodes.ts exists
**When** I import ERROR_CODES
**Then** I get typed constants: INVALID_CODES, SESSION_EXPIRED, CONTEST_NOT_FOUND, CATEGORY_CLOSED, FILE_TOO_LARGE, INVALID_FILE_TYPE, VALIDATION_ERROR, SERVER_ERROR

**Given** TanStack Query is configured
**When** I use a query hook
**Then** I have access to isLoading, isFetching, error states

**Given** React Hook Form + Zod are configured
**When** I create a form with validation
**Then** validation runs on blur and shows inline errors below fields

**Given** a Skeleton component exists
**When** I render `<Skeleton className="h-4 w-full" />`
**Then** a loading placeholder animation displays

**Requirements:** ARCH5-6, ARCH19-22, UX20-22, UX24, NFR21

---

## Story 1.5: CI/CD & Environment Configuration

As a **developer**,
I want **automated deployments and error tracking configured**,
So that **code changes deploy automatically and errors are captured**.

**Acceptance Criteria:**

**Given** code is pushed to main branch
**When** Vercel receives the webhook
**Then** the application builds and deploys to production URL

**Given** a PR is opened
**When** Vercel receives the webhook
**Then** a preview deployment is created with a unique URL

**Given** .env.example exists
**When** I review it
**Then** I see all required variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_SENTRY_DSN

**Given** Sentry is configured
**When** an unhandled error occurs in production
**Then** the error is captured and sent to Sentry with stack trace

**Given** the GitHub Actions workflow exists
**When** a PR is opened
**Then** lint and type-check run automatically

**Requirements:** ARCH6, ARCH15-17, NFR27

---
