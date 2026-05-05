# Workflow A to Z

## 1. Purpose

This document defines the target business workflow from the moment a client creates a request until the work becomes a completed project. It is intentionally written as a future-state operating specification so the implementation can move toward one stable lifecycle.

This workflow follows these decisions:

1. A client-originated request is a first-class `Request` record.
2. A request is not a real execution `Project` before contract signing.
3. Before contract signing, the client still sees that work item in the portal with the label `طلب قيد الانتظار`.
4. After contract signing, the system creates the real execution `Project` and the PM becomes the client-facing owner.

## 2. Actors and Responsibilities

| Actor           | Responsibility                                                                                                                               |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Client          | Creates requests, reviews proposals, signs contracts, pays invoices, tracks project progress, reviews deliverables, views campaign analytics |
| Sales           | Owns pre-contract qualification, CRM pipeline, follow-up, proposal coordination, and commercial negotiation                                  |
| Finance         | Prepares contract and invoice artifacts, tracks payment status, supports commercial approval rules                                           |
| Project Manager | Owns post-signing project handoff, project breakdown, task planning, team coordination, client communication after signing                   |
| Delivery Teams  | Execute assigned tasks and update progress through the approved workflow                                                                     |
| Marketing Team  | Runs campaign work, updates campaign metrics, and supports campaign reporting visible to the client                                          |
| Admin           | Oversees permissions, fallback assignments, manual recovery, and governance                                                                  |

## 3. Canonical Entity Map

The workflow should use the following business objects:

- `Client`: the canonical customer identity.
- `Request`: the canonical record of client demand.
- `Lead`: the internal sales opportunity record.
- `Proposal`: the technical/commercial offer prepared for a request.
- `Contract`: the legal/commercial agreement for the request.
- `Invoice`: the commercial billing record connected to the request and contract.
- `Project`: the real execution container created only after contract signing.
- `ProjectMember`: the explicit internal user-to-project link.
- `Task`: the internal work unit inside the project.
- `Deliverable`: the client-facing output.
- `Campaign`: the marketing execution and analytics object.
- `NotificationEvent` and `Notification`: workflow communication records.

## 4. Ownership and Relationship Rules

1. One `Client` can own many `Request` records.
2. One `Request` belongs to exactly one `Client`.
3. One `Request` can optionally create or attach to one internal `Lead` for sales handling.
4. One `Request` can have multiple proposals over time, but only one active proposal/negotiation path at a time.
5. One signed contract creates one execution `Project` for that request.
6. Every PM, team member, assignee, reviewer, and internal stakeholder involved in delivery must be explicitly linked through `ProjectMember` or a future team-membership abstraction that still resolves to project membership.
7. A task assignee cannot exist outside the project membership graph.
8. Every deliverable and campaign should be traceable back to the request, project, and client.

## 5. Status Model

### 5.1 Client-visible request state

For clarity in the portal, every pre-signing request is shown with a simplified client-facing status label:

- `طلب قيد الانتظار`

This label remains visible until the contract is signed.

### 5.2 Internal request lifecycle

Recommended internal `RequestStatus` values:

- `SUBMITTED`
- `SALES_REVIEW`
- `PROPOSAL_PREPARATION`
- `PROPOSAL_SENT`
- `NEGOTIATION`
- `CONTRACT_PREPARATION`
- `CONTRACT_SENT`
- `SIGNED`
- `CONVERTED_TO_PROJECT`
- `CANCELLED`

### 5.3 Internal sales pipeline

The current CRM pipeline can continue to exist for sales detail handling. It should be linked to the request, not treated as the request itself.

Existing internal sales stages in the current system:

- `NEW`
- `INTRO_SENT`
- `CALL_ATTEMPT`
- `MEETING_SCHEDULED`
- `MEETING_DONE`
- `PROPOSAL_SENT`
- `FOLLOW_UP`
- `APPROVED`
- `CONTRACT_SIGNED`

### 5.4 Contract status

- `DRAFT`
- `SENT`
- `SIGNED`
- `ACTIVE`
- `EXPIRED`
- `CANCELLED`

### 5.5 Project status

Project status is execution-only:

- `PLANNING`
- `ACTIVE`
- `ON_HOLD`
- `COMPLETED`
- `CANCELLED`

### 5.6 Task status

- `TODO`
- `IN_PROGRESS`
- `IN_REVIEW`
- `DONE`
- `REVISION`

## 6. End-to-End Workflow

### Step 1 - Client Identity and Access

**Owner**
Client and Auth subsystem

**System rule**
The platform must resolve one portal user to one canonical `Client` record.

**Data outcome**

- `User(role=CLIENT)` exists.
- `Client(userId=...)` exists and is canonical.

**Critical rule**
The system must not create a second `Client` record later through lead- or contract-based flows for the same person/company without a merge decision.

### Step 2 - Client Creates a Request

**Owner**
Client

**Action**
The client submits a new request from the portal.

**Data written**

- New `Request`
- Requested services
- Request metadata and notes
- Initial request history event

**Notifications**

