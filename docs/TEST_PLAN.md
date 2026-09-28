# CaseBridge Master Test Plan (Stage 8 Quality Engineering)

## 1. Executive Summary & Quality Strategy
This test plan defines the comprehensive verification strategy for CaseBridge, an institutional grievance reporting and case management system with an anonymity boundary.

The test strategy references **ISO/IEC 25010:2023** (Systems and software Quality Requirements and Evaluation — Product quality model) as an engineering guideline. Formal ISO certification is neither claimed nor implied.

---

## 2. ISO/IEC 25010:2023 Quality Characteristics Coverage

| Quality Characteristic | Focus in CaseBridge | Verification Method |
|:---|:---|:---|
| **Functional Suitability** | Completeness and correctness of all 10 core grievance functions (FR-01 to FR-10) | Automated unit, integration, and workflow tests |
| **Performance Efficiency** | Sub-millisecond cryptographic hashing, lean bundle size (<500KB entry), sub-20ms 1,000-case search | Automated performance benchmark test suite & build analyzer |
| **Compatibility** | Standard Web standards, headless execution, responsive across mobile and desktop | Multi-viewport CSS tests & headless Vite/Node execution |
| **Usability** | WCAG 2.2 AA accessible focus rings, clear error feedback, zero confusing jargon | Automated UI state tests & manual keyboard audit |
| **Reliability** | Graceful rejection of malformed inputs, atomic audit events, state machine constraint enforcement | Edge case & boundary test suite |
| **Security** | Zero-ID persistence, high-entropy hash tokens, RBAC enforcement, XSS escaping, IDOR shielding | Security hardening & authorization test suites |
| **Maintainability** | Clean modular TypeScript architecture, strict type contracts, reusable UI component library | TypeScript strict mode (`tsc --noEmit`), Vitest suite |
| **Portability** | Runs hermetically on Node/Vite/Express in containerized cloud runtimes | Zero external font/CDN dependencies, hermetic build |

---

## 3. Testing Pyramid Architecture

```
                    ┌─────────────────────────┐
                    │  Deployment Smoke Tests │ (Runtime Health, Route Rendering)
                    ├─────────────────────────┤
                    │    UI Component Tests   │ (8 Tests: States, Badges, Timelines)
                    ├─────────────────────────┤
                    │   Workflow/E2E Tests    │ (2 Tests: Whistleblower & SLA Journeys)
                    ├─────────────────────────┤
                    │   Authorization/RBAC    │ (9 Tests: Student, Member, Lead, Admin)
                    ├─────────────────────────┤
                    │  Edge Cases & Integrity │ (11 Tests: Boundaries, Files, Throttling)
                    ├─────────────────────────┤
                    │  Security Hardening     │ (11 Tests: OWASP ASVS Threats T01-T15)
                    ├─────────────────────────┤
                    │  Case Engine Core Unit  │ (16 Tests: Functions FR-01 to FR-10)
                    ├─────────────────────────┤
                    │  Performance Benchmarks │ (4 Tests: Latency, Throughput, Memory)
                    └─────────────────────────┘
```

---

## 4. Test Suite Structure & Mapping

| Test Suite File | Layer | Primary Scope | Test Count |
|:---|:---|:---|:---|
| `tests/test_case_engine_core.test.ts` | Unit | Functions FR-01 through FR-10 core implementation | 16 |
| `tests/test_security_hardening.test.ts` | Security | OWASP ASVS 5.0.0 threat vectors (IDOR, XSS, upload, tokens) | 11 |
| `tests/test_authorization_and_rbac.test.ts` | Security / Auth | Role boundaries, anonymous isolation, disabled accounts | 9 |
| `tests/test_edge_cases_and_data_integrity.test.ts` | Edge Cases | Boundaries (10K chars, 5MB), rate limit lockout, immutability | 11 |
| `tests/test_integration_workflows.test.ts` | Integration | End-to-end multi-actor lifecycle and SLA escalation | 2 |
| `tests/test_performance_benchmarks.test.ts` | Performance | Hash computation, search throughput, memory caps | 4 |
| `tests/test_ui_components_and_routes.test.ts` | UI Smoke | Component variants, status badges, timelines, cards | 8 |
| **Total Test Count** | | | **61** |

---

## 5. Requirement Traceability Matrix (FR-01 to FR-10)

| Requirement | Feature | Primary Modules | Automated Tests |
|:---|:---|:---|:---|
| **FR-01: Anonymous Submission** | Anonymous filing without student PII, SHA-256 token generation | `caseEngine.ts`, `SubmitCasePage.tsx` | `test_case_engine_core.test.ts` (3 tests), `test_integration_workflows.test.ts` |
| **FR-02: Tracking Code Lookup** | High-entropy token lookup, zero integer ID exposure | `caseEngine.ts`, `TrackCasePage.tsx` | `test_case_engine_core.test.ts` (2 tests), `test_security_hardening.test.ts` |
| **FR-03: Case Status Timeline** | 6-stage lifecycle tracking with overdue indicator | `StatusTimeline.tsx`, `caseEngine.ts` | `test_case_engine_core.test.ts` (2 tests), `test_ui_components_and_routes.test.ts` |
| **FR-04: Two-Way Dialogue** | Anonymous student <-> committee messaging | `caseEngine.ts`, `CaseDetailsStudentPage.tsx` | `test_case_engine_core.test.ts` (1 test), `test_integration_workflows.test.ts` |
| **FR-05: Assignment Management** | Role-restricted delegation by Committee Leads | `caseEngine.ts`, `CaseDetailPage.tsx` | `test_case_engine_core.test.ts` (2 tests), `test_authorization_and_rbac.test.ts` |
| **FR-06: Priority Management** | 4-tier urgency classification with SLA adjustment | `caseEngine.ts`, `CaseDetailPage.tsx` | `test_case_engine_core.test.ts` (1 test), `test_edge_cases_and_data_integrity.test.ts` |
| **FR-07: Secure Attachments** | Extension and MIME validation, 5MB ceiling, path safety | `caseEngine.ts`, `security.ts` | `test_case_engine_core.test.ts` (2 tests), `test_edge_cases_and_data_integrity.test.ts` |
| **FR-08: Escalations & Deadlines** | Target date computation, dynamic overdue evaluation | `caseEngine.ts`, `store.ts` | `test_case_engine_core.test.ts` (1 test), `test_integration_workflows.test.ts` |
| **FR-09: Tamper-Evident Audit** | Append-only audit logging without narrative leaks | `store.ts`, `caseEngine.ts` | `test_case_engine_core.test.ts` (1 test), `test_security_hardening.test.ts` |
| **FR-10: Abuse Protection** | Rate limiting, brute-force lockout, XSS sanitization | `security.ts`, `caseEngine.ts` | `test_case_engine_core.test.ts` (1 test), `test_edge_cases_and_data_integrity.test.ts` |

---

## 6. Regression Protocol
- All tests are executed using `npm test` (`vitest run tests/`).
- TypeScript type contracts are verified via `npm run lint` (`tsc --noEmit`).
- Production bundles and chunking are verified via `npm run build` (`vite build`).
