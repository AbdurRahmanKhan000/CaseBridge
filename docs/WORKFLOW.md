# CaseBridge - Core Case Workflow & Lifecycle Specification

## 1. Case Lifecycle & State Machine (Function 3)

The CaseBridge case management engine enforces a strict sequential state machine. Arbitrary free-form status manipulation is blocked both in the client engine and in server-side validators.

```text
[ RECEIVED ]
      │
      ├───> [ ASSIGNED ]
      │          │
      │          ├───> [ IN REVIEW ]
      │          │          │
      │          │          ├───> [ ACTION REQUIRED ]
      │          │          │          │
      │          │          │          └───> [ IN REVIEW ] (after student input)
      │          │          │
      │          │          └───> [ RESOLVED ]
      │          │                     │
      │          │                     └───> [ CLOSED ]
      │          │
      │          └───> [ CLOSED ] (Administrative dismissal / lack of jurisdiction)
      │
      └───> [ CLOSED ] (Duplicate or spam intake)
```

### 1.1 Legal Status Transition Rules
| Source Status | Permitted Target Statuses | Actor Role Constraints | Trigger Conditions |
| :--- | :--- | :--- | :--- |
| **`Received`** | `Assigned`, `In Review`, `Closed` | Committee Lead, Committee Member | Investigator assigned or direct triage commenced. |
| **`Assigned`** | `In Review`, `Action Required`, `Resolved`, `Closed` | Assigned Member, Committee Lead | Investigator opens file or requests information. |
| **`In Review`** | `Action Required`, `Resolved`, `Closed` | Assigned Member, Committee Lead | Formal investigation, evidence review, or clarification requested. |
| **`Action Required`** | `In Review`, `Resolved`, `Closed` | Assigned Member, Committee Lead | Follow-up received from student or faculty. |
| **`Resolved`** | `Closed`, `In Review` | Committee Lead | Formal findings and remedies published. Can return to `In Review` only upon verified formal appeal. |
| **`Closed`** | `In Review` | Committee Lead Only | Final archiving. Requires justification audit event to reopen. |

---

## 2. Response Deadlines & Overdue Detection (Function 8)

### 2.1 Deadline Calculation
Deadlines are deterministically computed upon submission based on the complaint's assigned category SLA and assessed priority level:
- **`Critical`**: **24 Hours** (`now + 1 day`). Severe ongoing threats, active bodily danger, or retaliatory expulsion threats.
- **`High`**: **72 Hours** (`now + 3 days`). Imminent grading retaliation, faculty misconduct, or targeted harassment.
- **`Medium`**: **Category SLA Days** (typically **7 Days**). Standard procedural or academic disputes.
- **`Low`**: **Max(10, Category SLA Days)** (typically **14 Days**). General institutional inquiries or historic non-active concerns.

### 2.2 Overdue Status Flag
`isOverdue` is calculated as a dynamic condition:
$$\text{isOverdue} = (\text{now} > \text{deadlineAt}) \land (\text{status} \notin \{\text{Resolved}, \text{Closed}\})$$

When `isOverdue` becomes true:
1. The case appears with high-contrast amber/red alert banners on student and committee screens.
2. An automatic system escalation event (`ESCALATION_TRIGGERED`) is recorded in the case audit log.
3. The Committee Lead receives prominent visual cues on the executive triage dashboard.

---

## 3. Assignment Workflow (Function 5)

1. **Role Authorization**: Only **`COMMITTEE_LEAD`** and **`SYSTEM_ADMIN`** are authorized to assign, reassign, or unassign cases. Ordinary `COMMITTEE_MEMBER` staff cannot reassign cases away from themselves.
2. **First Assignment**: When an unassigned case in `Received` status is assigned to an investigator, its status automatically advances to `Assigned`.
3. **Reassignment**: If the assigned investigator has a conflict of interest (e.g. from the same department as the accused), the Committee Lead reassigns the case to another member. This triggers an `ASSIGNMENT_REASSIGNED` audit record.
4. **Unassignment**: A case can be returned to the general intake queue (`assignedToId = null`), triggering an `ASSIGNMENT_REMOVED` audit record.

---

## 4. Anonymous Two-Way Dialogue & Internal Notes (Function 4)

Communication on any case is strictly segmented into two channels:
1. **Public Thread (Student $\leftrightarrow$ Committee)**:
   - Visible to the anonymous student in the tracking portal.
   - Student messages do not require an account or login; session access is verified via the 16-character code hash.
   - Committee replies attribute the institutional display name (e.g., "Ethics & Case Committee") to maintain impartiality.
2. **Confidential Internal Notes**:
   - Marked with `isInternalNote = true`.
   - Stored in the database and visible **ONLY** to logged-in committee staff.
   - **Filtered out unconditionally** from all public-facing tracking views and student API responses.
   - Ideal for investigator notes, department conflict checks, and legal counsel opinions.

---

## 5. Evidence Attachments Handling (Function 7)

1. **Permitted Formats**: Strictly limited to `PDF`, `PNG`, `JPG`, `JPEG`, `TXT`, and `DOCX`.
2. **Maximum Size**: 5 MB ($5 \times 1024 \times 1024$ bytes) per file.
3. **Validation**: Validates both file extension and MIME type. Files with executable extensions (`.sh`, `.exe`, `.bat`, `.js`, `.py`) are rejected immediately.
4. **Storage Architecture**: Files are stored with cryptographically generated UUID storage keys in protected, unindexed storage folders. Direct static HTTP access is prohibited.
