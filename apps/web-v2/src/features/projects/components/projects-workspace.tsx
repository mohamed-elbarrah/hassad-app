"use client";

import { useState } from "react";
import { FolderKanbanIcon } from "lucide-react";

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
import { ProjectsTable } from "@/features/projects/components/projects-table";
import {
  type ProjectDirectoryModelFilter,
  type ProjectDirectorySort,
  type ProjectDirectoryStatusFilter,
  type ProjectDirectoryTimelineFilter,
} from "@/features/projects/lib/project-directory";
import { useGetDeliveryWorkspaceQuery } from "@/lib/api/admin-projects-api";
import { useAppSelector } from "@/lib/store";
import { useTranslations } from "@/lib/i18n";

export function ProjectsWorkspace() {
  const { t } = useTranslations();
  const authStatus = useAppSelector((state) => state.auth.status);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<ProjectDirectoryStatusFilter>("all");
  const [modelFilter, setModelFilter] =
    useState<ProjectDirectoryModelFilter>("all-models");
  const [timelineFilter, setTimelineFilter] =
    useState<ProjectDirectoryTimelineFilter>("all-timelines");
  const [sort, setSort] = useState<ProjectDirectorySort>("highest-value");

  const { data, error, isError, isLoading, refetch } = useGetDeliveryWorkspaceQuery(
    {
      search,
      statusFilter,
      modelFilter,
      timelineFilter,
      sort,
    },
    {
      skip: authStatus !== "authenticated",
    },
  );
  const rows = data?.items ?? [];

  return (
    <PageScaffold
      title={t("projects")}
      description={t("projectPortfolioDescription")}
      actions={
        <>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("searchProjects")}
            aria-label={t("searchProjectsLabel")}
            className="sm:w-72"
          />

          <ToggleGroup
            value={[statusFilter]}
            onValueChange={(value) => {
              const nextValue = value[0];

              if (
                nextValue === "all" ||
                nextValue === "active" ||
                nextValue === "attention" ||
                nextValue === "completed"
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
            <ToggleGroupItem value="attention">{t("needsAttention")}</ToggleGroupItem>
            <ToggleGroupItem value="completed">{t("stateCompleted")}</ToggleGroupItem>
          </ToggleGroup>

          <Select
            value={modelFilter}
            onValueChange={(value) => {
              if (
                value === "all-models" ||
                value === "recurring" ||
                value === "one-off"
              ) {
                setModelFilter(value);
              }
            }}
          >
            <SelectTrigger size="sm" aria-label={t("allDeliveryModels")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all-models">{t("allDeliveryModels")}</SelectItem>
                <SelectItem value="recurring">{t("recurringRetainers")}</SelectItem>
                <SelectItem value="one-off">{t("oneOffProjects")}</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select
            value={timelineFilter}
            onValueChange={(value) => {
              if (
                value === "all-timelines" ||
                value === "ending-soon" ||
                value === "overdue" ||
                value === "archived"
              ) {
                setTimelineFilter(value);
              }
            }}
          >
            <SelectTrigger size="sm" aria-label={t("allTimelines")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all-timelines">{t("allTimelines")}</SelectItem>
                <SelectItem value="ending-soon">{t("ending21")}</SelectItem>
                <SelectItem value="overdue">{t("overdueBlocked")}</SelectItem>
                <SelectItem value="archived">{t("archivedOnly")}</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select
            value={sort}
            onValueChange={(value) => {
              if (
                value === "highest-value" ||
                value === "ending-soon" ||
                value === "newest"
              ) {
                setSort(value);
              }
            }}
          >
            <SelectTrigger size="sm" aria-label={t("sortProjects")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="highest-value">{t("highestValue")}</SelectItem>
                <SelectItem value="ending-soon">{t("endingSoon")}</SelectItem>
                <SelectItem value="newest">{t("newestStart")}</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>{t("projectPortfolio")}</CardTitle>
          <CardDescription>
            {t("projectPortfolioDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {authStatus !== "authenticated" || (isLoading && !data) ? (
            <WorkspaceQueryState
              kind="loading"
              loadingTitle={t("loadingProjects")}
              loadingDescription={t("loadingProjectsDescription")}
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
                  <FolderKanbanIcon />
                </EmptyMedia>
                <EmptyTitle>{t("noProjects")}</EmptyTitle>
                <EmptyDescription>
                  {t("adjustProjectFilters")}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ProjectsTable rows={rows} />
          )}
        </CardContent>
      </Card>
    </PageScaffold>
  );
}
