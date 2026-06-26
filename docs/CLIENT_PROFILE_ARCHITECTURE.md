# Client Profile Architecture

> **Status**: ✅ Complete - All Phases Implemented
> **Document Type**: Architecture Decision Record (ADR)
> **Created**: 2024-06-26
> **Completed**: 2024-06-26

---

## Overview

### What This Document Is

This document defines the architecture for managing client profile data in the Hassad Platform. It establishes a **single source of truth** for user-editable data and provides a clean separation between user input and system-generated metrics.

### The Core Problem

Clients fill out an intake form with their business information, but this data is fragmented across multiple tables and components. When viewing or editing the profile, the data is either incomplete or duplicated. This leads to:

- Clients seeing "لا توجد معلومات إضافية" (no additional information)
- Admin/Sales unable to see client profile data
- Maintenance nightmare with duplicated components
- No clear data ownership

### The Solution

1. **ClientProfile** becomes the **single source of truth** for ALL user-editable data
2. **Shared components** are used for intake, edit, and view modes
3. **System metrics** are separated from user input
4. **Clear data flows** ensure consistency

---

## Architecture Rules

### Rule 1: Single Source of Truth

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ClientProfile is THE ONLY source for user-editable data.      │
│                                                                 │
│  - PortalIntakeForm is a DRAFT storage (temporary)              │
│  - On submission, data is COPIED to ClientProfile               │
│  - ProfileEdit writes DIRECTLY to ClientProfile                 │
│  - ClientBrief reads FROM ClientProfile                        │
│                                                                 │
│  NO duplication. NO multiple sources. NO sync issues.           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Rule 2: Separation of Concerns

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  User-Editable Data ≠ System-Generated Data                    │
│                                                                 │
│  USER-EDITABLE (ClientProfile):                                │
│  - Contact info, business details, preferences                  │
│  - Client can modify anytime via portal                         │
│  - Stored as V2 JSON fields                                    │
│                                                                 │
│  SYSTEM-GENERATED (Client table or metrics):                   │
│  - Project counts, financial totals, ratings                    │
│  - Computed from system records                                 │
│  - User CANNOT modify directly                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Rule 3: Shared Components, Multiple Modes

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ONE component definition = THREE behaviors                    │
│                                                                 │
│  <CommunicationSection mode="wizard" />  → Intake form          │
│  <CommunicationSection mode="edit" />    → Profile edit         │
│  <CommunicationSection mode="view" />   → Profile display       │
│                                                                 │
│  SAME component, SAME fields, SAME validation                   │
│  DIFFERENT rendering based on mode                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Rule 4: No Legacy Duplication

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Old components must be REPLACED, not maintained alongside.    │
│                                                                 │
│  DELETE after migration:                                       │
│  - PortalProfileEditForm (old)                                  │
│  - IntakeFormFields/ProfileForm (old)                           │
│  - Legacy fields in ClientProfile (optional cleanup)            │
│                                                                 │
│  KEEP:                                                          │
│  - V2 JSON structure in ClientProfile                           │
│  - IntakeFormV2 step components (extract to shared)              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Rule 5: Data Flows One Way

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  INTAKE:     PortalIntakeForm (draft) → ClientProfile           │
│  EDIT:       ProfileEditV2 → ClientProfile (direct)              │
│  VIEW:       ClientProfile → ClientBrief (read-only)            │
│                                                                 │
│  NEVER: ClientProfile → PortalIntakeForm (wrong direction)      │
│  NEVER: Multiple writes to different tables                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. Problem Statement

### 1.1 Current Issues

#### Issue 1: Data Fragmentation

- **PortalIntakeForm** stores V2 intake data (8 JSON sections)
- **ClientProfile** stores legacy fields (old structure)
- **ClientBrief** component reads legacy fields only
- **Result**: Client data exists in multiple places with no clear source of truth

#### Issue 2: Component Duplication

- `IntakeFormV2` has 8 step components
- `ProfileForm` (old) has 4 section components with different structure
- Both serve the same purpose: collecting client business info
- **Result**: Maintenance burden, inconsistent UX, code duplication

#### Issue 3: Broken Data Flow

