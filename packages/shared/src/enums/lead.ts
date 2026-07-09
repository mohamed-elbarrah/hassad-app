export const LEAD_STAGE_ORDER = [
  "NEW",
  "QUALIFIED",
  "PROPOSAL",
  "NEGOTIATION",
  "WON",
  "LOST",
] as const;

export const LEAD_STAGE_AR: Record<string, string> = {
  NEW: "جديد",
  QUALIFIED: "مؤهل",
  PROPOSAL: "عرض",
  NEGOTIATION: "تفاوض",
  WON: "مغلق (فوز)",
  LOST: "مغلق (خسارة)",
};
