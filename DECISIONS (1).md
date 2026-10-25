# Engineering Decisions — InquiryDesk

## Assumptions
- The application is an internal staff workspace; customers do not sign in or submit inquiries directly.
- Staff accounts are provisioned for local assessment rather than created through self-registration.
- A customer's contact detail may be an email address or phone number, so the form uses one flexible contact-details field.

## Key design decisions

### 1. Inquiry ownership and access
An inquiry belongs to the staff member who created it. The Express API uses the authenticated staff identity to restrict inquiry listing, viewing, and updating. For an inquiry that is missing or belongs to another user, the detail API returns **404 Not Found**, avoiding disclosure of another employee's records. This rule must be enforced in the backend, not only by hiding UI controls.

### 2. Controlled status lifecycle
The permitted sequence is **New → In Progress → Resolved**. Skipping stages, moving backwards, and reopening a Resolved inquiry are not supported in this intentionally small workflow. The API rejects invalid transitions with **422 Unprocessable Entity**, while the UI communicates the permitted next action.

### 3. Stale-data handling
Each inquiry has a `version` value. The frontend submits its last-read version when changing a status. The backend checks that value during the database update; if another browser tab has already changed the record, it returns **409 Conflict** rather than overwriting newer information. The UI can then reload the current inquiry. This avoids needing WebSockets or real-time synchronization for the assessment.

## Validation, reliability, and usability
The frontend displays required-field and loading/error feedback, but validation is also performed independently in the Express API using Zod. Parameterized PostgreSQL queries reduce SQL-injection risk. Staff passwords are stored as hashes, and authentication is enforced by the API using signed HTTP-only cookies. Missing records, invalid requests, and unauthenticated access receive explicit responses. These design choices should be verified through the provided tests and demonstration scenarios.

## Trade-off and limitations
The inquiry list is capped at 200 records to keep the application focused and achievable in the assessment's time budget. Duplicate handling is limited to preventing repeated clicks while a submission is in progress; the system does not detect semantically identical inquiries. A production system would benefit from pagination, a status-change audit log, and broader database-backed integration tests.

## Use of AI and outside resources
AI assistance was used to help outline the project structure, draft the React and Express implementation, propose API validation and automated tests, and troubleshoot local setup and GitHub publishing. One suggestion adopted was **version-based stale-update detection**, because it addresses the two-browser-tab scenario without requiring real-time infrastructure. Additional dashboard analytics, notifications, and complex user roles were not included because the assessment prioritizes a small, dependable inquiry workflow. The final submission has been reviewed and adjusted through local setup and testing; any behavior not personally verified should be presented as an implementation choice or limitation rather than as a confirmed test result.

## Next improvements
Add automated integration tests against a disposable PostgreSQL database, pagination, an audit history for status changes, stronger production CSRF protections, and deployment monitoring.
