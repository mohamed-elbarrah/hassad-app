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
import type {
  NotificationEventCode,
  NotificationMetadata,
  NotificationPresentation,
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
  CLIENT_SUSPENDED: "إيقاف العميل",
  CLIENT_REACTIVATED: "إعادة تفعيل العميل",
  CLIENT_MANAGER_CHANGED: "تغيير مدير الحساب",
  suspended: "إيقاف العميل",
  reactivated: "إعادة تفعيل العميل",
  manager_changed: "تغيير مدير الحساب",
  PROFILE_UPDATED: "تحديث الملف التعريفي",
  CONTRACT_CREATED: "إنشاء عقد",
  PROJECT_CREATED: "إنشاء مشروع",
  INVOICE_CREATED: "إصدار فاتورة",
  PAYMENT_RECEIVED: "استلام دفعة",
};

const CLIENT_ACTIVITY_DETAILS: Record<string, string> = {
  CLIENT_CREATED: "تم إنشاء العميل.",
  CLIENT_UPDATED: "تم تحديث ملف العميل.",
  CLIENT_SUSPENDED: "تم إيقاف العميل.",
  CLIENT_REACTIVATED: "تم إعادة تفعيل العميل.",
  CLIENT_MANAGER_CHANGED: "تم تغيير مدير الحساب.",
  suspended: "تم إيقاف العميل.",
  reactivated: "تم إعادة تفعيل العميل.",
  manager_changed: "تم تغيير مدير الحساب.",
  PROFILE_UPDATED: "تم تحديث الملف التعريفي.",
  CONTRACT_CREATED: "تم إنشاء عقد للعميل.",
  PROJECT_CREATED: "تم إنشاء مشروع للعميل.",
  INVOICE_CREATED: "تم إصدار فاتورة للعميل.",
  PAYMENT_RECEIVED: "تم استلام دفعة من العميل.",
};

export const UNKNOWN_STATUS_LABEL = "حالة غير معروفة";

/** Presentation label for a message whose content was removed by the chat API. */
export const CHAT_DELETED_MESSAGE_LABEL = "هذه الرسالة محذوفة";

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
    CONTRACT_STATUS_AR[status as keyof typeof CONTRACT_STATUS_AR] ??
    UNKNOWN_STATUS_LABEL
  );
}

