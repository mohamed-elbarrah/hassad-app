export enum ServiceCategory {
  BRANDING = "BRANDING",
  WEB_DEVELOPMENT = "WEB_DEVELOPMENT",
  SOCIAL_MEDIA = "SOCIAL_MEDIA",
  ADVERTISING = "ADVERTISING",
  CONTENT_CREATION = "CONTENT_CREATION",
  PHOTOGRAPHY = "PHOTOGRAPHY",
  VIDEO_PRODUCTION = "VIDEO_PRODUCTION",
  SEO = "SEO",
  OTHER = "OTHER",
}

export const SERVICE_CATEGORY_AR: Record<ServiceCategory, string> = {
  BRANDING: "هوية بصرية",
  WEB_DEVELOPMENT: "تطوير مواقع",
  SOCIAL_MEDIA: "تواصل اجتماعي",
  ADVERTISING: "إعلانات",
  CONTENT_CREATION: "إنتاج محتوى",
  PHOTOGRAPHY: "تصوير",
  VIDEO_PRODUCTION: "إنتاج فيديو",
  SEO: "تحسين محركات البحث",
  OTHER: "أخرى",
};

export enum DeliverableStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  IN_REVIEW = "IN_REVIEW",
  DONE = "DONE",
  REVISION = "REVISION",
}

export const DELIVERABLE_STATUS_AR: Record<DeliverableStatus, string> = {
  TODO: "قيد الانتظار",
  IN_PROGRESS: "قيد التنفيذ",
  IN_REVIEW: "قيد المراجعة",
  DONE: "مكتمل",
  REVISION: "مراجعة",
};
