"use client";

import { use } from "react";
import { Building2 } from "lucide-react";
import { toast } from "sonner";
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
import type { RequestStatus } from "@hassad/shared";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function SalesRequestDetailPage({
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
                <EmptyTitle>تعذر تحميل تفاصيل الطلب</EmptyTitle>
                <EmptyDescription>
                  لم نتمكن من العثور على بيانات هذا العميل المحتمل.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button asChild>
                  <Link href="/dashboard/sales/pipeline">
                    <ArrowLeft data-icon="inline-start" />
                    العودة إلى خط المبيعات
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
      mode="sales"
      backHref="/dashboard/sales/pipeline"
      backLabel="العودة إلى خط المبيعات"
      onStageChange={handleStageChange}
      onAddContactLog={handleAddContactLog}
      isUpdatingStage={isUpdatingStage}
      isAddingContactLog={isAddingContactLog}
    />
  );
}
