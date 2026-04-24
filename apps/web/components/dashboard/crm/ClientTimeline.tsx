import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
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

interface ActivityEntry {
  id: string;
  action: string;
  details?: string | null;
  createdAt: string;
  userId: string;
}

interface ClientTimelineProps {
  activities: ActivityEntry[];
}

const ACTION_CONFIG: Record<
  string,
  { label: string; icon: LucideIcon; color: string }
> = {
  CLIENT_CREATED: {
    label: "تم إضافة العميل",
    icon: CircleDot,
    color: "text-blue-500",
  },
  STAGE_UPDATED: {
    label: "تغيير المرحلة",
    icon: UserCheck,
    color: "text-violet-500",
  },
  CLIENT_UPDATED: {
    label: "تحديث بيانات",
    icon: FileText,
    color: "text-amber-500",
  },
  REQUIREMENTS_UPDATED: {
    label: "تحديث المتطلبات",
    icon: ClipboardList,
    color: "text-emerald-500",
  },
  CONTACT_ATTEMPT: {
    label: "محاولة تواصل",
    icon: PhoneCall,
    color: "text-blue-500",
  },
  FOLLOW_UP_INTRO_MESSAGE: {
    label: "رسالة تعريفية تلقائية",
    icon: MessageCircle,
    color: "text-indigo-500",
  },
  FOLLOW_UP_MEETING_LINK: {
    label: "رابط تحديد موعد",
    icon: MessageCircle,
    color: "text-purple-500",
  },
  FOLLOW_UP_SERVICE_SUMMARY: {
    label: "عرض مختصر للخدمة",
    icon: FileText,
    color: "text-orange-500",
  },
  FOLLOW_UP_REMINDER: {
    label: "تذكير متابعة",
    icon: Bell,
    color: "text-amber-500",
  },
  PROPOSAL_CREATED: {
    label: "إنشاء عرض فني",
    icon: FileText,
    color: "text-sky-500",
  },
  PROPOSAL_SENT: {
    label: "إرسال عرض فني",
    icon: Send,
    color: "text-sky-500",
  },
  PROPOSAL_APPROVED: {
    label: "موافقة على العرض",
    icon: CheckCircle2,
    color: "text-emerald-600",
  },
  PROPOSAL_REVISION_REQUESTED: {
    label: "طلب تعديل العرض",
    icon: ClipboardList,
    color: "text-amber-600",
  },
  CONTRACT_CREATED: {
    label: "إنشاء عقد",
    icon: FileText,
    color: "text-indigo-600",
  },
  CONTRACT_SENT: {
    label: "إرسال عقد",
    icon: Send,
    color: "text-indigo-600",
  },
  CONTRACT_SIGNED: {
    label: "توقيع عقد",
    icon: CheckCircle2,
    color: "text-emerald-600",
  },
  HANDOVER: {
    label: "تسليم للعمليات",
    icon: ClipboardList,
    color: "text-muted-foreground",
  },
};

function getActionConfig(action: string) {
  return (
    ACTION_CONFIG[action] ?? {
      label: action,
      icon: CheckCircle2,
      color: "text-muted-foreground",
    }
  );
}

export function ClientTimeline({ activities }: ClientTimelineProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">سجل النشاط</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            لا يوجد نشاط مسجل
          </p>
        ) : (
          <div className="relative">
            <div className="absolute right-4 top-0 bottom-0 w-px bg-border" />
            <div className="space-y-4">
              {activities.map((activity) => {
                const {
                  label,
                  icon: Icon,
                  color,
                } = getActionConfig(activity.action);
                return (
                  <div key={activity.id} className="relative ps-10">
                    <div className="absolute right-2 top-1 w-5 h-5 rounded-full bg-background border-2 border-border flex items-center justify-center">
                      <Icon className={cn("h-2.5 w-2.5", color)} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      {activity.details && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {activity.details}
                        </p>
                      )}
                      <p
                        className="text-xs text-muted-foreground mt-1"
                        dir="ltr"
                      >
                        {new Intl.DateTimeFormat("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          numberingSystem: "latn",
                        }).format(new Date(activity.createdAt))}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
