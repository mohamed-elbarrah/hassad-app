"use client";

import { useMemo, useState } from "react";
import { Columns3, FolderKanban, LayoutGrid, Search } from "lucide-react";
import { ProjectStatus } from "@hassad/shared";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectCard } from "@/components/dashboard/pm/ProjectCard";
import { ProjectForm } from "@/components/dashboard/pm/ProjectForm";
import { ProjectKanbanBoard } from "@/components/dashboard/pm/ProjectKanbanBoard";
import { useGetProjectsQuery } from "@/features/projects/projectsApi";
import { useAppSelector } from "@/lib/hooks";
import { PROJECT_STATUS_LABELS } from "@/lib/utils/project-status";

const PAGE_SIZE = 12;

export default function PmProjectsPage() {
  const { user } = useAppSelector((state) => state.auth);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"kanban" | "cards">("kanban");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"ALL" | ProjectStatus>("ALL");
  const { data: allData } = useGetProjectsQuery(
    { projectManagerId: user?.role === "PM" ? user.id : undefined, limit: 100 },
    { skip: !user },
  );
  const { data, isLoading, isError } = useGetProjectsQuery(
    {
      search: search || undefined,
      status: status === "ALL" ? undefined : status,
      projectManagerId: user?.role === "PM" ? user.id : undefined,
      page: view === "cards" ? page : undefined,
      limit: view === "cards" ? PAGE_SIZE : 100,
    },
    { skip: !user },
  );
  const statusCounts = useMemo(
    () =>
      (allData?.items ?? []).reduce<Record<string, number>>(
        (counts, project) => {
          counts[project.status] = (counts[project.status] || 0) + 1;
          return counts;
        },
        {},
      ),
    [allData],
  );

  if (!user) return null;

  return (
    <main dir="rtl" className="flex flex-col gap-6">
      <Card>
        <CardHeader className="gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted">
              <FolderKanban />
            </div>
            <div className="flex flex-col gap-1">
              <CardTitle className="text-2xl">المشاريع</CardTitle>
              <CardDescription>
                إدارة ومتابعة جميع المشاريع تحت إدارتك.
              </CardDescription>
            </div>
          </div>
          <ProjectForm currentUserId={user.id} />
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4 p-6">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="ابحث عن مشروع..."
                className="pr-10"
              />
            </div>
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value as "ALL" | ProjectStatus);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="كل الحالات" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="ALL">كل الحالات</SelectItem>
                  {Object.values(ProjectStatus).map((value) => (
                    <SelectItem key={value} value={value}>
                      {PROJECT_STATUS_LABELS[value]} ({statusCounts[value] || 0})
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Tabs
              value={view}
              onValueChange={(value) => {
                setView(value as "kanban" | "cards");
                setPage(1);
              }}
            >
              <TabsList>
                <TabsTrigger value="kanban">
                  <Columns3 data-icon="inline-start" />
                  كانبان
                </TabsTrigger>
                <TabsTrigger value="cards">
                  <LayoutGrid data-icon="inline-start" />
                  بطاقات
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {view === "kanban" && (
        <ProjectKanbanBoard
          projectManagerId={user.role === "PM" ? user.id : undefined}
          search={search || undefined}
          status={status === "ALL" ? undefined : status}
        />
      )}
      {view === "cards" && isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-60" />
          ))}
        </div>
      )}
      {view === "cards" && isError && (
        <Card>
          <CardContent className="p-6">
            <PageEmpty
              title="تعذر تحميل المشاريع"
              description="يرجى تحديث الصفحة والمحاولة مرة أخرى."
            />
          </CardContent>
        </Card>
      )}
      {view === "cards" &&
        !isLoading &&
        !isError &&
        data &&
        (data.items.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <PageEmpty
                title="لا توجد مشاريع"
                description="ستظهر المشاريع المسندة إليك هنا."
              />
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {data.items.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
            <PagePagination
              page={page}
              totalPages={data.totalPages ?? 1}
              onPageChange={setPage}
            />
          </>
        ))}
    </main>
  );
}

function PageEmpty({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FolderKanban />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function PagePagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            text="السابق"
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
          />
        </PaginationItem>
        {Array.from({ length: totalPages }, (_, index) => index + 1).map(
          (item) => (
            <PaginationItem key={item}>
              <PaginationLink
                isActive={item === page}
                onClick={() => onPageChange(item)}
              >
                {item}
              </PaginationLink>
            </PaginationItem>
          ),
        )}
        <PaginationItem>
          <PaginationNext
            text="التالي"
            disabled={page === totalPages}
            onClick={() => onPageChange(page + 1)}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
