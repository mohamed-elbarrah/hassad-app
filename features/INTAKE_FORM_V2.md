# Intake Form V2 — Feature Plan

> **Tracking doc.** Read before starting any phase. Check `[ ]` → `[x]` as work progresses.
> Append a line to **Status log** at the bottom each time a phase is completed.

---

## 1. Overview

Complete redesign of the client portal intake form. Current form has 4 basic sections (15 fields). New form has **8 sections across 7 steps (~45+ fields)** matching the detailed brief provided by the project owner.

The new form preserves progress at every step — if a user leaves and comes back, they continue exactly where they stopped. Only Step 1 (Communication Summary) is required to mark intake as complete; all other steps are optional with a "تخطي" (Skip) button.

---

## 2. Non-Negotiable Rules

| # | Rule |
|---|------|
| 1 | **Follow best practices and clean code with standard pattern for Next.js and NestJS** — match the established patterns in this codebase (see AGENTS.md and .agent/ specs) |
| 2 | **Exact content**: Use the Arabic field names, descriptions, and instructions EXACTLY as provided by the project owner below — no paraphrasing, no shortening |
| 3 | **Progress persistence**: Every step auto-saves to the backend. If the user leaves and returns, they resume exactly where they stopped |
| 4 | **Design system compliance**: ALL styling must use portal design tokens (`portal-bg`, `portal-card-border`, `portal-divider`, `portal-note-text`, `portal-icon`, etc.) — zero hardcoded colors. All components from `@/components/design-system/*` or `@/components/ui/*` |
| 5 | **RTK Query**: No raw `fetch()` calls. Every API interaction through `portalApi` mutations/queries |
| 6 | **Zod + react-hook-form**: Every step uses `react-hook-form` with `zodResolver`. Schemas live in `packages/shared/src/schemas/` |
| 7 | **No raw DOM inputs**: All form fields must use shadcn/ui or design-system components (no bare `<input>`, `<select>`, `<textarea>`) |
| 8 | **State machine**: Server-side status transitions only. Client just submits sections |
| 9 | **Multi-table writes** use `prisma.$transaction()` |
| 10 | **Notifications fire AFTER** the core transaction commits |

---

## 3. User Stories

> As a **client**, I want to fill my business profile in small, focused steps so I don't feel overwhelmed.

> As a **client**, I want to see clear Arabic instructions for every field so I know exactly what to write.

> As a **client**, I want the form to save my progress automatically so I can leave and come back later.

> As a **client**, I want to skip optional sections and fill them later from my profile page.

> As a **client**, I want to review all my answers before submitting.

> As a **client**, I want to see my progress through the steps clearly.

> As a **sales team member**, I want clients to complete their intake so I have the data I need to start campaigns.

---

## 4. Step-by-Step Design

### Step 1: الملخص التواصلي (Communication Summary) — REQUIRED

**Field count:** 5

| Field Name | Type | Validation | Instruction (exact from brief) |
|---|---|---|---|
| `contactName` | `input` | Required, min 2 chars | اسمك |
| `businessName` | `input` | Required, min 2 chars | اسم النشاط |
| `industry` | `select` | Required | مجال النشاط |
| `contactNumber` | `input type="tel"` | Required, min 5 chars | رقم التواصل |
| `email` | `input type="email"` | Required, valid email | البريد الإلكتروني |

**Behavior:**
- Save to `PortalIntakeForm.communicationInfo` (JSON) on blur
- Mark `intakeCompleted = true` on submission of this step
- No "تخطي" button — required to proceed

---

### Step 2: معلومات المنتج / الخدمة (Product/Service Info) — OPTIONAL

**Field count:** 6

