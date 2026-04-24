"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowRight, Calendar, User, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectForm } from "@/components/dashboard/pm/ProjectForm";
import { TaskForm } from "@/components/dashboard/pm/TaskForm";
import { TaskKanban } from "@/components/dashboard/pm/TaskKanban";
import { useGetProjectByIdQuery } from "@/features/projects/projectsApi";
import { useAppSelector } from "@/lib/hooks";
import { ProjectStatus } from "@hassad/shared";

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  ProjectStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  [ProjectStatus.PLANNING]: { label: "تخطيط", variant: "secondary" },
  [ProjectStatus.ACTIVE]: { label: "نشط", variant: "default" },
  [ProjectStatus.ON_HOLD]: { label: "موقوف", variant: "outline" },
  [ProjectStatus.COMPLETED]: { label: "مكتمل", variant: "secondary" },
  [ProjectStatus.CANCELLED]: { label: "ملغى", variant: "destructive" },
};

// ── Page ──────────────────────────────────────────────────────────────────────

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = use(params);
  const { user } = useAppSelector((state) => state.auth);
  const { data: project, isLoading, isError } = useGetProjectByIdQuery(id);

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="flex flex-col gap-4">
        <Link href="/dashboard/pm/projects">
          <Button variant="ghost" size="sm">
            <ArrowRight className="size-4 mr-1" />
            العودة للمشاريع
          </Button>
        </Link>
        <p className="text-destructive">
          المشروع غير موجود أو لا يمكن الوصول إليه.
        </p>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[project.status];

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/dashboard/pm/projects"
          className="hover:text-foreground transition-colors"
        >
          المشاريع
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{project.name}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
        </div>
        <ProjectForm project={project} currentUserId={user.id} />
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-muted-foreground text-sm max-w-2xl">
          {project.description}
        </p>
      )}

      {/* Meta cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="size-4" />
              الجدول الزمني
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">البداية</span>
              <span>
                {new Intl.DateTimeFormat("en-GB", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  numberingSystem: "latn",
                }).format(new Date(project.startDate))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">النهاية</span>
              <span>
                {new Intl.DateTimeFormat("en-GB", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  numberingSystem: "latn",
                }).format(new Date(project.endDate))}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="size-4" />
              التقدم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {Math.round(project.progress ?? 0)}%
            </p>
            <div className="h-2 bg-muted rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${Math.round(project.progress ?? 0)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <User className="size-4" />
              المدير
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            {"manager" in project && project.manager ? (
              <>
                <p className="font-medium">
                  {(project as { manager: { name: string } }).manager.name}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">—</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tasks section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">المهام</CardTitle>
            <TaskForm projectId={id} />
          </div>
        </CardHeader>
        <CardContent>
          <TaskKanban projectId={id} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">الفريق</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            أعضاء الفريق وتوزيع الأدوار سيظهرون هنا.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">الملفات</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            ملفات المشروع وتسليمات الفريق قيد الإضافة.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">المحادثة</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            سجل المحادثات سيكون متاحاً هنا.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">التسليمات</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            قائمة التسليمات المعتمدة ستظهر هنا.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
