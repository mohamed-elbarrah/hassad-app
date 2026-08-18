// apps/web/lib/i18n.ts
//
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