| Field Name | Type | Instruction |
|---|---|---|
| `productStory` | `textarea` (5 rows) | قصة المنتج أو الخدمة — قصة البراند علمنا عن البداية و كواليس التصنيع أو تجارب عملائك الأوائل عشان نصنع منها قصة تبيع. |
| `detailedDescription` | `textarea` (5 rows) | وصف تفصيلي للمنتج أو الخدمة — وش سالفة منتجك / خدمتك؟ اشرح لنا بالتفصيل وش تقدم تخيل العميل واقف قدامك وودك تقنعه |
| `valueProposition` | `textarea` (3 rows) | القيمة المضافة — وش ميزتك الجوهرية؟ وش الشيء الرهيب اللي يخليك تفرق عن كل الموجودين بالسوق؟ |
| `advantages` | `textarea` (3 rows) | المزايا — ليه العميل يختارك؟ وش أهم النقاط اللي تخلي العميل يشتري بدون ما يفكر؟ |
| `benefits` | `chips + custom` | الفوائد — وش بيستفيد العميل؟ زبونك وش بيتغير في حياته أو يومه بعد ما يجرب منتجك أو خدمتك؟ |
| `contentDirection` | `textarea` (3 rows) | المحتوى — كيف لازم يكون المحتوى؟ حدد اهم النقاط اللي نركز عليها |

**Save to:** `PortalIntakeForm.productInfo` (JSON)

---

### Step 3: الجمهور المستهدف + الرسائل والهوية (Audience & Messaging) — OPTIONAL

**Field count:** 6

| Field Name | Type | Instruction |
|---|---|---|
| `customerAnalysis` | `textarea` (5 rows) | تحليل العملاء — أوصف لنا عميلك المثالي: كم عمره؟ وش جنسه؟ وين ساكن؟ وش اهتماماته؟ وش مشاكله اللي بتحلها؟ |
| `faq` | `textarea` (5 rows) | الأسئلة الشائعة — وش أكثر الأسئلة اللي تجيك من العملاء؟ وكيف ترد عليهم؟ |
| `toneOfVoice` | `select` | النبرة — كيف ودك نكلم الناس؟ (رسمي وجاد، سواليف، شبابي، احترافي) |
| `boundaries` | `textarea` (3 rows) | الحدود / العوائق — الخطوط الحمراء: وش الأشياء أو الكلمات اللي ما ودك تطلع في المحتوى و إعلاناتك أبد؟ |
| `verbalSlogan` | `input` | الشعار اللفظي — وش الشعار اللفظي الثابت لبراندك؟ |
| `appearanceMethod` | `select` | طريقة الظهور — إذا بنسوي فيديو إعلاني أو مونتاج، مين بيمثله؟ (مؤدي صوتي، مودل بوجه واضح، تصوير يدين للمنتج) |

**Layout:** 2-column grid — left column for audience (customerAnalysis, faq), right column for messaging (toneOfVoice, boundaries, verbalSlogan, appearanceMethod)

**Save to:** `PortalIntakeForm.audienceInfo` (JSON) + `PortalIntakeForm.brandVoice` (JSON)

---

### Step 4: رحلة العميل (Customer Journey) — OPTIONAL

**Field count:** 2

| Field Name | Type | Instruction |
|---|---|---|
| `orderMethods` | `multi-select chips` | طريقة الطلب — العميل كيف يشتري؟ (من المتجر دايركت، وإلا يكلمك واتساب، وإلا نموذج يعبيه؟) |
| `followUpTools` | `textarea` (3 rows) | أدوات المتابعة — هل عندكم نظام يتابع السلات المتروكة أو العملاء المترددين؟ |

**Save to:** `PortalIntakeForm.customerJourney` (JSON)

---

### Step 5: الحملة الإعلانية (Campaign) — OPTIONAL

**Field count:** 6

