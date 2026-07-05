# خطة إعادة تصميم واجهة الملف التعريفي للبوابة

## Executive Summary

هذه الخطة تُعيد بناء واجهة عرض **الملف التعريفي للعميل في البوابة (Portal Profile)** لتصبح على غرار لوحة تحكم حديثة (dashboard-style) مشابهة للمرجع المرفق، مع حل مشاكل الاتجاه والتكرار والبنية الحالية. **لا يُمسّى الخلفية (Backend) نهائياً**، ويعتمد فقط على البيانات المُرَدّة من `Client` و `ClientProfile` الحاليين.

---

## 1. المشاكل الحقيقية في الواجهة الحالية

### 1.1 فوضى الاتجاه (RTL / LTR)

- الاتجاه RTL مُعيّن مرة واحدة في الجذر:
  - `apps/web/app/layout.tsx` → `<html lang="ar" dir="rtl">`
  - `apps/web/app/(portal)/layout.tsx` → `<div … dir="rtl">`
- رغم ذلك، تُكرّر المكونات `dir="rtl"` و `dir="ltr"` بشكل عشوائي داخل نفس الصفحة (`PortalProfilePage`, `ClientBriefV2`, `ProfileSections`).
- بعض الحقول تستخدم `flex-row-reverse` + `text-right` ثم في المقابل حقول أخرى لا تستخدم أيّ منهما.
- النتيجة: محتوى يبدأ من اليمين في مكان ومن اليسار في آخر، ومسافات غير متسقة.

### 1.2 تكرار هيكلي واضح

- `ClientBriefV2` يكرّر منطق الهوية (avatar + status + quick stats) الذي يوجد مسبقاً في:
  - `ClientBriefCompact.tsx`
  - `ClientBriefIdentity.tsx`
  - `ClientBriefOverview.tsx`
- كل قسم من `ProfileSections` (Communication, Product, Audience, …) يُعيد اختراع تخطيط البطاقة والأيقونة والعنوان بدلاً من استخدام `BriefCard` / `ClientBriefField` الموحدة.
- نفس تنسيق "بطاقة مع أيقونة + عنوان + وصف" مُكرّر في 7+ ملفات بأشكال مختلفة.

### 1.3 تخطيط عمودي ممل وغير فعّال

- جميع الأقسام متراصة عمودياً `space-y-5`، حتى لو كانت بيانات منطقية منفصلة.
- لا يوجد شبكة رئيسية (main grid) أو شريط جانبي (sidebar) أو مناطق ثانوية/رئيسية.
- المرجع يُظهر: **بطاقة هوية على الشريط الجانبي + بطاقات KPI + مناطق محتوى منظمة**؛ هذا هو الهدف.

### 1.4 عدم تناسق في نظام البطاقات

- بعض البطاقات: `rounded-2xl border shadow-sm`
- أخرى: `rounded-[30px] border-[1.5px] shadow-none`
- أحجام padding غير موحدة (`p-5`, `p-6` بلا سبب).
- ألوان خلفيات KPI مختلطة (`bg-secondary-50`, `bg-success-50`, `bg-primary-50`) بلا قاعدة.
- ألوان مُضمنة inline (`style={{ backgroundColor: color }}`) تُعيق الـ Dark Mode والثيمات.

### 1.5 غياب التسلسل الهرمي البصري

- كل الأقسام لها نفس الحجم والوزن والأيقونة، فلا يستطيع المستخدم تمييز الأهم.
- البيانات الأساسية (التواصل) تبدو بنفس أهمية "المنافسون" و"الضمانات".

### 1.6 كود ضعيف القابلية للصيانة

- منطق التنسيق مُمزّق بين الصفحة والمكونات؛ لا يوجد "ViewModel" أو تجميع للبيانات.
- `ClientBriefV2.tsx` يجمع بين البيانات النظامية (system stats) وبيانات الملف التعريفي (profile sections) مباشرة في JSX، مما يُصعّب التعديل.
- بعض الأقسام (`AudienceSection`, `PerformanceSection`) تحتوي على HTML مُكرّر لكل حقل بدلاً من التكرار عبر خريطة بيانات (data map).

---

## 2. كيف يجب أن تكون الواجهة (الهدف)

### 2.1 بنية صفحة شبه مرجعية (RTL-aware)

بما أن التطبيق RTL، سيتم عكس المرجع LTR بشكل طبيعي:

