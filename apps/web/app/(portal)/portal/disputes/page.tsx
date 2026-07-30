"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, RefreshCw, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { DisputeStatus } from "@hassad/shared";
import { PORTAL_POLLING_INTERVAL_MS } from "@/lib/constants";
import {
  useCreateDisputeMutation,
  useGetClientDisputesQuery,
} from "@/features/portal/portalApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DisputeCard } from "@/components/disputes/DisputeCard";
import { DisputeEmptyState } from "@/components/disputes/DisputeEmptyState";
import { NewDisputeDialog } from "@/components/disputes/NewDisputeDialog";

const PAGE_SIZE = 9;

const STATUS_TABS = [
  { value: "", label: "الكل" },
  { value: DisputeStatus.PENDING_APPROVAL, label: "بانتظار الموافقة" },
  { value: DisputeStatus.IN_PROGRESS, label: "قيد المعالجة" },
  { value: DisputeStatus.PENDING_CLIENT, label: "بانتظار تأكيدي" },
  { value: DisputeStatus.ESCALATED, label: "تم التصعيد" },
  { value: DisputeStatus.RESOLVED, label: "تم الحل" },
] as const;

export default function PortalDisputesPage() {
  const searchParams = useSearchParams();
  const projectIdFromUrl = searchParams.get("projectId") || undefined;

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState("");
  const [isNewDisputeOpen, setIsNewDisputeOpen] = useState(!!projectIdFromUrl);

  const { data, isLoading, isError, refetch, isFetching } = useGetClientDisputesQuery(
    {
      status: (activeTab || undefined) as DisputeStatus | undefined,
      page,
      limit: PAGE_SIZE,
    },
    { pollingInterval: PORTAL_POLLING_INTERVAL_MS },
  );

  const [createDispute, { isLoading: isCreating }] = useCreateDisputeMutation();
  const disputes = useMemo(() => data?.data ?? [], [data?.data]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return disputes;
    return disputes.filter((item) =>
      [item.title, item.project.name].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [disputes, search]);

  const handleCreateDispute = async (
    input: import("@hassad/shared").CreateDisputeInput,
    files?: File[],
  ) => {
    try {
      await createDispute({ ...input, files }).unwrap();
      toast.success("تم إرسال التذكرة");
      setIsNewDisputeOpen(false);
      refetch();
    } catch (error: any) {
      const message = error?.data?.error?.message || "حدث خطأ أثناء إرسال التذكرة";
      toast.error(message);
    }
  };

  return (
    <div dir="rtl" className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader className="gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldAlert />
            </div>
            <div className="flex flex-col gap-1">
              <CardTitle className="text-2xl">نزاعاتي</CardTitle>
              <CardDescription>
                افتح تذكرة جديدة أو تابع حالة التذاكر الحالية من شاشة واحدة.
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw data-icon="inline-start" />
              {isFetching ? "جارٍ التحديث" : "تحديث"}
            </Button>
            <Button onClick={() => setIsNewDisputeOpen(true)}>
              <Plus data-icon="inline-start" />
              تذكرة جديدة
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value); setPage(1); }}>
              <TabsList className="h-auto flex-wrap">
                {STATUS_TABS.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <Input
              placeholder="ابحث في التذاكر..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full lg:max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isError ? (
            <DisputeEmptyState hasFilter canCreate={false} />
          ) : isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <DisputeEmptyState
              hasFilter={!!search || !!activeTab}
              onCreateNew={() => setIsNewDisputeOpen(true)}
              canCreate
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((dispute) => (
                <DisputeCard key={dispute.id} dispute={dispute} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <NewDisputeDialog
        isOpen={isNewDisputeOpen}
        onClose={() => setIsNewDisputeOpen(false)}
        onSubmit={handleCreateDispute}
        isLoading={isCreating}
        projectId={projectIdFromUrl || undefined}
      />
    </div>
  );
}