| Field Name | Type | Instruction |
|---|---|---|
| `campaignGoal` | `textarea` (3 rows) | الهدف — وش الهدف الأول والثاني من هالحملة؟ وكيف تقيس نجاح حملاتك عادة؟ |
| `campaignDetails` | `textarea` (5 rows) | تفاصيل الحملة الإعلانية — وش بنعلن عنه؟ الحملة لمنتج واحد وإلا مجموعة منتجات؟ إذا مجموعة عطنا أهمها بالترتيب. |
| `campaignOffer` | `textarea` (3 rows) | العرض في الحملة — وش عرضك القوي؟ وش الحافز والعروض القوية اللي بنصيد فيها العميل؟ |
| `guarantees` | `textarea` (3 rows) | الضمانات — عندك سياسة إرجاع أو ضمان ذهبي يخلي العميل يشتري وهو مرتاح البال؟ |
| `campaignSeason` | `input` | المناسبة / الموسم — هل الحملة مرتبطة بموسم أو توقيت معين؟ |
| `competitors` | `textarea` (3 rows) | المنافسون — مين منافسينك في السوق؟ عطنا اقوى 3 علامات تجارية منافسة لك |

**Save to:** `PortalIntakeForm.campaignInfo` (JSON)

---

### Step 6: الأداء السابق والميزانية (Past Performance & Budget) — OPTIONAL

**Field count:** 5

| Field Name | Type | Instruction |
|---|---|---|
| `bestCampaigns` | `textarea` (5 rows) | أفضل الحملات السابقة — وش الإعلانات الأكثر نجاحًا وليش نجحت؟ |
| `pastPerformance` | `textarea` (5 rows) | أداء الحملات السابقة — مهم ذكر المنصات الإعلانية المستخدمة - نوع المواد الإبداعية (صور – ريل – تصميم اعلاني)، مدة الحملة وتوقيتها, الميزانية المخصصة لها، طريقة قياس النتائج (نقرات، مبيعات، تسجيل،)، النتائج الإيجابية أو السلبية التي خرجتم بها. |
| `trackingSetup` | `select` | الربط — هل البكسل (Pixel) وأكواد التتبع والـ API مربوطة وشغالة تمام وصار لها قراءة سابقة، ولا بنأسسها من الصفر؟ |
| `budgetRange` | `input type="number"` | الميزانية — كم ناوي تصرف في الشهر على المنصات؟ نبي رقم منطقي يخلينا ننافس بقوة. |
| `previousReports` | `file upload` | التقارير السابقة — إذا عندك تقارير لحملات سابقة، شاركها معنا خلنا نحللها. |

**Layout:** 2-column grid for trackingSetup + budgetRange side by side

**Save to:** `PortalIntakeForm.pastPerformance` (JSON) + `PortalIntakeForm.budgetInfo` (JSON)

---

### Step 7: الهوية البصرية + التصميم (Visual Identity & Design) — OPTIONAL

**Field count:** 5

| Field Name | Type | Instruction |
|---|---|---|
| `hasVisualIdentity` | `yes/no toggle` | هل عندك هوية بصرية جاهزة؟ (شعار، خطوط، ألوان) أو بنصممها من الصفر؟ |
| `brandAssets` | `file upload + inputs` | ملفات براندك البصرية — logo (png, svg)، brand colors (color pickers), fonts (text input), guidelines (file upload) |
| `pastDesigns` | `textarea` (3 rows) | تصاميم سابقة — وش نوع البوستات وتصاميم الصور الإعلانية اللي جابت نتيجة ومبيعات؟ |
| `productPhotos` | `file upload` (multi) | صور المنتج — هل عندك صور حقيقية وجلسات تصوير فوتوغرافي لمنتجاتك نقدر نشتغل عليها في التصاميم؟ |
| `visualDirection` | `3x input` | التوجه البصري — عطنا 3 حسابات يعجبك ستايل تصاميمها في السوشيال ميديا؟ ودنا نعرف المظهر البصري اللي تبيه في التصاميم |

**Save to:** `PortalIntakeForm.visualIdentityInfo` (JSON)

---

### Step 8: Review (المراجعة والإرسال)