```text
┌─────────────────────────────────────────────────────────────┐
│ [الملف التعريفي]            [تعديل الملف]        (header)  │
├─────────────┬───────────────────────────────────────────────┤
│             │                                                 │
│  SIDEBAR    │           MAIN CONTENT AREA                     │
│  (right)    │           (left)                                │
│             │                                                 │
│  • Avatar   │  ┌─────────────┐  ┌─────────────┐  ┌────────┐  │
│  • Name     │  │ KPI 1       │  │ KPI 2       │  │ KPI 3  │  │
│  • Status   │  └─────────────┘  └─────────────┘  └────────┘  │
│  • Contact  │                                                 │
│  • Activity │  ┌─────────────────────────────────────────┐  │
│             │  │           Key Sections Block              │  │
│             │  │  (Communication / Product / Audience)     │  │
│             │  └─────────────────────────────────────────┘  │
│             │                                                 │
│             │  ┌──────────────────┐ ┌────────────────────┐  │
│             │  │ Secondary Cards  │ │ Secondary Cards    │  │
│             │  └──────────────────┘ └────────────────────┘  │
│             │                                                 │
└─────────────┴─────────────────────────────────────────────────┘
```

- الشريط الجانبي يحتوي على الهوية الأساسية + معلومات التواصل السريعة + نشاط/حالة.
- المنطقة الرئيسية تبدأ ببطاقات KPI (إحصائيات العميل) ثم أقسام الملف التعريفي مجمعة في شبكة منطقية.
- `last updated` يبقى في أسفل الصفحة بمحاذاة مركزية خفيفة.

### 2.2 قواعد بصرية موحدة

- بطاقة واحدة: `rounded-2xl`, `border border-portal-card-border`, `bg-natural-0`, `shadow-sm`.
- العناوين: `text-base font-semibold` للبطاقات الفرعية، `text-lg font-bold` للرئيسية فقط.
- الأيقونات: دائماً داخل `IconCircle` بحجم موحد (w-9 h-10 أو w-10 h-10) ولون خلفية `bg-secondary-50` افتراضياً.
- حالة الـ status تظهر كـ `Pill` واحدة فوق الاسم، لا تكرار.
- حقول LTR (`email`, `phone`, `color hex`) تُعرض باتجاه نصّها الصحيح دون الحاجة لتغيير flex أو محاذاة الحاوية.

### 2.3 تجربة المستخدم المستهدفة

- المستخدم يدخل الصفحة → يرى هويته وإحصائياته في لمحة.
- التواصل الأساسي على الشريط الجانبي دائماً ظاهر.
- الأقسام الأطول (الجمهور، الحملة، الأداء، الهوية البصرية) موزعة على شبكة لا تُطيل التمرير العمودي.
- مؤشرات فارغة (empty states) موحدة: "لم يتم إضافة … بعد".

---

## 3. القواعد الصارمة (Non-Negotiable Rules)

| #   | القاعدة                                                                                                            | السبب                                        |
| --- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| R1  | **لا تُلمس الخلفية (backend) نهائياً** — لا API جديد، لا route، لا controller، لا service، لا migration.           | الطلب واضح: تعديل واجهة فقط.                 |
| R2  | **لا تُكرّر `dir="rtl"`** — RTL موجود في `RootLayout` و `PortalLayout`.                                            | إزالة التكرار يُحل مشكلة المحاذاة المتباينة. |
| R3  | **لا تُكرّر تخطيط البطاقة أو حقل العرض** — استخدم `BriefCard` + `ClientBriefField` + `SectionLayout` الموحدة.      | DRY؛ كل تغيير مستقبلي يكون في مكان واحد.     |
| R4  | **استخدم شبكة رئيسية (`grid`) للصفحة** — لا `space-y-5` مُطوّل لكل شيء.                                            | يُحاكي المرجع ويُحسّن استخدام المساحة.       |
| R5  | **كل لون أو مسافة أو زاوية دائرية تأتي من التصميم المُعتمد** — لا `rounded-[30px]` أو inline colors عشوائية.       | نظام تصميم صارم وقابل للصيانة.               |
| R6  | **افصل البيانات عن التقديم (Data → ViewModel → JSX)** — لا تُدخل `client.` / `profile.` مباشرة في JSX المعقّد.     | يُسهّل الاختبار ويُقلّل الأخطاء.             |
| R7  | **أعد استخدام ما هو موجود** — `ClientBriefSidebar`, `ClientBriefCompact`, `BriefCard`, `ClientBriefField` موجودون. | لا نُعيد اختراع العجلة.                      |
| R8  | **المحتوى العربي يبدأ من اليمين افتراضياً**؛ LTR يُطبّق فقط على قيمة النص نفسها (`dir="ltr"` داخل الـ `<p>`).      | لا تغيير في اتجاه الحاويات.                  |
| R9  | **ادعم الحالات الفارغة بشكل موحّد** — لا يُسمح ببطاقات فارغة بلا محتوى.                                            | تجربة مستخدم ناضجة.                          |
| R10 | **لا تُضيف dependencies جديدة** — استخدم shadcn/ui، lucide، tailwind، Recharts (موجود).                            | يحافظ على حجم الحزمة.                        |