```
Client fills IntakeFormV2
    → Data saved to PortalIntakeForm
    → Partial sync to ClientProfile (only 5 basic fields)
    → ClientBrief reads ClientProfile legacy fields (empty)
    → User sees "لا توجد معلومات إضافية"
```

#### Issue 4: Mixed Concerns

- User-editable data mixed with system-computed data
- No clear ownership of data fields
- No distinction between input data and derived data

---

## 2. Domain Analysis

### 2.1 Data Types

| Category | Source | Mutability | Examples |
|----------|--------|------------|----------|
| **User-Editable Data** | Client inputs via forms | Client can modify anytime | Contact info, business details, preferences, brand assets |
| **System-Generated Data** | Computed from system records | System-only updates | Project counts, financial totals, ratings, activity history |

### 2.2 User Journeys

#### Journey A: New Client Onboarding (Intake)

```
1. Client signs up → redirected to intake form
2. Client fills multi-step form (autosave as draft)
3. Client submits → data becomes their profile
4. System marks intakeCompleted = true
```

#### Journey B: Existing Client Updates Profile

```
1. Client navigates to Profile page
2. Client clicks "Edit"
3. Client modifies any section
4. Client saves → profile updated
```

#### Journey C: Admin/Sales Views Client

```
1. Admin searches for client
2. Admin opens client detail page
3. Admin sees all client info + system metrics
4. Admin can edit on behalf of client
```

### 2.3 Current vs Desired State

| Aspect | Current State | Desired State |
|--------|---------------|---------------|
| Source of Truth | Multiple (PortalIntakeForm + ClientProfile legacy) | Single (ClientProfile with V2 fields) |
| Intake → Profile | Partial sync, different structures | Full sync, same structure |
| View Component | Reads legacy fields (incomplete) | Reads V2 fields (complete) |
| Edit Component | Different from IntakeForm | Same shared components as IntakeForm |
| System Data | Mixed in ClientProfile | Separate (Client table or metrics) |

---

## 3. Architecture Design

### 3.1 Data Model

#### Entity: Client (Core Identity)

```
Purpose: Authentication and core identity
Owner: System / Admin
Mutability: Low (admin-only for most fields)

Fields:
- id: UUID
- userId: UUID (link to auth user)
- companyName: string
- contactName: string
- phoneWhatsapp: string
- email: string
- businessName: string
- businessType: enum
- status: enum (ACTIVE, INACTIVE, etc.)
- accountManager: string (user ID)
- intakeCompleted: boolean
- createdAt, updatedAt: timestamps
```

#### Entity: ClientProfile (User-Editable Data)

```
Purpose: Single source of truth for ALL user-provided business info
Owner: Client (editable via portal) or Admin/Sales
Mutability: High (client can update anytime)

Fields (V2 JSON structure):
- id: UUID
- clientId: UUID (1:1 with Client)

Section 1 - Communication:
- communicationInfo: JSON
  { contactName, businessName, industry, contactNumber, email }

Section 2 - Product/Service:
- productInfo: JSON
  { productStory, detailedDescription, valueProposition, advantages, benefits[], contentDirection }

Section 3 - Audience & Brand Voice:
- audienceInfo: JSON
  { customerAnalysis, faq[{question, answer}] }
- brandVoice: JSON
  { toneOfVoice, boundaries, verbalSlogan, appearanceMethod }

Section 4 - Customer Journey:
- customerJourney: JSON
  { orderMethods[], followUpTools }

Section 5 - Campaign:
- campaignInfo: JSON
  { campaignGoal, campaignDetails, campaignOffer, guarantees, campaignSeason, competitors }

Section 6 - Performance & Budget:
- pastPerformance: JSON
  { bestCampaigns, pastPerformance, trackingSetup }
- budgetInfo: JSON
  { budgetRange, previousReports[] }

Section 7 - Visual Identity:
- visualIdentityInfo: JSON
  { hasVisualIdentity, brandAssets{logoUrl, brandColors[], fonts[], guidelinesUrl}, pastDesigns, productPhotos[], visualDirection[] }

Metadata:
- createdBy: UUID
- createdAt, updatedAt: timestamps
```

#### Entity: Client Metrics (System-Generated Data)

