# CaseBridge - UX Content & SEO Copywriting Guide

## 1. Tone of Voice & Guiding Principles

CaseBridge speaks with an authoritative, reassuring, and plainly understood voice. Whistleblowers and aggrieved students are frequently under severe stress; our copy must prioritize clarity, transparency, and dignity over bureaucratic or technical jargon.

### Core Writing Principles:
1. **Plain Language**: Explain processes in straightforward conversational English. Avoid legalistic obscurities.
2. **Candid & Truthful**: Do NOT make false promises such as "100% untraceable on the internet". Explain the real boundary (application-level zero storage vs. ISP/network logging).
3. **No AI Clichés**: Avoid phrases like "Delve into", "Revolutionizing", "In today's fast-paced world", or "State-of-the-art".
4. **Safety-First**: Prominently display emergency disclaimers (not an emergency dispatch line) on every intake view.

---

## 2. Page-by-Page SEO Metadata & Content Matrix

| Page Path | Target Page Title | Meta Description | Primary H1 & Search Intent |
| :--- | :--- | :--- | :--- |
| **`/`** | `CaseBridge \| Anonymous University Case Reporting & Grievance Review` | `CaseBridge enables university students and staff to submit sensitive grievances anonymously, track resolution progress securely, and communicate without fear of retaliation.` | **Report Campus Concerns Safely. No Personal Identifiers Required.**<br>*(Intent: Find safe anonymous university complaint portal)* |
| **`/about`** | `About CaseBridge & The ARK Ecosystem \| Institutional Governance` | `Learn about CaseBridge's mission to bridge student safety and institutional accountability, and its role within the ARK Ecosystem governance framework.` | **About CaseBridge & The ARK Ecosystem**<br>*(Intent: Understand oversight, governance, and consortium backing)* |
| **`/how-it-works`** | `How CaseBridge Works \| Investigation Process & Resolution Stages` | `Understand the CaseBridge grievance process step-by-step: from anonymous intake and tracking code generation, to committee triage, secure two-way messaging, and resolution.` | **How the CaseBridge Process Works**<br>*(Intent: Evaluate investigation steps, SLAs, and privacy steps)* |
| **`/submit`** | `Submit an Anonymous Case \| CaseBridge Safe Grievance Intake` | `Submit an anonymous complaint or grievance regarding harassment, discrimination, or unfair treatment without providing your name or student ID.` | **Submit an Anonymous Case**<br>*(Intent: Report a grievance safely without identity exposure)* |
| **`/track`** | `Track Case Status \| CaseBridge Anonymous Investigation Portal` | `Track your submitted case status, review investigation milestones, read official committee responses, and send anonymous follow-up messages using your private tracking code.` | **Case Tracking Portal**<br>*(Intent: Look up existing case progress and communicate with reviewers)* |
| **`/privacy`** | `Privacy Boundary & Whistleblower Protection \| CaseBridge` | `Read CaseBridge's transparent privacy architecture. We deliberately do not store names, student IDs, emails, phone numbers, or IP addresses for anonymous grievance submissions.` | **Privacy Boundary & Data Collection Policy**<br>*(Intent: Verify what data is collected and evaluate privacy safety)* |
| **`/security`** | `Security Architecture & Cryptographic Trust \| CaseBridge` | `Discover how CaseBridge safeguards whistleblower communications: high-entropy tracking codes, SHA-256 peppered digests, AES-256 field encryption, and OWASP ASVS verification.` | **Security Architecture & Cryptographic Trust**<br>*(Intent: Audit cryptographic hashing, code entropy, and encryption)* |
| **`/faq`** | `Frequently Asked Questions \| CaseBridge Whistleblower FAQ` | `Find answers to common questions regarding anonymous grievance submission, lost tracking codes, investigation timelines, and whistleblower protection.` | **Frequently Asked Questions**<br>*(Intent: Immediate answers for practical concerns and lost codes)* |

---

## 3. Standard Copy Patterns

### 3.1 Emergency Notice Pattern
> **Immediate Danger Notice:** CaseBridge is an asynchronous case review system, not an immediate dispatch line. If you or someone else is in immediate physical danger, call Campus Security at **[Emergency Phone]** or emergency services (911).

### 3.2 Lost Code Pattern
> **Lost Code Custody Rule:** Because CaseBridge stores only an irreversible SHA-256 hash of your code and retains zero student identifying info, institutional staff cannot look up or reset lost codes. Store your code in a safe place.

### 3.3 Safe Error Pattern (Non-Enumerating)
> **Case Not Found:** No case record was found matching the provided code. Please verify each of the 16 characters. For security against guessing, queries are rate-limited.

---

## 4. Internal Linking Rules
1. Anchor text must describe the destination clearly (e.g. `[Read Privacy Policy]`, `[Review Security Architecture]`, never generic `[Click Here]`).
2. Public informational pages must always provide a path to both action funnels (`[Submit a Case]` and `[Track a Case]`).
3. Footer links must provide universal access to Trust & Security documentation.
