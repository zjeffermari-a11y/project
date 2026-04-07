# Masterfile & Audit Workflow Modernization

This plan addresses the requirements for the "Masterfile" transition, UI redesign for document tracking, and automated workflow logic.

## User Review Required

> [!IMPORTANT]
> **Status Automation**: The status of an audit engagement will now be derived from the progress of its documents (e.g., once all Planning documents are 'Approved', the engagement moves to 'Execution'). This replaces the manual status dropdown.
> **Role Assignments**: Each document will now explicitly track who prepared it, who is reviewing it, and who approved it.

## Proposed Changes

### 1. Dashboard Refinement (Division Chief & Director)

- Rename all instances of "Ongoing Master File" to "Masterfile".
- Standardize labels on KPI cards (e.g., "Active Audits" instead of just "Master File").
- Ensure the "Active Audits" card correctly filters the table below.

### 2. Audit Workspace Redesign (`AuditWorkspace.jsx`)

- **New Table Layout**: Implement the table shown in the screenshot for each audit phase.
  - Columns: `DOCUMENT / TOOLS`, `PREPARED BY`, `REVIEWED BY`, `APPROVED BY`, `FINAL`.
  - Add status badges: "Awaiting Receipt", "Approved [Date]", "Pending Review".
- **Phase Logic**:
  - Documents will only be "Prepared" by assigned auditors.
  - "Reviewed By" will automatically pull from the assigned lead/chief.
  - Integrate a "Final" column with download/view icons.

### 3. Backend Enhancements (PHP/Laravel)

- **Database Migration**:
  - Add `prepared_by_id`, `reviewed_by_id`, `approved_by_id` to the `documents` table.
  - Create an `activity_logs` table for the **Audit Trail**.
- **Controllers**:
  - Update `EngagementController` to handle automatic status transitions.
  - Implement `ActivityLogController` to record every major action (Upload, Sign, Approve, Status Change).

### 4. Audit Trail UI

- Add a new tab or side panel in the `AuditWorkspace` or Dashboards to display a live feed of activities related to an engagement.

### 5. Auditee Visibility

- Ensure the `AuditeeDashboard` provides a read-only link to the `AuditWorkspace` so they can see which tools are active and provide MOVs accordingly.

## Open Questions

1. **Reviewer Assignment**: Should the reviewer be assigned per document, or is it always the Lead Auditor/Division Chief of the entire engagement?
2. **Audit Trail Detail**: How detailed should the audit trail be? (e.g., "User X opened Tool Y" vs only "User X saved/signed Tool Y").

## Verification Plan

### Automated Tests
- Verify status transition logic via Postman/Unit tests.
- Check that auditees cannot edit tools in the workspace.

### Manual Verification
- Walk through a full document cycle: Prepare -> Review -> Approve -> Engagement Status Change.
- Verify the new table layout matches the provided screenshot.
