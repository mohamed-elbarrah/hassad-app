export const STEPS = [
  { label: "البيانات الشخصية",    sectionKeys: [] as const },
  { label: "بيانات النشاط",       sectionKeys: ["communicationInfo"] as const },
  { label: "المنتج / الخدمة",     sectionKeys: ["productInfo"] as const },
  { label: "الجمهور والرسائل",    sectionKeys: ["audienceInfo", "brandVoice"] as const },
  { label: "رحلة العميل",         sectionKeys: ["customerJourney"] as const },
  { label: "الحملة الإعلانية",    sectionKeys: ["campaignInfo"] as const },
  { label: "الأداء والميزانية",   sectionKeys: ["pastPerformance", "budgetInfo"] as const },
  { label: "الهوية البصرية",      sectionKeys: ["visualIdentityInfo"] as const },
  { label: "المراجعة",            sectionKeys: [] as const },
] as const;

export type StepConfig = (typeof STEPS)[number];

export const TOTAL_STEPS = STEPS.length;

export const STEP_SECTION_MAP: readonly (readonly string[])[] = STEPS
  .filter((s) => s.sectionKeys.length > 0)
  .map((s) => s.sectionKeys);
