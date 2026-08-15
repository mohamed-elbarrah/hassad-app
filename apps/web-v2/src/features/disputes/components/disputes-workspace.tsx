"use client";

import { useMemo, useState } from "react";
import { ShieldAlertIcon } from "lucide-react";
import {
  DisputeCategory,
  DisputePriority,
  DisputeStatus,
} from "@hassad/shared";

import { PageScaffold } from "@/components/patterns/page-scaffold";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { DisputesTable } from "@/features/disputes/components/disputes-table";
import {
  formatDisputeCategory,
  formatDisputePriority,
  formatDisputeStatus,
  type DisputeDirectoryRecord,
  type DisputeQueueFilter,
  type DisputeStaleFilter,
} from "@/features/disputes/lib/dispute-directory";
import { mapDisputeIndexItem } from "@/features/admin-details/lib/admin-index-mappers";
import { useGetAdminDisputesQuery } from "@/lib/api/admin-disputes-api";
import { useAppSelector } from "@/lib/store";
import { translateRequestLabel, useTranslations } from "@/lib/i18n";

export function DisputesWorkspace() {
  const { locale, t } = useTranslations();
  const authStatus = useAppSelector((state) => state.auth.status);
  const [search, setSearch] = useState("");
  const [queue, setQueue] = useState<DisputeQueueFilter>("all");
  const [status, setStatus] = useState<DisputeStatus | "all-statuses">(
    "all-statuses"
  );
  const [category, setCategory] = useState<DisputeCategory | "all-categories">(
    "all-categories"
  );
  const [priority, setPriority] = useState<DisputePriority | "all-priorities">(
    "all-priorities"
  );
  const [pm, setPm] = useState<string | "all-pms">("all-pms");
  const [stale, setStale] = useState<DisputeStaleFilter>("all-activity");

  const { data, error, isError, isLoading, refetch } = useGetAdminDisputesQuery(
    {
      status: status === "all-statuses" ? undefined : status,
      category: category === "all-categories" ? undefined : category,
      priority: priority === "all-priorities" ? undefined : priority,
      page: 1,
      limit: 100,
    },
    { skip: authStatus !== "authenticated" },
  );

  const mappedRows = useMemo<DisputeDirectoryRecord[]>(
    () => (data?.data ?? []).map(mapDisputeIndexItem),
    [data?.data],
  );

  const rows = useMemo<DisputeDirectoryRecord[]>(() => {
    const query = search.trim().toLowerCase();

    return mappedRows
      .filter((row: DisputeDirectoryRecord) => {
        if (!query) return true;
        return [
          row.ticketNumber,
          row.title,
          row.clientName,
          row.projectName,
          row.pmName,
          formatDisputeCategory(row.category),
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .filter((row: DisputeDirectoryRecord) => {
        if (queue === "pending-approval") {
          return row.status === DisputeStatus.PENDING_APPROVAL;
        }
        if (queue === "escalated") {
          return row.status === DisputeStatus.ESCALATED;
        }
        if (queue === "active") {
          return [
            DisputeStatus.APPROVED,
            DisputeStatus.IN_PROGRESS,
            DisputeStatus.PENDING_CLIENT,
          ].includes(row.status);
        }
        if (queue === "resolved") {
          return [DisputeStatus.RESOLVED, DisputeStatus.CLOSED].includes(row.status);
        }
        return true;
      })
      .filter((row: DisputeDirectoryRecord) => (pm === "all-pms" ? true : row.pmName === pm))
      .filter((row: DisputeDirectoryRecord) => {
        if (stale === "stale-3-days") return row.staleDays >= 3;
        if (stale === "stale-7-days") return row.staleDays >= 7;
        return true;
      });
  }, [mappedRows, pm, queue, search, stale]);

  const pmOptions = useMemo<string[]>(
    () => Array.from(new Set(mappedRows.map((row) => row.pmName).filter(Boolean))).sort(),
    [mappedRows],
  );

  return (
    <PageScaffold
      title={t("disputes")}
      description={t("resolutionQueueDescription")}
      actions={
        <>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("searchDisputes")}
            aria-label={t("searchDisputesLabel")}
            className="sm:w-80"
          />

          <ToggleGroup
            value={[queue]}
            onValueChange={(value) => {
              const nextValue = value[0];

              if (
                nextValue === "all" ||
                nextValue === "pending-approval" ||
                nextValue === "escalated" ||
                nextValue === "active" ||
                nextValue === "resolved"
              ) {
                setQueue(nextValue);
              }
            }}
            variant="outline"
            size="sm"
            spacing={0}
          >
            <ToggleGroupItem value="all">{t("all")}</ToggleGroupItem>
            <ToggleGroupItem value="pending-approval">{t("pendingApproval")}</ToggleGroupItem>
            <ToggleGroupItem value="escalated">{t("escalated")}</ToggleGroupItem>
            <ToggleGroupItem value="active">{t("active")}</ToggleGroupItem>
            <ToggleGroupItem value="resolved">{t("resolved")}</ToggleGroupItem>
          </ToggleGroup>

          <Select<string>
            value={status}
            onValueChange={(value) => {
              if (!value) {
                return;
              }

              if (
                value === "all-statuses" ||
                Object.values(DisputeStatus).includes(value as DisputeStatus)
              ) {
                setStatus(value as DisputeStatus | "all-statuses");
              }
            }}
          >
            <SelectTrigger size="sm" aria-label={t("status")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all-statuses">{t("allStatuses")}</SelectItem>
                {Object.values(DisputeStatus).map((value) => (
                  <SelectItem key={value} value={value}>
                    {translateRequestLabel(locale, formatDisputeStatus(value))}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select<string>
            value={category}
            onValueChange={(value) => {
              if (!value) {
                return;
              }

              if (
                value === "all-categories" ||
                Object.values(DisputeCategory).includes(value as DisputeCategory)
              ) {
                setCategory(value as DisputeCategory | "all-categories");
              }
            }}
          >
            <SelectTrigger size="sm" aria-label={t("category")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all-categories">{t("allCategories")}</SelectItem>
                {Object.values(DisputeCategory).map((value) => (
                  <SelectItem key={value} value={value}>
                    {translateRequestLabel(locale, formatDisputeCategory(value))}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select<string>
            value={priority}
            onValueChange={(value) => {
              if (!value) {
                return;
              }

              if (
                value === "all-priorities" ||
                Object.values(DisputePriority).includes(value as DisputePriority)
              ) {
                setPriority(value as DisputePriority | "all-priorities");
              }
            }}
          >
            <SelectTrigger size="sm" aria-label={t("priority")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all-priorities">{t("allPriorities")}</SelectItem>
                {Object.values(DisputePriority).map((value) => (
                  <SelectItem key={value} value={value}>
                    {translateRequestLabel(locale, formatDisputePriority(value))}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select<string>
            value={pm}
            onValueChange={(value) => {
              if (!value) {
                return;
              }

              if (value === "all-pms" || pmOptions.includes(value)) {
                setPm(value);
              }
            }}
          >
            <SelectTrigger size="sm" aria-label={t("projectManager")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all-pms">{t("allPms")}</SelectItem>
                {pmOptions.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select<string>
            value={stale}
            onValueChange={(value) => {
              if (!value) {
                return;
              }

              if (
                value === "all-activity" ||
                value === "stale-3-days" ||
                value === "stale-7-days"
              ) {
                setStale(value);
              }
            }}
          >
            <SelectTrigger size="sm" aria-label={t("lastActivity")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all-activity">{t("allActivity")}</SelectItem>
                <SelectItem value="stale-3-days">{t("stale3")}</SelectItem>
                <SelectItem value="stale-7-days">{t("stale7")}</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>{t("resolutionQueue")}</CardTitle>
          <CardDescription>
            {t("resolutionQueueDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {authStatus !== "authenticated" || (isLoading && !data) ? (
            <WorkspaceQueryState
              kind="loading"
              loadingTitle={t("loadingDisputes")}
              loadingDescription={t("loadingDisputesDescription")}
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
                  <ShieldAlertIcon />
                </EmptyMedia>
                <EmptyTitle>{t("noDisputes")}</EmptyTitle>
                <EmptyDescription>
                  {t("adjustDisputeFilters")}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <DisputesTable rows={rows} />
          )}
        </CardContent>
      </Card>
    </PageScaffold>
  );
}