---

## 4. الخطة التنفيذية بالمراحل

### المرحلة 0: تحليل + توحيد البيانات (.foundation)

**هدف:** تحضير "ViewModel" واحد للصفحة يُغذّي كل المكونات دون تكرار.

#### 4.0.1 إنشاء `ClientBriefViewModel`

ملف: `apps/web/components/client-brief/useClientBrief.ts` (hook) أو `ClientBriefViewModel.ts` (pure mapper).

```ts
// مثال للعقد المستهدف
interface ClientBriefViewModel {
  identity: {
    companyName: string;
    contactName?: string | null;
    statusLabel: string;
    statusTone: PillTone;
    logoUrl?: string | null;
    email: string;
    phone?: string | null;
    businessTypeLabel?: string;
    managerName?: string | null;
  };
  kpis: {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    cancelledProjects: number;
    contractValue: string; // formatted
    totalPaid: string; // formatted
  };
  sections: {
    communication?: CommunicationViewData;
    product?: ProductViewData;
    audience?: AudienceViewData;
    journey?: JourneyViewData;
    campaign?: CampaignViewData;
    performance?: PerformanceViewData;
    visual?: VisualViewData;
  };
  meta: {
    updatedAt?: string;
    viewAs: ClientBriefView;
  };
}
```

- تجميع كل `formatCurrency`, `formatDate`, `STATUS_LABELS`, `BUSINESS_TYPE_LABELS` في Hook واحد.
- هذا يُخرج منطق التحويل من `ClientBriefV2.tsx`.

#### 4.0.2 توحيد مكونات العرض الموجودة

- مراجعة `ClientBriefField` — يجب أن يكون كافياً لكل حقول القراءة فقط.
- مراجعة `BriefCard` — يجب أن يكون هو البطاقة الوحيدة (no second card style).
- مراجعة `ClientBriefStatCard` — إضافة `trend` و `bgTone` اختياريين، بدل الألوان المُدخلة يدوياً.

### المرحلة 1: إعادة هيكلة الصفحة الرئيسية (layout grid)

**هدف:** تحويل `ClientBriefV2` إلى تخطيط شبكة حديث.

#### 4.1.1 تعديل `apps/web/app/(portal)/portal/profile/page.tsx`

- يبقى مسؤولاً عن:
  - `clientId`
  - `isEditing`
  - تحميل البيانات
  - تمرير `viewModel` إلى `ClientBriefV2`
- يُزال `dir="rtl"` من أماكنه الداخلية.
- يُحافظ على `ProfileEditV2` كما هو (لا يتغيّر).

#### 4.1.2 تعديل `ClientBriefV2.tsx`

- يُستبدل `space-y-5` بهيكل grid:

```tsx
<div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
  {/* Sidebar — right in RTL */}
  <aside className="lg:col-span-4 xl:col-span-3 space-y-5">
    <IdentitySidebar data={viewModel.identity} />
  </aside>

  {/* Main content */}
  <div className="lg:col-span-8 xl:col-span-9 space-y-5">
    <KpiGrid kpis={viewModel.kpis} />
    <ProfileSectionsGrid sections={viewModel.sections} />
  </div>
</div>
```

- يُنشأ مكونان جديدان فقط:
  - `IdentitySidebar`
  - `KpiGrid`
- يُستخدم `ClientBriefSidebar` الموجود كقاعدة للهوية البصرية إن لزم.

### المرحلة 2: إعادة توحيد أقسام الملف التعريفي

**هدف:** كل `ProfileSections/sections/*.tsx` يستخدم `BriefCard` + `ClientBriefField`.

#### 4.2.1 تعديل `SectionLayout.tsx` (mode="view")

- جعل `SectionLayout` في وضع العرض يُرجع `BriefCard`.
- جعل `ViewField` يستخدم `ClientBriefField` تحت الطبقات.
- إزالة أي `flex-row-reverse` أو `text-right` — RTL يتولّى الأمر.

#### 4.2.2 إعادة كتابة الأقسام السبعة

- `CommunicationSection`, `ProductSection`, `AudienceSection`, `JourneySection`, `CampaignSection`, `PerformanceSection`, `VisualSection`.
- تُحوّل حقولها إلى مصفوفة بيانات + تكرار واحد:

