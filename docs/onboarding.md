# Developer Onboarding and Installation Guide

Welcome to the development team of the **Clinic Queue Management Platform**! This guide details local setup instructions, repository conventions, and contribution standards.

---

## Local Setup Prerequisites

Make sure you have the following packages installed on your development workstation:
* **Node.js**: v18.x or newer (npm v9.x or newer)
* **PostgreSQL**: v15.x or newer (local daemon or remote instance)
* **Git**

---

## Development Installation

Follow these steps to initialize the project locally:

1. **Clone the Repository:**
   ```bash
   git clone <repository-url>
   cd clinic-queue-management-system
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root workspace folder:
   ```env
   # PostgreSQL Connection String
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres?schema=public"

   # Supabase Client Credentials
   NEXT_PUBLIC_SUPABASE_URL="https://example.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
   ```

4. **Initialize Database Tables:**
   Execute Prisma migrations to build tables, relationships, and indexes:
   ```bash
   npx prisma db push
   ```

5. **Generate Database client bindings:**
   ```bash
   npx prisma generate
   ```

6. **Launch local dev server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your web browser to check the app.

---

## Coding Standards & Workflow

- **Layered Architecture**: Keep route controllers thin. Perform database writes inside Repositories (`src/lib/backend/repositories/`), business logic validations inside Services (`src/lib/backend/services/`), and schema checks inside Validators (`src/lib/backend/validators/`).
- **DRY & SOLID**: Avoid copy-pasting Prisma calls. Call repository functions inside services.
- **Type Safety**: Enforce strict TypeScript typing. Avoid using `any` unless absolutely required.
