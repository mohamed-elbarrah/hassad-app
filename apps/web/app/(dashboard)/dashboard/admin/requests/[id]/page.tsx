"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";
import { toast } from "sonner";
import type { RequestStatus } from "@hassad/shared";
import { adminErrorMessage, adminSuccessMessage } from "@/lib/i18n";
import {
  useAddAdminRequestContactLogMutation,
  useGetAdminRequestByIdQuery,
  useUpdateAdminRequestStatusMutation,
  type AdminRequestContactLogPayload,
} from "@/features/admin/adminRequestsApi";
import {
  RequestDetailLoading,
  RequestDetailView,
} from "@/components/request-detail/RequestDetailPattern";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default function AdminRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: request, isLoading, isError, error, refetch } = useGetAdminRequestByIdQuery(id);
  const [updateStatus, { isLoading: isUpdatingStage }] = useUpdateAdminRequestStatusMutation();
  const [addContactLog, { isLoading: isAddingContactLog }] = useAddAdminRequestContactLogMutation();

  if (isLoading) {
    return <RequestDetailLoading />;
  }

  if (isError || !request) {
    return (
      <div className="  " dir="rtl">
        <Card>
          <CardContent className="p-8">
            <Empty>
              <EmptyMedia variant="icon">
                <Building2 />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>تعذر تحميل تفاصيل السجل</EmptyTitle>
                <EmptyDescription>
                  {adminErrorMessage(error)}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button variant="outline" onClick={() => refetch()}>إعادة المحاولة</Button>
                <Button asChild>
                  <Link href="/dashboard/admin/requests">
                    <ArrowLeft data-icon="inline-start" />
                    العودة إلى الطلبات
                  </Link>
                </Button>
              </EmptyContent>
            </Empty>
          </CardContent>
        </Card>
      </div>
    );
  }

  async function handleStageChange(status: RequestStatus) {
    if (status === request.status) return;

    try {
      const result = await updateStatus({ id: request.id, status, reason: "ADMIN_STATUS_UPDATE" }).unwrap();
      toast.success(adminSuccessMessage(result.code));
    } catch (error) {
      toast.error(adminErrorMessage(error));
    }
  }

  async function handleAddContactLog(payload: AdminRequestContactLogPayload) {
    try {
      const result = await addContactLog({ id: request.id, body: payload }).unwrap();
      toast.success(adminSuccessMessage(result.code));
    } catch (error) {
      toast.error(adminErrorMessage(error));
      throw error;
    }
  }

  return (
    <RequestDetailView
      request={request}
      mode="admin"
      backHref="/dashboard/admin/requests"
      backLabel="العودة إلى الطلبات"
      breadcrumbs={[
        { label: "الرئيسية", href: "/dashboard" },
        { label: "الطلبات", href: "/dashboard/admin/requests" },
        { label: request.companyName },
      ]}
      onStageChange={handleStageChange}
      onAddContactLog={handleAddContactLog}
      isUpdatingStage={isUpdatingStage}
      isAddingContactLog={isAddingContactLog}
    />
  );
}
