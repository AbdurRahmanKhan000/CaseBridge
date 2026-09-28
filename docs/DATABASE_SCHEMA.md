# CaseBridge - Relational Database Schema Specification (MySQL 8.0)

## 1. Architectural Overview & Entity-Relationship Model

CaseBridge uses a dedicated **MySQL 8.0** relational database accessed via SQLAlchemy 2.0 and Alembic/Flask-Migrate. The browser never accesses the database directly. All operations pass through the server-side Flask application layer.

```text
+-----------------------+           +-----------------------+           +-----------------------+
|         roles         |           |   complaint_categories|           |    system_settings    |
+-----------------------+           +-----------------------+           +-----------------------+
| id (PK)               |           | id (PK)               |           | id (PK)               |
| name (UQ)             |           | name (UQ)             |           | setting_key (UQ)      |
| description           |           | description           |           | setting_value (TEXT)  |
| created_at            |           | sla_days (INT)        |           | description           |
+-----------+-----------+           | active (BOOL)         |           | updated_at            |
            |                       | created_at            |           +-----------------------+
            | 1:N                   +-----------+-----------+
            v                                   | 1:N
+-----------------------+                       v
|         users         |           +-----------------------+
+-----------------------+           |         cases         |
| id (PK)               |           +-----------------------+
| role_id (FK)          |           | id (PK) [Internal]    |
| username (UQ)         |           | tracking_hash (UQ/IX) |<-- Shielded Lookup Token
| email (UQ)            |           | category_id (FK)      |
| password_hash         |           | priority (ENUM)       |
| full_name             |           | status (ENUM)         |
| department            |           | subject               |
| active (BOOL)         |           | narrative (AES-Enc)   |
| created_at            |           | location              |
| updated_at            |           | incident_date         |
| last_login_at         |           | deadline_at (DATETIME)|
+-----+-----------+-----+           | resolved_at           |
      |           |                 | closed_at             |
      | 1:N       | 1:N             | created_at            |
      | (assign)  | (notify)        | updated_at            |
      v           v                 +-----+-----+-----+-----+
+-----------------------+                 |     |     |     |
|      assignments      |<----------------+     |     |     |
+-----------------------+                       |     |     |
| id (PK)               |                       |     |     |
| case_id (FK)          |                       |     |     |
| assigned_user_id (FK) |                       |     |     |
| assigned_by_id (FK)   |                       |     |     |
| assigned_at           |                       |     |     |
| unassigned_at         |                       |     |     |
| notes                 |                       |     |     |
| is_active (BOOL)      |                       |     |     |
+-----------------------+                       |     |     |
                                                |     |     |
      +-----------------------------------------+     |     |
      | 1:N                                           |     |
      v                                               |     |
+-----------------------+                             |     |
|        messages       |                             |     |
+-----------------------+                             |     |
| id (PK)               |                             |     |
| case_id (FK)          |                             |     |
| sender_context (ENUM) |                             |     |
| sender_user_id (FK/N) |                             |     |
| display_name          |                             |     |
| message_content (Enc) |                             |     |
| is_internal_note      |                             |     |
| is_read               |                             |     |
| created_at            |                             |     |
+-----------------------+                             |     |
                                                      |     |
      +-----------------------------------------------+     |
      | 1:N                                                 | 1:N
      v                                                     v
+-----------------------+                             +-----------------------+
|      attachments      |                             |      case_events      |
+-----------------------+                             +-----------------------+
| id (PK)               |                             | id (PK)               |
| case_id (FK)          |                             | case_id (FK)          |
| storage_identifier(UQ)|                             | event_type            |
| original_filename     |                             | actor                 |
| content_type          |                             | actor_role            |
| file_size             |                             | actor_user_id (FK)    |
| sha256_checksum       |                             | details (Safe Meta)   |
| uploaded_by_context   |                             | timestamp             |
| created_at            |                             +-----------------------+
+-----------------------+                                         |
                                                                  | 1:N
                                                                  v
                                                      +-----------------------+
                                                      |      escalations      |
                                                      +-----------------------+
                                                      | id (PK)               |
                                                      | case_id (FK)          |
                                                      | trigger_reason        |
                                                      | deadline              |
                                                      | escalation_target     |
                                                      | status (ENUM)         |
                                                      | created_at            |
                                                      | resolved_at           |
                                                      +-----------------------+
```

---

## 2. Table Schemas & Data Types (MySQL 8.0)

