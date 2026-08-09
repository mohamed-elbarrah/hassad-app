"use client";

import { useMemo, useState } from "react";
import { FolderKanbanIcon } from "lucide-react";

import { PageScaffold } from "@/components/patterns/page-scaffold";
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
  getFilteredProjects,
  type ProjectDirectoryModelFilter,
  type ProjectDirectorySort,
  type ProjectDirectoryStatusFilter,
  type ProjectDirectoryTimelineFilter,
} from "@/features/projects/lib/project-directory";

export function ProjectsWorkspace() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<ProjectDirectoryStatusFilter>("all");
  const [modelFilter, setModelFilter] =
    useState<ProjectDirectoryModelFilter>("all-models");
  const [timelineFilter, setTimelineFilter] =
    useState<ProjectDirectoryTimelineFilter>("all-timelines");
  const [sort, setSort] = useState<ProjectDirectorySort>("highest-value");

  const rows = useMemo(
    () =>
      getFilteredProjects(
        search,
        statusFilter,
        modelFilter,
        timelineFilter,
        sort
      ),
    [modelFilter, search, sort, statusFilter, timelineFilter]
  );

  return (
    <PageScaffold
      title="Projects"
      description="Delivery portfolio view for PM ownership, current periods, workload risk, and contract-backed value across active and archived projects."
      actions={
        <>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search project, client, PM, or team"
            aria-label="Search projects"
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
            <ToggleGroupItem value="all">All</ToggleGroupItem>
            <ToggleGroupItem value="active">Active</ToggleGroupItem>
            <ToggleGroupItem value="attention">Needs attention</ToggleGroupItem>
            <ToggleGroupItem value="completed">Completed</ToggleGroupItem>
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
            <SelectTrigger size="sm" aria-label="Filter projects by model">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all-models">All delivery models</SelectItem>
                <SelectItem value="recurring">Recurring retainers</SelectItem>
                <SelectItem value="one-off">One-off projects</SelectItem>
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
            <SelectTrigger size="sm" aria-label="Filter projects by timeline">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all-timelines">All timelines</SelectItem>
                <SelectItem value="ending-soon">Ending in 21 days</SelectItem>
                <SelectItem value="overdue">Overdue or blocked</SelectItem>
                <SelectItem value="archived">Archived only</SelectItem>
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
            <SelectTrigger size="sm" aria-label="Sort projects">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="highest-value">Highest value</SelectItem>
                <SelectItem value="ending-soon">Ending soon</SelectItem>
                <SelectItem value="newest">Newest start date</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Delivery portfolio</CardTitle>
          <CardDescription>
            Each row shows the current delivery model, PM owner, active period signal,
            and the workload or billing risk that matters before you open project detail.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FolderKanbanIcon />
                </EmptyMedia>
                <EmptyTitle>No projects match these filters</EmptyTitle>
                <EmptyDescription>
                  Change the search, status, model, or timeline filters to inspect another delivery segment.
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
