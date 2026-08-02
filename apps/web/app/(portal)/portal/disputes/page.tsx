"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  MessageSquare,
  Plus,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { DisputeStatus } from "@hassad/shared";
import { PORTAL_POLLING_INTERVAL_MS } from "@/lib/constants";
import {
  useCreateDisputeMutation,
  useGetClientDisputesQuery,
} from "@/features/portal/portalApi";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DisputeCategoryIcon } from "@/components/disputes/DisputeCategoryIcon";
import { DisputeEmptyState } from "@/components/disputes/DisputeEmptyState";
import { DisputeStatusBadge } from "@/components/disputes/DisputeStatusBadge";
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
    <main dir="rtl" className="flex flex-col gap-6">
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
        {isError ? (
          <CardContent className="pt-6">
            <DisputeEmptyState hasFilter canCreate={false} />
          </CardContent>
        ) : isLoading ? (
          <CardContent className="flex flex-col gap-3 pt-6">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </CardContent>
        ) : filtered.length === 0 ? (
          <CardContent className="pt-6">
            <DisputeEmptyState
              hasFilter={!!search || !!activeTab}
              onCreateNew={() => setIsNewDisputeOpen(true)}
              canCreate
            />
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>التذكرة</TableHead>
                <TableHead>العنوان</TableHead>
                <TableHead>التصنيف</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>فتحت في</TableHead>
                <TableHead>الرسائل</TableHead>
                <TableHead className="text-end">
                  <span className="sr-only">الإجراء</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((dispute) => (
                <TableRow key={dispute.id}>
                  <TableCell className="font-medium text-muted-foreground">
                    #{dispute.ticketNumber.toString().padStart(3, "0")}
                  </TableCell>
                  <TableCell>
                    <p className="line-clamp-2 font-medium">{dispute.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {dispute.project.name}
                    </p>
                  </TableCell>
                  <TableCell>
                    <DisputeCategoryIcon
                      category={dispute.category}
                      size="sm"
                      showLabel
                    />
                  </TableCell>
                  <TableCell>
                    <DisputeStatusBadge status={dispute.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3.5" />
                      {new Date(dispute.openedAt).toLocaleDateString("ar-SA")}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {dispute._count && dispute._count.messages > 0 ? (
                      <span className="flex items-center gap-1">
                        <MessageSquare className="size-3.5" />
                        {dispute._count.messages}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/portal/disputes/${dispute.id}`}>
                        <ArrowLeft />
                        استعراض
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <NewDisputeDialog
        isOpen={isNewDisputeOpen}
        onClose={() => setIsNewDisputeOpen(false)}
        onSubmit={handleCreateDispute}
        isLoading={isCreating}
        projectId={projectIdFromUrl || undefined}
      />
    </main>
  );
}
