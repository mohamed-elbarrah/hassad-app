"use client";

import type { KeyboardEvent, MouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  CircleDollarSign,
  ClipboardList,
  Phone,
  UserRound,
} from "lucide-react";
import { REQUEST_STATUS_AR } from "@hassad/shared";
import type { CreateRequestContactLogPayload } from "@/features/requests/requestsApi";
import type { SalesPipelineItem } from "@/features/sales/salesApi";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatCurrency,
  formatDateTime,
  formatNumber,
  formatRelativeTime,
} from "@/lib/format";
import { SalesPipelineActions } from "./SalesPipelineActions";
import {
  getDealValue,
  getInitials,
  getRequestStatusBadgeVariant,
  getSalesPipelineDisplayName,
  getServicePreview,
} from "./presentation";

interface SalesPipelineTableProps {
  requests: SalesPipelineItem[];
  onCreateProposal?: (request: SalesPipelineItem) => void;
  onEditProposal?: (request: SalesPipelineItem) => void;
  onCreateContract?: (request: SalesPipelineItem) => void;
  onEditContract?: (request: SalesPipelineItem) => void;
  onAddContactLog?: (
    request: SalesPipelineItem,
    payload: CreateRequestContactLogPayload,
  ) => Promise<void>;
  isAddingContactLog?: boolean;
}

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest("a,button"));
}

export function SalesPipelineTable({
  requests,
  onCreateProposal,
  onEditProposal,
  onCreateContract,
  onEditContract,
  onAddContactLog,
  isAddingContactLog,
}: SalesPipelineTableProps) {
  const router = useRouter();

  function openRequest(request: SalesPipelineItem) {
    router.push(`/dashboard/sales/requests/${request.id}`);
  }

  function handleRowClick(
    event: MouseEvent<HTMLTableRowElement>,
    request: SalesPipelineItem,
  ) {
    if (isInteractiveTarget(event.target)) return;
    openRequest(request);
  }

  function handleRowKeyDown(
    event: KeyboardEvent<HTMLTableRowElement>,
    request: SalesPipelineItem,
  ) {
    if (isInteractiveTarget(event.target)) return;
    if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    openRequest(request);
  }

  return (
    <div className="rounded-xl border">
      <Table className="min-w-max">
        <TableHeader>
          <TableRow>
            <TableHead>العميل</TableHead>
            <TableHead>المرحلة</TableHead>
            <TableHead>الخدمات والقيمة</TableHead>
            <TableHead>المتابعة</TableHead>
            <TableHead>آخر تحديث</TableHead>
            <TableHead>الإجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="p-0">
                <Empty className="py-10">
                  <EmptyMedia variant="icon">
                    <ClipboardList />
                  </EmptyMedia>
                  <EmptyHeader>
                    <EmptyTitle>لا توجد فرص مطابقة</EmptyTitle>
                    <EmptyDescription>
                      جرّب تغيير البحث أو الفلتر لعرض نتائج أخرى.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </TableCell>
            </TableRow>
          ) : (
            requests.map((request) => {
              const displayName = getSalesPipelineDisplayName(request);
              const dealValue = getDealValue(request);

              return (
                <TableRow
                  key={request.id}
                  tabIndex={0}
                  aria-label={`فتح تفاصيل ${displayName}`}
                  className="cursor-pointer focus-visible:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                  onClick={(event) => handleRowClick(event, request)}
                  onKeyDown={(event) => handleRowKeyDown(event, request)}
                >
                  <TableCell className="align-top">
                    <Link
                      href={`/dashboard/sales/requests/${request.id}`}
                      className="flex min-w-64 items-start gap-3 transition-colors hover:text-primary"
                    >
                      <Avatar className="size-10 shrink-0">
                        <AvatarFallback className="text-xs">
                          {getInitials(displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="flex min-w-0 flex-col gap-1">
                        <span className="truncate font-medium text-foreground">
                          {displayName}
                        </span>
                        <span className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                          <Building2 className="size-3 shrink-0" />
                          {request.companyName}
                        </span>
                        <span
                          dir="ltr"
                          className="flex items-center gap-1 truncate text-xs text-muted-foreground"
                        >
                          <Phone className="size-3 shrink-0" />
                          {request.phoneWhatsapp}
                        </span>
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="align-top">
                    <Badge
                      variant={getRequestStatusBadgeVariant(request.status)}
                    >
                      {REQUEST_STATUS_AR[request.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="flex min-w-48 flex-col gap-2">
                      <span className="flex items-center gap-1 text-sm">
                        <ClipboardList className="size-3 shrink-0 text-muted-foreground" />
                        {getServicePreview(request)}
                      </span>
                      {dealValue !== null ? (
                        <span className="flex items-center gap-1 text-sm font-medium">
                          <CircleDollarSign className="size-3 shrink-0 text-muted-foreground" />
                          {formatCurrency(dealValue)}
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="flex min-w-48 flex-col gap-1 text-sm">
                      <span className="flex items-center gap-1">
                        <UserRound className="size-3 shrink-0 text-muted-foreground" />
                        {request.assignee?.name || "غير مسند"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        محاولات التواصل:{" "}
                        {formatNumber(request.contactAttemptCount)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {request.lastContactAt
                          ? `آخر تواصل ${formatRelativeTime(request.lastContactAt)}`
                          : "لم يتم التواصل بعد"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="align-top">
                    <span className="flex min-w-32 flex-col gap-1">
                      <span className="text-sm">
                        {formatDateTime(request.updatedAt)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        آخر تعديل على الطلب
                      </span>
                    </span>
                  </TableCell>
                  <TableCell className="align-top">
                    <SalesPipelineActions
                      request={request}
                      onCreateProposal={onCreateProposal}
                      onEditProposal={onEditProposal}
                      onCreateContract={onCreateContract}
                      onEditContract={onEditContract}
                      onAddContactLog={onAddContactLog}
                      canAddContactLog={request.capabilities.canLogContact}
                      isAddingContactLog={isAddingContactLog}
                      className="justify-start"
                    />
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
