// apps/web/lib/i18n.ts
//
import { formatNumber } from "@/lib/format";

// Domain display labels and lookup helpers.
//
// Why this module exists:
//   `lib/format.ts` should only contain pure formatting helpers
//   (date / number / currency formatting). Domain labels (contract
//   types, campaign platforms, etc.) belong alongside other
//   presentation-layer constants so callers can import labels
//   without pulling in `Intl` plumbing.
//
// Naming convention: every export is the *display* form of a
// backend enum value. Lookups fall back to the raw enum string
// if the value is unknown — never throw, never return an empty
// string (which would render as a blank badge).

export const CONTRACT_TYPE_LABELS: Record<string, string> = {
  MONTHLY_RETAINER: "شهري ثابت",
  FIXED_PROJECT: "مشروع محدد",
  ONE_TIME_SERVICE: "خدمة مرة واحدة",
};

export function contractTypeLabel(type: string | null | undefined): string {
  if (!type) return "عقد";
  return CONTRACT_TYPE_LABELS[type] ?? type;
}

const AUTH_SUCCESS_MESSAGES: Record<string, string> = {
  UNKNOWN_SUCCESS: "تمت العملية بنجاح.",
  USER_REGISTERED: "تم إنشاء حسابك بنجاح!",
  PASSWORD_RESET_REQUEST_ACCEPTED: "تم إرسال رابط إعادة التعيين!",
  PASSWORD_RESET: "تم إعادة تعيين كلمة المرور بنجاح!",
  SIGNED_OUT: "تم تسجيل الخروج بنجاح.",
};

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  UNKNOWN_ERROR: "حدث خطأ. يرجى المحاولة مرة أخرى.",
  INVALID_CREDENTIALS: "فشل تسجيل الدخول. يرجى التحقق من بياناتك.",
  ACCOUNT_LOCKED: "تم قفل الحساب مؤقتاً. يرجى المحاولة لاحقاً.",
  ACCOUNT_SUSPENDED: "هذا الحساب موقوف.",
  ACCOUNT_INACTIVE: "هذا الحساب غير نشط.",
  SOCIAL_LOGIN_REQUIRED: "يرجى تسجيل الدخول باستخدام مزود الخدمة الاجتماعي.",
  EMAIL_ALREADY_IN_USE: "البريد الإلكتروني مستخدم بالفعل.",
  INVALID_RESET_TOKEN: "رابط إعادة التعيين غير صالح أو منتهي الصلاحية.",
  AUTHENTICATION_REQUIRED: "انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.",
  INVALID_TOKEN: "انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.",
};

export function authSuccessMessage(code: string | undefined): string {
  return (
    (code && AUTH_SUCCESS_MESSAGES[code]) ||
    AUTH_SUCCESS_MESSAGES.UNKNOWN_SUCCESS
  );
}

export function authErrorMessage(error: unknown): string {
  const code = (error as { data?: { error?: { code?: string } } })?.data?.error
    ?.code;
  return (
    (code && AUTH_ERROR_MESSAGES[code]) || AUTH_ERROR_MESSAGES.UNKNOWN_ERROR
  );
}

const PORTAL_PROJECT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "نشط",
  PLANNING: "تخطيط",
  ON_HOLD: "معلق",
  AWAITING_REVIEW: "بانتظار المراجعة",
  NEEDS_REVISION: "مطلوب تعديلات",
  COMPLETED: "مكتمل",
  CANCELLED: "ملغى",
};

const PORTAL_REQUEST_STATUS_LABELS: Record<string, string> = {
  SUBMITTED: "مستلم",
  QUALIFYING: "قيد التأهيل",
  PROPOSAL_IN_PROGRESS: "إعداد العرض",
  PROPOSAL_SENT: "العرض جاهز",
  NEGOTIATION: "قيد التفاوض",
  CONTRACT_PREPARATION: "تجهيز العقد",
  CONTRACT_SENT: "بانتظار توقيعك",
  SIGNED: "موقّع",
  PROJECT_CREATED: "تحوّل إلى مشروع",
  CANCELLED: "ملغي",
};

const PORTAL_REQUEST_STAGE_LABELS: Record<string, string> = {
  PROPOSAL_IN_PROGRESS: "يتم إعداد العرض الفني لطلبك.",
  PROPOSAL_SENT: "العرض الفني متاح الآن للمراجعة والمتابعة.",
  NEGOTIATION: "العرض الفني متاح الآن للمراجعة والمتابعة.",
  CONTRACT_PREPARATION: "يتم تجهيز العقد والملف المالي.",
  CONTRACT_SENT: "العقد جاهز للتوقيع من خلال البوابة.",
  SIGNED: "تم توقيع العقد وجارٍ تحويل الطلب إلى مشروع.",
  QUALIFYING: "طلبك قيد المراجعة من فريق المبيعات.",
  SUBMITTED: "طلبك قيد المراجعة من فريق المبيعات.",
};

