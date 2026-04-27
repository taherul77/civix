# CiviXLab — Frontend MVP (full UI)

Next.js 16 frontend for **CiviXLab**, a multi-tenant civil engineering laboratory testing SaaS for
Saudi Arabia & the GCC. SBC 304 / SASO / GSO / ASTM compliant. ISO 17025 audit-trail aware.

This MVP implements the **entire frontend surface area** of the technical specification with mock
data. Backend, real auth, real PDF generation, equipment APIs and mobile native are still mocked.

## Stack

| Concern   | Tech                                        |
| --------- | ------------------------------------------- |
| Framework | Next.js 16.2.4 (App Router) + React 19      |
| Language  | TypeScript (strict)                         |
| Styling   | Tailwind CSS 3.4 with custom design tokens  |
| Forms     | React Hook Form + Zod                       |
| Charts    | Recharts                                    |
| State     | Zustand (persisted) + TanStack Query        |
| Icons     | lucide-react                                |
| Bilingual | English + Arabic with RTL                   |

## Run

```bash
cd civixlab
npm install
npm run dev
```

Open <http://localhost:3000>. Sign in with **any** email + password.

## Pages delivered

### Operations
- **Dashboard** — 4 KPIs, monthly volume line, category pie, pass/fail bars, recent tests, projects
- **Projects** — list + detail (samples + tests aggregation)
- **Samples** — list with filters + detail with **chain-of-custody timeline** & signature trail
- **Tests** — list with status / category / search filters
- **Review queue** — Quality Manager / Approver UI with approve / return / **digital sign + lock**
- **Reports** — gallery + printable A4 report preview (signatures, QR, ZATCA-style block)

### All 75 tests with live calculations
- Featured forms (hand-built, sticky live-results panel + chart): **A1 Compressive**, **A4 Placement Temp**, **H1 Potable Water**
- Generic schema-driven form for **all 72 remaining tests** (`/tests/new/[code]`):
  - 13 concrete · 14 soil · 12 aggregate · 10 asphalt · 7 steel · 9 cement · 7 masonry · 9 water
  - Each schema defines fields, units, defaults, calculations, and pass/fail rules referenced in code
- Saudi-specific badges and SBC 304 / SASO / GSO limits enforced live

### Visualize
- **Calendar** — month view with test / calibration / sampling events
- **Sample map** — SVG of Saudi Arabia with GPS-tagged samples and city labels
- **Notifications & alerts** — info / warn / error / success with deep-links

### Lab
- **Equipment** — register with calibration countdown and overdue alerts
- **Field (mobile)** — phone mock with 4-step capture: type → barcode → GPS → photo, offline indicator, pending-sync queue
- **Audit log** — tamper-evident, action-tagged, with diff display (old → new)

### Admin
- **Users** — RBAC table with MFA status (11 roles per spec)
- **Security & MFA** — 3-step TOTP enrolment (QR → verify → recovery codes) + SAML 2.0 providers (Azure AD, Okta, Google Workspace, Microsoft 365) + access policies
- **White-label & report template** — color-picker + presets (Aramco, NEOM, Red Sea, Diriyah), identity fields, bilingual headers, **live report preview** that reflects every change
- **Billing — ZATCA & Etimad** — Phase 2 e-invoicing status (CSID, ECDSA stamp, QR codes), Etimad vendor info, invoice list with VAT
- **Settings** — tenant info, theme, language, standards, integrations

### UX
- Dark / light mode
- English ↔ Arabic with full RTL layout
- Sticky live-result panels on all test forms
- Print-optimized report (`window.print()` produces clean A4)
- Status & pass/fail badges everywhere

## Project structure

```
src/
├── app/
│   ├── (app)/                       # Authenticated app shell
│   │   ├── audit/
│   │   ├── billing/                 # ZATCA Phase 2 + Etimad
│   │   ├── calendar/
│   │   ├── dashboard/
│   │   ├── equipment/
│   │   ├── field/                   # Mobile field-tech preview
│   │   ├── map/                     # Saudi Arabia sample map
│   │   ├── notifications/
│   │   ├── projects/[id]/
│   │   ├── reports/
│   │   ├── review/                  # Approve / sign / lock
│   │   ├── samples/[id]/            # Chain of custody
│   │   ├── security/                # MFA + SAML SSO
│   │   ├── settings/
│   │   ├── tests/
│   │   │   ├── [id]/report/
│   │   │   └── new/
│   │   │       ├── [code]/          # Generic schema-driven form (72 tests)
│   │   │       ├── A1/              # Featured: compressive strength
│   │   │       ├── A4/              # Featured: placement temperature
│   │   │       └── H1/              # Featured: potable water
│   │   ├── users/
│   │   └── white-label/             # Branding + report template editor
│   ├── login/
│   └── ...
├── components/
│   ├── shell/                       # Sidebar (4 groups), Topbar
│   ├── dashboard/                   # KPI card + 3 chart components
│   ├── test-form/                   # FormSection, Field, Result
│   └── ui/                          # PageHeader, StatusBadge
├── lib/
│   ├── i18n.ts                      # EN / AR dictionary
│   ├── mock-data.ts                 # Projects, samples, tests, equipment
│   ├── mock-extra.ts                # Audit, notifications, calendar, geo
│   ├── test-catalog.ts              # 75-test catalog metadata
│   ├── test-schemas.ts              # Calculation schemas for 72 tests
│   └── utils.ts
└── store/
    └── app-store.ts                 # zustand: lang, theme, user
```

## What's still mocked (frontend-only build)

- **Auth** — zustand persist, no real JWT, MFA, or SAML round-trip
- **API** — every page reads from `mock-data.ts` and `mock-extra.ts`
- **PDF download** — uses `window.print()`; no Puppeteer rendering
- **Equipment integrations** — UI surfaces exist; no real REST/Modbus adapters
- **ZATCA** — UUID + UI shown; no real ZATCA portal call
- **Mobile** — phone-frame preview only; no native React Native build yet

## Roadmap (phase 2 — backend)

1. Fastify + Prisma + PostgreSQL with Row-Level Security
2. Auth.js v5 with JWT + TOTP MFA + SAML
3. Server-side calculation engine (reuses `test-schemas.ts` shape)
4. Puppeteer PDF rendering + PKCS#12 digital signatures
5. ZATCA Phase 2 real integration
6. Equipment REST adapters (Forney, Controls, Instron, HACH)
7. React Native + Expo mobile app

## License

Private / proprietary — built from CiviXLab Technical Specification v2.0 (April 2026).
# civix
