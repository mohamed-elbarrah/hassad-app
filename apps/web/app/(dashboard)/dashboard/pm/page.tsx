"use client";

import { useAppSelector } from "@/lib/hooks";
import { useGetProjectsQuery } from "@/features/projects/projectsApi";
import { ProjectCard } from "@/components/dashboard/pm/ProjectCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const ALERTS = [
  "مهمة متأخرة في مشروع " + "شركة النور",
  "طلب تعديل جديد من عميل " + "مطعم الريحان",
];

export default function PMWorkspacePage() {
  const { user } = useAppSelector((state) => state.auth);
  const { data, isLoading, isError } = useGetProjectsQuery({
    limit: 6,
    projectManagerId: user?.role === "PM" ? user.id : undefined,
  });

  if (!user) return null;

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">لوحة مدير المشروع</h1>
        <p className="text-sm text-muted-foreground mt-1">
          متابعة المشاريع والتنبيهات اليومية.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">تنبيهات</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {ALERTS.map((alert) => (
              <li key={alert}>• {alert}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold mb-3">المشاريع الحالية</h2>
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-lg" />
            ))}
          </div>
        )}

        {isError && (
          <p className="text-sm text-destructive">
            حدث خطأ أثناء تحميل المشاريع.
          </p>
        )}

        {!isLoading && !isError && data && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.items.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
