import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ClientHistoryLogItem } from "@hassad/shared";
import {
  CircleDot,
  PhoneCall,
  MessageCircle,
  Send,
  Bell,
  UserCheck,
  FileText,
  ClipboardList,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";

interface ClientTimelineProps {
  activities: ClientHistoryLogItem[];
}

const ACTION_CONFIG: Record<
  string,
  { label: string; icon: LucideIcon; color: string }
> = {
  CLIENT_CREATED: {
    label: "تم إضافة العميل",
    icon: CircleDot,
    color: "text-action-blue",
  },
  CLIENT_UPDATED: {
    label: "تحديث بيانات العميل",
    icon: FileText,
    color: "text-alert-500",
  },
  CLIENT_COUNTERS_UPDATED: {
    label: "تحديث إحصائيات العميل",
    icon: ClipboardList,
    color: "text-neutral-300",
  },
  CLIENT_PROFILE_CREATED: {
    label: "إنشاء الملف التعريفي",
    icon: UserCheck,
    color: "text-secondary-500",
  },
  CLIENT_PROFILE_UPDATED: {
    label: "تحديث الملف التعريفي",
    icon: FileText,
    color: "text-alert-500",
  },
  STAGE_UPDATED: {
    label: "تغيير المرحلة",
    icon: UserCheck,
    color: "text-secondary-500",
  },
  REQUIREMENTS_UPDATED: {
    label: "تحديث المتطلبات",
    icon: ClipboardList,
    color: "text-success-500",
  },
  CONTACT_ATTEMPT: {
    label: "محاولة تواصل",
    icon: PhoneCall,
    color: "text-action-blue",
  },
  FOLLOW_UP_INTRO_MESSAGE: {
    label: "رسالة تعريفية تلقائية",
    icon: MessageCircle,
    color: "text-secondary-500",
  },
  FOLLOW_UP_MEETING_LINK: {
    label: "رابط تحديد موعد",
    icon: MessageCircle,
    color: "text-secondary-500",
  },
  FOLLOW_UP_SERVICE_SUMMARY: {
    label: "عرض مختصر للخدمة",
    icon: FileText,
    color: "text-alert-500",
  },
  FOLLOW_UP_REMINDER: {
    label: "تذكير متابعة",
    icon: Bell,
    color: "text-alert-500",
  },
  PROPOSAL_CREATED: {
    label: "إنشاء عرض فني",
    icon: FileText,
    color: "text-action-blue",
  },
  PROPOSAL_SENT: {
    label: "إرسال عرض فني",
    icon: Send,
    color: "text-action-blue",
  },
  PROPOSAL_APPROVED: {
    label: "موافقة على العرض",
    icon: CheckCircle2,
    color: "text-success-600",
  },
  PROPOSAL_REVISION_REQUESTED: {
    label: "طلب تعديل العرض",
    icon: ClipboardList,
    color: "text-alert-600",
  },
  CONTRACT_CREATED: {
    label: "إنشاء عقد",
    icon: FileText,
    color: "text-secondary-500",
  },
  CONTRACT_SENT: {
    label: "إرسال عقد",
    icon: Send,
    color: "text-secondary-500",
  },
  CONTRACT_SIGNED: {
    label: "توقيع عقد",
    icon: CheckCircle2,
    color: "text-success-600",
  },
  CONTRACT_SIGNED_HANDOVER: {
    label: "تسليم للعمليات",
    icon: ClipboardList,
    color: "text-neutral-300",
  },
};

function getActionConfig(action: string) {
  return (
    ACTION_CONFIG[action] ?? {
      label: action,
      icon: CheckCircle2,
      color: "text-neutral-300",
    }
  );
}

export function ClientTimeline({ activities }: ClientTimelineProps) {
  return (
    <Card title="سجل النشاط">
      {activities.length === 0 ? (
        <p className="text-sm text-neutral-300 text-center py-4">
          لا يوجد نشاط مسجل
        </p>
      ) : (
        <div className="relative">
          <div className="absolute right-4 top-0 bottom-0 w-px bg-portal-divider" />
          <div className="space-y-4">
            {activities.map((activity) => {
              const {
                label,
                icon: Icon,
                color,
              } = getActionConfig(activity.eventType);
              return (
                <div key={activity.id} className="relative ps-10">
                  <div className="absolute right-2 top-1 w-5 h-5 rounded-full bg-natural-0 border-2 border-portal-divider flex items-center justify-center">
                    <Icon className={cn("h-2.5 w-2.5", color)} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    {activity.description && (
                      <p className="text-xs text-neutral-300 mt-0.5">
                        {activity.description}
                      </p>
                    )}
                    {activity.user?.name && (
                      <p className="text-xs text-neutral-300 mt-0.5">
                        بواسطة: {activity.user.name}
                      </p>
                    )}
                    <p className="text-xs text-neutral-300 mt-1" dir="ltr">
                      {new Intl.DateTimeFormat("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        numberingSystem: "latn",
                      }).format(new Date(activity.occurredAt))}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}