Displays all 7 sections in read-only cards with per-section "تعديل" button. Sections that were skipped show "لم يتم التعبئة — يمكنك العودة لاحقاً". "إرسال" button submits the final `isSubmitted = true`.

---

## 5. Progress Persistence (Critical UX)

### How It Works

```
User lands on /portal/profile/setup
  │
  ├── GET /v1/portal/intake-form → "has draft?"
  │     ├── Yes → Load saved sections + currentStep → redirect to that step
  │     └── No  → Start from Step 1
  │
  Each step change:
  └── PATCH /v1/portal/intake-form/draft
      Body: { currentStep: 3, productInfo: {...}, ... }
      → Backend upserts PortalIntakeForm + saves currentStep
```

### Implementation

1. **New API endpoint**: `PATCH /v1/portal/intake-form/draft`
   - Upserts `PortalIntakeForm` with the submitted section data + `currentStep`
   - Does NOT set `isSubmitted = true`
   - Returns `{ currentStep, completedSections: [1,2] }`

2. **Modified GET endpoint**: `GET /v1/portal/intake-form`
   - Returns all saved sections + `currentStep` if draft exists
   - Frontend uses this to determine where to resume

3. **Client-side**: The `useIntakeFormV2` hook loads the draft on mount:
   ```tsx
   const { data: draft } = useGetIntakeFormDraftQuery();
   useEffect(() => {
     if (draft?.currentStep) goToSection(draft.currentStep);
   }, [draft]);
   ```

4. **Auto-save**: persists every 30s (existing pattern) + on every step navigation

5. **Edge case**: If user has completed Step 1 (`intakeCompleted = true`) but hasn't filled later steps, the dashboard shows a banner "أكمل بيانات ملفك التعريفي — sections not filled"

---

## 6. Data Model

### Prisma — New JSON Columns on PortalIntakeForm

```prisma
model PortalIntakeForm {
  // Existing columns (KEPT for backward compat)
  id                    String    @id @default(uuid())
  clientId              String    @unique
  token                 String    @unique
  industry              String?
  businessDescription   String?   @db.Text
  targetAudience        String?   @db.Text
  budgetRangeMin        Float?
  budgetRangeMax        Float?
  campaignGoals         Json?
  campaignOffer         String?   @db.Text
  competitors           String?
  seasonalTiming        String?
  orderMethods          Json?
  abandonedCartSystem   Boolean?  @default(false)
  hasVisualIdentity     Boolean?  @default(false)
  brandAssets           Json?
  visualReferences      String?
  uploadedFiles         Json?
  isSubmitted           Boolean   @default(false)
  submittedAt           DateTime?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  // NEW columns — JSON sections
  currentStep           Int?      @default(0)
  communicationInfo     Json?
  productInfo           Json?
  audienceInfo          Json?
  brandVoice            Json?
  customerJourney       Json?
  campaignInfo          Json?
  pastPerformance       Json?
  budgetInfo            Json?
  visualIdentityInfo    Json?

  @@index([clientId])
  @@map("portal_intake_forms")
}
```

### Zod Schema (new file)

`packages/shared/src/schemas/intake-form-v2.schema.ts`

