"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Columns3, FolderKanban, Search, Table2 } from "lucide-react";
import { ProjectStatus } from "@hassad/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
import { PmStatusBadge } from "@/components/dashboard/pm/shared/PmStatusBadge";
import { ProjectKanbanBoard } from "@/components/dashboard/pm/ProjectKanbanBoard";
import { PageHeader } from "@/components/common/PageHeader";
import {
  type ProjectListItem,
  useGetProjectsQuery,
} from "@/features/projects/projectsApi";
import { formatDate } from "@/lib/format";
import { useAppSelector } from "@/lib/hooks";
import { PROJECT_STATUS_LABELS } from "@/lib/utils/project-status";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PAGE_SIZE = 12;

export default function PmProjectsPage() {
  const { user } = useAppSelector((state) => state.auth);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"ALL" | ProjectStatus>("ALL");
  const { data, isLoading, isError } = useGetProjectsQuery(
    {
      search: search || undefined,
      status: status === "ALL" ? undefined : status,
      projectManagerId: user?.role === "PM" ? user.id : undefined,
      page: view === "table" ? page : undefined,
      limit: view === "table" ? PAGE_SIZE : 100,
    },
    { skip: !user },
  );
  if (!user) return null;

  return (
    <main dir="rtl" className="flex flex-col gap-6">
      <PageHeader
        title="المشاريع"
        description="إدارة ومتابعة جميع المشاريع تحت إدارتك."
        icon={FolderKanban}
      />

      <div className="flex flex-col gap-3 border-b pb-6 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="ابحث عن مشروع..."
            aria-label="البحث عن مشروع"
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
          <SelectTrigger className="lg:w-56" aria-label="تصفية المشاريع حسب الحالة">
            <SelectValue placeholder="كل الحالات" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="ALL">كل الحالات</SelectItem>
              {Object.values(ProjectStatus).map((value) => (
                <SelectItem key={value} value={value}>
                  {PROJECT_STATUS_LABELS[value]}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Tabs
          value={view}
          onValueChange={(value) => {
            setView(value as "kanban" | "table");
            setPage(1);
          }}
        >
          <TabsList>
            <TabsTrigger value="kanban">
              <Columns3 data-icon="inline-start" />
              كانبان
            </TabsTrigger>
            <TabsTrigger value="table">
              <Table2 data-icon="inline-start" />
              جدول
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {view === "kanban" && (
        <ProjectKanbanBoard
          projectManagerId={user.role === "PM" ? user.id : undefined}
          search={search || undefined}
          status={status === "ALL" ? undefined : status}
        />
      )}
      {view === "table" && isLoading && <ProjectTableSkeleton />}
      {view === "table" && isError && (
        <Card>
          <CardContent className="p-6">
            <PageEmpty
              title="تعذر تحميل المشاريع"
              description="يرجى تحديث الصفحة والمحاولة مرة أخرى."
            />
          </CardContent>
        </Card>
      )}
      {view === "table" &&
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
            <ProjectTable projects={data.items} />
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

function ProjectTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            {Array.from({ length: 7 }).map((_, index) => (
              <TableHead key={index}>
                <Skeleton className="h-4 w-full" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 6 }).map((_, row) => (
            <TableRow key={row}>
              {Array.from({ length: 7 }).map((_, cell) => (
                <TableCell key={cell}>
                  <Skeleton className="h-5 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ProjectTable({ projects }: { projects: ProjectListItem[] }) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <caption className="sr-only">قائمة المشاريع</caption>
        <TableHeader>
          <TableRow>
            <TableHead>المشروع</TableHead>
            <TableHead>العميل</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead>التقدم</TableHead>
            <TableHead>الفترة</TableHead>
            <TableHead>المهام</TableHead>
            <TableHead className="text-left">التفاصيل</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => {
            const progress = Math.round(
              project.progress ?? project.completionPercentage ?? 0,
            );

            return (
              <TableRow key={project.id}>
                <TableCell className="min-w-52">
                  <Link
                    href={`/dashboard/pm/projects/${project.id}`}
                    className="font-medium transition-colors hover:text-primary"
                  >
                    {project.name}
                  </Link>
                  {project.manager && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {project.manager.name}
                    </p>
                  )}
                </TableCell>
                <TableCell>{project.client?.companyName ?? "—"}</TableCell>
                <TableCell>
                  <PmStatusBadge domain="project" status={project.status} />
                </TableCell>
                <TableCell className="min-w-36">
                  <div className="flex items-center gap-3">
                    <Progress value={progress} className="h-2" />
                    <span className="w-10 text-sm text-muted-foreground">
                      {progress}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatDate(project.startDate)} – {formatDate(project.endDate)}
                </TableCell>
                <TableCell>{project._count?.tasks ?? "—"}</TableCell>
                <TableCell className="text-left">
                  <Link
                    href={`/dashboard/pm/projects/${project.id}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    فتح
                    <ArrowUpRight data-icon="inline-end" />
                  </Link>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
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