```
Purpose: Computed statistics about client
Owner: System (auto-updated via events/jobs)
Mutability: None (system-managed)

Fields:
- id: UUID
- clientId: UUID
- totalProjects: int
- activeProjects: int
- completedProjects: int
- totalContractValue: decimal
- totalInvoiced: decimal
- totalPaid: decimal
- avgSatisfactionScore: decimal
- lastProjectAt: timestamp
- updatedAt: timestamp
```

#### Entity: PortalIntakeForm (Draft Storage)

```
Purpose: Temporary storage for multi-step form progress
Owner: System (autosave mechanism)
Lifecycle: 
  - Created when client starts intake
  - Updated on each step (autosave)
  - Marked isSubmitted=true on completion
  - Data COPIED to ClientProfile
  - Kept for audit trail (read-only after submission)

Fields: Same V2 JSON structure as ClientProfile
+ isSubmitted: boolean
+ submittedAt: timestamp
+ currentStep: int
```

### 3.2 Data Relationships

```
┌─────────────┐       1:1       ┌─────────────────┐
│   Client    │────────────────▶│ ClientProfile   │
│ (Identity)  │                 │ (User Input)    │
└─────────────┘                 └─────────────────┘
       │
       │ 1:1
       ▼
┌─────────────┐
│   Client    │  System-computed metrics
│  Metrics    │  (derived from projects, invoices, etc.)
└─────────────┘

┌─────────────────┐
│ PortalIntakeForm│  Draft storage (temporary)
│                 │  → Final submission copies to ClientProfile
└─────────────────┘
```

### 3.3 Data Flow Diagrams

#### Flow 1: New Client Intake

```
┌──────────────────────────────────────────────────────────────────┐
│                     INTAKE FORM FLOW                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Step 1: Communication                                           │
│     ↓                                                            │
│  PortalIntakeForm (autosave)                                     │
│     ↓                                                            │
│  Step 2: Product Info                                           │
│     ↓                                                            │
│  ... continue through all 7 steps ...                            │
│     ↓                                                            │
│  Step 8: Review & Submit                                         │
│     ↓                                                            │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    ON SUBMIT TRANSACTION                     │  │
│  │                                                             │  │
│  │  1. Validate all V2 sections                                │  │
│  │  2. Copy ALL data FROM PortalIntakeForm TO ClientProfile    │  │
│  │  3. Mark PortalIntakeForm.isSubmitted = true                │  │
│  │  4. Mark Client.intakeCompleted = true                      │  │
│  │  5. Create ClientHistoryLog entry                           │  │
│  │  6. Send notifications                                      │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

#### Flow 2: Profile Edit

```
┌──────────────────────────────────────────────────────────────────┐
│                     PROFILE EDIT FLOW                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────┐                                             │
│  │ Client navigates│                                             │
│  │ to /portal/profile│                                           │
│  └────────┬───────┘                                             │
│           ▼                                                      │
│  ┌────────────────┐     ┌────────────────┐                       │
│  │ GET            │────▶│ ClientProfile  │                       │
│  │ /profile       │     │ (all V2 fields)│                       │
│  └────────────────┘     └────────────────┘                       │
│           │                                                      │
│           ▼                                                      │
│  ┌────────────────┐                                             │
│  │ ProfileEditV2  │  (uses shared sections, mode='edit')         │
│  │ displays data   │                                             │
│  └────────┬───────┘                                             │
│           │                                                      │
│           │ Client edits sections                                │
│           ▼                                                      │
│  ┌────────────────┐     ┌────────────────┐                       │
│  │ PUT            │────▶│ ClientProfile  │                       │
│  │ /profile/v2    │     │ (update)       │                       │
│  └────────────────┘     └────────────────┘                       │
│           │                                                      │
│           ▼                                                      │
│  ┌────────────────┐                                             │
│  │ ClientHistoryLog│ (audit trail)                              │
│  └────────────────┘                                             │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

#### Flow 3: View Profile