```typescript
import { z } from "zod";

// ── Section schemas ───────────────────────────────────────────

export const CommunicationInfoSchema = z.object({
  contactName: z.string().min(2, "اسم يجب أن يكون 2 أحرف على الأقل"),
  businessName: z.string().min(2, "اسم النشاط يجب أن يكون 2 أحرف على الأقل"),
  contactNumber: z.string().min(5, "رقم التواصل يجب أن يكون 5 أحرف على الأقل"),
  email: z.string().email("البريد الإلكتروني غير صحيح"),
});

export const ProductInfoSchema = z.object({
  productStory: z.string().optional(),
  detailedDescription: z.string().optional(),
  valueProposition: z.string().optional(),
  advantages: z.string().optional(),
  benefits: z.array(z.string()).optional(),
  contentDirection: z.string().optional(),
});

export const AudienceInfoSchema = z.object({
  customerAnalysis: z.string().optional(),
  faq: z.string().optional(),
});

export const BrandVoiceSchema = z.object({
  toneOfVoice: z.string().optional(),
  boundaries: z.string().optional(),
  verbalSlogan: z.string().optional(),
  appearanceMethod: z.string().optional(),
});

export const CustomerJourneySchema = z.object({
  orderMethods: z.array(z.string()).optional(),
  followUpTools: z.string().optional(),
});

export const CampaignInfoSchema = z.object({
  campaignGoal: z.string().optional(),
  campaignDetails: z.string().optional(),
  campaignOffer: z.string().optional(),
  guarantees: z.string().optional(),
  campaignSeason: z.string().optional(),
  competitors: z.string().optional(),
});

export const PastPerformanceSchema = z.object({
  bestCampaigns: z.string().optional(),
  pastPerformance: z.string().optional(),
  trackingSetup: z.string().optional(),
});

export const BudgetInfoSchema = z.object({
  budgetRange: z.number().positive().optional(),
  previousReports: z.array(z.string()).optional(),
});

export const VisualIdentityInfoSchema = z.object({
  hasVisualIdentity: z.boolean().optional(),
  brandAssets: z.object({
    logoUrl: z.string().optional(),
    brandColors: z.array(z.string()).optional(),
    fonts: z.array(z.string()).optional(),
    guidelinesUrl: z.string().optional(),
  }).optional(),
  pastDesigns: z.string().optional(),
  productPhotos: z.array(z.string()).optional(),
  visualDirection: z.array(z.string()).max(3).optional(),
});

// ── Combined schema ───────────────────────────────────────────

export const IntakeFormV2Schema = z.object({
  currentStep: z.number().int().min(0).max(7).optional(),
  communicationInfo: CommunicationInfoSchema.optional(),
  productInfo: ProductInfoSchema.optional(),
  audienceInfo: AudienceInfoSchema.optional(),
  brandVoice: BrandVoiceSchema.optional(),
  customerJourney: CustomerJourneySchema.optional(),
  campaignInfo: CampaignInfoSchema.optional(),
  pastPerformance: PastPerformanceSchema.optional(),
  budgetInfo: BudgetInfoSchema.optional(),
  visualIdentityInfo: VisualIdentityInfoSchema.optional(),
});

export type IntakeFormV2Input = z.infer<typeof IntakeFormV2Schema>;
```

---

## 7. API Endpoints

| Method | Path | Purpose | New/Edit |
|---|---|---|---|
| `GET` | `/v1/portal/intake-form` | Fetch full intake (existing) | Edit — return new JSON fields + `currentStep` |
| `PATCH` | `/v1/portal/intake-form/draft` | Save current step progress | **NEW** |
| `POST` | `/v1/portal/intake-form` | Final submit (existing) | Edit — accept new JSON fields |
| `POST` | `/v1/portal/upload-intake-files` | File upload (existing) | Edit — support new upload categories |

### API DTO Updates

`CreateIntakeFormDto` gets new optional fields for all JSON sections. The NestJS class-validator uses `@IsOptional()` + `@IsObject()` for each JSON section. A new `SaveDraftDto` mirrors the same structure but allows partial updates.

---

## 8. Frontend Component Architecture

