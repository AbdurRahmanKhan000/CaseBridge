# CaseBridge - Route Map & Navigation Architecture

## 1. Public Routes (Stage 3 Complete)

| URL Path | Route Endpoint | HTTP Methods | Purpose & Core Content | Rate Limit |
| :--- | :--- | :--- | :--- | :--- |
| **`/`** | `public.index` | GET | **Home**: Clear purpose, who it is for, primary actions (`[Submit a Case]`, `[Track a Case]`), quick tracking input, 4 workflow pillars, approved categories, emergency notice. | Standard (100/min) |
| **`/about`** | `public.about` | GET | **About & ARK Ecosystem**: Whistleblower protection mission, ARK Ecosystem consortium placement, clearly editable institutional specification placeholder, committee independence. | Standard (100/min) |
| **`/how-it-works`** | `public.how_it_works` | GET | **How It Works**: Step-by-step process (Submit → Receive Code → Review → Assignment → Dialogue → Updates → Resolution), SLA resolution benchmarks. | Standard (100/min) |
| **`/submit`** | `public.submit` | GET, POST | **Submit a Case**: Simplest important form (category, priority self-assessment, subject, optional location/date, narrative, optional permitted attachment, consent checks). | 10 per hour |
| **`/track`** | `public.track` | GET, POST | **Track a Case**: 16-character code input, rate-limited lookup, milestone stepper, safe timeline, permitted committee dialogue, attachment summary, reply form. Safe non-enumerating error states. | 20 per minute |
| **`/track/<code_or_hash>/message`** | `public.post_student_message` | POST | **Anonymous Reply**: Student follow-up message submission without account creation. Strictly isolated from staff-only internal notes. | 15 per hour |
| **`/privacy`** | `public.privacy` | GET | **Privacy Boundary**: Clear list of non-collected items (names, IDs, emails, IPs, telemetry), candid network reality notice, self-redacting tips. | Standard (100/min) |
| **`/security`** | `public.security` | GET | **Security & Cryptography**: Cryptographic breakdown ($32^{12}$ tokens, SHA-256 peppered digests, AES-256 field encryption, RBAC, immutable event journal). | Standard (100/min) |
| **`/faq`** | `public.faq` | GET | **Frequently Asked Questions**: Straightforward human answers for anonymity limits, lost codes, investigation stages, emergency protocols. | Standard (100/min) |

---

## 2. Internal Linking Hierarchy

```text
[Home Page /]
  │
  ├──> [Submit /submit]
  │       └──> [Submit Success /submit (POST)] ───> [Track /track?code=...]
  │
  ├──> [Track /track]
  │       └──> [Active Track View] ───> [Post Message /track/<code>/message]
  │
  ├──> [How It Works /how-it-works]
  │       ├──> [Submit /submit]
  │       └──> [Track /track]
  │
  ├──> [About /about]
  │       ├──> [How It Works /how-it-works]
  │       └──> [Privacy /privacy]
  │
  ├──> [FAQ /faq]
  │       ├──> [Submit /submit]
  │       ├──> [Track /track]
  │       └──> [Privacy /privacy]
  │
  ├──> [Privacy /privacy]
  │       ├──> [Security /security]
  │       └──> [Submit /submit]
  │
  └──> [Security /security]
          ├──> [Track /track]
          └──> [About /about]
```

**Global Navigation Bar**:
- Top emergency bar: Immediate danger warning with phone reference.
- Header links: Home, How It Works, About & ARK, FAQ, Privacy, Security.
- Primary CTA buttons: `[Track a Case]`, `[Submit a Case]`.
- Secondary portal link: `[Staff Login]` / `[Staff Portal]`.

**Global Footer**:
- Emergency policy disclosure.
- 4 column link matrix (CaseBridge summary, Public actions, Trust & Security, Institutional Desk).
- Direct footer bottom links to Privacy, Security, FAQ, and About.

---

## 3. Authenticated Staff Routes (Stage 4 & 5)
- `/committee/login` — Staff authentication entry point.
- `/committee/logout` — Graceful session termination.
- `/committee/dashboard` — Overview metrics and recent intake queue.
- `/committee/cases` — Full case management queue with status and priority filtering.
- `/committee/cases/<id>` — Deep investigation workspace with internal confidential notes, official replies, and immutable audit logs.
- `/admin/dashboard` — System administrator console (roles, categories, SLAs, system-wide audit stream).

---

## 4. Error State Endpoints
- `403` — Access Forbidden / Role authorization failure (`errors/403.html`).
- `404` — Route or Resource Not Found (`errors/404.html`).
- `429` — Rate Limit Exceeded (`errors/429.html`).
- `500` — Safe Internal Server Error with database rollback (`errors/500.html`).
