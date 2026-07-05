export enum TriggerEvent {
  PROJECT_COMPLETED = "PROJECT_COMPLETED",
  TASK_APPROVED = "TASK_APPROVED",
  MONTHLY_REVIEW = "MONTHLY_REVIEW",
}

export const TRIGGER_EVENT_AR: Record<TriggerEvent, string> = {
  PROJECT_COMPLETED: "اكتمال المشروع",
  TASK_APPROVED: "اعتماد مهمة",
  MONTHLY_REVIEW: "مراجعة شهرية",
};

export enum AutoAction {
  NONE = "NONE",
  NOTIFY_PM = "NOTIFY_PM",
  ESC_TO_ADMIN = "ESC_TO_ADMIN",
}

export const AUTO_ACTION_AR: Record<AutoAction, string> = {
  NONE: "لا شيء",
  NOTIFY_PM: "إبلاغ مدير المشروع",
  ESC_TO_ADMIN: "تصعيد للمدير",
};