### 2.1 `roles`
Stores authorization roles for institutional staff.
- `id` INT AUTO_INCREMENT PRIMARY KEY
- `name` VARCHAR(50) NOT NULL UNIQUE (e.g. `COMMITTEE_MEMBER`, `COMMITTEE_LEAD`, `SYSTEM_ADMIN`)
- `description` VARCHAR(255) NOT NULL
- `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP

### 2.2 `users`
Authorized institutional staff only. **Anonymous students never have accounts in this table.**
- `id` INT AUTO_INCREMENT PRIMARY KEY
- `role_id` INT NOT NULL, FOREIGN KEY REFERENCES `roles(id)` ON DELETE RESTRICT
- `username` VARCHAR(100) NOT NULL UNIQUE
- `email` VARCHAR(191) NOT NULL UNIQUE
- `password_hash` VARCHAR(255) NOT NULL (Werkzeug Scrypt)
- `full_name` VARCHAR(150) NOT NULL
- `department` VARCHAR(150) NOT NULL DEFAULT 'Ethics & Compliance'
- `active` BOOLEAN NOT NULL DEFAULT 1
- `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
- `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
- `last_login_at` DATETIME NULL

### 2.3 `complaint_categories`
Classification scopes with institutional response SLAs.
- `id` INT AUTO_INCREMENT PRIMARY KEY
- `name` VARCHAR(100) NOT NULL UNIQUE
- `description` TEXT NOT NULL
- `sla_days` INT NOT NULL DEFAULT 7
- `active` BOOLEAN NOT NULL DEFAULT 1
- `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP

### 2.4 `cases`
Core grievance entity.
- `id` INT AUTO_INCREMENT PRIMARY KEY — **Internal integer PK, strictly shielded from students**
- `tracking_hash` VARCHAR(64) NOT NULL UNIQUE — **Lookup representation: SHA-256(tracking_code + salt)**
- `category_id` INT NOT NULL, FOREIGN KEY REFERENCES `complaint_categories(id)` ON DELETE RESTRICT
- `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MEDIUM'
- `status` ENUM('RECEIVED', 'ASSIGNED', 'IN_REVIEW', 'ACTION_REQUIRED', 'RESOLVED', 'CLOSED') NOT NULL DEFAULT 'RECEIVED'
- `subject` VARCHAR(191) NOT NULL
- `narrative` TEXT NOT NULL — **Application-level encrypted (AES-256 / Fernet)**
- `location` VARCHAR(191) NULL
- `incident_date` DATE NULL
- `deadline_at` DATETIME NULL
- `resolved_at` DATETIME NULL
- `closed_at` DATETIME NULL
- `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
- `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

### 2.5 `assignments`
Audit-ready assignment and delegation history.
- `id` INT AUTO_INCREMENT PRIMARY KEY
- `case_id` INT NOT NULL, FOREIGN KEY REFERENCES `cases(id)` ON DELETE CASCADE
- `assigned_user_id` INT NOT NULL, FOREIGN KEY REFERENCES `users(id)` ON DELETE RESTRICT
- `assigned_by_id` INT NOT NULL, FOREIGN KEY REFERENCES `users(id)` ON DELETE RESTRICT
- `assigned_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
- `unassigned_at` DATETIME NULL
- `notes` VARCHAR(255) NULL
- `is_active` BOOLEAN NOT NULL DEFAULT 1

### 2.6 `messages`
Two-way dialogue between student and committee.
- `id` INT AUTO_INCREMENT PRIMARY KEY
- `case_id` INT NOT NULL, FOREIGN KEY REFERENCES `cases(id)` ON DELETE CASCADE
- `sender_context` ENUM('STUDENT', 'COMMITTEE', 'SYSTEM') NOT NULL
- `sender_user_id` INT NULL, FOREIGN KEY REFERENCES `users(id)` ON DELETE SET NULL (NULL for student)
- `display_name` VARCHAR(120) NULL
- `message_content` TEXT NOT NULL — **Application-level encrypted (AES-256 / Fernet)**
- `is_internal_note` BOOLEAN NOT NULL DEFAULT 0
- `is_read` BOOLEAN NOT NULL DEFAULT 0
- `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP

### 2.7 `case_events`
Immutable technical audit trail.
- `id` INT AUTO_INCREMENT PRIMARY KEY
- `case_id` INT NOT NULL, FOREIGN KEY REFERENCES `cases(id)` ON DELETE CASCADE
- `event_type` VARCHAR(64) NOT NULL (e.g. `STATUS_UPDATED`, `ASSIGNMENT_CHANGED`, `ESCALATED`)
- `actor` VARCHAR(150) NOT NULL
- `actor_role` VARCHAR(64) NOT NULL
- `actor_user_id` INT NULL, FOREIGN KEY REFERENCES `users(id)` ON DELETE SET NULL
- `details` VARCHAR(500) NOT NULL — **Sanitized metadata only; no raw narrative or PII**
- `timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP

### 2.8 `attachments`
Evidence file metadata stored in protected storage.
- `id` INT AUTO_INCREMENT PRIMARY KEY
- `case_id` INT NOT NULL, FOREIGN KEY REFERENCES `cases(id)` ON DELETE CASCADE
- `storage_identifier` VARCHAR(255) NOT NULL UNIQUE (Randomized UUID key, not public)
- `original_filename` VARCHAR(255) NOT NULL
- `content_type` VARCHAR(100) NOT NULL
- `file_size` INT NOT NULL (Bytes)
- `sha256_checksum` VARCHAR(64) NOT NULL
- `uploaded_by_context` VARCHAR(50) NOT NULL DEFAULT 'STUDENT'
- `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP

### 2.9 `escalations`
Formal SLA breach and high-priority escalation records.
- `id` INT AUTO_INCREMENT PRIMARY KEY
- `case_id` INT NOT NULL, FOREIGN KEY REFERENCES `cases(id)` ON DELETE CASCADE
- `trigger_reason` VARCHAR(255) NOT NULL
- `deadline` DATETIME NOT NULL
- `escalation_target` VARCHAR(150) NOT NULL
- `status` ENUM('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED') NOT NULL DEFAULT 'ACTIVE'
- `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
- `resolved_at` DATETIME NULL

### 2.10 `notifications`
Internal staff notifications for case assignments and deadline alerts.
- `id` INT AUTO_INCREMENT PRIMARY KEY
- `case_id` INT NULL, FOREIGN KEY REFERENCES `cases(id)` ON DELETE SET NULL
- `recipient_user_id` INT NOT NULL, FOREIGN KEY REFERENCES `users(id)` ON DELETE CASCADE
- `title` VARCHAR(150) NOT NULL
- `message` VARCHAR(500) NOT NULL
- `is_read` BOOLEAN NOT NULL DEFAULT 0
- `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP

### 2.11 `system_settings`
Configurable institutional parameters.
- `id` INT AUTO_INCREMENT PRIMARY KEY
- `setting_key` VARCHAR(100) NOT NULL UNIQUE
- `setting_value` TEXT NOT NULL
- `description` VARCHAR(255) NOT NULL
- `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

---

## 3. Performance Indexing Strategy

To maintain rapid lookups under institutional loads without over-indexing:

1. **`cases.tracking_hash`**: Unique B-tree index for instantaneous $O(1)$ anonymous student lookups.
2. **`cases.status` & `cases.priority`**: Single-column indexes for fast staff triage and queue filtering.
3. **`cases.category_id`**: Foreign key index for category aggregation and report generation.
4. **`cases.created_at` & `cases.updated_at`**: Sorting indexes for chronological queues.
5. **`cases.deadline_at`**: Index for scheduled batch jobs identifying overdue SLAs.
6. **`assignments.case_id` & `assignments.assigned_user_id`**: Indexes for "Assigned to Me" queries.
7. **`messages.case_id` & composite `(case_id, created_at)`**: Fast retrieval of chronological discussion threads.
8. **`case_events.case_id` & `case_events.timestamp`**: Fast audit timeline extraction.
9. **`escalations.deadline` & `escalations.status`**: Quick detection of active overdue escalations.

---

## 4. Cryptographic Security & Field Encryption

1. **Unpredictable Tracking Code**: Generated using Python's cryptographically secure `secrets` library (`CB-XXXX-XXXX-XXXX`).
2. **Irreversible Tracking Hash**: Stored as `SHA-256(code + TRACKING_CODE_SALT)`.
3. **Sensitive Field Encryption**: The narrative in `cases.narrative` and body in `messages.message_content` are encrypted at rest using AES-256 (Fernet) with a key stored in `CASE_ENCRYPTION_KEY`.
4. **Zero-PII Storage**: IP addresses, browser fingerprints, and student matriculation numbers are strictly prohibited and structurally omitted from the database schema.