```
┌──────────────────────────────────────────────────────────────────┐
│                     PROFILE VIEW FLOW                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                      ClientBrief                            │  │
│  │                    (View Component)                          │  │
│  └────────────────────────────────────────────────────────────┘  │
│                              │                                   │
│              ┌───────────────┼───────────────┐                   │
│              ▼               ▼               ▼                   │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐          │
│  │    Client     │ │ClientProfile  │ │ClientMetrics  │          │
│  │   (Identity)  │ │ (User Input)  │ │ (System Data)  │          │
│  │               │ │               │ │               │          │
│  │ companyName   │ │ communication │ │ totalProjects │          │
│  │ contactName   │ │ productInfo   │ │ activeProjects│          │
│  │ email         │ │ audienceInfo   │ │ totalInvoiced │          │
│  │ status        │ │ ...           │ │ avgRating     │          │
│  └───────────────┘ └───────────────┘ └───────────────┘          │
│                                                                  │
│  Display: Combined view showing identity + user data + metrics   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 4. Component Architecture

### 4.1 Shared Components Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                 SHARED COMPONENT HIERARCHY                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  components/shared/ProfileSections/                             │
│  │                                                              │
│  ├── index.ts                    (barrel export)                │
│  ├── types.ts                    (shared TypeScript types)       │
│  │                                                              │
│  ├── sections/                                                  │
│  │   ├── CommunicationSection.tsx                               │
│  │   ├── ProductSection.tsx                                      │
│  │   ├── AudienceSection.tsx                                     │
│  │   ├── JourneySection.tsx                                      │
│  │   ├── CampaignSection.tsx                                     │
│  │   ├── PerformanceSection.tsx                                  │
│  │   └── VisualSection.tsx                                       │
│  │                                                              │
│  └── hooks/                                                     │
│      └── useProfileForm.ts       (shared form logic)            │
│                                                                 │
│  Each section component accepts:                                 │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  interface SectionProps {                                  │  │
│  │    initialData?: SectionData;                              │  │
│  │    onDataChange: (data: SectionData) => void;              │  │
│  │    onValid: (isValid: boolean) => void;                     │  │
│  │    mode: 'wizard' | 'edit' | 'view';                        │  │
│  │  }                                                          │  │
│  │                                                            │  │
│  │  mode behaviors:                                            │  │
│  │  - wizard: show next/back buttons, enable navigation         │  │
│  │  - edit: no navigation, parent handles save                 │  │
│  │  - view: read-only, formatted display                       │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Component Usage by Context

```
┌─────────────────────────────────────────────────────────────────┐
│                   USAGE BY CONTEXT                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    IntakeFormV2                              ││
│  │                  (Portal - New Client)                       ││
│  │                                                             ││
│  │  mode="wizard"                                              ││
│  │  - Step-by-step navigation                                  ││
│  │  - Progress indicator                                        ││
│  │  - Autosave draft to PortalIntakeForm                        ││
│  │  - Submit creates ClientProfile                              ││
│  │                                                             ││
│  │  <CommunicationSection mode="wizard" onNext={...} />         ││
│  │  <ProductSection mode="wizard" onNext={...} onBack={...} />   ││
│  │  ...                                                        ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    ProfileEditV2                              ││
│  │                  (Portal - Existing Client)                   ││
│  │                                                             ││
│  │  mode="edit"                                                 ││
│  │  - All sections visible at once                               ││
│  │  - No navigation buttons                                      ││
│  │  - Single "Save" button                                      ││
│  │  - Direct update to ClientProfile                            ││
│  │                                                             ││
│  │  <CommunicationSection mode="edit" onDataChange={...} />      ││
│  │  <ProductSection mode="edit" onDataChange={...} />            ││
│  │  ...                                                        ││
│  │  <SaveButton onClick={handleSave} />                          ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                     ClientBrief                               ││
│  │                  (View Mode - All Contexts)                   ││
│  │                                                             ││
│  │  mode="view"                                                 ││
│  │  - Read-only display                                          ││
│  │  - Formatted, user-friendly presentation                     ││
│  │  - Shows identity + profile + metrics                        ││
│  │                                                             ││
│  │  <CommunicationSection mode="view" data={...} />               ││
│  │  <ProductSection mode="view" data={...} />                     ││
│  │  ...                                                        ││
│  │  <MetricsSection data={clientMetrics} />                      ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. API Design

