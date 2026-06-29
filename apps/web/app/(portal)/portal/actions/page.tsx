"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Settings,
  CheckCircle2,
  Clock,
  ExternalLink,
  BellOff,
  Bell,
  Hourglass,
  CalendarClock,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { Pagination } from "@/components/design-system/Pagination";
import { FilterBar, type FilterGroup } from "@/components/design-system/FilterBar";
import { Pill } from "@/components/design-system/Pill";
import { DataTable } from "@/components/design-system/DataTable";
import { ActionButton } from "@/components/design-system/ActionButton";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/design-system/Tabs";
import { useAppSelector } from "@/lib/hooks";
import {
  useGetActionItemsQuery,
  useGetSnoozedActionItemsQuery,
  useSnoozeActionItemMutation,
  useUnsnoozeActionItemMutation,
  type SnoozedActionItem,
} from "@/features/portal/portalApi";

const FILTER_GROUPS: FilterGroup[] = [
  {
    key: "type",
    label: "النوع",
    options: [
      { label: "الكل", value: "" },
      { label: "مراجعة تسليمات", value: "DELIVERABLE_APPROVAL" },
      { label: "دفع فواتير", value: "INVOICE_PAYMENT" },
      { label: "مراجعة عروض", value: "PROPOSAL_REVIEW" },
      { label: "توقيع عقود", value: "CONTRACT_SIGN" },
      { label: "مراجعة دراسة تسويقية", value: "STRATEGY_REVIEW" },
    ],
  },
];

const TYPE_CONFIG: Record<
  string,
  { label: string; color: "purple" | "blue" }
> = {
  DELIVERABLE_APPROVAL: { label: "مراجعة تسليم", color: "purple" },
  INVOICE_PAYMENT: { label: "دفع فاتورة", color: "blue" },
  PROPOSAL_REVIEW: { label: "مراجعة عرض", color: "purple" },
  CONTRACT_SIGN: { label: "توقيع عقد", color: "blue" },
  STRATEGY_REVIEW: { label: "مراجعة دراسة تسويقية", color: "purple" },
};

const PRIORITY_PILL: Record<
  string,
  { label: string; tone: "danger" | "neutral" | "warning" }
> = {
  high: { label: "عاجل", tone: "danger" },
  normal: { label: "عادي", tone: "neutral" },
  low: { label: "منخفض", tone: "warning" },
};

const PAGE_SIZE = 6;

/** Strip the `del-` / `inv-` / etc. prefix from an action item id. */
function stripPrefix(id: string): string {
  return id.replace(/^(del|inv|prop|con|strat)-/, "");
}