- Notify Sales queue or assigned sales owner
- Optionally notify Admin if no sales owner is available

**Client visibility**

- The request appears immediately in the client portal
- The displayed status is `طلب قيد الانتظار`

### Step 3 - Automatic Sales Ownership

**Owner**
System

**Action**
The request is automatically assigned to Sales.

**Data written**

- `Request.assignedSalesId`
- Assignment history event
- Optional linked `Lead` record if the organization keeps a parallel CRM object

**Notifications**

- Assigned salesperson
- Admin fallback notification if no active salesperson is available

**Client visibility**

- Still sees `طلب قيد الانتظار`
- Does not see internal assignee names unless explicitly allowed by product policy

### Step 4 - Sales Qualification and CRM Handling

**Owner**
Sales

**Action**
Sales works the opportunity through qualification, discovery, meetings, and follow-up.

**Data written**

- Request state history
- Lead pipeline history
- Contact logs
- Optional qualification notes

**Critical rule**
The request is the business anchor. The lead is only the internal sales handling record.

**Client visibility**

- The client still sees one pending request
- Internal call attempts, meeting notes, and employee-level CRM details remain hidden

### Step 5 - Technical Proposal Preparation

**Owner**
Sales, with optional PM or technical support input

**Action**
Sales prepares and sends a technical proposal linked to the request.

**Data written**

- `Proposal`
- Proposal send event
- Request history update
- Lead stage update if CRM tracking is enabled

**Notifications**

- Client receives proposal review notification
- Sales receives confirmation/logging event

**Client visibility**

- Proposal becomes available in the portal or public share flow
- The top-level request card can still remain under the `طلب قيد الانتظار` summary state

### Step 6 - Client Reviews Proposal

**Owner**
Client

**Action**
The client reviews, approves, rejects, or requests changes to the proposal.

**Data written**

- Proposal status update
- Request history event
- Lead pipeline update if linked

**Notifications**

- Sales is notified of approval, rejection, or revision request

**Client visibility**

- Proposal review state is visible
- Internal decision notes remain hidden

### Step 7 - Finance Prepares Contract and Invoice

**Owner**
Finance, with Sales coordination

**Action**
After commercial approval, Finance prepares the contract and invoice package for the approved request.

**Data written**

- `Contract`
- `Invoice` or invoice draft, according to business rules
- Contract send event
- Request status update to contract stage

**Critical rule**
The invoicing rule must be explicit. If invoices are required before project activation, that behavior must be encoded as policy rather than left to manual assumption.

**Client visibility**

- Contract and invoice appear in the portal when they are ready
- The request still remains under the pending state until signing

### Step 8 - Contract Signing

**Owner**
Client

**Action**
The client signs the contract.

**Data written**

- Contract status becomes `SIGNED`
- Request status becomes `SIGNED`
- Lead stage becomes `CONTRACT_SIGNED` if linked
- Request history and contract history are updated

**Critical rule**
This is the only point where the pre-contract request becomes eligible for execution project creation.

**Notifications**

- Sales
- Finance
- PM assignment workflow
- Admin fallback if automatic handoff fails

### Step 9 - Request Converts to Execution Project

**Owner**
System

**Action**
Immediately after successful signing, the system creates the real execution project.

**Data written**

- `Project`
- `ProjectMember` for the PM
- Optional initial deliverables and templates
- Link from request to project
- Conversion history event

**Critical rule**
This step must be reliable. The system must not silently swallow project creation failure after contract signing.

**Client visibility**

- The pending request is replaced by a real project entry
- The client now sees real project status and progress tracking

### Step 10 - Communication Handoff from Sales to PM

**Owner**
System and PM

**Action**
Client-facing ownership moves from Sales to the assigned PM.

**Rules**

- Before signing: client communicates with Sales
- After signing: client communicates only with the assigned PM for project execution matters

**Data written**

- Handoff event
- Primary communication owner update
- Optional conversation/channel reassignment

**Notifications**

- PM receives assignment notification
- Client receives PM introduction or ownership handoff notification
- Sales receives handoff completion confirmation

### Step 11 - PM Planning and Breakdown

**Owner**
Project Manager

**Action**
The PM analyzes the project, defines scope, creates tasks, and links delivery users.

**Data written**

- Project plan updates
- `ProjectMember` rows
- `Task` rows
- Optional intake clarification records

**Critical rule**
Every user who is expected to work on the project must be explicitly linked to that project.

**Client visibility**

- The client sees project progress and milestones
- The client does not see internal task assignments or employee management details

### Step 12 - Task Execution by Teams

**Owner**
Assigned teams

**Action**
Delivery teams execute tasks and move them through the approved lifecycle.

**Data written**

- Task state transitions
- Task history
- Files and comments
- Internal notifications

**Critical rule**
Task assignees must already be valid project members.

**Client visibility**

- Internal task details remain hidden
- Client-facing progress is shown through project progress and approved deliverables

### Step 13 - Deliverables and Revisions

**Owner**
PM, delivery teams, and client