### 5.1 Endpoints

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/portal/intake-form` | GET | Get draft or submitted form | Client (own) |
| `/portal/intake-form/draft` | PATCH | Autosave draft | Client (own) |
| `/portal/intake-form` | POST | Submit final form | Client (own) |
| `/clients/:id/profile` | GET | Get client profile | Client (own) / Admin / Sales |
| `/clients/:id/profile` | PUT | Update profile | Client (own) / Admin / Sales |
| `/clients/:id/team-view` | GET | Get filtered view for team | PM / Employee |
| `/clients/:id/metrics` | GET | Get computed metrics | Admin / Sales / PM |

### 5.2 Response Shapes

```typescript
// GET /clients/:id/profile
interface ClientProfileResponse {
  id: string;
  clientId: string;
  
  // V2 Sections (nullable)
  communicationInfo: CommunicationInfo | null;
  productInfo: ProductInfo | null;
  audienceInfo: AudienceInfo | null;
  brandVoice: BrandVoice | null;
  customerJourney: CustomerJourney | null;
  campaignInfo: CampaignInfo | null;
  pastPerformance: PastPerformance | null;
  budgetInfo: BudgetInfo | null;
  visualIdentityInfo: VisualIdentityInfo | null;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

// GET /clients/:id (with profile and metrics)
interface ClientWithProfileResponse {
  // From Client (identity)
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  status: ClientStatus;
  
  // From ClientProfile (user input)
  profile: ClientProfileResponse | null;
  
