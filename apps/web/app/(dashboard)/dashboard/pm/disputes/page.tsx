"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, RefreshCw, ShieldAlert, Ticket } from "lucide-react";
import type { DisputeStatus } from "@hassad/shared";
import { useGetPmDisputesQuery } from "@/features/disputes/pmDisputesApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DisputeEmptyState } from "@/components/disputes/DisputeEmptyState";
import { PmDisputeCard } from "@/components/disputes/PmDisputeCard";

const PAGE_SIZE = 9;

const TABS = [
  { value: "", label: "الكل", icon: Ticket },
  { value: "APPROVED", label: "جديدة", icon: Clock3 },
  { value: "IN_PROGRESS", label: "قيد المعالجة", icon: Clock3 },
  { value: "ESCALATED", label: "مصعدة", icon: AlertTriangle },
  { value: "RESOLVED", label: "تم حلها", icon: CheckCircle2 },
] as const;

export default function PmDisputesPage() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch, isFetching } = useGetPmDisputesQuery(
    {
      status: (activeTab || undefined) as DisputeStatus | undefined,
      page,
      limit: PAGE_SIZE,
    },
    { pollingInterval: 60_000 },
  );

  const disputes = useMemo(() => data?.data ?? [], [data?.data]);
  const total = data?.meta?.total ?? 0;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return disputes;
    return disputes.filter((item) =>
      [item.title, item.client.name, item.project.name]
        .some((value) => value.toLowerCase().includes(query)),
    );
  }, [disputes, search]);

  const metrics = {
    active: disputes.filter((item) => ["APPROVED", "IN_PROGRESS"].includes(item.status)).length,
    escalated: disputes.filter((item) => item.status === "ESCALATED").length,
    resolved: disputes.filter((item) => ["RESOLVED", "CLOSED"].includes(item.status)).length,
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
                راقب التذاكر المفتوحة ضد مشاريعك وتعامل معها من مساحة موحدة.
              </CardDescription>
            </div>
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw data-icon="inline-start" />
            {isFetching ? "جارٍ التحديث" : "تحديث"}
          </Button>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "نشطة", value: metrics.active, icon: Clock3 },
          { label: "مصعدة", value: metrics.escalated, icon: AlertTriangle },
          { label: "تم حلها / مغلقة", value: metrics.resolved, icon: CheckCircle2 },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="flex items-start justify-between gap-4 p-5">
              <div>
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold">{item.value}</p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                <item.icon className="text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value); setPage(1); }}>
              <TabsList className="h-auto flex-wrap">
                {TABS.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="ابحث في النزاعات..."
              className="w-full lg:max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <DisputeEmptyState hasFilter={!!search || !!activeTab} canCreate={false} />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((dispute) => (
                <PmDisputeCard key={dispute.id} dispute={dispute} />
              ))}
            </div>
          )}
          {!isLoading && filtered.length > 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">إجمالي النتائج: {total}</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