```tsx
const fields = [
  { icon: User, label: "الاسم", value: data.contactName },
  { icon: Building2, label: "اسم النشاط", value: data.businessName },
  { icon: Briefcase, label: "المجال", value: data.industry },
  { icon: Phone, label: "رقم التواصل", value: data.contactNumber, dir: "ltr" },
  { icon: Mail, label: "البريد الإلكتروني", value: data.email, dir: "ltr" },
];

return (
  <SectionLayout mode="view" title="معلومات التواصل">
    <div className="space-y-3">
      {fields.map((f) => f.value && <ClientBriefField key={f.label} {...f} />)}
    </div>
  </SectionLayout>
);
```

- الأقسام الأطول تُقسّم إلى `grid grid-cols-1 xl:grid-cols-2 gap-5` داخل `BriefCard`.
- الأقسام ذات الصلة (Brand Voice + Audience) تُوضع في بطاقة واحدة مع عنوانين فرعيين.

### المرحلة 3: توحيد الهوية والإحصائيات

**هدف:** الشريط الجانبي والبطاقات الرقمية تبدو كجزء من نفس النظام.

#### 4.3.1 `IdentitySidebar`

- يستخدم `UserAvatar`, `Pill`, `ClientBriefField`.
- يعرض: avatar + status + name + contact info + manager + createdAt.
- يبقى sticky على الشاشات الكبيرة.

#### 4.3.2 `KpiGrid`

- 3-6 بطاقات تستخدم `ClientBriefStatCard`.
- تنسيق: `grid grid-cols-2 xl:grid-cols-3 gap-4`.
- يُمنع استخدام inline colors؛ استخدم `tone` من `Pill` / `ClientBriefStatCard`.

### المرحلة 4: responsive + polish

**هدف:** التأكد من أن التصميم يعمل على كل الأجهزة.

#### 4.4.1 breakpoints

- mobile (< `lg`): بطاقة واحدة تحت الأخرى.
- tablet (`lg`): sidebar 4/12، main 8/12.
- desktop (`xl`): sidebar 3/12، main 9/12.

#### 4.4.2 accessibility

- كل icon يحمل `aria-hidden="true"`.
- الأزرار تستخدم `ActionButton` (موجود).
- empty states تستخدم `text-portal-note-text`.

#### 4.4.3 cleanup

- إزالة جميع `dir="rtl"` الزائدة.
- إزالة جميع `flex-row-reverse`.
- إزالة جميع `text-right` / `text-left` غير ضرورية.
- توحيد `rounded-2xl` بديلاً عن `rounded-[30px]`.

### المرحلة 5: مراجعة نهائية + build

- تشغيل `turbo build --filter=web`.
- فحص أن `PortalProfilePage` لا يزال يعرض وضع التعديل (`ProfileEditV2`) بشكل صحيح.
- فحص أن الصفحة لا تُرسّل طلبات إضافية للخلفية.

---

## 5. Architecture Decisions (ADRs)

### ADR-1: ViewModel Hook للصفحة

- **القرار:** `useClientBrief({ client, profile, viewAs })` يُنتج `ClientBriefViewModel`.
- **البديل:** تمرير `client`/`profile` مباشرة.
- **السبب:** يمنع تكرار `formatCurrency`/`STATUS_LABELS` ويجعل JSX مجرد تقديم.

### ADR-2: مكون واحد للبطاقة (`BriefCard`)

- **القرار:** كل بطاقة في الملف التعريفي تستخدم `BriefCard`.
- **البديل:** كل قسم يبني بطاقته الخاصة.
- **السبب:** DRY، ويسمح بتغيير نظام البطاقة من ملف واحد.

### ADR-3: الشريط الجانبي منفصل

- **القرار:** `IdentitySidebar` مكون مستقل يُعرض فقط الهوية الأساسية والتواصل.
- **البديل:** إبقاؤها ضمن تدفق عمودي.
- **السبب:** يُحاكي المرجع ويُبقي المعلومات الأساسية ظاهرة دائماً.

### ADR-4: لا تغيير في `ProfileEditV2`

- **القرار:** تبقى تجربة التعديل كما هي؛ نغيّر فقط وضع العرض.
- **السبب:** يقلل النطاق ولا يُعقّد وضع التعديل.

---

## 6. Files to Touch / Not Touch

### سيتم التعديل عليها (frontend فقط)

