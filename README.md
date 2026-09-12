# KAMPYN - Frontend Web Application

*Project under **EXSOLVIA** - Excellence in Software Solutions*

## Introduction

**KAMPYN** is a campus-focused platform for food ordering, vendor and university dashboards, payments, guest-house flows, auditorium booking, and related admin tools. The UI is a **Next.js** application with role-specific dashboards and integrations for Razorpay.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Runtime:** React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS, SCSS, Radix UI primitives, Framer Motion
- **Charts / UX:** Recharts, Lucide / React Icons
- **HTTP:** Axios (central API helpers in `src/utils/apiUtils.ts`)
- **Auth:** JWT-backed flows with `@react-oauth/google`
- **Payments:** Razorpay (via backend + public key configuration)
- **Analytics:** Vercel Analytics & Speed Insights (when deployed on Vercel)

## Features

- Multi-role experiences (students, vendors, universities, admins, guest house, auditorium booking)
- Food ordering, carts, favourites, and vendor dashboards
- Payments and invoices (integration with backend Razorpay routes)
- Admin tooling (monitoring, platform fees, help messages, rate limits, etc.)
- Responsive layouts and shared cart / billing components

## Quick Start

### Prerequisites

- **Node.js** 18 or newer (aligned with Next.js / React requirements)
- **npm** (or another compatible package manager)

### Installation

From this repository’s frontend folder:

```bash
git clone https://github.com/exsolvia/kampyn-frontend.git
cd kampyn-frontend

npm install
```

Create **`.env.local`** in the project root (Next.js reads this automatically). Use at least the variables in [Environment variables](#environment-variables) below.

Start the dev server (uses **Turbopack**):

```bash
npm run dev
```

The app runs at **http://localhost:3000**.

If you use the **KAMPYN monorepo** layout instead of cloning only this repo, open `kampyn-frontend` from the workspace root and follow the same steps.

### Backend pairing

Point **`NEXT_PUBLIC_BACKEND_URL`** at your API origin (for example `http://localhost:5001` when running `kampyn-backend` locally). In development, `next.config.ts` also rewrites `/api/*` to `http://localhost:5001/api/*` so direct `/api/...` calls can reach the backend without CORS issues for that path pattern.

## Environment variables

Define these in **`.env.local`** (never commit secrets).

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_BACKEND_URL` | Base URL of the KAMPYN backend (no trailing slash), e.g. `http://localhost:5001` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth Web client ID for Sign in with Google |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay **Key ID** (publishable) |
| `NEXT_PUBLIC_APP_NAME` | Display name (defaults to `KAMPYN` in code if unset) |
| `NEXT_PUBLIC_APP_VERSION` | Optional version string for UI/config |

## NPM scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Next.js dev server with Turbopack |
| `npm run build` | Production build (runs `postbuild` → `next-sitemap`) |
| `npm start` | Serve production build |
| `npm run lint` | ESLint via Next.js |
| `npm run sitemap` | Regenerate sitemap (`next-sitemap`) |

**Husky** and **lint-staged** run ESLint on staged files when configured in your checkout.

## Documentation

- [Documentation overview](./docs/README.md)
- [Development guide](./docs/DEVELOPMENT_GUIDE.md)
- [Component library](./docs/COMPONENT_LIBRARY.md)
- [Security guide](./docs/SECURITY.md)

## Development workflow

### Branch naming

- **Features:** `feature/feature-description`
- **Bug fixes:** `fix/bug-description`
- **Hotfixes:** `hotfix/critical-fix-description`

### Commit messages (Conventional Commits)

```bash
git commit -m "feat: implement user authentication system"
git commit -m "fix: resolve payment validation issue"
git commit -m "docs: update component documentation"
```

## Contributing

1. Fork or branch from the appropriate repo
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit with clear messages
4. Push and open a pull request

## License

This project is licensed under the MIT License.

## Support & Contact

- **Contact:** [contact@kampyn.com](mailto:contact@kampyn.com)

---

**© 2026 EXSOLVIA. All rights reserved.**