```
components/
├── portal/
│   └── IntakeFormV2/
│       ├── index.ts                          // barrel export
│       ├── IntakeFormV2.tsx                  // orchestrator — 7-step wizard
│       ├── hooks/
│       │   └── useIntakeFormV2.ts            // extends existing with draft resume + RTK
│       ├── components/
│       │   ├── StepNavigation.tsx            // next/back/skip buttons
│       │   ├── StepProgressBar.tsx           // 8-dot progress indicator
│       │   ├── AutoSaveIndicator.tsx         // reuse from current
│       │   └── StepLayout.tsx                // shared card wrapper per step
│       └── steps/
│           ├── Step1_Communication.tsx       // react-hook-form + zod
│           ├── Step2_ProductInfo.tsx
│           ├── Step3_AudienceMessaging.tsx   // 2-column grid layout
│           ├── Step4_CustomerJourney.tsx
│           ├── Step5_Campaign.tsx
│           ├── Step6_PerformanceBudget.tsx
│           ├── Step7_VisualIdentity.tsx
│           └── Step8_Review.tsx              // reads all sections + edit links
│
└── shared/
    └── IntakeFormFields/                      // KEPT — shared section components for ProfileForm (edit mode)
        └── (updated to use portal tokens)
```

### Component Responsibilities

| Component | Role |
|---|---|
| `IntakeFormV2.tsx` | State machine: loads draft → renders current step → handles navigation → auto-saves |
| `StepLayout.tsx` | Shared wrapper: section header + instruction text + skip button + card body |
| `Step1_Communication.tsx` | `useForm<CommunicationInfoSchema>` — 5 required fields |
| `Step2_ProductInfo.tsx` | `useForm<ProductInfoSchema>` — 6 optional fields with large textareas |
| `Step3_AudienceMessaging.tsx` | `useForm<AudienceInfoSchema & BrandVoiceSchema>` — 2-column layout |
| `Step4_CustomerJourney.tsx` | `useForm<CustomerJourneySchema>` — chips + textarea |
| `Step5_Campaign.tsx` | `useForm<CampaignInfoSchema>` — 6 fields |
| `Step6_PerformanceBudget.tsx` | `useForm<PastPerformanceSchema & BudgetInfoSchema>` — 2-column + file upload |
| `Step7_VisualIdentity.tsx` | `useForm<VisualIdentityInfoSchema>` — conditional sections + file uploads |
| `Step8_Review.tsx` | Read-only display of all 7 sections + edit per section + final submit |

---

## 9. Design Token Alignment Checklist

Every component must pass this checklist:

- [ ] No `text-neutral-*` or `text-natural-*` in intake form files → use `text-portal-note-text`, `text-portal-icon`, etc.
- [ ] No `border-neutral-*` → use `border-portal-divider`, `border-portal-card-border`
- [ ] No hardcoded background colors → use `bg-portal-bg`, `bg-natural-0`, design tokens
- [ ] All inputs use shadcn/ui or `@/components/design-system/` components
- [ ] Placeholder color uses `placeholder:text-portal-placeholder` (add this token if missing in globals.css)
- [ ] Buttons use `ActionButton` from design system (not raw `<button>`)
- [ ] Card containers use `SurfaceCard` or `DashboardCard` from design system
- [ ] File upload uses `FileDropzone` from `@/components/shared/FileDropzone`
- [ ] Select dropdowns use `FormSelect*` from `@/components/design-system/FormSelectControl`

---

## 10. Implementation Phases

### Phase 1: Data Layer (Backend)

- [ ] Add new JSON columns to `PortalIntakeForm` via Prisma migration:
  - `currentStep`, `communicationInfo`, `productInfo`, `audienceInfo`, `brandVoice`, `customerJourney`, `campaignInfo`, `pastPerformance`, `budgetInfo`, `visualIdentityInfo`
- [ ] Create `IntakeFormV2Schema` in `packages/shared/src/schemas/intake-form-v2.schema.ts`
- [ ] Export new types from `packages/shared/src/index.ts`
- [ ] Update `CreateIntakeFormDto` with new optional fields (all `@IsOptional()`)
- [ ] Create `SaveDraftDto` for the draft endpoint
- [ ] Add `PATCH /v1/portal/intake-form/draft` endpoint in `portal.controller.ts`
- [ ] Add `saveDraft()` method to `portal.service.ts` (uses `$transaction`)
- [ ] Update `GET /v1/portal/intake-form` to return draft state + `currentStep`
- [ ] Add RTK Query hooks in `portalApi.ts`:
  - `useGetIntakeFormDraftQuery`
  - `useSaveIntakeFormDraftMutation`
  - Keep `useSubmitIntakeFormMutation` but update to accept new fields

