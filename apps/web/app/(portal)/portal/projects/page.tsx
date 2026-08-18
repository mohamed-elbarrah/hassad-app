"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  ExternalLink,
  Filter,
  FolderOpen,
  Search,
  User,
  X,
} from "lucide-react";
import { ProjectStatus } from "@hassad/shared";

import { PORTAL_POLLING_INTERVAL_MS } from "@/lib/constants";
import { PageHeader } from "@/components/common/PageHeader";
import { formatShortDate } from "@/lib/format";
import { portalErrorMessage, portalProjectStatusLabel } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useGetPortalProjectsQuery } from "@/features/portal/portalApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationEllipsis,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_OPTIONS = Object.values(ProjectStatus) as ProjectStatus[];

const PAGE_SIZE = 9;

function ProjectBadge({ label, status }: { label: string; status: string }) {
  const variant =
    status === ProjectStatus.CANCELLED
      ? "destructive"
      : status === ProjectStatus.ACTIVE || status === ProjectStatus.COMPLETED
        ? "default"
        : "secondary";
  return <Badge variant={variant}>{label}</Badge>;
}

function getPaginationItems(
  currentPage: number,
  totalPages: number,
): Array<number | "ellipsis-start" | "ellipsis-end"> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "ellipsis-end", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      "ellipsis-start",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "ellipsis-start",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "ellipsis-end",
    totalPages,
  ];
}

function ProjectsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: PAGE_SIZE }).map((_, index) => (
        <Skeleton key={index} className="h-64 w-full" />
      ))}
    </div>
  );
}

export default function PortalProjectsPage() {
  const [status, setStatus] = useState<ProjectStatus | "">("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  const { data, error, isLoading, isError } = useGetPortalProjectsQuery(
    {
      status: status || undefined,
      search: debouncedSearch || undefined,
      page,
      limit: PAGE_SIZE,
    },
    { pollingInterval: PORTAL_POLLING_INTERVAL_MS },
  );
  const projects = data?.data ?? [];
  const totalPages = Math.ceil((data?.total ?? 0) / PAGE_SIZE);
  const hasActiveFilter = Boolean(search.trim() || status);

  return (
    <main dir="rtl" className="flex flex-col gap-6">
      <PageHeader
        title="مشاريعي"
        description="تتبع جميع مشاريعك، راقب الحالة الحالية، واستعرض نسبة التقدم لكل مشروع."
        icon={FolderOpen}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Label htmlFor="project-search" className="sr-only">
            البحث في المشاريع
          </Label>
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="project-search"
            className="ps-9 pe-9"
            placeholder="ابحث عن مشروع..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
          {search ? (
            <Button
              variant="ghost"
              size="icon"
              className="absolute end-1 top-1/2 size-8 -translate-y-1/2"
              onClick={() => {
                setSearch("");
                setPage(1);
              }}
              aria-label="مسح البحث"
            >
              <X />
            </Button>
          ) : null}
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-between">
              <span className="flex items-center gap-2">
                <Filter />
                تصفية الحالة
              </span>
              {status ? <Badge variant="secondary">1</Badge> : null}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            sideOffset={8}
            collisionPadding={16}
            className="flex w-max max-w-[calc(100vw-2rem)] flex-col gap-3 p-4"
            dir="rtl"
          >
            <fieldset className="flex flex-col gap-3">
              <legend className="font-medium">حالة المشروع</legend>
              <p className="text-sm text-muted-foreground">اختر حالة واحدة.</p>
              <Separator />
              <div className="flex flex-col gap-1">
                {STATUS_OPTIONS.map((option) => {
                  const id = `project-status-${option}`;
                  const selected = status === option;
                  return (
                    <Label
                      key={option}
                      htmlFor={id}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm",
                        "hover:bg-accent hover:text-accent-foreground",
                        selected && "bg-accent text-accent-foreground",
                      )}
                    >
                      <Checkbox
                        id={id}
                        checked={selected}
                        onCheckedChange={() => {
                          setStatus(selected ? "" : option);
                          setPage(1);
                        }}
                      />
                      {portalProjectStatusLabel(option)}
                    </Label>
                  );
                })}
              </div>
            </fieldset>
            {status ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatus("");
                  setPage(1);
                }}
              >
                مسح الفلتر
              </Button>
            ) : null}
          </PopoverContent>
        </Popover>
      </div>

      {isLoading ? (
        <ProjectsSkeleton />
      ) : isError ? (
        <Card>
          <CardContent className="pt-6">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FolderOpen />
                </EmptyMedia>
                <EmptyTitle>{portalErrorMessage(error)}</EmptyTitle>
                <EmptyDescription>يرجى المحاولة لاحقاً.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      ) : projects.length ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <Card key={project.id} className="flex flex-col">
                <CardHeader className="gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="truncate text-lg">
                        {project.name}
                      </CardTitle>
                      {project.projectManager ? (
                        <CardDescription className="mt-1 flex items-center gap-1">
                          <User className="size-3" />
                          {project.projectManager.name}
                          {project.projectManager.isOnline ? (
                            <Badge variant="outline">متصل</Badge>
                          ) : null}
                        </CardDescription>
                      ) : null}
                    </div>
                    <ProjectBadge
                      label={portalProjectStatusLabel(project.status)}
                      status={project.status}
                    />
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        نسبة الإنجاز
                      </span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} />
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3.5" />
                      {formatShortDate(project.startDate)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3.5" />
                      {formatShortDate(project.endDate)}
                    </span>
                  </div>
                  <Button asChild variant="outline" className="mt-auto">
                    <Link href={`/portal/projects/${project.id}`}>
                      <ExternalLink />
                      عرض الفترات
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </section>
          {totalPages > 1 ? (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    direction="rtl"
                    aria-label="الانتقال إلى الصفحة السابقة"
                    text="السابق"
                    disabled={page === 1}
                    onClick={() =>
                      setPage((current) => Math.max(1, current - 1))
                    }
                  />
                </PaginationItem>
                {getPaginationItems(page, totalPages).map((item) =>
                  typeof item === "number" ? (
                    <PaginationItem key={item}>
                      <PaginationLink
                        isActive={item === page}
                        onClick={() => setPage(item)}
                        aria-label={`الانتقال إلى الصفحة ${item}`}
                      >
                        {item}
                      </PaginationLink>
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={item}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ),
                )}
                <PaginationItem>
                  <PaginationNext
                    direction="rtl"
                    aria-label="الانتقال إلى الصفحة التالية"
                    text="التالي"
                    disabled={page === totalPages}
                    onClick={() =>
                      setPage((current) => Math.min(totalPages, current + 1))
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          ) : null}
        </>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FolderOpen />
                </EmptyMedia>
                <EmptyTitle>
                  {hasActiveFilter
                    ? "لا توجد مشاريع تطابق بحثك"
                    : "لا توجد مشاريع حالياً"}
                </EmptyTitle>
                <EmptyDescription>
                  {hasActiveFilter
                    ? "حاول تغيير كلمة البحث أو إزالة الفلتر لعرض نتائج أكثر."
                    : "ستظهر هنا جميع المشاريع المرتبطة بحسابك فور توفرها."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
