📁 SALES_PIPELINE.md — Professional Sales Tracking System

    Status: Execution Draft (Phase 2 - CRM Expansion)

    Objective: Automate and organize the customer journey from the moment of registration (Signup) to final contracting and payment.

🏗️ 1. Procedural Engineering (The Workflow)
1.1 Entry Point

    Path: /signup

    Action: Upon successful registration, a User record with the role CLIENT is created and automatically linked to a ClientProfile with the initial status NEW_LEAD.

    Routing: The customer immediately appears in the "Sales Manager" dashboard under the "New Leads" column.

1.2 The 9 Stages

The system must enforce the following order in both the database and the UI:

    NEW_LEAD: Initial entry after signup.

    CONTACTED: First communication attempt made.

    MEETING_SCHEDULED: Interview or discovery call booked.

    REQUIREMENTS_GATHERING: Detailed session to define technical/business needs (Critical Stage).

    PROPOSAL_SENT: Technical and financial proposal generated/sent.

    NEGOTIATION: Discussing terms, pricing, and adjustments.

    WAITING_FOR_SIGNATURE: Contract sent to the client for digital/manual signature.

    CONTRACTED_WON: Payment received (deposit) and contract signed.

    HANDOVER: Moving the client from Sales to the Project Management team.

🛠️ 2. Backend Requirements (NestJS + Prisma)
2.1 Schema Update (schema.prisma)

    Update enum ClientStatus to include all 9 stages mentioned above.

    Add a notes field (JSON) to the Client table to store an "Activity Log" (history of stage movements).

    Add a requirements field (JSON) to store data from the Requirements Gathering form.

2.2 Protected Transitions (Business Logic)

    Validation: Prevent moving a client from REQUIREMENTS_GATHERING to PROPOSAL_SENT unless the requirements field is populated.

    Notifications: Trigger an internal system notification when a client reaches CONTRACTED_WON.

🎨 3. Frontend Requirements (Next.js + Tailwind)
3.1 Kanban Board UI

    Path: apps/web/app/dashboard/sales/pipeline/page.tsx

    Tech: Use dnd-kit or react-beautiful-dnd for the 9-column layout.

    Card Components: Display Client Name, Business Type, Date Added, and a "Time-in-Stage" indicator.

3.2 Client Detail Page

    Path: apps/web/app/dashboard/sales/clients/[id]/page.tsx

    Timeline Component: A visual vertical line showing the history of status transitions.

    Dynamic Forms: Forms that appear based on the current stage (e.g., the Requirements Form only becomes editable during the REQUIREMENTS_GATHERING stage).

🔐 4. Role-Based Access Control (RBAC)
Role	Permissions on Pipeline
ADMIN	Full visibility + Can modify any stage + Delete leads
SALES	Full visibility + Move only assigned leads
PM	Visibility only for the HANDOVER stage to prepare for execution
🧪 5. Definition of Done (Acceptance Criteria)

    [ ] Prisma Enum updated and Migration executed successfully.

    [ ] New registered users automatically appear in the NEW_LEAD column.

    [ ] Drag-and-drop between columns successfully updates the status in the database.

    [ ] System blocks transition to "Proposal" stage if the requirements form is empty.

Agent Instructions:

    Backend First: Update the Enum, run the migration, and update the DTOs.

    API Layer: Create a PATCH endpoint /clients/:id/status with validation logic.

    Frontend: Implement the Kanban board structure and integrate with the status update API.