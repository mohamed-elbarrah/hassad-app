// apps/web/lib/i18n.ts
//
import {
  BUSINESS_TYPE_AR,
  CLIENT_KIND_AR,
  CLIENT_SOURCE_AR,
  CLIENT_STATUS_AR,
  CONTRACT_STATUS_AR,
  ContactLogResult,
  ContactLogType,
  PROJECT_STATUS_AR,
  PROPOSAL_STATUS_AR,
  REQUEST_STATUS_AR,
} from "@hassad/shared";
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

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  APPLE_PAY: "أبل باي",
  MADA: "مدى",
  VISA_MC: "فيزا/ماستركارد",
  TABBY: "تابي",
  TAMARA: "تمارا",
  BANK_TRANSFER: "تحويل بنكي",
  CARD: "بطاقة",
  CASH: "نقدي",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "معلقة",
  COMPLETED: "مكتملة",
  PAID: "مدفوعة",
  FAILED: "فشلت",
  REFUNDED: "مستردة",
  CANCELLED: "ملغاة",
};

const CLIENT_ACTIVITY_LABELS: Record<string, string> = {
  CLIENT_CREATED: "إنشاء العميل",
  CLIENT_UPDATED: "تحديث بيانات العميل",
  PROFILE_UPDATED: "تحديث الملف التعريفي",
  CONTRACT_CREATED: "إنشاء عقد",
  PROJECT_CREATED: "إنشاء مشروع",
  INVOICE_CREATED: "إصدار فاتورة",
  PAYMENT_RECEIVED: "استلام دفعة",
};

const INVOICE_STATUS_LABELS: Record<string, string> = {
  DUE: "مستحقة",
  SENT: "مرسلة",
  PAID: "مدفوعة",
  PARTIAL: "مدفوعة جزئياً",
  PENDING: "معلقة",
  LATE: "متأخرة",
  CANCELLED: "ملغاة",
};

const PAYMENT_PLAN_TRIGGER_LABELS: Record<string, string> = {
  ON_SIGN: "عند التوقيع",
  PERIOD_END: "نهاية الفترة",
  MILESTONE: "عند الإنجاز",
  MANUAL: "يدوية",
};

export function contractStatusLabel(status: string | null | undefined): string {
  if (!status) return "غير محدد";
  return (
    CONTRACT_STATUS_AR[status as keyof typeof CONTRACT_STATUS_AR] ?? status
  );
}

export function invoiceStatusLabel(status: string | null | undefined): string {
  if (!status) return "غير محددة";
  return INVOICE_STATUS_LABELS[status] ?? status;
}

export function paymentMethodLabel(method: string | null | undefined): string {
  if (!method) return "غير محددة";
  return PAYMENT_METHOD_LABELS[method] ?? "طريقة دفع أخرى";
}

export function paymentStatusLabel(status: string | null | undefined): string {
  if (!status) return "غير محددة";
  return PAYMENT_STATUS_LABELS[status] ?? "حالة دفع أخرى";
}

export function clientActivityLabel(
  eventType: string | null | undefined,
): string {
  if (!eventType) return "تحديث على العميل";
  return CLIENT_ACTIVITY_LABELS[eventType] ?? "تحديث على العميل";
}

export function paymentPlanTriggerLabel(
  trigger: string | null | undefined,
): string {
  if (!trigger) return "عند الحدث";
  return PAYMENT_PLAN_TRIGGER_LABELS[trigger] ?? trigger;
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

const PROJECT_ERROR_MESSAGES: Record<string, string> = {
  PROJECT_NOT_FOUND: "المشروع غير موجود.",
  PROJECT_STATUS_UPDATE_FAILED: "تعذر تحديث حالة المشروع.",
  PERMISSION_DENIED: "ليس لديك صلاحية لتنفيذ هذا الإجراء.",
  VALIDATION_ERROR: "تحقق من البيانات المدخلة وحاول مرة أخرى.",
  REQUEST_FAILED: "تعذر تنفيذ العملية. حاول مرة أخرى.",
  UNKNOWN_ERROR: "حدث خطأ. يرجى المحاولة مرة أخرى.",
};

export function projectErrorMessage(error: unknown): string {
  const code = (error as { data?: { error?: { code?: string } } })?.data?.error
    ?.code;
  return (
    (code && PROJECT_ERROR_MESSAGES[code]) || PROJECT_ERROR_MESSAGES.UNKNOWN_ERROR
  );
}

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

export function portalServiceName(names: {
  default: string;
  ar?: string | null;
}): string {
  return names.ar ?? names.default;
}

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
  return (
    PROJECT_STATUS_AR[status as keyof typeof PROJECT_STATUS_AR] ??
    "حالة غير معروفة"
  );
}