  // From ClientMetrics (system data)
  metrics: {
    totalProjects: number;
    activeProjects: number;
    totalContractValue: number;
    totalInvoiced: number;
    totalPaid: number;
  };
}
```

---

## 6. Implementation Phases

### Phase 1: Data Migration & Cleanup
**Goal**: Ensure data integrity and single source of truth

| Task | Description | Status |
|------|-------------|--------|
| 1.1 | Verify V2 fields exist in ClientProfile (Prisma schema) | ✅ Done |
| 1.2 | Create migration to sync PortalIntakeForm → ClientProfile | ✅ Done (migration 20260626_add_v2_fields_to_client_profile) |
| 1.3 | Update intake submission to sync ALL V2 fields | ✅ Done |
| 1.4 | Remove legacy field references from ClientBrief | ✅ Done |
| 1.5 | Test data integrity across all flows | ✅ Done |

### Phase 2: Extract Shared Components
**Goal**: Create reusable section components

| Task | Description | Status |
|------|-------------|--------|
| 2.1 | Create `components/shared/ProfileSections/` directory | ✅ Done |
| 2.2 | Define `types.ts` with all section data types | ✅ Done |
| 2.3 | Extract each step from IntakeFormV2 to shared section | ✅ Done |
| 2.4 | Add `mode` prop ('wizard' \| 'edit' \| 'view') to each section | ✅ Done |
| 2.5 | Create `useProfileSection` hook for shared logic | ✅ Done |
| 2.6 | Update IntakeFormV2 to use shared sections | ✅ Done |
| 2.7 | Create all 7 section components | ✅ Done |

### Phase 3: Profile Edit Component
**Goal**: Create unified edit experience

| Task | Description | Status |
|------|-------------|--------|
| 3.1 | Create ProfileEditV2 using shared sections | ✅ Done |
| 3.2 | Implement mode="edit" for all sections | ✅ Done |
| 3.3 | Add single save button at bottom | ✅ Done |
| 3.4 | Wire to PUT /clients/:id/profile/v2 | ✅ Done |
| 3.5 | Update portal profile page to use ProfileEditV2 | ✅ Done |
| 3.6 | Use GET /clients/:id/profile/v2 endpoint | ✅ Done |
| 3.7 | Hide navigation in edit mode | ✅ Done |

### Phase 4: View Component Update
**Goal**: Display profile data correctly

| Task | Description | Status |
|------|-------------|--------|
| 4.1 | Create ClientBriefV2 using shared sections with mode="view" | ✅ Done |
| 4.2 | Implement mode="view" for all sections | ✅ Done |
| 4.3 | Add formatted display for each section | ✅ Done |
| 4.4 | Ensure system metrics display correctly | ✅ Done |
| 4.5 | Use V2 endpoint in portal profile page | ✅ Done |
| 4.6 | Update Sales dashboard profile-edit-tab to use shared sections | ✅ Done |

### Phase 5: Cleanup & Documentation
**Goal**: Remove legacy code and document

| Task | Description | Status |
|------|-------------|--------|
| 5.1 | Remove old PortalProfileEditForm | ✅ Done |
| 5.2 | Remove old IntakeFormFields components | ✅ Done |
| 5.3 | Remove old IntakeForm (V1) directory | ✅ Done |
| 5.4 | Remove old ProfileSetupForm | ✅ Done |
| 5.5 | Update Sales dashboard profile-edit-tab | ✅ Done |
| 5.6 | Remove unused legacy fields from ClientProfile (optional) | ⏸️ Deferred |
| 5.7 | Update API documentation | ✅ Done |
| 5.8 | Add inline code comments | ✅ Done |

---

**Document Status**: All Phases Complete ✅
**Last Updated**: 2024-06-26
**Completion Date**: 2024-06-26

---

## 7. Decision Log

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| Use JSON columns for V2 fields | Flexible schema, easy to extend, matches intake form structure | Flat columns (rejected: too many fields, hard to maintain) |
| Single source of truth | Eliminates sync issues, simpler queries, consistent data | Multiple sources (rejected: leads to data divergence) |
| Shared components with mode prop | DRY principle, consistent UX, single point of change | Separate components for each mode (rejected: duplication) |
| Keep PortalIntakeForm for drafts | Autosave mechanism, audit trail, separation of concerns | Direct writes to ClientProfile (rejected: loses draft state) |
| Separate ClientMetrics | Clear ownership, different update patterns, security | Mixed in ClientProfile (rejected: user could modify system data) |

---

## 8. File Uploads Decision

**Question**: Should brand assets (logo, guidelines) be part of ClientProfile JSON or stored separately?

**Decision**: Store file metadata in JSON, actual files in object storage (Cloudflare R2)

```typescript
// In visualIdentityInfo
{
  hasVisualIdentity: true,
  brandAssets: {
    logoUrl: "https://storage.../logo.png",  // URL reference
    brandColors: ["#e7be52", "#121936"],
    fonts: ["Cairo", "Tajawal"],
    guidelinesUrl: "https://storage.../guidelines.pdf"  // URL reference
  }
}
```

**Rationale**:
- JSON stays queryable and lightweight
- Files are handled by object storage service
- Presigned URLs for secure access
- Existing `StorageService` already supports this

---

## 9. Validation Strategy

**Question**: Should we validate V2 fields against Zod schemas on every write, or only on frontend?

**Decision**: Validate on BOTH frontend (UX) and backend (security)

```typescript
// Frontend: Immediate feedback
const form = useForm({
  resolver: zodResolver(CommunicationInfoSchema),
  mode: 'onChange'
});

// Backend: Security guarantee
@Put(':id/profile')
async updateProfile(@Body() dto: UpsertClientProfileV2Dto) {
  // DTO uses class-validator which mirrors Zod schemas
}
```

**Rationale**:
- Frontend: Better UX with immediate validation feedback
- Backend: Never trust client input, always validate server-side
- Keep schemas in sync via `@hassad/shared` package

---

## 10. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Data Consistency | 100% | ClientProfile contains all IntakeFormV2 data after submission |
| Code Reuse | 100% | IntakeFormV2 and ProfileEditV2 use same section components |
| View Accuracy | 100% | ClientBrief displays all V2 fields correctly |
| API Efficiency | Minimal | Single GET for profile view, single PUT for update |
| No Regressions | 0 | All existing features continue to work |

---

## 11. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data loss during migration | High | Create backup before migration, test on staging |
| Breaking existing views | Medium | Keep legacy fields during transition, gradual rollout |
| Performance with JSON queries | Low | PostgreSQL JSONB is well-optimized, add indexes if needed |
| User confusion with new UI | Low | Keep similar UX between intake and edit modes |

---

## 12. Appendix

### A. Type Definitions

```typescript
// types.ts

export type ProfileMode = 'wizard' | 'edit' | 'view';

// Section 1
export interface CommunicationInfo {
  contactName: string;
  businessName: string;
  industry: string;
  contactNumber: string;
  email: string;
}

// Section 2
export interface ProductInfo {
  productStory?: string;
  detailedDescription?: string;
  valueProposition?: string;
  advantages?: string;
  benefits?: string[];
  contentDirection?: string;
}

// Section 3
export interface AudienceInfo {
  customerAnalysis?: string;
  faq?: FaqPair[];
}

export interface BrandVoice {
  toneOfVoice?: string;
  boundaries?: string;
  verbalSlogan?: string;
  appearanceMethod?: string;
}

// Section 4
export interface CustomerJourney {
  orderMethods?: string[];
  followUpTools?: string;
}

// Section 5
export interface CampaignInfo {
  campaignGoal?: string;
  campaignDetails?: string;
  campaignOffer?: string;
  guarantees?: string;
  campaignSeason?: string;
  competitors?: string;
}

// Section 6
export interface PastPerformance {
  bestCampaigns?: string;
  pastPerformance?: string;
  trackingSetup?: string;
}

export interface BudgetInfo {
  budgetRange?: number;
  previousReports?: string[];
}

// Section 7
export interface VisualIdentityInfo {
  hasVisualIdentity?: boolean;
  brandAssets?: {
    logoUrl?: string;
    brandColors?: string[];
    fonts?: string[];
    guidelinesUrl?: string;
  };
  pastDesigns?: string;
  productPhotos?: string[];
  visualDirection?: string[];
}

// Full profile
export interface ClientProfileV2 {
  communicationInfo?: CommunicationInfo;
  productInfo?: ProductInfo;
  audienceInfo?: AudienceInfo;
  brandVoice?: BrandVoice;
  customerJourney?: CustomerJourney;
  campaignInfo?: CampaignInfo;
  pastPerformance?: PastPerformance;
  budgetInfo?: BudgetInfo;
  visualIdentityInfo?: VisualIdentityInfo;
}
```

### B. Section Component Template

```typescript
// sections/CommunicationSection.tsx

import { CommunicationInfo } from '../types';
import { ProfileMode } from '../types';

interface CommunicationSectionProps {
  initialData?: CommunicationInfo;
  onDataChange: (data: CommunicationInfo) => void;
  onValid: (isValid: boolean) => void;
  mode: ProfileMode;
  onNext?: () => void; // wizard mode only
  onBack?: () => void; // wizard mode only
}

export function CommunicationSection({
  initialData,
  onDataChange,
  onValid,
  mode,
  onNext,
  onBack,
}: CommunicationSectionProps) {
  const form = useForm<CommunicationInfo>({
    resolver: zodResolver(CommunicationInfoSchema),
    defaultValues: initialData,
    mode: 'onChange',
  });

  // Notify parent of data changes
  useEffect(() => {
    const subscription = form.watch((values) => {
      onDataChange(values as CommunicationInfo);
    });
    return () => subscription.unsubscribe();
  }, [form, onDataChange]);

  // Notify parent of validity
  useEffect(() => {
    onValid(form.formState.isValid);
  }, [form.formState.isValid, onValid]);

  // Render based on mode
  if (mode === 'view') {
    return <CommunicationSectionView data={form.getValues()} />;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(() => onNext?.())}>
        {/* Form fields */}
        
        {mode === 'wizard' && (
          <div className="flex justify-between">
            {onBack && <Button onClick={onBack}>Back</Button>}
            <Button type="submit">Next</Button>
          </div>
        )}
      </form>
    </Form>
  );
}
```

---

## 13. Approval Checklist

Implementation Complete ✅

- [x] All V2 fields sync from IntakeFormV2 to ClientProfile
- [x] ClientBriefV2 displays V2 fields correctly
- [x] ProfileEditV2 uses shared section components
- [x] IntakeFormV2 uses shared section components
- [x] Both edit and view modes work for all sections
- [x] Admin/Sales can view and edit client profiles
- [x] Client can edit own profile via portal
- [x] No TypeScript errors
- [x] No console errors
- [x] Database migration applied
- [x] Old components removed (IntakeFormFields, PortalProfileEditForm, ProfileSetupForm, IntakeForm V1)
- [x] Documentation updated
- [x] Sales dashboard profile-edit-tab uses shared sections
- [x] Portal profile page uses ClientBriefV2 and ProfileEditV2

---

**Document Status**: ✅ Implementation Complete
**Architecture Rules**: All 5 rules followed
**Production Ready**: Yes