# MVP Condos Portal

Resident, building admin, and company owner/administrator portals built with React, Vite, and Tailwind CSS.

## Demo logins

Use any non-empty username and password. The username selects which portal opens:

| Username contains | Portal |
|-------------------|--------|
| `company` or `owner` | Company Owner / Administrator |
| `admin` | Building admin |
| `vendor` or a vendor registry email | Vendor |
| (anything else) | Resident |

Examples: `company@demo.com`, `owner@demo.com`, `admin@demo.com`, `resident@demo.com`, `vendor@test.com`, `sarah@waterlooelectric.ca` (pending PO), `mike@kitchenerplumbing.ca`.

## Prerequisites

Install [Bun](https://bun.sh/docs/installation). This project uses Bun for package management — do not use `npm install`.

## Setup

```bash
bun install
```

## Scripts

| Task | Command |
|------|---------|
| Dev server | `bun run dev` |
| Production build | `bun run build` |
| Preview build | `bun run preview` |

The dev server runs at [http://localhost:5173](http://localhost:5173) by default.