export function businessTypeLabel(type: string | null | undefined): string {
  if (!type) return "نوع نشاط غير معروف";
  return (
    BUSINESS_TYPE_AR[type as keyof typeof BUSINESS_TYPE_AR] ??
    "نوع نشاط غير معروف"
  );
}

export function clientSourceLabel(source: string | null | undefined): string {
  if (!source) return "مصدر غير معروف";
  return (
    CLIENT_SOURCE_AR[source as keyof typeof CLIENT_SOURCE_AR] ??
    "مصدر غير معروف"
  );
}

export function clientKindLabel(kind: string | null | undefined): string {
  if (!kind) return "نوع عميل غير معروف";
  return (
    CLIENT_KIND_AR[kind as keyof typeof CLIENT_KIND_AR] ?? "نوع عميل غير معروف"
  );
}

export function clientStatusLabel(status: string | null | undefined): string {
  if (!status) return "حالة عميل غير معروفة";
  return (
    CLIENT_STATUS_AR[status as keyof typeof CLIENT_STATUS_AR] ??
    "حالة عميل غير معروفة"
  );
}

export function requestStatusLabel(status: string | null | undefined): string {
  if (!status) return "حالة غير معروفة";
  return (
    REQUEST_STATUS_AR[status as keyof typeof REQUEST_STATUS_AR] ??
    "حالة غير معروفة"
  );
}

const REQUEST_CONTACT_TYPE_LABELS: Record<ContactLogType, string> = {
  [ContactLogType.CALL]: "مكالمة",
  [ContactLogType.WHATSAPP]: "واتساب",
  [ContactLogType.MEETING]: "اجتماع",
  [ContactLogType.EMAIL]: "بريد إلكتروني",
};

const REQUEST_CONTACT_RESULT_LABELS: Record<ContactLogResult, string> = {
  [ContactLogResult.RESPONDED]: "تم الرد",
  [ContactLogResult.NO_RESPONSE]: "لا يوجد رد",
  [ContactLogResult.BUSY]: "مشغول",
  [ContactLogResult.WRONG_NUMBER]: "رقم خاطئ",
  [ContactLogResult.NOT_INTERESTED]: "غير مهتم",
};

export function requestContactTypeLabel(
  type: string | null | undefined,
): string {
  return type && type in REQUEST_CONTACT_TYPE_LABELS
    ? REQUEST_CONTACT_TYPE_LABELS[type as ContactLogType]
    : "نوع تواصل غير معروف";
}

export function requestContactResultLabel(
  result: string | null | undefined,
): string {
  return result && result in REQUEST_CONTACT_RESULT_LABELS
    ? REQUEST_CONTACT_RESULT_LABELS[result as ContactLogResult]
    : "نتيجة غير معروفة";
}

export function proposalStatusLabel(status: string | null | undefined): string {
  if (!status) return "حالة غير معروفة";
  return (
    PROPOSAL_STATUS_AR[status as keyof typeof PROPOSAL_STATUS_AR] ??
    "حالة غير معروفة"
  );
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
  titleCode?: string;
  titleParams?: Record<string, unknown>;
}): string {
  if (item.titleCode === "INVOICE") {
    return `فاتورة ${String(item.titleParams?.invoiceNumber ?? "")}`;
  }
  if (item.titleCode === "MARKETING_STRATEGY") {
    return `دراسة تسويقية — ${String(item.titleParams?.projectName ?? "")}`;
  }
  return portalActionTypeLabel(item.titleCode ?? "ACTION_REQUIRED");
}

