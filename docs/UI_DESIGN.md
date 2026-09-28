# CaseBridge - UI System & Design Tokens Specification

## 1. Design Philosophy
CaseBridge employs a calm, institutional, highly accessible aesthetic. Whistleblowers reporting sensitive issues require visual clarity, immediate reassurance, and zero distracting gimmicks.

The design strictly avoids heavy visual elements, unoptimized imagery, video backgrounds, or external font latency.

---

## 2. Reusable Design Tokens

### 2.1 Color Palette
```css
:root {
  /* Core Brand Colors */
  --cb-navy: #0f172a;          /* Slate 900: Authority, headers, footers */
  --cb-navy-dark: #0b1120;     /* Deep Slate: Notice bars, contrast borders */
  --cb-blue: #1d4ed8;          /* Blue 700: Primary actions, active links */
  --cb-blue-hover: #1e40af;    /* Blue 800: Hover states */
  --cb-blue-light: #eff6ff;    /* Blue 50: Pill badges, info highlights */

  /* Neutral Backgrounds & Grays */
  --cb-white: #ffffff;         /* Cards, modal dialogs, input fields */
  --cb-gray-50: #f8fafc;       /* Canvas body background */
  --cb-gray-100: #f1f5f9;      /* Stepper containers, code boxes */
  --cb-gray-200: #e2e8f0;      /* Standard card borders */
  --cb-gray-300: #cbd5e1;      /* Input borders, dividers */
  --cb-gray-500: #64748b;      /* Helper text, timestamps */
  --cb-gray-600: #475569;      /* Secondary copy, captions */
  --cb-gray-700: #334155;      /* Body text */
  --cb-gray-900: #0f172a;      /* High-emphasis text */

  /* Restrained State Colors */
  --cb-green-bg: #ecfdf5;      /* Emerald 50: Success alerts, Resolved badge */
  --cb-green-text: #065f46;    /* Emerald 800: Accessible contrast ratio >= 4.5:1 */
  --cb-green-border: #a7f3d0;

  --cb-amber-bg: #fffbeb;      /* Amber 50: Action Required, warnings */
  --cb-amber-text: #92400e;    /* Amber 800: Accessible contrast */
  --cb-amber-border: #fde68a;

  --cb-red-bg: #fef2f2;        /* Red 50: Errors, Overdue SLA flags */
  --cb-red-text: #991b1b;      /* Red 800: High-visibility urgency */
  --cb-red-border: #fecaca;
}
```

### 2.2 Typography
To ensure instant page loads and zero external font requests, CaseBridge utilizes an optimized system font stack:
- **Body & UI**: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
- **Tracking Codes & Keys**: `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`

---

## 3. Button Hierarchy & Interactive States

1. **Primary Action (`.btn-primary`)**:
   - Background: `var(--cb-blue)`, Text: `var(--cb-white)`
   - Used for: `Submit a Case`, `Track a Case`, `Submit Anonymous Complaint`.
   - Hover: Transitions to `var(--cb-blue-hover)` in 180ms.
2. **Secondary Action (`.btn-secondary`)**:
   - Background: `var(--cb-white)`, Text: `var(--cb-gray-800)`, Border: `var(--cb-gray-300)`
   - Used for: `Learn How It Works`, `Print / Save`, `Reset Filter`.
   - Hover: Subtle background shift to `var(--cb-gray-100)`.
3. **Dark Institutional Action (`.btn-dark`)**:
   - Background: `var(--cb-navy)`, Text: `var(--cb-white)`
   - Used for: Quick track submit, Staff portal access.

---

## 4. Accessibility & Interaction Standards (WCAG 2.2 AA)

- **Skip Navigation**: `<a href="#main-content" class="skip-link">Skip to main content</a>` allows immediate keyboard jumping past headers.
- **Visible Focus States**: Every link, button, input, and select element has a high-contrast focus ring: `outline: 2px solid var(--cb-blue); outline-offset: 2px;`.
- **Mobile Touch Targets**: All interactive buttons and inputs have minimum heights of 42–48px to meet touch target criteria.
- **Reduced Motion Support**:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
  ```
- **Error Perception**: Error states include explicit text headings, icons, and bordered boxes—never relying on color alone.

---

## 5. Animation Policy
- Transitions are capped strictly between **150ms and 200ms** (`180ms ease-in-out`).
- No external heavy animation frameworks (e.g. GSAP, Lottie) are loaded.
- All motion is functional (hover feedback, focus states, copy-to-clipboard status) rather than decorative.
