"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";
import { toast } from "sonner";
import type { RequestStatus } from "@hassad/shared";
import { useAddRequestContactLogMutation, useGetRequestByIdQuery, useUpdateRequestStatusMutation, type CreateRequestContactLogPayload } from "@/features/requests/requestsApi";
import { RequestDetailLoading, RequestDetailView } from "@/components/request-detail/RequestDetailPattern";
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
  const { data: request, isLoading, isError } = useGetRequestByIdQuery(id);
  const [updateStatus, { isLoading: isUpdatingStage }] = useUpdateRequestStatusMutation();
  const [addContactLog, { isLoading: isAddingContactLog }] = useAddRequestContactLogMutation();

  if (isLoading) {
    return <RequestDetailLoading />;
  }

  if (isError || !request) {
    return (
      <div className="p-4 sm:p-6 lg:p-8" dir="rtl">
        <Card>
          <CardContent className="p-8">
            <Empty>
              <EmptyMedia variant="icon">
                <Building2 />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>تعذر تحميل تفاصيل السجل</EmptyTitle>
                <EmptyDescription>
                  لم نتمكن من العثور على بيانات هذا العميل المحتمل من مسار الطلبات.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
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
      await updateStatus({ id: request.id, toStatus: status }).unwrap();
      toast.success("تم تحديث مرحلة الطلب");
    } catch (error) {
      const message =
        (error as { data?: { message?: string } })?.data?.message ??
        "فشل تحديث مرحلة الطلب";
      toast.error(message);
    }
  }

  async function handleAddContactLog(payload: CreateRequestContactLogPayload) {
    try {
      await addContactLog({ id: request.id, body: payload }).unwrap();
      toast.success("تم تسجيل التواصل");
    } catch (error) {
      const message =
        (error as { data?: { message?: string } })?.data?.message ??
        "فشل تسجيل التواصل";
      toast.error(message);
      throw error;
    }
  }

  return (
    <RequestDetailView
      request={request}
      mode="admin"
      backHref="/dashboard/admin/requests"
      backLabel="العودة إلى الطلبات"
      onStageChange={handleStageChange}
      onAddContactLog={handleAddContactLog}
      isUpdatingStage={isUpdatingStage}
      isAddingContactLog={isAddingContactLog}
    />
  );
}