1. `apps/web/app/(portal)/portal/profile/page.tsx`
2. `apps/web/components/client-brief/ClientBriefV2.tsx`
3. `apps/web/components/client-brief/ClientBriefField.tsx` — تعديلات طفيفة للـ RTL
4. `apps/web/components/client-brief/BriefCard.tsx` — تعديلات طفيفة للـ padding
5. `apps/web/components/client-brief/ClientBriefStatCard.tsx` — توحيد الألوان
6. `apps/web/components/client-brief/ClientBriefSidebar.tsx` — دمج مع الهوية الجديدة
7. `apps/web/components/shared/ProfileSections/SectionLayout.tsx`
8. `apps/web/components/shared/ProfileSections/sections/*.tsx`

### ملفات جديدة (frontend فقط)

1. `apps/web/components/client-brief/useClientBrief.ts`
2. `apps/web/components/client-brief/IdentitySidebar.tsx`
3. `apps/web/components/client-brief/KpiGrid.tsx`

### لا تُلمس نهائياً

- أي ملف في `apps/api/`
- أي ملف Prisma / migration
- أي route API في `apps/web/app/api/`
- أي Zod schema في `packages/shared` (ما لم يكن ضرورياً لتنسيق العرض، وهو غير مطلوب)

---

## 7. Deliverables per Phase

| Phase | Deliverable                                                                    | Definition of Done                                        |
| ----- | ------------------------------------------------------------------------------ | --------------------------------------------------------- |
| 0     | `useClientBrief` + مراجعة `BriefCard`/`ClientBriefField`/`ClientBriefStatCard` | Hook يُنتج viewModel؛ المكونات الموحدة جاهزة              |
| 1     | تخطيط grid في `ClientBriefV2` + `IdentitySidebar` + `KpiGrid`                  | الصفحة تبدو كلوحة تحكم بدون تغيير الأقسام الداخلية        |
| 2     | إعادة كتابة `ProfileSections` باستخدام `BriefCard` + `ClientBriefField`        | جميع الأقسام متسقة ولا تحتوي على `dir` زائد               |
| 3     | responsive + sticky sidebar + empty states                                     | يعمل على mobile/tablet/desktop                            |
| 4     | cleanup + build + visual QA                                                    | `turbo build --filter=web` ناجح؛ لا errors/warnings جديدة |

---

## 8. Acceptance Criteria

1. فتح `/portal/profile` يُظهر صفحة RTL متسقة: الشريط الجانبي على اليمين، المحتوى الرئيسي على اليسار.
2. كل الحقول العربية تبدأ من اليمين؛ `email` و `phone` و hex colors يظلون LTR داخلياً.
3. لا يوجد `dir="rtl"` إضافي داخل `ClientBriefV2` أو `ProfileSections` أو `PortalProfilePage`.
4. جميع البطاقات بنفس الـ border radius والـ shadow والـ padding.
5. الـ KPIs تظهر في شبكة أولاً، ثم الأقسام المجمعة في شبكة ثانية.
6. لا يوجد تكرار منطقي ظاهر (HTML مُكرّر لكل حقل).
7. وضع التعديل يعمل كما كان (`ProfileEditV2`).
8. `turbo build --filter=web` ينجح.

---

## 9. Risks & Mitigations

| Risk                                              | Mitigation                                                                                         |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| تغيير `ProfileSections` يكسر وضع التعديل / wizard | نُعدّل فقط `mode="view"`؛ `SectionLayout` يحتفظ بـ wizard/edit paths                               |
| بيانات فارغة تُظهر بطاقات فارغة                   | empty states موحدة + conditional rendering                                                         |
| RTL يتعارض مع أيقونات أو charts                   | كل `dir="ltr"` يُطبّق فقط على عنصر النص وليس الحاوية                                               |
| تكرار موجود في `ClientBriefCompact`               | نستخدم `ClientBriefCompact` كمرجع للبيانات ولكن لا ندمجه؛ نبني `IdentitySidebar` ليكون أقل مسؤولية |

---

## 10. Notes for the Engineer

- لا تُجرب حلولاً عشوائية في CSS. كل تغيير يجب أن ينتمي إما إلى `BriefCard`، `ClientBriefField`، `ClientBriefStatCard`، `SectionLayout`، أو التخطيط الرئيسي.
- إذا وجدت نفسك تكتب `dir="rtl"` أو `flex-row-reverse`، توقف — السبب غالباً أنك لا تثق بالـ RTL العام. عدّل الحاوية الأم بدلاً من ذلك.
- لا تُغيّر شيئاً في `ProfileEditV2` إلا إذا كان التغيير يؤثر على وضع العرض.
- ابدأ دائماً بالـ ViewModel؛ هذا يُبقي JSX نظيفاً ويُسهّل المراجعة.