const PORTAL_ACTION_LABELS: Record<string, string> = {
  DELIVERABLE_APPROVAL: "مراجعة التسليم",
  INVOICE_PAYMENT: "دفع الفاتورة",
  PROPOSAL_REVIEW: "مراجعة العرض",
  CONTRACT_SIGN: "توقيع العقد",
  STRATEGY_REVIEW: "مراجعة الدراسة التسويقية",
};

export function portalTeamRoleLabel(roleCode: string): string {
  return (
    {
      SALES: "المشرف",
      ACCOUNT_MANAGER: "مدير الحساب",
      PM: "مدير المشروع",
    }[roleCode] ?? "عضو الفريق"
  );
}

export function portalProjectStatusLabel(status: string): string {
  return PORTAL_PROJECT_STATUS_LABELS[status] ?? "حالة غير معروفة";
}

export function portalRequestStatusLabel(status: string): string {
  return PORTAL_REQUEST_STATUS_LABELS[status] ?? "حالة غير معروفة";
}

export function portalRequestStageLabel(stage: string): string {
  return (
    PORTAL_REQUEST_STAGE_LABELS[stage] ?? PORTAL_REQUEST_STAGE_LABELS.SUBMITTED
  );
}

export function portalActionTypeLabel(type: string): string {
  return PORTAL_ACTION_LABELS[type] ?? "إجراء مطلوب";
}

export function portalActionTitle(item: {
  title?: string;
  titleCode?: string;
  titleParams?: Record<string, unknown>;
}): string {
  if (item.title) return item.title;
  if (item.titleCode === "INVOICE") {
    return `فاتورة ${String(item.titleParams?.invoiceNumber ?? "")}`;
  }
  if (item.titleCode === "MARKETING_STRATEGY") {
    return `دراسة تسويقية — ${String(item.titleParams?.projectName ?? "")}`;
  }
  return portalActionTypeLabel(item.titleCode ?? "ACTION_REQUIRED");
}

export function portalActionSubtitle(item: {
  subtitle?: string;
  subtitleCode?: string;
  subtitleParams?: Record<string, unknown>;
}): string {
  if (item.subtitle) return item.subtitle;
  switch (item.subtitleCode) {
    case "PROJECT":
      return `مشروع: ${String(item.subtitleParams?.projectName ?? "")}`;
    case "INVOICE_AMOUNT": {
      const amount = Number(item.subtitleParams?.amount ?? 0);
      const dueSoon = Boolean(item.subtitleParams?.dueSoon);
      return `المبلغ: ${formatNumber(amount)} ر.س${dueSoon ? " — مستحقة قريباً" : ""}`;
    }
    case "CONTRACT_SIGN":
      return "عقد بانتظار توقيعك";
    case "PROPOSAL_REVIEW":
      return "عرض فني بانتظار مراجعتك";
    case "MARKETING_STRATEGY_TASK":
      return `دراسة تسويقية للمهمة "${String(item.subtitleParams?.taskTitle ?? "")}" بانتظار مراجعتك`;
    default:
      return "يتطلب هذا الإجراء مراجعتك";
  }
}

export function portalActivityText(item: {
  type: string;
  data?: Record<string, unknown>;
}): string {
  const title = String(item.data?.title ?? "");
  const name = String(item.data?.name ?? "");
  const amount = Number(item.data?.amount ?? 0);
  switch (item.type) {
    case "DELIVERABLE_APPROVED":
      return `تم اعتماد "${title}"`;
    case "DELIVERABLE_REVISION_REQUESTED":
      return `طلب تعديل على "${title}"`;
    case "DELIVERABLE_UPLOADED":
      return `تم رفع "${title}"`;
    case "CAMPAIGN_LAUNCHED":
      return `تم إطلاق حملة "${name}"`;
    case "PAYMENT_COMPLETED":
      return `تم دفع ${formatNumber(amount)} ر.س`;
    case "ACTION_ITEM_SNOOZED":
      return "تم تأجيل إجراء";
    default:
      return "تم تسجيل تحديث جديد";
  }
}

export function portalErrorMessage(error: unknown): string {
  const code = (error as { data?: { error?: { code?: string } } })?.data?.error
    ?.code;
  return code === "PERMISSION_DENIED"
    ? "ليس لديك صلاحية لعرض هذه البيانات."
    : code === "AUTHENTICATION_REQUIRED"
      ? "انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى."
      : "تعذر تحميل البيانات. يرجى المحاولة لاحقاً.";
}

export function portalSnoozeSuccessMessage(): string {
  return "تم تأجيل التذكير";
}

export function portalSnoozeErrorMessage(): string {
  return "حدث خطأ أثناء تأجيل التذكير";
}

export function portalUnsnoozeSuccessMessage(): string {
  return "تم إلغاء التأجيل";
}

export function portalUnsnoozeErrorMessage(): string {
  return "حدث خطأ أثناء إلغاء التأجيل";
}