### Phase 2: Step Components (Frontend)

- [ ] Build `StepLayout.tsx` — shared wrapper with instruction box + skip button
- [ ] Build `StepProgressBar.tsx` — 8-step progress indicator
- [ ] Build `Step1_Communication.tsx` — 5 required fields with react-hook-form + zod
- [ ] Build `Step2_ProductInfo.tsx` — 6 fields with large textareas
- [ ] Build `Step3_AudienceMessaging.tsx` — 2-column grid layout
- [ ] Build `Step4_CustomerJourney.tsx` — chips + textarea
- [ ] Build `Step5_Campaign.tsx` — 6 fields
- [ ] Build `Step6_PerformanceBudget.tsx` — 2-column + file upload
- [ ] Build `Step7_VisualIdentity.tsx` — conditional sections + file uploads
- [ ] Build `Step8_Review.tsx` — read-only display + edit links + final submit

### Phase 3: Wizard Orchestrator + Progress Persistence

- [ ] Build `IntakeFormV2.tsx` — state machine orchestrator
- [ ] Build `useIntakeFormV2.ts` — hook for draft loading, auto-save, navigation
- [ ] Wire auto-save: 30s interval + on step change → `saveDraft` mutation
- [ ] Wire draft resume: on mount → `getDraft` → `goToSection(draft.currentStep)`
- [ ] Handle edge cases: first-time vs returning user vs completed user
- [ ] Update `app/(portal)/portal/profile/setup/page.tsx` to render `IntakeFormV2` instead of old `IntakeForm`

### Phase 4: Design Polish + Review

- [ ] Audit all components against Design Token Alignment Checklist (Section 9)
- [ ] Polish: alignment, spacing, interaction states, transitions
- [ ] Verify RTL rendering on all steps
- [ ] Test mobile layout (touch targets 44x44px)
- [ ] Update `shared/IntakeFormFields` components to use portal tokens
- [ ] Verify `ProfileForm` (edit mode) still works with updated shared components

### Phase 5: Cleanup

- [ ] Remove commented-out code
- [ ] Ensure no console.logs or debug code
- [ ] Build successfully with `turbo build`
- [ ] Remove old `components/portal/IntakeForm/` directory (no longer needed)
- [ ] Final `turbo build` verification

---

## 11. Status Log

| Phase | Status | Date | Notes |
|---|---|---|---|
| Phase 1: Data Layer | [x] | 2026-06-24 | Prisma migration, Zod schemas, DTOs, saveDraft service, PATCH endpoint, GET /portal/intake-form, RTK Query hooks |
| Phase 2: Step Components | [x] | 2026-06-24 | StepLayout, StepProgressBar, Step1-8 all built with react-hook-form + zodResolver using shared schemas, portal design tokens, design-system components, chips/selects/textareas/file uploads, RTL layout, 2-column grids, review step with progress |
| Phase 3: Wizard + Persistence | [x] | 2026-06-24 | useIntakeFormV2 hook with draft load/resume/auto-save/step-navigation/submit, IntakeFormV2 orchestrator, AutoSaveIndicator, submitIntakeForm RTK mutation, setup page updated |
| Phase 4: Design Polish | [x] | 2026-06-24 | Full checklist audit: fixed bg-neutral-50 in Step8, replaced raw <select> with FormSelectControl in shared Sections 1/2, fixed bg-neutral-300 toggles to bg-portal-divider, swapped all navigation <button> elements for ActionButton in Steps 1-7, added portal token variables (iconColor, cardBorder, etc.) to all shared sections with isPortal fallbacks, fixed FileUploadZone neutral tokens, added ActionButton imports to all steps, verified dashboard mode works |
| Phase 5: Cleanup | [ ] | — | — |
