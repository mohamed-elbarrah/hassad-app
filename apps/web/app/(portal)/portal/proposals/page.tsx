"use client";

import Link from "next/link";
import { FileText, ExternalLink } from "lucide-react";
import { useGetMyProposalsQuery } from "@/features/proposals/proposalsApi";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { DataTable } from "@/components/design-system/DataTable";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { ActionButton } from "@/components/design-system/ActionButton";
import { mapProposalStatusToUI } from "@/lib/utils/statusMapping";

export default function PortalProposalsPage() {
  const {
    data: proposals,
    isLoading,
    isError,
  } = useGetMyProposalsQuery(undefined, { pollingInterval: 120_000 });

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <PageIntro
        title="العروض الفنية"
        description="استعرض العروض الفنية المقدّمة لك وراجع تفاصيلها قبل الموافقة."
        icon={FileText}
      />

      <SurfaceCard title="قائمة العروض الفنية" icon={FileText}>
        <DataTable
          columns={[
            { id: "title", label: "عنوان العرض" },
            { id: "company", label: "الشركة" },
            { id: "sentDate", label: "تاريخ الإرسال" },
            { id: "status", label: "الحالة" },
            { id: "action", label: "الملف" },
          ]}
          data={proposals ?? []}
          isLoading={isLoading}
          isError={isError}
          errorMessage="حدث خطأ أثناء تحميل العروض."
          emptyState={{
            icon: FileText,
            message: "لا توجد عروض فنية حتى الآن.",
            hint: "ستظهر هنا العروض الفنية المقدّمة لك فور إعدادها من قبل فريق المبيعات.",
          }}
          renderRow={(proposal) => (
            <tr
              key={proposal.id}
              className="border-b-[1.5px] border-portal-divider"
            >
              <td className="px-5 py-4 font-medium text-sm text-natural-100">
                {proposal.title}
              </td>
              <td className="px-5 py-4 text-sm text-portal-note-text">
                {proposal.lead?.companyName ?? "—"}
              </td>
              <td className="px-5 py-4 text-sm text-portal-note-text">
                {proposal.sentAt
                  ? new Date(proposal.sentAt as string).toLocaleDateString(
                      "ar-SA-u-nu-latn",
                    )
                  : new Date(proposal.createdAt as string).toLocaleDateString(
                      "ar-SA-u-nu-latn",
                    )}
              </td>
              <td className="px-5 py-4">
                <StatusBadge status={mapProposalStatusToUI(proposal.status)} />
              </td>
              <td className="px-5 py-4">
                {proposal.shareLinkToken ? (
                  <Link href={`/portal/proposals/${proposal.shareLinkToken}`}>
                    <ActionButton
                      variant="outline"
                      size="md"
                      className="h-9 rounded-xl border border-portal-card-border bg-white px-3 text-xs font-medium text-portal-icon hover:bg-badge-gray-bg hover:text-secondary-500 gap-1"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      فتح العرض
                    </ActionButton>
                  </Link>
                ) : (
                  <span className="text-xs text-portal-note-text">
                    غير متاح
                  </span>
                )}
              </td>
            </tr>
          )}
        />
      </SurfaceCard>
    </div>
  );
}
