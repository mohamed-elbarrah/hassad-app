"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useGetDeliverableRedirectQuery } from "@/features/portal/portalApi";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, AlertCircle, PackageOpen } from "lucide-react";

/**
 * Deep-link target for `actionUrl: /portal/deliverables/${deliverableId}`.
 *
 * The actual review UX is project-scoped (one modal per project at
 * `/portal/deliverables`). This page resolves the deliverable to its owning
 * project and redirects there with a `?focus=projectId` hint so the
 * existing review modal auto-opens.
 *
 * Defense-in-depth fallback: if the resolver returns 404/403 we show an
 * actionable empty state instead of Next.js' default 404 page, and link
 * back to the deliverables list. This also gives the user a recovery path
 * if the deliverable was already approved/archived since the action item
 * was generated.
 */
export default function PortalDeliverableDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) ?? "";

  const { data, isLoading, isError } = useGetDeliverableRedirectQuery(id, {
    skip: !id,
  });

  useEffect(() => {
    if (data?.projectId) {
      router.replace(`/portal/deliverables?focus=${data.projectId}`);
    }
  }, [data?.projectId, router]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4" dir="rtl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-4" dir="rtl">
        <Link href="/portal/deliverables">
          <Button
            variant="ghost"
            size="sm"
            data-icon="inline-start"
            className="gap-2 text-muted-foreground"
          >
            <ArrowRight className="h-4 w-4" />
            مراجعة المشاريع
          </Button>
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-danger-600" />
              تعذر العثور على التسليم
            </CardTitle>
            <CardDescription>
              ربما تمت الموافقة على هذا التسليم أو إخفاؤه بالفعل. ارجع إلى قائمة
              المراجعة للاطلاع على المشاريع بانتظار مراجعتك.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/portal/deliverables">
              <Button data-icon="inline-start" className="gap-2">
                <PackageOpen className="h-4 w-4" />
                قائمة المراجعة
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Resolved but the redirect hasn't fired yet (should be near-instant).
  return (
    <div className="flex items-center justify-center min-h-[40vh]" dir="rtl">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        <p className="text-sm">جارٍ التحويل إلى المشروع...</p>
      </div>
    </div>
  );
}