/** Friendly "23 Aug 2026, 14:30" formatter using Arabic-locale Latin digits. */
function formatReminderTime(iso: string): string {
  return new Date(iso).toLocaleString("ar-SA-u-nu-latn", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Portal actions page.
 *
 * Two tabs:
 *   - "الآن"          → pending action items the client still needs to act on.
 *   - "المؤجلة"       → items the client snoozed. Each row shows the
 *                       countdown until the reminder fires and offers an
 *                       "إلغاء التأجيل" affordance.
 *
 * The dashboard card (`/portal`) deep-links here too. We keep the same
 * `Type` filter for both tabs because users want to narrow both lists by
 * the same criteria.
 */
export default function PortalActionsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"now" | "snoozed">("now");
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [page, setPage] = useState(1);
  // Per-row busy state so only one row shows the spinner at a time.
  const [busyId, setBusyId] = useState<string | null>(null);

  const typeFilter = activeFilters["type"]?.[0] ?? "";

  const { user } = useAppSelector((state) => state.auth);
  const clientId = user?.clientId ?? "";

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useGetActionItemsQuery(
    {
      type: typeFilter || undefined,
      page,
      limit: PAGE_SIZE,
    },
    { skip: !clientId || activeTab !== "now", pollingInterval: 120_000 },
  );

  const {
    data: snoozedData,
    isLoading: snoozedLoading,
    isError: snoozedError,
  } = useGetSnoozedActionItemsQuery(
    { activeOnly: true },
    { skip: !clientId || activeTab !== "snoozed", pollingInterval: 120_000 },
  );

  const [snoozeActionItem] = useSnoozeActionItemMutation();
  const [unsnoozeActionItem] = useUnsnoozeActionItemMutation();

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const snoozedItems = snoozedData ?? [];

  const handleFilterChange = useCallback((groupKey: string, values: string[]) => {
    setActiveFilters((prev) => ({ ...prev, [groupKey]: values }));
    setPage(1);
  }, []);

  /** Snooze an item from the "الآن" tab. */
  const handleSnooze = async (item: {
    id: string;
    type: string;
    title: string;
  }) => {
    const itemId = stripPrefix(item.id);
    setBusyId(item.id);
    try {
      const result = await snoozeActionItem({
        itemType: item.type,
        itemId,
      }).unwrap();
      const until = result?.snoozedUntil
        ? formatReminderTime(result.snoozedUntil)
        : "بعد 24 ساعة";
      toast.success(`سيتم تذكيرك بـ «${item.title}» ${until}`, {
        description: "يمكنك التراجع من تبويب «المؤجلة».",
        duration: 5000,
      });
    } catch (err: any) {
      toast.error(err?.data?.message || "فشل في إخفاء الإجراء");
    } finally {
      setBusyId(null);
    }
  };

  /** Cancel an existing snooze from the "المؤجلة" tab. */
  const handleUnsnooze = async (item: SnoozedActionItem) => {
    const itemId = stripPrefix(item.id);
    setBusyId(item.id);
    try {
      await unsnoozeActionItem({ itemType: item.type, itemId }).unwrap();
      toast.success(`تم إعادة «${item.title}» إلى قائمة الإجراءات`, {
        description: "ستجده في تبويب «الآن».",
        duration: 4000,
      });
    } catch (err: any) {
      toast.error(err?.data?.message || "فشل في إلغاء التأجيل");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <PageIntro
        title="إجراءات تتطلب تدخلك"
        description="جميع الإجراءات التي تحتاج مراجعتك أو موافقتك ضمن نفس تجربة العميل الموحدة."
        icon={CheckCircle2}
      />

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "now" | "snoozed")}
        dir="rtl"
      >
        <TabsList className="self-start">
          <TabsTrigger value="now" className="gap-2">
            <Bell className="h-4 w-4" />
            الآن
            {!isLoading && items.length > 0 && (
              <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-secondary-500 px-1.5 text-[11px] font-semibold text-white">
                {items.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="snoozed" className="gap-2">
            <Hourglass className="h-4 w-4" />
            المؤجلة
            {!snoozedLoading && snoozedItems.length > 0 && (
              <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-portal-note-text/20 px-1.5 text-[11px] font-semibold text-portal-note-text">
                {snoozedItems.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Tab: الآن ───────────────────────────────────────────────── */}
        {isError ? (
          <SurfaceCard>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="w-12 h-12 text-danger-500 mb-4" />
              <p className="text-lg font-medium text-natural-100 mb-2">تعذر تحميل الإجراءات</p>
              <ActionButton variant="primary" onClick={() => refetch()}>إعادة المحاولة</ActionButton>
            </div>
          </SurfaceCard>
        ) : (
        <TabsContent value="now" className="mt-4">
          <SurfaceCard
            title="الإجراءات المعلقة"
            description="راجع ما يتطلب تدخلك واتخذ الإجراء المناسب"
            icon={Settings}
            action={
              <FilterBar
                groups={FILTER_GROUPS}
                activeFilters={activeFilters}
                onFilterChange={handleFilterChange}
              />
            }
          >
            <DataTable
              columns={[
                { id: "title", label: "الإجراء" },
                { id: "subtitle", label: "التفاصيل" },
                { id: "priority", label: "الأولوية" },
                { id: "type", label: "النوع" },
                { id: "dueDate", label: "تاريخ الاستحقاق" },
                { id: "action", label: "الإجراء" },
              ]}
              data={items}
              isLoading={isLoading}
              isError={isError}
              errorMessage="حدث خطأ أثناء تحميل الإجراءات."
              emptyState={{
                icon: CheckCircle2,
                message: "لا توجد إجراءات معلقة.",
                hint: "ستظهر هنا جميع الإجراءات التي تتطلب مراجعتك وموافقتك.",
              }}
              renderRow={(item) => {
                const config =
                  TYPE_CONFIG[item.type] ?? TYPE_CONFIG.DELIVERABLE_APPROVAL;
                const priorityCfg =
                  PRIORITY_PILL[item.priority] ?? PRIORITY_PILL.normal;
                const isBusy = busyId === item.id;
                return (
                  <tr
                    key={item.id}
                    className="border-b-[1.5px] border-portal-divider transition-colors hover:bg-portal-bg/40"
                  >
                    <td className="px-5 py-4 font-medium text-sm text-natural-100">
                      {item.title}
                    </td>
                    <td className="px-5 py-4 text-sm text-portal-note-text truncate max-w-[200px]">
                      {item.subtitle}
                    </td>
                    <td className="px-5 py-4">
                      <Pill tone={priorityCfg.tone}>{priorityCfg.label}</Pill>
                    </td>
                    <td className="px-5 py-4">
                      <Pill
                        tone={config.color === "purple" ? "purple" : "blue"}
                      >
                        {config.label}
                      </Pill>
                    </td>
                    <td className="px-5 py-4 text-sm text-portal-note-text">
                      {item.dueDate ? (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {new Date(item.dueDate).toLocaleDateString(
                              "ar-SA-u-nu-latn",
                            )}
                          </span>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <ActionButton
                          variant="outline"
                          size="md"
                          onClick={() => handleSnooze(item)}
                          disabled={isBusy}
                          title="تأجيل التذكير 24 ساعة"
                          className="gap-1.5 border-[1.5px] border-portal-card-border bg-natural-0 text-portal-note-text hover:bg-badge-gray-bg hover:text-secondary-500"
                        >
                          <BellOff className="h-3.5 w-3.5" />
                          {isBusy ? "جاري التأجيل..." : "ذكرني لاحقاً"}
                        </ActionButton>
                        <ActionButton
                          variant="primary"
                          size="md"
                          onClick={() => router.push(item.actionUrl)}
                        >
                          <ExternalLink className="h-3.5 w-3.5 ml-1" />
                          اتخاذ إجراء
                        </ActionButton>
                      </div>
                    </td>
                  </tr>
                );
              }}
            />

            {!isLoading && !isError && items.length > 0 && (
              <div className="mt-6">
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </SurfaceCard>
        </TabsContent>
        )}

        {/* ── Tab: المؤجلة ────────────────────────────────────────────── */}
        <TabsContent value="snoozed" className="mt-4">
          <SurfaceCard
            title="الإجراءات المؤجلة"
            description="إجراءات أخّرتها مؤقتاً. سيتم تذكيرك عند انتهاء مدة التأجيل."
            icon={Hourglass}
          >
            <DataTable
              columns={[
                { id: "title", label: "الإجراء" },
                { id: "subtitle", label: "التفاصيل" },
                { id: "type", label: "النوع" },
                { id: "snoozedUntil", label: "التذكير" },
                { id: "action", label: "الإجراء" },
              ]}
              data={snoozedItems}
              isLoading={snoozedLoading}
              isError={snoozedError}
              errorMessage="حدث خطأ أثناء تحميل الإجراءات المؤجلة."
              emptyState={{
                icon: Hourglass,
                message: "لا توجد إجراءات مؤجلة.",
                hint: "عند تأجيل أي إجراء سيظهر هنا مع موعد التذكير.",
              }}
              renderRow={(item) => {
                const config =
                  TYPE_CONFIG[item.type] ?? TYPE_CONFIG.DELIVERABLE_APPROVAL;
                const isBusy = busyId === item.id;
                const reminderLabel = item.reminderSentAt
                  ? "تم إرسال التذكير"
                  : formatReminderTime(item.snoozedUntil);
                return (
                  <tr
                    key={item.id}
                    className="border-b-[1.5px] border-portal-divider transition-colors hover:bg-portal-bg/40"
                  >
                    <td className="px-5 py-4 font-medium text-sm text-natural-100">
                      {item.title}
                    </td>
                    <td className="px-5 py-4 text-sm text-portal-note-text truncate max-w-[200px]">
                      {item.subtitle}
                    </td>
                    <td className="px-5 py-4">
                      <Pill
                        tone={config.color === "purple" ? "purple" : "blue"}
                      >
                        {config.label}
                      </Pill>
                    </td>
                    <td className="px-5 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <CalendarClock
                          className={`h-3.5 w-3.5 ${item.reminderSentAt ? "text-portal-note-text" : "text-secondary-500"}`}
                        />
                        <span
                          className={
                            item.reminderSentAt
                              ? "text-portal-note-text line-through"
                              : "text-natural-100"
                          }
                        >
                          {reminderLabel}
                        </span>
                        {item.reminderSentAt && (
                          <Pill tone="neutral">مُنبّه</Pill>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <ActionButton
                          variant="outline"
                          size="md"
                          onClick={() => handleUnsnooze(item)}
                          disabled={isBusy}
                          title="إلغاء التأجيل وإعادة الإجراء للقائمة"
                          className="gap-1.5 border-[1.5px] border-portal-card-border bg-natural-0 text-portal-note-text hover:bg-badge-gray-bg hover:text-secondary-500"
                        >
                          <Bell className="h-3.5 w-3.5" />
                          {isBusy ? "جاري الإلغاء..." : "إلغاء التأجيل"}
                        </ActionButton>
                        <ActionButton
                          variant="primary"
                          size="md"
                          onClick={() => router.push(item.actionUrl)}
                        >
                          <ExternalLink className="h-3.5 w-3.5 ml-1" />
                          اتخاذ إجراء
                        </ActionButton>
                      </div>
                    </td>
                  </tr>
                );
              }}
            />
          </SurfaceCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}