export function portalActionSubtitle(item: {
  subtitleCode?: string;
  subtitleParams?: Record<string, unknown>;
}): string {
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

export function salesPipelineErrorMessage(error: unknown): string {
  const code = (error as { data?: { error?: { code?: string } } })?.data?.error
    ?.code;

  switch (code) {
    case "INVALID_REQUEST_STATUS_TRANSITION":
      return "لا يمكن نقل الفرصة إلى هذه المرحلة.";
    case "PERMISSION_DENIED":
      return "ليس لديك صلاحية لتحديث المرحلة.";
    case "REQUEST_NOT_FOUND":
      return "لم تعد هذه الفرصة متاحة.";
    case "AUTHENTICATION_REQUIRED":
      return "انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.";
    default:
      return "تعذر تحديث مرحلة الفرصة. يرجى المحاولة لاحقاً.";
  }
}

type ApiErrorPayload = {
  status?: number | string;
  data?: {
    error?: {
      code?: string;
      details?: {
        fields?: Record<string, { code?: string }>;
      };
    };
  };
};

function getApiErrorPayload(error: unknown): ApiErrorPayload {
  return (error ?? {}) as ApiErrorPayload;
}

const SALES_WORKFLOW_ERROR_MESSAGES: Record<string, string> = {
  PROPOSAL_NOT_FOUND: "لم يتم العثور على العرض الفني.",
  PROPOSAL_REQUEST_MISMATCH: "العرض الفني لا ينتمي إلى الطلب المحدد.",
  CONTRACT_NOT_FOUND: "لم يتم العثور على العقد.",
  CONTRACT_SHARE_LINK_NOT_FOUND: "لا يوجد رابط توقيع متاح لهذا العقد.",
  CONTRACT_NOT_SIGNABLE: "لا يمكن توقيع العقد في حالته الحالية.",
  INITIAL_PAYMENT_REQUIRED: "يجب سداد الدفعة الأولى قبل تفعيل العقد.",
  PAYMENT_PLAN_REQUIRED: "لا يمكن توقيع العقد قبل إعداد خطة الدفعة الأولى.",
  PROJECT_MANAGER_ASSIGNMENT_REQUIRED: "تعذر تعيين مدير المشروع.",
  REQUEST_NOT_FOUND: "لم يتم العثور على الطلب.",
  PERMISSION_DENIED: "ليس لديك صلاحية لتنفيذ هذه العملية.",
  AUTHENTICATION_REQUIRED: "انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.",
  INVALID_FILE_TYPE: "نوع الملف غير مدعوم. اختر ملف PDF.",
  PDF_FILE_REQUIRED: "اختر ملف PDF قبل الحفظ.",
  VERSION_PDF_FILE_REQUIRED: "اختر ملف PDF للإصدار الجديد.",
  FILE_TOO_LARGE: "حجم الملف أكبر من الحد المسموح.",
  INVALID_PROPOSAL_STATUS: "لا يمكن تنفيذ العملية على حالة العرض الحالية.",
  INVALID_CONTRACT_STATUS: "لا يمكن تنفيذ العملية على حالة العقد الحالية.",
  INVALID_REQUEST_STATUS_TRANSITION: "لا يمكن نقل الطلب إلى هذه المرحلة.",
  REQUEST_STATUS_CHANGED:
    "تم تحديث الطلب من مستخدم آخر. حدّث الصفحة وحاول مرة أخرى.",
  EMAIL_ALREADY_IN_USE: "البريد الإلكتروني مستخدم بالفعل.",
  CLIENT_ROLE_NOT_FOUND: "تعذر إنشاء حساب العميل. تواصل مع مسؤول النظام.",
};

const SALES_WORKFLOW_FIELD_MESSAGES: Record<string, string> = {
  REQUIRED: "هذا الحقل مطلوب.",
  INVALID_EMAIL: "أدخل بريداً إلكترونياً صحيحاً.",
  INVALID_FILE_TYPE: "اختر ملف PDF صحيحاً.",
  FILE_TOO_LARGE: "حجم الملف أكبر من الحد المسموح.",
  INVALID_REQUEST_ID: "الطلب المرتبط غير صحيح.",
  INVALID_PROPOSAL_ID: "العرض المرتبط غير صحيح.",
};

export function clientWorkflowErrorMessage(error: unknown): string {
  const payload = getApiErrorPayload(error);
  const code = payload.data?.error?.code;
  if (code === "CLIENT_NOT_FOUND" || code === "CLIENT_PROFILE_NOT_FOUND") {
    return "لم يتم العثور على بيانات العميل.";
  }
  if (code === "CLIENT_PROFILE_ACCESS_DENIED") {
    return "ليس لديك صلاحية لعرض ملف العميل.";
  }
  if (payload.status === 401)
    return "انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.";
  if (payload.status === 403) return "ليس لديك صلاحية لعرض هذه البيانات.";
  if (payload.status === "FETCH_ERROR") {
    return "تعذر الاتصال بالخادم. تحقق من اتصال الشبكة وحاول مرة أخرى.";
  }
  return "تعذر تحميل العملاء. يرجى المحاولة مرة أخرى.";
}

export function clientRelatedErrorMessage(error: unknown): string {
  const payload = getApiErrorPayload(error);
  const code = payload.data?.error?.code;
  if (code === "CLIENT_NOT_FOUND" || code === "CLIENT_PROFILE_NOT_FOUND") {
    return "لم يتم العثور على البيانات المرتبطة بالعميل.";
  }
  if (code === "CLIENT_PROFILE_ACCESS_DENIED") {
    return "ليس لديك صلاحية لعرض بيانات العميل المرتبطة.";
  }
  if (payload.status === 401)
    return "انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.";
  if (payload.status === 403) return "ليس لديك صلاحية لعرض هذه البيانات.";
  if (payload.status === "FETCH_ERROR") {
    return "تعذر الاتصال بالخادم. تحقق من اتصال الشبكة وحاول مرة أخرى.";
  }
  return "تعذر تحميل هذه البيانات. يرجى المحاولة مرة أخرى.";
}

export function salesWorkflowErrorMessage(error: unknown): string {
  const payload = getApiErrorPayload(error);
  const code = payload.data?.error?.code;

  if (code && SALES_WORKFLOW_ERROR_MESSAGES[code]) {
    return SALES_WORKFLOW_ERROR_MESSAGES[code];
  }
  if (payload.status === 401)
    return SALES_WORKFLOW_ERROR_MESSAGES.AUTHENTICATION_REQUIRED;
  if (payload.status === 403)
    return SALES_WORKFLOW_ERROR_MESSAGES.PERMISSION_DENIED;
  if (payload.status === "FETCH_ERROR") {
    return "تعذر الاتصال بالخادم. تحقق من اتصال الشبكة وحاول مرة أخرى.";
  }
  return "تعذر تنفيذ العملية. يرجى المحاولة مرة أخرى.";
}

export function salesRequestCreationLoadErrorMessage(error: unknown): string {
  const payload = getApiErrorPayload(error);
  const code = payload.data?.error?.code;

  if (code === "PERMISSION_DENIED" || payload.status === 403) {
    return "ليس لديك صلاحية لتحميل بيانات الطلب الجديد.";
  }
  if (code === "AUTHENTICATION_REQUIRED" || payload.status === 401) {
    return SALES_WORKFLOW_ERROR_MESSAGES.AUTHENTICATION_REQUIRED;
  }
  if (payload.status === "FETCH_ERROR") {
    return "تعذر الاتصال بالخادم. تحقق من اتصال الشبكة وحاول مرة أخرى.";
  }
  return "تعذر تحميل بيانات الطلب الجديد. يرجى المحاولة مرة أخرى.";
}

export function salesRequestLoadErrorMessage(error: unknown): string {
  const payload = getApiErrorPayload(error);
  const code = payload.data?.error?.code;

  if (code === "PERMISSION_DENIED" || payload.status === 403) {
    return "يمكنك العودة إلى خط المبيعات أو طلب الصلاحية من مسؤول النظام.";
  }
  if (code === "AUTHENTICATION_REQUIRED" || payload.status === 401) {
    return "انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.";
  }
  if (payload.status === "FETCH_ERROR") {
    return "تعذر الاتصال بالخادم. تحقق من اتصال الشبكة وحاول مرة أخرى.";
  }
  return "تعذر تحميل تفاصيل الطلب. يرجى المحاولة مرة أخرى.";
}

export function salesWorkflowValidationMessages(
  error: unknown,
): Record<string, string> {
  const fields = getApiErrorPayload(error).data?.error?.details?.fields ?? {};
  return Object.fromEntries(
    Object.entries(fields).map(([field, detail]) => [
      field,
      SALES_WORKFLOW_FIELD_MESSAGES[detail.code ?? ""] ??
        "تحقق من قيمة هذا الحقل.",
    ]),
  );
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
