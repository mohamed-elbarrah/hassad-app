"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  useGetDeliverableRedirectQuery,
} from "@/features/portal/portalApi";
import { Skeleton } from "@/components/design-system/Skeleton";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { ActionButton } from "@/components/design-system/ActionButton";
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
          <ActionButton
            variant="ghost"
            size="sm"
            className="gap-2 text-portal-note-text hover:text-natural-100"
          >
            <ArrowRight className="h-4 w-4" />
            مراجعة المشاريع
          </ActionButton>
        </Link>
        <SurfaceCard title="تعذر العثور على التسليم" icon={AlertCircle}>
          <p className="text-sm text-portal-note-text">
            ربما تمت الموافقة على هذا التسليم أو إخفاؤه بالفعل. ارجع إلى
            قائمة المراجعة للاطلاع على المشاريع بانتظار مراجعتك.
          </p>
          <div className="mt-4">
            <Link href="/portal/deliverables">
              <ActionButton
                variant="primary"
                icon={<PackageOpen className="h-4 w-4" />}
                className="gap-2"
              >
                قائمة المراجعة
              </ActionButton>
            </Link>
          </div>
        </SurfaceCard>
      </div>
    );
  }

  // Resolved but the redirect hasn't fired yet (should be near-instant).
  return (
    <div className="flex items-center justify-center min-h-[40vh]" dir="rtl">
      <div className="flex flex-col items-center gap-3 text-portal-note-text">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary-500" />
        <p className="text-sm">جارٍ التحويل إلى المشروع...</p>
      </div>
    </div>
  );
}