**Action**
Client-facing outputs are published as deliverables. The client can approve or request revision.

**Data written**

- `Deliverable`
- Deliverable approval/revision events
- `ClientRevisionRequest`

**Critical rule**
Client-facing endpoints must already be server-scoped to visible deliverables. The frontend must not be responsible for hiding confidential deliverables.

**Notifications**

- Client notified when a deliverable is ready for review
- PM notified when the client approves or requests revision

### Step 14 - Marketing Campaign Execution and Analytics

**Owner**
Marketing team

**Action**
If the project includes marketing work, campaign execution and KPI tracking are linked to the project.

**Data written**

- `Campaign`
- KPI snapshots
- Campaign status updates

**Client visibility**

- The client can view campaign analytics and performance summaries
- The client does not see internal team workload or internal-only optimization notes unless explicitly exposed

### Step 15 - Completion and Closure

**Owner**
PM and Admin, with client confirmation where required

**Action**
The project is completed, closed, or archived according to business rules.

**Data written**

- Project completion event
- Final status update
- Final deliverable state
- Optional satisfaction rating or closure note

**Client visibility**

- The project appears as completed
- Historical contracts, invoices, deliverables, and campaign reports remain available as needed

## 7. Notifications Matrix

| Event                         | Notify client                           | Notify sales | Notify finance | Notify PM | Notify team |
| ----------------------------- | --------------------------------------- | ------------ | -------------- | --------- | ----------- |
| Request created               | No immediate self-notification required | Yes          | No             | No        | No          |
| Request assigned              | No                                      | Yes          | No             | No        | No          |
| Proposal sent                 | Yes                                     | Yes          | No             | Optional  | No          |
| Proposal approved/rejected    | Optional                                | Yes          | Optional       | Optional  | No          |
| Contract sent                 | Yes                                     | Yes          | Yes            | Optional  | No          |
| Contract signed               | Yes                                     | Yes          | Yes            | Yes       | Optional    |
| Project created               | Yes                                     | Optional     | Optional       | Yes       | No          |
| PM handoff complete           | Yes                                     | Yes          | No             | Yes       | No          |
| Task assigned                 | No                                      | No           | No             | Yes       | Yes         |
| Deliverable ready             | Yes                                     | No           | No             | Yes       | Optional    |
| Deliverable approved/revision | Yes                                     | No           | No             | Yes       | Optional    |
| Campaign milestone update     | Yes if client-visible                   | Optional     | No             | Yes       | Yes         |

## 8. Visibility Rules

### Client can see

- Their own requests
- Proposal review state
- Contracts and invoices that belong to them
- Real project progress after signing
- Approved/client-visible deliverables
- Campaign analytics for campaigns linked to their project

### Client cannot see

- Internal task comments
- Employee names and assignment details unless specifically allowed by product policy
- Internal CRM notes and call logs
- Internal notification traffic
- Internal-only deliverables and drafts

## 9. Non-Negotiable Data Rules

1. One portal user must resolve to one canonical `Client`.
2. One client can create multiple requests.
3. One request must stay independently trackable until conversion.
4. A request must not become a real execution project before contract signing.
5. A signed contract must reliably create or attach the project in the same lifecycle.
6. Every involved internal user must be explicitly linked to the project.
7. Client-facing data must be scoped server-side.
8. Every state change must write history.
9. Critical workflow transitions must not depend on swallowed exceptions.
10. The request, contract, invoice, project, deliverables, campaigns, and notifications must remain traceable through the same ownership chain.

## 10. Suggested API Responsibility Map

### Portal-facing APIs

- Create request
- List requests
- Get request timeline
- Review proposal
- View/sign contract
- View/pay invoice
- View project progress
- View deliverables
- Request deliverable revision
- View campaign analytics

### Internal sales APIs

- Assign request
- Link request to lead/opportunity
- Update request commercial state
- Update CRM pipeline stage
- Create/send proposal
- Coordinate contract handoff

### Internal delivery APIs

- Create execution project from signed request/contract
- Assign PM
- Manage project members
- Create and manage tasks
- Publish deliverables
- Manage campaign execution

## 11. Acceptance Checklist

The workflow is correctly implemented only when:

1. A client creates multiple requests and each remains separate.
2. Sales receives and manages those requests without duplicating the client identity.
3. The client sees `طلب قيد الانتظار` until signing.
4. Proposal, contract, and invoice records stay tied to the same request and client.
5. Contract signing creates the real project reliably.
6. PM ownership replaces Sales ownership for client-facing execution communication.
7. Every team member involved in execution is explicitly linked to the project.
8. The client can track project progress and campaign analytics without seeing internal-only execution details.
9. All lifecycle transitions are auditable.
10. The system does not require frontend filtering to protect sensitive data.

## 12. Implementation Note

The safest implementation order is:

1. Stabilize the domain model.
2. Refactor backend orchestration.
3. Expose request-focused APIs.
4. Rework the portal and dashboard semantics.
5. Run data cleanup and workflow validation.

Starting with UI changes before domain stabilization would preserve the same underlying instability under new labels.
