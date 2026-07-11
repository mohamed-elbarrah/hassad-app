export enum AiEntityType {
  LEAD = "LEAD",
  CLIENT = "CLIENT",
  PROJECT = "PROJECT",
  TASK = "TASK",
}

export enum AiAnalysisType {
  CHURN_PREDICTION = "CHURN_PREDICTION",
  SENTIMENT_ANALYSIS = "SENTIMENT_ANALYSIS",
  PERFORMANCE_FORECAST = "PERFORMANCE_FORECAST",
  CONTENT_GENERATION = "CONTENT_GENERATION",
  QUALITY_CHECK = "QUALITY_CHECK",
}

export enum AiSuggestionType {
  STRATEGY = "STRATEGY",
  OPTIMIZATION = "OPTIMIZATION",
  CONTENT = "CONTENT",
}

export enum AiSuggestionStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
}

export const AI_ENTITY_TYPE_AR: Record<AiEntityType, string> = {
  LEAD: "عميل محتمل",
  CLIENT: "عميل",
  PROJECT: "مشروع",
  TASK: "مهمة",
};

export const AI_ANALYSIS_TYPE_AR: Record<AiAnalysisType, string> = {
  CHURN_PREDICTION: "توقع انسحاب",
  SENTIMENT_ANALYSIS: "تحليل المشاعر",
  PERFORMANCE_FORECAST: "توقع الأداء",
  CONTENT_GENERATION: "توليد محتوى",
  QUALITY_CHECK: "فحص الجودة",
};

export const AI_SUGGESTION_TYPE_AR: Record<AiSuggestionType, string> = {
  STRATEGY: "استراتيجية",
  OPTIMIZATION: "تحسين",
  CONTENT: "محتوى",
};

export const AI_SUGGESTION_STATUS_AR: Record<AiSuggestionStatus, string> = {
  PENDING: "معلق",
  ACCEPTED: "مقبول",
  REJECTED: "مرفوض",
};
