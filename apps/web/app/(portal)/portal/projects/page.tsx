"use client";

import { useMemo, useState } from "react";
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
import { formatShortDate } from "@/lib/format";
import { portalErrorMessage, portalProjectStatusLabel } from "@/lib/i18n";
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
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

const STATUS_OPTIONS = [
  { label: "نشط", value: ProjectStatus.ACTIVE },
  { label: "تخطيط", value: ProjectStatus.PLANNING },
  { label: "معلق", value: ProjectStatus.ON_HOLD },
  { label: "بانتظار المراجعة", value: ProjectStatus.AWAITING_REVIEW },
  { label: "مطلوب تعديلات", value: ProjectStatus.NEEDS_REVISION },
  { label: "مكتمل", value: ProjectStatus.COMPLETED },
  { label: "ملغى", value: ProjectStatus.CANCELLED },
] as const;

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
  const [status, setStatus] = useState<string>("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, error, isLoading, isError } = useGetPortalProjectsQuery(
    { status: status || undefined, page, limit: PAGE_SIZE },
    { pollingInterval: PORTAL_POLLING_INTERVAL_MS },
  );
  const projects = data?.data ?? [];
  const totalPages = Math.ceil((data?.total ?? 0) / PAGE_SIZE);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query
      ? projects.filter((project) => project.name.toLowerCase().includes(query))
      : projects;
  }, [projects, search]);
  const hasActiveFilter = Boolean(search || status);

  return (
    <main dir="rtl" className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <FolderOpen className="size-5 text-muted-foreground" />
            <CardTitle>مشاريعي</CardTitle>
          </div>
          <CardDescription>
            تتبع جميع مشاريعك، راقب الحالة الحالية، واستعرض نسبة التقدم لكل
            مشروع.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
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
            align="start"
            className="flex flex-col gap-3"
            dir="rtl"
          >
            <div>
              <p className="font-medium">حالة المشروع</p>
              <p className="text-sm text-muted-foreground">اختر حالة واحدة.</p>
            </div>
            <Separator />
            {STATUS_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2 text-sm"
              >
                <Checkbox
                  checked={status === option.value}
                  onCheckedChange={() => {
                    setStatus(status === option.value ? "" : option.value);
                    setPage(1);
                  }}
                />
                {option.label}
              </label>
            ))}
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
      ) : filtered.length ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((project) => (
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
                    text="السابق"
                    disabled={page === 1}
                    onClick={() =>
                      setPage((current) => Math.max(1, current - 1))
                    }
                  />
                </PaginationItem>
                {Array.from(
                  { length: totalPages },
                  (_, index) => index + 1,
                ).map((number) => (
                  <PaginationItem key={number}>
                    <PaginationLink
                      isActive={number === page}
                      onClick={() => setPage(number)}
                    >
                      {number}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
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
