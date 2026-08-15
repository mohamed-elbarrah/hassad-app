"use client";

import Link from "next/link";
import { useState } from "react";
import { BriefcaseBusinessIcon } from "lucide-react";
import { LocalizedCurrency } from "@/components/patterns/localized-currency";
import { ClientSource } from "@hassad/shared";

import { PageScaffold } from "@/components/patterns/page-scaffold";
import { StatusBadge } from "@/components/patterns/status-badge";
import { Badge } from "@/components/ui/badge";
import { WorkspaceQueryState } from "@/components/patterns/workspace-query-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import {
  formatOrderSource,
  formatOrderStage,
  formatProposalStatus,
  type OrderDateFilter,
  type OrderDirectoryFilter,
  type OrderValueFilter,
} from "@/features/crm-orders/lib/order-directory";
import { translateRequestLabel, useTranslations } from "@/lib/i18n";
import { useGetAdminRequestsWorkspaceQuery } from "@/lib/api/admin-requests-api";

export function OrdersWorkspace() {
  const { locale, t } = useTranslations();
  const [statusFilter, setStatusFilter] = useState<OrderDirectoryFilter>("all");
  const [kindFilter, setKindFilter] = useState<"all" | "lead" | "order">("all");
  const [dateFilter, setDateFilter] = useState<OrderDateFilter>("last-30-days");
  const [valueFilter, setValueFilter] = useState<OrderValueFilter>("all-values");

  const { data, error, isError, isLoading, refetch } = useGetAdminRequestsWorkspaceQuery({
    kind: kindFilter,
    statusFilter,
    dateFilter,
    valueFilter,
  });
  const rows = data?.items ?? [];

  return (
    <PageScaffold
      title={t("requests")}
      description={t("requestPipelineDescription")}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <ToggleGroup
            value={[statusFilter]}
            onValueChange={(value) => {
              const nextValue = value[0];

              if (
                nextValue === "all" ||
                nextValue === "active" ||
                nextValue === "waiting-approval" ||
                nextValue === "stalled"
              ) {
                setStatusFilter(nextValue);
              }
            }}
            variant="outline"
            size="sm"
            spacing={0}
          >
            <ToggleGroupItem value="all">{t("all")}</ToggleGroupItem>
            <ToggleGroupItem value="active">{t("active")}</ToggleGroupItem>
            <ToggleGroupItem value="waiting-approval">{t("waitingApproval")}</ToggleGroupItem>
            <ToggleGroupItem value="stalled">{t("stalled")}</ToggleGroupItem>
          </ToggleGroup>

          <ToggleGroup
            value={[kindFilter]}
            onValueChange={(value) => {
              const nextValue = value[0];
              if (nextValue === "all" || nextValue === "lead" || nextValue === "order") {
                setKindFilter(nextValue);
              }
            }}
            variant="outline"
            size="sm"
            spacing={0}
          >
            <ToggleGroupItem value="all">{t("allTypes")}</ToggleGroupItem>
            <ToggleGroupItem value="lead">{t("leads")}</ToggleGroupItem>
            <ToggleGroupItem value="order">{t("orders")}</ToggleGroupItem>
          </ToggleGroup>

          <Select
            value={dateFilter}
            onValueChange={(value) => {
              if (
                value === "all-time" ||
                value === "last-7-days" ||
                value === "last-30-days" ||
                value === "last-90-days"
              ) {
                setDateFilter(value);
              }
            }}
          >
            <SelectTrigger size="sm" aria-label={t("filterRequestsDate")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all-time">{t("allDates")}</SelectItem>
                <SelectItem value="last-7-days">{t("openedLast7")}</SelectItem>
                <SelectItem value="last-30-days">{t("openedLast30")}</SelectItem>
                <SelectItem value="last-90-days">{t("openedLast90")}</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select
            value={valueFilter}
            onValueChange={(value) => {
              if (
                value === "all-values" ||
                value === "under-15000" ||
                value === "15000-30000" ||
                value === "30000-50000" ||
                value === "50000-plus"
              ) {
                setValueFilter(value);
              }
            }}
          >
            <SelectTrigger size="sm" aria-label={t("filterRequestsValue")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all-values">{t("allValues")}</SelectItem>
                <SelectItem value="under-15000">{t("under15k")}</SelectItem>
                <SelectItem value="15000-30000">{t("from15to30k")}</SelectItem>
                <SelectItem value="30000-50000">{t("from30to50k")}</SelectItem>
                <SelectItem value="50000-plus">{t("above50k")}</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>{t("requestPipeline")}</CardTitle>
          <CardDescription>
            Each row shows the CRM state, value, follow-up discipline, and proposal or contract signal that matters before project handoff.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && !data ? (
            <WorkspaceQueryState
              kind="loading"
              loadingTitle={t("loadingCrmRequests")}
              loadingDescription={t("loadingCrmRequestsDescription")}
            />
          ) : isError && !data ? (
            <WorkspaceQueryState
              kind="error"
              error={error}
              onRetry={() => {
                void refetch();
              }}
            />
          ) : rows.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <BriefcaseBusinessIcon />
                </EmptyMedia>
                <EmptyTitle>{t("noRequests")}</EmptyTitle>
                <EmptyDescription>
                  {t("adjustRequestFilters")}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("request")}</TableHead>
                  <TableHead>{t("type")}</TableHead>
                  <TableHead>{t("stage")}</TableHead>
                  <TableHead>{t("owner")}</TableHead>
                  <TableHead>{t("source")}</TableHead>
                  <TableHead className="text-right">{t("estimatedValue")}</TableHead>
                  <TableHead>{t("lastContact")}</TableHead>
                  <TableHead>{t("nextFollowUp")}</TableHead>
                  <TableHead>{t("proposal")}</TableHead>
                  <TableHead>{t("contract")}</TableHead>
                  <TableHead>{t("aging")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="flex min-w-0 flex-col gap-1">
                        <Link
                          href={`/admin/crm/orders/${row.id}`}
                          className="font-medium hover:underline"
                        >
                          {row.companyName}
                        </Link>
                        <span className="truncate text-sm text-muted-foreground">
                          {row.contactName} · {row.serviceLine}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {translateRequestLabel(locale, row.kind === "order" ? "Order" : "Lead")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge tone={row.stageTone}>
                        {translateRequestLabel(locale, formatOrderStage(row.crmStage ?? row.stage))}
                      </StatusBadge>
                    </TableCell>
                    <TableCell>{row.owner}</TableCell>
                    <TableCell>{translateRequestLabel(locale, formatOrderSource(row.source as ClientSource))}</TableCell>
                    <TableCell className="text-right font-medium">
                      <LocalizedCurrency amount={row.estimatedValue} />
                    </TableCell>
                    <TableCell>{row.lastContact}</TableCell>
                    <TableCell>
                      <div className="flex min-w-0 flex-col gap-1">
                        <span>{row.nextFollowUp}</span>
                        <span className="truncate text-sm text-muted-foreground">
                          {row.nextStep}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge tone={row.proposalTone}>
                        {translateRequestLabel(locale, formatProposalStatus(row.proposalStatus))}
                      </StatusBadge>
                    </TableCell>
                    <TableCell>
                      <div className="flex min-w-0 flex-col gap-1">
                        <StatusBadge tone={row.contractTone}>
                          {translateRequestLabel(locale, row.contractState)}
                        </StatusBadge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge tone={row.agingTone}>{translateRequestLabel(locale, row.agingLabel)}</StatusBadge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </PageScaffold>
  );
}