export function invoiceStatusLabel(status: string | null | undefined): string {
  if (!status) return "غير محددة";
  return INVOICE_STATUS_LABELS[status] ?? UNKNOWN_STATUS_LABEL;
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

export function clientActivityDetails(
  eventType: string | null | undefined,
  metadata?: unknown,
): string {
  const base =
    (eventType && CLIENT_ACTIVITY_DETAILS[eventType]) ??
    "تم تسجيل تحديث على العميل.";
  if (!metadata || typeof metadata !== "object") return base;
  const record = metadata as Record<string, unknown>;
  const managerName =
    typeof record.managerName === "string" ? record.managerName.trim() : "";
  if (managerName) return `${base} المدير: ${managerName}.`;
  // Reasons are free-form backend/user content; do not render them as a
  // substitute for a localized activity description.
  return base;
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

const ADMIN_ERROR_MESSAGES: Record<string, string> = {
  AUTHENTICATION_REQUIRED: "يلزم تسجيل الدخول.",
  PROJECT_NOT_FOUND: "لم يتم العثور على المشروع.",
  PROJECT_NOT_ARCHIVED: "المشروع غير مؤرشف.",
  PROJECT_MANAGER_NOT_ELIGIBLE: "مدير المشروع المحدد غير نشط أو غير مؤهل.",
  PROJECT_ACTION_FAILED: "تعذر تنفيذ إجراء المشروع.",
  PROJECT_ACTION_COMPLETED: "تم تنفيذ إجراء المشروع.",
  PROPOSAL_NOT_FOUND: "لم يتم العثور على العرض.",
  PROPOSAL_MUST_BE_APPROVED: "لا يمكن تحويل إلا العروض المقبولة.",
  PROPOSAL_ALREADY_CONVERTED: "تم تحويل هذا العرض إلى عقد مسبقاً.",
  PROPOSAL_CLIENT_REQUIRED: "يجب ربط العرض بعميل قبل تحويله إلى عقد.",
  PROPOSAL_CONVERTED_TO_CONTRACT: "تم تحويل العرض إلى عقد بنجاح.",
  ACCOUNT_INACTIVE: "هذا الحساب غير نشط.",
  ACCOUNT_SUSPENDED: "هذا الحساب موقوف.",
  USER_ALREADY_SUSPENDED: "الموظف موقوف بالفعل.",
  USER_NOT_SUSPENDED: "الموظف غير موقوف.",
  USER_NOT_FOUND: "لم يتم العثور على الموظف.",
  TASK_NOT_FOUND: "لم يتم العثور على المهمة.",
  CLIENT_NOT_FOUND: "لم يتم العثور على العميل.",
  CONTRACT_NOT_FOUND: "لم يتم العثور على العقد.",
  CONTRACT_MUST_BE_ACTIVE: "لا يمكن تحويل إلا العقود النشطة إلى مشاريع.",
  CONTRACT_ALREADY_CONVERTED: "تم تحويل هذا العقد إلى مشروع مسبقاً.",
  INVALID_CONTRACT_STATUS: "حالة العقد غير صالحة.",
  EMAIL_ALREADY_IN_USE: "البريد الإلكتروني مستخدم بالفعل.",
  PERMISSION_ASSIGNMENT_NOT_ALLOWED: "لا يمكنك منح هذه الصلاحية.",
  SELF_PERMISSION_ESCALATION_NOT_ALLOWED: "لا يمكنك تعديل صلاحيات حسابك.",
  SESSION_NOT_FOUND: "لم يتم العثور على الجلسة.",
  INVALID_PERMISSION_ID: "توجد صلاحية غير صالحة.",
  PERMISSION_DENIED: "ليس لديك صلاحية لتنفيذ هذا الإجراء.",
  VALIDATION_ERROR: "تحقق من البيانات المدخلة وحاول مرة أخرى.",
  REQUEST_FAILED: "تعذر تنفيذ الطلب. حاول مرة أخرى.",
  REQUEST_NOT_FOUND: "لم يتم العثور على الطلب.",
  DISPUTE_NOT_FOUND: "لم يتم العثور على النزاع.",
  DISPUTE_INVALID_STATUS: "لا يمكن تنفيذ العملية في حالة النزاع الحالية.",
  DISPUTE_PM_CHANGE_NOT_ALLOWED: "لا يمكن تغيير المدير في حالة النزاع الحالية.",
  DISPUTE_MESSAGES_NOT_ALLOWED: "لا يمكن إضافة رسائل في حالة النزاع الحالية.",
  DISPUTE_THREAD_ACCESS_DENIED: "ليس لديك صلاحية للوصول إلى هذه المحادثة.",
  FILE_TOO_LARGE: "حجم الملف أكبر من الحد المسموح.",
  FILE_TYPE_NOT_ALLOWED: "نوع الملف غير مسموح.",
  SVG_TYPE_NOT_ALLOWED: "يسمح برفع ملفات SVG فقط.",
  SVG_TOO_LARGE: "حجم ملف SVG أكبر من الحد المسموح.",
  SVG_UPLOAD_REFERENCE_MISSING: "تعذر تحديد الملف المرفوع.",
  SVG_UPLOAD_FAILED: "تعذر رفع ملف SVG.",
  CURRENCY_CREATE_FAILED: "تعذر إضافة العملة.",
  CURRENCY_UPDATE_FAILED: "تعذر تحديث العملة.",
  CURRENCY_DELETE_FAILED: "تعذر حذف العملة.",
  UNKNOWN_ERROR: "حدث خطأ. يرجى المحاولة مرة أخرى.",
};

const ADMIN_SUCCESS_MESSAGES: Record<string, string> = {
  CURRENCY_CREATED: "تمت إضافة العملة بنجاح.",
  CURRENCY_UPDATED: "تم تحديث العملة بنجاح.",
  CURRENCY_DELETED: "تم حذف العملة بنجاح.",
  CURRENCY_DEFAULT_SET: "تم تعيين العملة الافتراضية.",
  CURRENCY_ACTIVATED: "تم تفعيل العملة.",
  CURRENCY_DEACTIVATED: "تم تعطيل العملة.",
  SVG_UPLOADED: "تم رفع ملف SVG بنجاح.",
  PROJECT_ACTION_COMPLETED: "تم تنفيذ إجراء المشروع بنجاح.",
  TASK_REASSIGNED: "تمت إعادة تعيين المهمة.",
  TASK_STATUS_UPDATED: "تم تحديث حالة المهمة.",
  DISPUTE_APPROVED: "تمت الموافقة على النزاع.",
  DISPUTE_REJECTED: "تم رفض النزاع.",
  DISPUTE_PM_CHANGED: "تم تغيير مدير المشروع.",
  DISPUTE_CLOSED: "تم إغلاق النزاع.",
  DISPUTE_MESSAGE_ADDED: "تمت إضافة الملاحظة الداخلية.",
  REQUEST_REASSIGNED: "تمت إعادة تعيين الطلب.",
  REQUEST_STATUS_FORCED: "تم تحديث مرحلة الطلب.",
  REQUEST_CONTACT_LOGGED: "تم تسجيل التواصل.",
  PROPOSAL_CONVERTED_TO_CONTRACT: "تم تحويل العرض إلى عقد.",
  CONTRACT_CANCELLED: "تم إلغاء العقد.",
  CONTRACT_RENEWAL_ALERT_TRIGGERED: "تم جدولة تنبيه التجديد.",
  CONTRACT_RENEWAL_ALERT_ALREADY_PENDING: "يوجد تنبيه تجديد مجدول بالفعل.",
  CONTRACT_STATUS_UPDATED: "تم تحديث حالة العقد.",
  CONTRACT_CONVERTED_TO_PROJECT: "تم تحويل العقد إلى مشروع بنجاح.",
};

export function adminSuccessMessage(code: string | undefined): string {
  return (code && ADMIN_SUCCESS_MESSAGES[code]) || "تمت العملية بنجاح.";
}

export function adminErrorMessage(error: unknown): string {
  const code = (error as { data?: { error?: { code?: string } } })?.data?.error
    ?.code;
  return (
    (code && ADMIN_ERROR_MESSAGES[code]) || ADMIN_ERROR_MESSAGES.UNKNOWN_ERROR
  );
}

const ADMIN_ACTIVITY_ACTION_LABELS: Record<string, string> = {
  "admin.users.create": "إنشاء موظف",
  "admin.users.update": "تحديث بيانات الموظف",
  "admin.users.reset-password": "إعادة تعيين كلمة مرور الموظف",
  "admin.users.bulk": "تنفيذ إجراء جماعي على الموظفين",
  "admin.users.set-permissions": "تعديل صلاحيات الموظف",
  "admin.users.suspend": "إيقاف حساب الموظف",
  "admin.users.reactivate": "إعادة تفعيل حساب الموظف",
  "admin.users.impersonate": "بدء انتحال هوية الموظف",
  "admin.users.revoke-sessions": "إلغاء جلسات الموظف",
  "admin.sessions.revoke": "إلغاء جلسة الموظف",
  "admin.clients.suspend": "إيقاف العميل",
  "admin.clients.reactivate": "إعادة تفعيل العميل",
  "admin.clients.assign-manager": "تعيين مدير الحساب",
  "admin.projects.create": "إنشاء مشروع",
  "admin.projects.reassign-pm": "إعادة تعيين مدير المشروع",
  "admin.projects.archive": "أرشفة المشروع",
  "admin.projects.unarchive": "إلغاء أرشفة المشروع",
  "admin.projects.force-status": "تغيير حالة المشروع",
  "admin.projects.add-member": "إضافة عضو للمشروع",
  "admin.projects.add-task": "إضافة مهمة للمشروع",
  "admin.tasks.reassign": "إعادة تعيين المهمة",
  "admin.tasks.force-transition": "تغيير حالة المهمة",
  "admin.requests.reassign": "إعادة تعيين الطلب",
  "admin.requests.force-status": "تغيير حالة الطلب",
  "admin.requests.update-notes": "تحديث ملاحظات الطلب",
  "admin.proposals.convert_to_contract": "تحويل العرض إلى عقد",
  "admin.contracts.cancel": "إلغاء العقد",
  "admin.contracts.status_change": "تغيير حالة العقد",
  "admin.contracts.convert_to_project": "تحويل العقد إلى مشروع",
  "admin.finance.force-invoice-status": "تغيير حالة الفاتورة",
  "admin.finance.trigger-refund": "بدء استرداد دفعة",
  "admin.finance.retry-webhook": "إعادة محاولة التكامل المالي",
  "admin.campaigns.update": "تحديث الحملة",
  "admin.campaigns.pause": "إيقاف الحملة",
  "admin.campaigns.end": "إنهاء الحملة",
};

const ADMIN_ACTIVITY_ENTITY_LABELS: Record<string, string> = {
  user: "مستخدم",
  client: "عميل",
  project: "مشروع",
  task: "مهمة",
  request: "طلب",
  session: "جلسة",
};

export function adminActivityActionLabel(action: string): string {
  return ADMIN_ACTIVITY_ACTION_LABELS[action] ?? "عملية إدارية";
}

export function adminActivityEntityLabel(entity: string): string {
  return ADMIN_ACTIVITY_ENTITY_LABELS[entity] ?? "عنصر إداري";
}

const ADMIN_EMPLOYEE_METRIC_LABELS: Record<string, string> = {
  ACTIVE_REQUESTS: "الطلبات النشطة",
  PROPOSALS_CREATED: "العروض المنشأة",
  CONTRACTS_CREATED: "العقود المنشأة",
  MANAGED_PROJECTS: "المشاريع المُدارة",
  ACTIVE_PROJECTS: "المشاريع النشطة",
  ACTIVE_TASKS: "المهام النشطة",
  OPEN_DISPUTES: "النزاعات المفتوحة",
  ASSIGNED_TASKS: "المهام المسندة",
  COMPLETED_TASKS: "المهام المكتملة",
  QUALITY_SCORE: "تقييم الجودة",
  CAMPAIGNS_CREATED: "الحملات المنشأة",
  ACTIVE_CAMPAIGNS: "الحملات النشطة",
  MARKETING_TASKS: "مهام التسويق",
  INVOICES_CREATED: "الفواتير المنشأة",
  SECURITY_EVENTS: "أحداث الأمان",
  MANAGED_USERS: "المستخدمون المُدارون",
  ACTIVE_SESSIONS: "الجلسات النشطة",
};

const ADMIN_EMPLOYEE_SECTION_TITLES: Record<string, string> = {
  SALES_PERFORMANCE: "أداء المبيعات",
  PM_PERFORMANCE: "أداء إدارة المشاريع",
  TEAM_PERFORMANCE: "أداء عضو الفريق",
  MARKETING_PERFORMANCE: "أداء التسويق",
  ACCOUNTANT_PERFORMANCE: "الأداء المالي",
  ADMIN_PERFORMANCE: "الأداء الإداري",
};

export function adminEmployeeMetricLabel(key: string): string {
  return ADMIN_EMPLOYEE_METRIC_LABELS[key] ?? key;
}

export function adminEmployeeSectionTitle(code: string): string {
  return ADMIN_EMPLOYEE_SECTION_TITLES[code] ?? "الأداء ومؤشرات العمل";
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
  PROPOSAL_NOT_EDITABLE: "لا يمكن تعديل العرض الفني في حالته الحالية.",
  PROPOSAL_REQUEST_MISMATCH: "العرض الفني لا ينتمي إلى الطلب المحدد.",
  CONTRACT_NOT_FOUND: "لم يتم العثور على العقد.",
  CONTRACT_NOT_SENDABLE: "لا يمكن إرسال العقد في حالته الحالية.",
  CONTRACT_NOT_EDITABLE: "لا يمكن تعديل العقد في حالته الحالية.",
  CONTRACT_UPDATE_FIELDS_REQUIRED: "أدخل قيمة واحدة على الأقل للتحديث.",
  CONTRACT_UPDATE_CONFLICT:
    "تم تعديل العقد من مستخدم آخر. حدّث الصفحة وحاول مرة أخرى.",
  CONTRACT_FINANCIAL_HISTORY_LOCKED:
    "لا يمكن تغيير الشروط المالية بعد بدء الفوترة أو السداد.",
  CONTRACT_TOTAL_VALUE_INVALID: "إجمالي قيمة العقد غير صالح.",
  CONTRACT_DATE_RANGE_INVALID: "تاريخ بداية العقد يجب أن يسبق تاريخ نهايته.",
  RETAINER_MONTHS_REQUIRED: "عدد أشهر الاشتراك مطلوب.",
  INITIAL_PAYMENT_DETAILS_REQUIRED: "بيانات الدفعة الأولية مطلوبة.",
  INITIAL_PAYMENT_PLAN_REQUIRED: "يجب أن تتضمن خطة الدفع الدفعة الأولية.",
  PAYMENT_PLAN_INITIAL_MISMATCH: "بيانات الدفعة الأولية لا تطابق خطة الدفع.",
  RECURRING_PAYMENT_PLAN_REQUIRED: "يجب أن تتضمن خطة العقد دفعة شهرية متكررة.",
  INITIAL_PAYMENT_AMOUNT_INVALID: "قيمة الدفعة الأولية غير صالحة.",
  RECURRING_PAYMENT_AMOUNT_INVALID: "قيمة الدفعة الشهرية غير صالحة.",
  FIXED_PROJECT_MONTHS_NOT_ALLOWED: "العقد الثابت لا يقبل عدد أشهر اشتراك.",
  INITIAL_PAYMENT_NOT_ALLOWED: "لا يمكن إرسال بيانات دفعة أولية عند تعطيلها.",
  PAYMENT_PLAN_FINANCIAL_HISTORY_LOCKED:
    "لا يمكن تعديل خطة الدفع بعد بدء الفوترة.",
  PAYMENT_PLAN_MULTIPLE_ON_SIGN: "لا يمكن إضافة أكثر من دفعة أولية واحدة.",
  PAYMENT_PLAN_PERCENT_INVALID: "نسبة الدفعة غير صالحة.",
  PAYMENT_PLAN_FIXED_AMOUNT_INVALID: "مبلغ الدفعة الثابت غير صالح.",
  PAYMENT_PLAN_DOWN_PAYMENT_EXCEEDS_TOTAL:
    "لا يمكن أن تتجاوز الدفعة الأولية إجمالي العقد.",
  PAYMENT_PLAN_SEQUENCE_DUPLICATE: "ترتيب خطة الدفع مكرر.",
  PAYMENT_PLAN_ROW_NOT_FOUND: "لم يتم العثور على بند خطة الدفع.",
  SCHEDULED_INVOICE_AMOUNT_INVALID: "قيمة الفاتورة المجدولة غير صالحة.",
  CONTRACT_SHARE_LINK_NOT_FOUND: "لا يوجد رابط توقيع متاح لهذا العقد.",
  CONTRACT_NOT_SIGNABLE: "لا يمكن توقيع العقد في حالته الحالية.",
  REQUEST_REFERENCE_REQUIRED: "يجب ربط العقد بطلب قبل إرساله.",
  REQUEST_NOT_READY_FOR_CONTRACT_SEND: "الطلب غير جاهز لإرسال العقد.",
  REQUEST_NOT_READY_FOR_CONTRACT: "الطلب غير جاهز لإنشاء العقد.",
  CONTRACT_STATUS_CHANGED:
    "تم تغيير حالة العقد من مستخدم آخر. حدّث الصفحة وحاول مرة أخرى.",
  INITIAL_PAYMENT_REQUIRED: "يجب سداد الدفعة الأولى قبل تفعيل العقد.",
  PAYMENT_PLAN_REQUIRED: "لا يمكن توقيع العقد قبل إعداد خطة الدفعة الأولى.",
  PROJECT_MANAGER_ASSIGNMENT_REQUIRED: "تعذر تعيين مدير المشروع.",
  REQUEST_NOT_FOUND: "لم يتم العثور على الطلب.",
  PERMISSION_DENIED: "ليس لديك صلاحية لتنفيذ هذه العملية.",
  AUTHENTICATION_REQUIRED: "انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.",
  INVALID_FILE_TYPE: "نوع الملف غير مدعوم. اختر ملف PDF.",
  INVALID_FILE_CONTENT: "محتوى الملف غير صالح. اختر ملف PDF صحيحاً.",
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

const NOTIFICATION_PRESENTATIONS: Record<string, NotificationPresentation> = {
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
  eventType: NotificationEventCode | undefined,
  metadata?: NotificationMetadata | null,
): NotificationPresentation {
  const presentation = (eventType && NOTIFICATION_PRESENTATIONS[eventType]) ?? {
    title: "إشعار جديد",
    body: "لديك إشعار جديد.",
  };
  const broadcastTitle =
    typeof metadata?.title === "string" ? metadata.title : null;
  const broadcastBody =
    typeof metadata?.body === "string" ? metadata.body : null;
  // Keep older records renderable while new producers persist only event codes
  // and structured metadata. Legacy title/body values are presentation-only
  // fallbacks and are never read by the API layer as business logic.
  if (eventType === "BROADCAST" && broadcastTitle && broadcastBody) {
    return { title: broadcastTitle, body: broadcastBody };
  }
  const legacyTitle =
    typeof metadata?.legacyTitle === "string" ? metadata.legacyTitle : null;
  const legacyBody =
    typeof metadata?.legacyBody === "string" ? metadata.legacyBody : null;
  if (legacyTitle && legacyBody) {
    return { title: legacyTitle, body: legacyBody };
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
  const campaignName =
    typeof metadata?.campaignName === "string" ? metadata.campaignName : null;
  if (campaignName && eventType?.startsWith("MARKETING_CAMPAIGN")) {
    return { ...presentation, body: `${presentation.body} «${campaignName}».` };
  }
  if (campaignName && eventType === "MARKETING_METRICS_UPDATED") {
    return {
      ...presentation,
      body: `تم تحديث نتائج الحملة «${campaignName}».`,
    };
  }
  if (campaignName && eventType === "MARKETING_OPTIMIZATION_REQUIRED") {
    return {
      ...presentation,
      body: `تحتاج الحملة «${campaignName}» إلى التحسين.`,
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
  const code =
    (error as { data?: { error?: { code?: string } }; code?: string })?.data
      ?.error?.code ?? (error as { code?: string })?.code;
  const messages: Record<string, string> = {
    PERMISSION_DENIED: "ليس لديك صلاحية لعرض هذه البيانات.",
    AUTHENTICATION_REQUIRED: "انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.",
    CONVERSATION_NOT_FOUND: "لم يتم العثور على المحادثة.",
    CONVERSATION_PARTICIPATION_FORBIDDEN:
      "ليس لديك صلاحية للوصول إلى هذه المحادثة.",
    CONVERSATION_INACTIVE: "هذه المحادثة غير متاحة حالياً.",
    SOCKET_NOT_CONNECTED: "تعذر الاتصال بالمحادثة. يرجى المحاولة لاحقاً.",
    SOCKET_ACK_TIMEOUT: "استغرق تحديث حالة القراءة وقتاً أطول من المتوقع.",
    INITIAL_PAYMENT_REQUIRED: "يجب سداد الدفعة الأولى قبل توقيع العقد.",
    PAYMENT_PLAN_REQUIRED: "لا يمكن توقيع العقد قبل إعداد خطة الدفع.",
    CONTRACT_NOT_SIGNABLE: "لا يمكن توقيع العقد في حالته الحالية.",
    INVALID_CONTRACT_STATUS: "لا يمكن تنفيذ هذا الإجراء في حالة العقد الحالية.",
  };
  return (
    (code && messages[code]) || "تعذر تحميل البيانات. يرجى المحاولة لاحقاً."
  );
}

export function marketingErrorMessage(error: unknown): string {
  const code = (error as { data?: { error?: { code?: string } } })?.data?.error
    ?.code;
  const messages: Record<string, string> = {
    CAMPAIGN_NOT_FOUND: "لم يتم العثور على الحملة.",
    MARKETING_STRATEGY_PDF_REQUIRED: "أرفق ملف PDF صالحاً للدراسة التسويقية.",
    MARKETING_STRATEGY_NOT_FOUND: "لم يتم العثور على الدراسة التسويقية.",
    MARKETING_TASK_NOT_FOUND: "لم يتم العثور على المهمة التسويقية.",
    MARKETING_CLIENT_NOT_FOUND: "لم يتم العثور على العميل.",
    MARKETING_STRATEGY_NOT_APPROVED: "يجب اعتماد الدراسة التسويقية أولاً.",
    MARKETING_STRATEGY_ALREADY_EXISTS: "توجد دراسة تسويقية نشطة لهذه المهمة.",
    MARKETING_CAMPAIGN_NOT_ALLOWED: "لا يمكن تنفيذ هذا الإجراء على الحملة.",
    MARKETING_FILE_REQUIRED: "أرفق ملفاً قبل المتابعة.",
    MARKETING_FILE_TOO_LARGE: "حجم الملف أكبر من الحد المسموح.",
    MARKETING_FILE_TYPE_NOT_ALLOWED: "نوع الملف غير مسموح.",
    FILE_REQUIRED: "أرفق ملفاً قبل المتابعة.",
    FILE_TOO_LARGE: "حجم الملف أكبر من الحد المسموح.",
    FILE_TYPE_NOT_ALLOWED: "نوع الملف غير مسموح.",
    MARKETING_TASK_DEPARTMENT_REQUIRED: "المهمة ليست ضمن قسم التسويق.",
    MARKETING_TASK_UNASSIGNED: "يجب إسناد المهمة لمسوق أولاً.",
    MARKETING_TASK_CLIENT_REQUIRED: "المهمة غير مرتبطة بعميل.",
    MARKETING_STRATEGY_OWNER_REQUIRED:
      "لا يملك هذا المستخدم الدراسة التسويقية.",
    MARKETING_STRATEGY_INVALID_STATUS:
      "لا يمكن تنفيذ هذا الإجراء في الحالة الحالية.",
    CAMPAIGN_NOT_EDITABLE: "لا يمكن تعديل حملة منتهية.",
    CAMPAIGN_PLATFORM_LOCKED: "لا يمكن تغيير المنصة بعد تفعيل الحملة.",
    CAMPAIGN_NOT_ARCHIVED: "الحملة غير مؤرشفة.",
    CAMPAIGN_INVALID_STATUS_TRANSITION: "لا يمكن تغيير حالة الحملة الحالية.",
    INVALID_DATE_RANGE: "تحقق من نطاق التواريخ.",
    MARKETING_TASK_STATUS_FORBIDDEN: "لا يسمح لك بهذا الانتقال.",
    CAMPAIGN_ARCHIVED: "لا يمكن تعديل حملة مؤرشفة.",
    VALIDATION_ERROR: "تحقق من قيم المقاييس المدخلة.",
    PERMISSION_DENIED: "ليس لديك صلاحية لتنفيذ هذا الإجراء.",
    AUTHENTICATION_REQUIRED: "انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.",
  };
  return (
    (code && messages[code]) ??
    "تعذر تنفيذ الإجراء على الحملة. يرجى المحاولة لاحقاً."
  );
}

const PM_ERROR_MESSAGES: Record<string, string> = {
  PERMISSION_DENIED: "ليس لديك صلاحية لتنفيذ هذا الإجراء.",
  AUTHENTICATION_REQUIRED: "انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.",
  PROJECT_NOT_FOUND: "المشروع غير موجود.",
  TASK_NOT_FOUND: "المهمة غير موجودة.",
  TASK_FILE_REQUIRED: "أرفق ملفاً قبل المتابعة.",
  TEAM_TASK_NOT_FOUND: "المهمة غير موجودة.",
  TEAM_CLIENT_NOT_FOUND: "العميل غير موجود.",
  TEAM_TASK_STATUS_FORBIDDEN: "لا يسمح لك بهذا الانتقال.",
  TEAM_TASK_FILE_REQUIRED: "أرفق ملفاً قبل المتابعة.",
  TEAM_DIRECT_CONVERSATION_UNAVAILABLE: "تعذر بدء المحادثة المباشرة.",
  TASK_STATUS_INVALID: "حالة المهمة غير صالحة.",
  TASK_STATUS_INVALID_FOR_TODO: "لا يمكن إعادة المهمة إلى قائمة الانتظار.",
  TASK_STATUS_UNHANDLED: "تعذر تحديث حالة المهمة.",
  TASK_STATUS_INVALID_FOR_START: "لا يمكن بدء المهمة في حالتها الحالية.",
  TASK_STATUS_INVALID_FOR_SUBMIT: "لا يمكن إرسال المهمة في حالتها الحالية.",
  TASK_STATUS_INVALID_FOR_APPROVE: "لا يمكن اعتماد المهمة في حالتها الحالية.",
  TASK_STATUS_INVALID_FOR_REVISION: "لا يمكن طلب التعديل في حالتها الحالية.",
  TASK_STATUS_UPDATE_FAILED: "تعذر تحديث حالة المهمة.",
  TASK_ASSIGNMENT_FAILED: "تعذر إسناد المهمة.",
  TASK_COMMENT_FAILED: "تعذر إضافة التعليق.",
  TASK_COMMENTS_LOAD_FAILED: "تعذر تحميل التعليقات.",
  TASK_FILES_LOAD_FAILED: "تعذر تحميل الملفات.",
  TASK_FILE_DOWNLOAD_FAILED: "تعذر تحميل الملف.",
  TASK_FILE_NOT_FOUND: "الملف غير موجود.",
  TASK_ASSIGNEE_NOT_FOUND: "المستخدم المكلف غير موجود.",
  TASK_ASSIGNEE_INACTIVE: "المستخدم المكلف غير نشط.",
  TASK_ASSIGNEE_DEPARTMENT_MISMATCH: "المستخدم المكلف لا ينتمي للقسم المطلوب.",
  TASK_MARKETING_DEPARTMENT_REQUIRED: "يجب تحديد قسم التسويق.",
  TASK_ASSIGNEE_ROLE_INVALID: "دور المستخدم المكلف غير صالح.",
  TASK_DEPARTMENT_NOT_FOUND: "القسم غير موجود.",
  TASK_FILE_UPLOAD_FAILED: "تعذر رفع الملف.",
  TASK_FILE_DELETE_FAILED: "تعذر حذف الملف.",
  TASK_INVALID_TRANSITION: "الانتقال غير مسموح في مسار حالة المهام.",
  TASK_DROP_NOT_ALLOWED: "لا يمكن نقل المهمة إلى هذه الحالة.",
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
  DISPUTE_CLIENT_CONFIRMED: "أكد العميل حل المشكلة.",
  DISPUTE_CLIENT_ESCALATED: "صعّد العميل النزاع لعدم حل المشكلة.",
  DISPUTE_APPROVED: "تمت الموافقة على النزاع.",
  DISPUTE_REJECTED: "تم رفض النزاع.",
  DISPUTE_PM_CHANGED: "تم تغيير مدير المشروع.",
  DISPUTE_CLOSED: "تم إغلاق النزاع.",
  DISPUTE_APPROVAL_NOTIFICATION_SENT: "تم إرسال إشعار الموافقة.",
  DISPUTE_REMINDER_SENT: "تم إرسال تذكير للعميل.",
  DISPUTE_HISTORY_UPDATED: "تم تحديث حالة النزاع.",
};

export function disputeHistoryMessage(
  code: string,
  metadata?: Record<string, unknown> | null,
): string {
  const base =
    DISPUTE_HISTORY_MESSAGES[code] ??
    DISPUTE_HISTORY_MESSAGES.DISPUTE_HISTORY_UPDATED;
  const detail =
    metadata &&
    ["reason", "feedback", "notes", "resolution"]
      .map((key) => metadata[key])
      .find(
        (value): value is string =>
          typeof value === "string" && value.trim().length > 0,
      );
  return detail ? `${base} التفاصيل: ${detail}` : base;
}

const DISPUTE_THREAD_MESSAGES: Record<string, string> = {
  DISPUTE_THREAD_CLIENT_PM: "العميل ↔ مدير المشروع",
  DISPUTE_THREAD_CLIENT_PM_DESCRIPTION:
    "محادثة معالجة النزاع بين العميل ومدير المشروع.",
  DISPUTE_THREAD_ADMIN_CLIENT: "الإدارة ↔ العميل",
  DISPUTE_THREAD_ADMIN_CLIENT_DESCRIPTION: "محادثة خاصة تظهر للإدارة والعميل.",
  DISPUTE_THREAD_ADMIN_PM: "الإدارة ↔ مدير المشروع",
  DISPUTE_THREAD_ADMIN_PM_DESCRIPTION:
    "محادثة خاصة تظهر للإدارة ومدير المشروع.",
};

export function disputeThreadMessage(code: string): string {
  return DISPUTE_THREAD_MESSAGES[code] ?? "محادثة النزاع";
}

const PM_SUCCESS_MESSAGES: Record<string, string> = {
  TASK_STATUS_UPDATED: "تم تحديث حالة المهمة.",
  TASK_FILE_UPLOADED: "تم رفع الملف.",
  TASK_FILE_DELETED: "تم حذف الملف.",
  TASK_COMMENT_ADDED: "تمت إضافة التعليق.",
  TASK_NOTE_ADDED: "تم حفظ الملاحظة الخاصة.",
  TASK_CREATED: "تم إنشاء المهمة بنجاح.",
  DISPUTE_ACKNOWLEDGED: "تم بدء المعالجة.",
  DISPUTE_RESOLVED: "تم إرسال الحل للعميل.",
  UNKNOWN_SUCCESS: "تمت العملية بنجاح.",
};

export function pmSuccessMessage(code: string | undefined): string {
  return (
    PM_SUCCESS_MESSAGES[code ?? "UNKNOWN_SUCCESS"] ??
    PM_SUCCESS_MESSAGES.UNKNOWN_SUCCESS
  );
}

export function projectSuccessMessage(code: string): string {
  const messages: Record<string, string> = {
    PROJECT_CREATED: "تم إنشاء المشروع بنجاح.",
    PROJECT_UPDATED: "تم تحديث المشروع بنجاح.",
  };
  return messages[code] ?? "تمت العملية بنجاح.";
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
