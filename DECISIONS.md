# Engineering decisions — InquiryDesk

## Assumptions
- Employees, not customers, submit and manage inquiries.
- No self-registration; two seeded staff users are sufficient for local evaluation.
- Customer contact may be either a phone number or email, so it is a general contact-details field.

## 1. Ownership rule
Only the staff creator can list, view, or update an inquiry. All database reads and changes filter by authenticated `created_by`, not just visible UI controls. Other users receive a 404 for a direct inquiry URL, without disclosing whether a record exists.

## 2. Controlled lifecycle
The only valid status transitions are `New → In Progress → Resolved`. Resolved is final. The API rejects shortcuts and backward transitions with 422. This makes the simple workflow consistent and easy to test.

## 3. Handling stale records
Each inquiry has an integer `version`. The client sends the version it last read. During a status update, PostgreSQL locks the row; if another tab updated it, the backend returns 409 (stale data), and the UI reloads rather than overwriting it. No real-time websocket infrastructure is needed.

## Trade-off
Inquiry listing is limited to 200 rows to keep the implementation and UI simple within the assessment time box. Production would add pagination, auditing, and richer search. Duplicate prevention is limited to disabling the submit button while saving; no semantic duplicate-detection system is provided.

## Validation, reliability and usability
Frontend gives immediate field errors; the Express API independently validates using Zod. Parameterized SQL prevents SQL injection. Passwords are hashed, sessions use signed httpOnly cookies, and the backend handles missing IDs, invalid tokens, unauthorized reads and malformed payloads. Loading, empty and server-error states are shown in the UI.

## AI / outside resources disclosure (edit this to reflect your actual work)
AI-assisted drafting was used to propose the folder structure, initial components, API routes, and tests. A concrete suggestion adopted was a version field for stale-tab handling. The recommendation to add rich analytics, notifications, or complex multi-role permissions was not adopted because the brief explicitly prioritizes a small reliable workflow. **Before submission, review every file and revise this paragraph to truthfully describe what you used, changed, accepted, or rejected.**

## Next improvements
Integration tests running against a disposable PostgreSQL database; pagination; audit log of status changes; production-ready CSRF mitigation, deployment and monitoring.
