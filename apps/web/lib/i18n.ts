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
  TASK_NOT_FOUND: "المهمة غير موجودة.",
  PERIOD_NOT_FOUND: "الفترة غير موجودة.",
  PERIOD_REQUIRED_FOR_RETAINER: "يجب تحديد فترة لهذا النوع من المشاريع.",
  MEETING_NOT_FOUND: "الاجتماع غير موجود.",
  FILE_NOT_FOUND: "الملف غير موجود.",
  PERMISSION_DENIED: "ليس لديك صلاحية لتنفيذ هذا الإجراء.",
  VALIDATION_ERROR: "تحقق من البيانات المدخلة وحاول مرة أخرى.",
  REQUEST_FAILED: "تعذر تنفيذ العملية. حاول مرة أخرى.",
  UNKNOWN_ERROR: "حدث خطأ. يرجى المحاولة مرة أخرى.",
};

export function projectErrorMessage(error: unknown): string {
  const code = (error as { data?: { error?: { code?: string } } })?.data?.error
    ?.code;
  return (
    (code && PROJECT_ERROR_MESSAGES[code]) ||
    PROJECT_ERROR_MESSAGES.UNKNOWN_ERROR
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

const NOTIFICATION_PRESENTATIONS: Record<
  string,
  { title: string; body: string }
> = {
  TASK_ASSIGNED: { title: "تم إسناد مهمة", body: "تم إسناد مهمة جديدة إليك." },
  PROJECT_STATUS_CHANGED: {
    title: "تغيرت حالة مشروع",
    body: "تم تحديث حالة أحد مشاريعك.",
  },
  PROJECT_STALLED: {
    title: "مشروع متعثر",
    body: "يوجد مشروع يحتاج إلى المراجعة.",
  },
  UNASSIGNED_REQUEST: {
    title: "طلبات غير معينة",
    body: "توجد طلبات تحتاج إلى التوزيع.",
  },
  STALE_REQUEST: {
    title: "طلب بحاجة للمتابعة",
    body: "يوجد طلب لم يتم تحديثه مؤخراً.",
  },
  CLIENT_INACTIVE: {
    title: "عميل غير نشط",
    body: "يوجد عميل يحتاج إلى المتابعة.",
  },
  WORKLOAD_WARNING: {
    title: "تنبيه حمل العمل",
    body: "يوجد تنبيه متعلق بحمل العمل.",
  },
  MEETING_SCHEDULED: {
    title: "تمت جدولة اجتماع",
    body: "تمت جدولة اجتماع جديد.",
  },
  MEETING_UPDATED: {
    title: "تم تحديث اجتماع",
    body: "تم تحديث تفاصيل اجتماع.",
  },
  PROJECT_FILE_UPLOADED: {
    title: "تم رفع ملف مشروع",
    body: "تم رفع ملف جديد إلى أحد مشاريعك.",
  },
  DISPUTE_OPENED: {
    title: "نزاع جديد",
    body: "تم فتح نزاع جديد يحتاج إلى المتابعة.",
  },
  DISPUTE_APPROVED: {
    title: "تمت الموافقة على النزاع",
    body: "تمت الموافقة على النزاع.",
  },
  DISPUTE_REJECTED: { title: "تم رفض النزاع", body: "تم رفض النزاع." },
  DISPUTE_NEW_MESSAGE: {
    title: "رسالة جديدة في النزاع",
    body: "لديك رسالة جديدة في أحد النزاعات.",
  },
  DISPUTE_CLIENT_CONFIRM: {
    title: "تأكيد حل النزاع",
    body: "أكد العميل حل النزاع.",
  },
  DISPUTE_CLIENT_ESCALATE: {
    title: "تم تصعيد النزاع",
    body: "طلب العميل تصعيد النزاع.",
  },
  DISPUTE_PM_RESOLVED: { title: "تم حل النزاع", body: "تم تأكيد حل النزاع." },
  DISPUTE_CLOSED: { title: "أُغلق النزاع", body: "تم إغلاق النزاع." },
  DISPUTE_PM_CHANGED: {
    title: "تغير مدير النزاع",
    body: "تم تحديث مدير النزاع.",
  },
  DISPUTE_AUTO_ESCALATED: {
    title: "تصعيد تلقائي للنزاع",
    body: "تم تصعيد النزاع تلقائياً.",
  },
  DISPUTE_REMINDER_DAY1: {
    title: "تذكير بالنزاع",
    body: "يرجى تأكيد حل النزاع.",
  },
  DISPUTE_REMINDER_DAY2: {
    title: "تذكير ثانٍ بالنزاع",
    body: "لم يتم تأكيد حل النزاع بعد.",
  },
  DISPUTE_REMINDER_DAY3: {
    title: "تذكير نهائي بالنزاع",
    body: "سيتم تصعيد النزاع عند عدم الرد.",
  },
  PROPOSAL_SENT: {
    title: "تم إرسال العرض",
    body: "تم إرسال عرض جديد للمراجعة.",
  },
  PROPOSAL_APPROVED: {
    title: "تمت الموافقة على العرض",
    body: "تمت الموافقة على العرض.",
  },
  PROPOSAL_APPROVED_BY_CLIENT: {
    title: "وافق العميل على العرض",
    body: "وافق العميل على العرض.",
  },
  PROPOSAL_REJECTED: { title: "تم رفض العرض", body: "تم رفض العرض." },
  PROPOSAL_REVISION_REQUESTED: {
    title: "مطلوب تعديل العرض",
    body: "طلب العميل تعديلات على العرض.",
  },
  CONTRACT_SENT: {
    title: "تم إرسال العقد",
    body: "تم إرسال عقد جديد للمراجعة.",
  },
  CONTRACT_ACTIVATED: { title: "تم تفعيل العقد", body: "تم تفعيل العقد." },
  CONTRACT_SIGNED: { title: "تم توقيع العقد", body: "تم توقيع العقد." },
  CONTRACT_CANCELLED: { title: "تم إلغاء العقد", body: "تم إلغاء العقد." },
  CONTRACT_EXPIRED: { title: "انتهى العقد", body: "انتهت مدة أحد العقود." },
  CONTRACT_EXPIRING: {
    title: "العقد يقترب من الانتهاء",
    body: "يوجد عقد يقترب من تاريخ الانتهاء.",
  },
  RENEWAL_ESCALATED: {
    title: "تجديد العقد يحتاج متابعة",
    body: "يحتاج عقد إلى متابعة عاجلة للتجديد.",
  },
  PROJECT_CREATED_FROM_CONTRACT: {
    title: "تم إنشاء مشروع",
    body: "تم إنشاء مشروع من عقد.",
  },
  PROJECT_SUSPENDED: {
    title: "تم تعليق المشروع",
    body: "تم تعليق أحد المشاريع.",
  },
  PERIOD_RESUMED: {
    title: "تم استئناف الفترة",
    body: "تم استئناف فترة المشروع.",
  },
  INVOICE_CREATED: { title: "تم إنشاء فاتورة", body: "تم إنشاء فاتورة جديدة." },
  INVOICE_SENT: {
    title: "تم إرسال الفاتورة",
    body: "تم إرسال فاتورة للمراجعة.",
  },
  INVOICE_REMINDER: {
    title: "تذكير بالفاتورة",
    body: "يوجد تذكير متعلق بفاتورة.",
  },
  INVOICE_ESCALATED: {
    title: "فاتورة متأخرة",
    body: "تحتاج فاتورة إلى متابعة.",
  },
  INVOICE_ISSUED: {
    title: "تم إصدار الفاتورة",
    body: "تم إصدار فاتورة لفترة المشروع.",
  },
  INVOICE_PAID: { title: "تم سداد الفاتورة", body: "تم تسجيل سداد فاتورة." },
  PAYMENT_RECEIVED: { title: "تم استلام دفعة", body: "تم استلام دفعة جديدة." },
  TASK_STARTED: { title: "بدأت المهمة", body: "بدأ تنفيذ إحدى المهام." },
  TASK_SUBMITTED: { title: "تم تسليم المهمة", body: "تم تسليم مهمة للمراجعة." },
  TASK_APPROVED: { title: "تم اعتماد المهمة", body: "تم اعتماد المهمة." },
  TASK_REJECTED: { title: "تم رفض المهمة", body: "تحتاج المهمة إلى تعديلات." },
  TASK_COMMENT_ADDED: {
    title: "تعليق جديد على المهمة",
    body: "تمت إضافة تعليق إلى مهمة.",
  },
  TASK_DELAYED: { title: "مهمة متأخرة", body: "توجد مهمة تحتاج إلى المتابعة." },
  PROJECT_AWAITING_REVIEW: {
    title: "المشروع بانتظار المراجعة",
    body: "يوجد مشروع بانتظار المراجعة.",
  },
  NEW_MESSAGE: { title: "رسالة جديدة", body: "لديك رسالة جديدة." },
  PERIODS_GENERATED: {
    title: "تم إنشاء فترات المشروع",
    body: "تم إنشاء فترات جديدة للمشروع.",
  },
  PERIOD_CLOSED: {
    title: "تم إغلاق الفترة",
    body: "تم إغلاق فترة من فترات المشروع.",
  },
  MEETING_CANCELLED: { title: "تم إلغاء الاجتماع", body: "تم إلغاء اجتماع." },
  MEETING_RESCHEDULED: { title: "تم تأجيل الاجتماع", body: "تم تأجيل اجتماع." },
  MEETING_DONE: { title: "اكتمل الاجتماع", body: "اكتمل اجتماع." },
  MARKETING_CAMPAIGN_CREATED: {
    title: "تم إنشاء حملة",
    body: "تم إنشاء حملة تسويقية جديدة.",
  },
  MARKETING_CAMPAIGN_STATUS_CHANGED: {
    title: "تغيرت حالة الحملة",
    body: "تم تحديث حالة حملة تسويقية.",
  },
  MARKETING_METRICS_UPDATED: {
    title: "تحديث مؤشرات الحملة",
    body: "تم تحديث مؤشرات حملة تسويقية.",
  },
  MARKETING_OPTIMIZATION_REQUIRED: {
    title: "مطلوب تحسين الحملة",
    body: "تحتاج حملة تسويقية إلى التحسين.",
  },
  MARKETING_STRATEGY_APPROVED: {
    title: "تم اعتماد الاستراتيجية",
    body: "تم اعتماد الاستراتيجية التسويقية.",
  },
  MARKETING_STRATEGY_REJECTED: {
    title: "تم رفض الاستراتيجية",
    body: "تم رفض الاستراتيجية التسويقية.",
  },
  MARKETING_STRATEGY_REVISION_REQUESTED: {
    title: "مطلوب تعديل الاستراتيجية",
    body: "طُلب تعديل الاستراتيجية التسويقية.",
  },
  MARKETING_STRATEGY_SENT: {
    title: "تم إرسال الاستراتيجية",
    body: "تم إرسال الاستراتيجية التسويقية للمراجعة.",
  },
  ACTION_ITEM_SNOOZED: {
    title: "تم تأجيل بند الإجراء",
    body: "تم تأجيل بند إجراء.",
  },
  ACTION_ITEM_SNOOZE_EXPIRED: {
    title: "انتهى تأجيل بند الإجراء",
    body: "عاد بند الإجراء للمتابعة.",
  },
  SYSTEM_FAILURE: {
    title: "تنبيه من النظام",
    body: "يوجد خلل يحتاج إلى المراجعة.",
  },
  BACKUP_COMPLETED: {
    title: "اكتمل النسخ الاحتياطي",
    body: "اكتملت عملية النسخ الاحتياطي.",
  },
  BACKUP_FAILED: {
    title: "فشل النسخ الاحتياطي",
    body: "فشلت عملية النسخ الاحتياطي.",
  },
  BACKUP_STARTED: {
    title: "بدأ النسخ الاحتياطي",
    body: "بدأت عملية النسخ الاحتياطي.",
  },
  BROADCAST: { title: "إعلان جديد", body: "لديك إعلان جديد." },
  CLIENT_COUNTERS_UPDATED: {
    title: "تحديث بيانات العملاء",
    body: "تم تحديث مؤشرات العملاء.",
  },
  CLIENT_CREATED_FOR_SALES_REQUEST: {
    title: "تم إنشاء عميل",
    body: "تم إنشاء عميل من طلب مبيعات.",
  },
  CLIENT_REQUEST_CREATED: {
    title: "طلب عميل جديد",
    body: "تم إنشاء طلب عميل جديد.",
  },
  CLIENT_UPDATED: { title: "تم تحديث العميل", body: "تم تحديث بيانات العميل." },
  CONTRACT_CONVERTED_TO_PROJECT: {
    title: "تم تحويل العقد إلى مشروع",
    body: "تم إنشاء مشروع من العقد.",
  },
  DELIVERABLE_APPROVED: {
    title: "تم اعتماد التسليمة",
    body: "تم اعتماد إحدى التسليمات.",
  },
  DELIVERABLE_REVISION: {
    title: "مطلوب تعديل التسليمة",
    body: "طُلب تعديل إحدى التسليمات.",
  },
  GATEWAY_FAILURE: {
    title: "خلل في بوابة الدفع",
    body: "يوجد خلل في بوابة الدفع يحتاج إلى المراجعة.",
  },
  PROJECT_APPROVED: {
    title: "تم اعتماد المشروع",
    body: "تم اعتماد أحد المشاريع.",
  },
  PROJECT_REVISION_REQUESTED: {
    title: "مطلوب تعديل المشروع",
    body: "طُلب تعديل أحد المشاريع.",
  },
  REQUEST_SUBMITTED: {
    title: "تم إرسال الطلب",
    body: "تم إرسال طلب جديد للمراجعة.",
  },
  WEBHOOK_FAILURE: {
    title: "خلل في التكامل",
    body: "يوجد خلل في أحد التكاملات.",
  },
};

export function notificationPresentation(
  eventType: string | undefined,
  metadata?: Record<string, unknown> | null,
): { title: string; body: string } {
  const presentation = (eventType && NOTIFICATION_PRESENTATIONS[eventType]) ?? {
    title: "إشعار جديد",
    body: "لديك إشعار جديد.",
  };
  const broadcastTitle =
    typeof metadata?.title === "string" ? metadata.title : null;
  const broadcastBody =
    typeof metadata?.body === "string" ? metadata.body : null;
  if (eventType === "BROADCAST" && broadcastTitle && broadcastBody) {
    return { title: broadcastTitle, body: broadcastBody };
  }
  const ticketNumber =
    typeof metadata?.ticketNumber === "string" ||
    typeof metadata?.ticketNumber === "number"
      ? String(metadata.ticketNumber)
      : null;
  const reason = typeof metadata?.reason === "string" ? metadata.reason : null;
  if (ticketNumber && eventType?.startsWith("DISPUTE_")) {
    const reminderNumber =
      typeof metadata?.reminderNumber === "number"
        ? metadata.reminderNumber
        : null;
    const role = typeof metadata?.role === "string" ? metadata.role : null;
    const roleText =
      role === "new_pm"
        ? " تم تعيينك مديراً للمشروع."
        : role === "old_pm"
          ? " تم تغيير مدير المشروع."
          : "";
    return {
      ...presentation,
      body: `${presentation.body} #${ticketNumber}${reminderNumber ? ` — التذكير رقم ${reminderNumber}` : ""}${reason ? ` — ${reason}` : ""}${roleText}`,
    };
  }
  const delayedTaskTitle =
    typeof metadata?.taskTitle === "string" ? metadata.taskTitle : null;
  const daysOverdue =
    typeof metadata?.daysOverdue === "number" ? metadata.daysOverdue : 0;
  if (delayedTaskTitle && eventType === "TASK_DELAYED") {
    return {
      ...presentation,
      body: `المهمة «${delayedTaskTitle}» متأخرة ${daysOverdue} يوماً.`,
    };
  }
  const senderName =
    typeof metadata?.senderName === "string" ? metadata.senderName : null;
  const attachmentCount =
    typeof metadata?.attachmentCount === "number"
      ? metadata.attachmentCount
      : 0;
  if (senderName && eventType === "NEW_MESSAGE") {
    return {
      ...presentation,
      title: `رسالة جديدة من ${senderName}`,
      body:
        attachmentCount > 0
          ? `لديك رسالة جديدة مع ${attachmentCount} مرفق.`
          : "لديك رسالة جديدة.",
    };
  }
  const taskTitle =
    typeof metadata?.taskTitle === "string" ? metadata.taskTitle : null;
  const meetingTitle =
    typeof metadata?.meetingTitle === "string" ? metadata.meetingTitle : null;
  const assigneeName =
    typeof metadata?.assigneeName === "string" ? metadata.assigneeName : null;
  if (taskTitle && eventType === "TASK_ASSIGNED") {
    return {
      ...presentation,
      body: assigneeName
        ? `تم إسناد المهمة «${taskTitle}» إلى ${assigneeName}.`
        : `تم إسناد المهمة «${taskTitle}» إليك.`,
    };
  }
  const requestCount =
    typeof metadata?.requestCount === "number" ? metadata.requestCount : null;
  if (requestCount !== null && eventType === "UNASSIGNED_REQUEST") {
    return {
      ...presentation,
      body: `توجد ${requestCount} طلبات غير معينة تحتاج إلى التوزيع.`,
    };
  }
  const activeTasks =
    typeof metadata?.activeTasks === "number" ? metadata.activeTasks : null;
  if (activeTasks !== null && eventType === "WORKLOAD_WARNING") {
    return {
      ...presentation,
      body: `لديك ${activeTasks} مهمة نشطة تحتاج إلى مراجعة الأولويات.`,
    };
  }
  const overdueCount =
    typeof metadata?.overdueCount === "number" ? metadata.overdueCount : null;
  if (overdueCount !== null && eventType === "INVOICE_ESCALATED") {
    return {
      ...presentation,
      body: `يوجد ${overdueCount} فاتورة متأخرة تحتاج إلى المتابعة.`,
    };
  }
  const contractTitle =
    typeof metadata?.contractTitle === "string" ? metadata.contractTitle : null;
  const daysRemaining =
    typeof metadata?.daysRemaining === "number" ? metadata.daysRemaining : null;
  if (
    contractTitle &&
    ["CONTRACT_EXPIRING", "CONTRACT_EXPIRED", "RENEWAL_ESCALATED"].includes(
      eventType ?? "",
    )
  ) {
    return {
      ...presentation,
      body: `${presentation.body} «${contractTitle}»${daysRemaining !== null ? ` — متبقٍ ${daysRemaining} أيام` : ""}`,
    };
  }
  const invoiceNumber =
    typeof metadata?.invoiceNumber === "string" ? metadata.invoiceNumber : null;
  const amount = typeof metadata?.amount === "number" ? metadata.amount : null;
  if (
    invoiceNumber &&
    ["INVOICE_CREATED", "INVOICE_SENT", "INVOICE_REMINDER"].includes(
      eventType ?? "",
    )
  ) {
    return {
      ...presentation,
      body: `${presentation.body} «${invoiceNumber}»${amount !== null ? ` — ${amount} ر.س` : ""}`,
    };
  }
  if (invoiceNumber && eventType === "PAYMENT_RECEIVED") {
    return {
      ...presentation,
      body: `تم استلام دفعة للفاتورة «${invoiceNumber}»${amount !== null ? ` بقيمة ${amount} ر.س` : ""}.`,
    };
  }
  const proposalTitle =
    typeof metadata?.proposalTitle === "string" ? metadata.proposalTitle : null;
  const notes = typeof metadata?.notes === "string" ? metadata.notes : null;
  if (proposalTitle && eventType === "PROPOSAL_SENT") {
    return {
      ...presentation,
      body: `تم إرسال العرض «${proposalTitle}» للمراجعة.`,
    };
  }
  if (
    proposalTitle &&
    [
      "PROPOSAL_APPROVED",
      "PROPOSAL_REJECTED",
      "PROPOSAL_APPROVED_BY_CLIENT",
      "PROPOSAL_REVISION_REQUESTED",
    ].includes(eventType ?? "")
  ) {
    return {
      ...presentation,
      body: `${presentation.body} «${proposalTitle}»${notes ? `: ${notes}` : ""}`,
    };
  }
  if (meetingTitle && eventType === "MEETING_SCHEDULED") {
    return { ...presentation, body: `تمت جدولة الاجتماع «${meetingTitle}».` };
  }
  if (meetingTitle && eventType === "MEETING_UPDATED") {
    return { ...presentation, body: `تم تحديث الاجتماع «${meetingTitle}».` };
  }
  if (
    meetingTitle &&
    ["MEETING_CANCELLED", "MEETING_RESCHEDULED", "MEETING_DONE"].includes(
      eventType ?? "",
    )
  ) {
    return {
      ...presentation,
      body: `${presentation.body} الاجتماع «${meetingTitle}».`,
    };
  }
  const projectName =
    typeof metadata?.projectName === "string" ? metadata.projectName : null;
  const status = typeof metadata?.status === "string" ? metadata.status : null;
  if (projectName && status && eventType === "PROJECT_STATUS_CHANGED") {
    return {
      ...presentation,
      body: `تم تحديث حالة المشروع «${projectName}» إلى ${status}.`,
    };
  }
  return presentation;
}

export function notificationErrorMessage(error: unknown): string {
  const payload = getApiErrorPayload(error);
  if (payload.status === 401)
    return "انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.";
  if (payload.status === 403) return "ليس لديك صلاحية لتنفيذ هذا الإجراء.";
  if (payload.status === "FETCH_ERROR") {
    return "تعذر الاتصال بالخادم. تحقق من اتصال الشبكة وحاول مرة أخرى.";
  }
  return "تعذر تحديث الإشعارات. يرجى المحاولة لاحقاً.";
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

const PM_ERROR_MESSAGES: Record<string, string> = {
  PERMISSION_DENIED: "ليس لديك صلاحية لتنفيذ هذا الإجراء.",
  AUTHENTICATION_REQUIRED: "انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.",
  PROJECT_NOT_FOUND: "المشروع غير موجود.",
  TASK_NOT_FOUND: "المهمة غير موجودة.",
  TASK_FILE_REQUIRED: "أرفق ملفاً قبل المتابعة.",
  TASK_STATUS_UPDATE_FAILED: "تعذر تحديث حالة المهمة.",
  TASK_ASSIGNMENT_FAILED: "تعذر إسناد المهمة.",
  TASK_COMMENT_FAILED: "تعذر إضافة التعليق.",
  TASK_COMMENTS_LOAD_FAILED: "تعذر تحميل التعليقات.",
  TASK_FILES_LOAD_FAILED: "تعذر تحميل الملفات.",
  TASK_FILE_DOWNLOAD_FAILED: "تعذر تحميل الملف.",
  TASK_FILE_UPLOAD_FAILED: "تعذر رفع الملف.",
  TASK_FILE_DELETE_FAILED: "تعذر حذف الملف.",
  PERIOD_NOT_FOUND: "الفترة غير موجودة.",
  PERIOD_REQUIRED_FOR_RETAINER: "يجب تحديد فترة لهذا النوع من المشاريع.",
  MEETING_NOT_FOUND: "الاجتماع غير موجود.",
  FILE_NOT_FOUND: "الملف غير موجود.",
  DISPUTE_NOT_FOUND: "النزاع غير موجود.",
  VALIDATION_ERROR: "تحقق من البيانات المدخلة وحاول مرة أخرى.",
};

const DISPUTE_HISTORY_MESSAGES: Record<string, string> = {
  DISPUTE_CREATED: "تم إنشاء التذكرة.",
  DISPUTE_ACKNOWLEDGED: "بدأ مدير المشروع في معالجة التذكرة.",
  DISPUTE_RESOLVED_BY_PM: "أشار مدير المشروع إلى حل المشكلة.",
  DISPUTE_ESCALATED_TIMEOUT: "تم تصعيد النزاع بعد انتهاء المهلة.",
};

export function disputeHistoryMessage(code: string): string {
  return DISPUTE_HISTORY_MESSAGES[code] ?? "تم تحديث حالة النزاع.";
}

export function pmErrorMessage(error: unknown): string {
  const payload = getApiErrorPayload(error);
  const code = payload.data?.error?.code;
  if (payload.status === 401) return PM_ERROR_MESSAGES.AUTHENTICATION_REQUIRED;
  if (payload.status === 403) return PM_ERROR_MESSAGES.PERMISSION_DENIED;
  if (payload.status === "FETCH_ERROR") {
    return "تعذر الاتصال بالخادم. تحقق من اتصال الشبكة وحاول مرة أخرى.";
  }
  return (
    (code && PM_ERROR_MESSAGES[code]) ||
    "تعذر تحميل البيانات. يرجى المحاولة لاحقاً."
  );
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
