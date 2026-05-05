"use client";

import { useState } from "react";
import { Settings, Palette, Receipt, FileText, PenTool, Clock } from "lucide-react";
import { useGetActionItemsQuery } from "@/features/portal/portalApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const TYPE_FILTERS: { label: string; value: string; icon: typeof Settings }[] = [
  { label: "الكل", value: "", icon: Settings },
  { label: "مراجعة تسليمات", value: "DELIVERABLE_APPROVAL", icon: Palette },
  { label: "دفع فواتير", value: "INVOICE_PAYMENT", icon: Receipt },
  { label: "مراجعة عروض", value: "PROPOSAL_REVIEW", icon: FileText },
  { label: "توقيع عقود", value: "CONTRACT_SIGN", icon: PenTool },
];

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  DELIVERABLE_APPROVAL: { label: "مراجعة تسليم", color: "purple" },
  INVOICE_PAYMENT: { label: "دفع فاتورة", color: "blue" },
  PROPOSAL_REVIEW: { label: "مراجعة عرض", color: "purple" },
  CONTRACT_SIGN: { label: "توقيع عقد", color: "blue" },
};

const PRIORITY_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  high: { label: "عاجل", variant: "destructive" },
  normal: { label: "عادي", variant: "default" },
  low: { label: "منخفض", variant: "outline" },
};

const PAGE_SIZE = 10;

export default function PortalActionsPage() {
  const router = useRouter();
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useGetActionItemsQuery({
    type: typeFilter || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-semibold">إجراءات تتطلب تدخلك</h1>
        <p className="text-sm text-muted-foreground mt-1">
          جميع الإجراءات التي تحتاج مراجعتك أو موافقتك.
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {TYPE_FILTERS.map((f) => {
          const Icon = f.icon;
          const isActive = typeFilter === f.value;
          return (
            <Button
              key={f.value}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setTypeFilter(f.value);
                setPage(1);
              }}
              className="gap-1.5"
            >
              <Icon className="h-3.5 w-3.5" />
              {f.label}
            </Button>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">الإجراءات المعلقة</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          )}
          {isError && (
            <p className="text-sm text-destructive">
              حدث خطأ أثناء تحميل الإجراءات. يرجى المحاولة لاحقاً.
            </p>
          )}
          {!isLoading && !isError && items.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-10">
              <Settings className="h-8 w-8 opacity-30" />
              <p className="text-sm text-muted-foreground">لا توجد إجراءات معلقة.</p>
            </div>
          )}
          {!isLoading && !isError && items.length > 0 && (
            <div className="space-y-3">
              {items.map((item) => {
                const config = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.DELIVERABLE_APPROVAL;
                const priorityConfig = PRIORITY_CONFIG[item.priority] ?? PRIORITY_CONFIG.normal;
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4 p-4 bg-white rounded-xl"
                    style={{ border: "1px solid #E1E4EA" }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{item.title}</span>
                        <Badge variant={priorityConfig.variant} className="text-xs shrink-0">
                          {priorityConfig.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {item.subtitle}
                      </p>
                      {item.dueDate && (
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            مستحق: {new Date(item.dueDate).toLocaleDateString("ar-SA")}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant="outline"
                        className="text-xs"
                        style={
                          config.color === "purple"
                            ? { borderColor: "#8B5CF6", color: "#8B5CF6" }
                            : { borderColor: "#3B82F6", color: "#3B82F6" }
                        }
                      >
                        {config.label}
                      </Badge>
                      <Button
                        size="sm"
                        onClick={() => router.push(item.actionUrl)}
                      >
                        اتخاذ إجراء
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                السابق
              </Button>
              <span className="text-sm text-muted-foreground">
                {page} من {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                التالي
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}