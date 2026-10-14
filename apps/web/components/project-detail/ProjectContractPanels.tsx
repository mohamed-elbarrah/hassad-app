"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { formatCurrency } from "@/lib/format";
import type { ProjectContractService } from "@/features/projects/projectContractTypes";

export function ProjectContractServices({
  services,
  currency,
}: {
  services: ProjectContractService[] | null | undefined;
  currency: string;
}) {
  if (!services?.length) {
    return (
      <Empty className="border">
        <EmptyMedia variant="icon"><FileText /></EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>لا توجد خدمات مسجلة</EmptyTitle>
          <EmptyDescription>لا يتضمن العقد قائمة خدمات متاحة لهذا المشروع.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>الخدمات المتفق عليها</CardTitle>
        <CardDescription>الخدمات وأسعارها كما هي محفوظة في العقد.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {services.map((service, index) => (
          <div key={`${service.name}-${index}`} className="flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 flex-col gap-1">
              <h3 className="font-medium">{service.name}</h3>
              {service.description ? (
                <p className="text-sm text-muted-foreground">{service.description}</p>
              ) : null}
            </div>
            <span className="shrink-0 font-semibold tabular-nums">
              {formatCurrency(service.price, currency)}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function ProjectContractFile({ fileUrl }: { fileUrl: string | null | undefined }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>ملف العقد</CardTitle>
        <CardDescription>النسخة المرفقة من العقد الموقع.</CardDescription>
      </CardHeader>
      <CardContent>
        {fileUrl ? (
          <Button asChild>
            <Link href={fileUrl} target="_blank" rel="noopener noreferrer">
              <FileText data-icon="inline-start" />
              عرض ملف العقد
            </Link>
          </Button>
        ) : (
          <Empty className="border">
            <EmptyMedia variant="icon"><FileText /></EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>ملف العقد غير متاح</EmptyTitle>
              <EmptyDescription>لا يوجد ملف عقد مرتبط بهذا المشروع.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
    </Card>
  );
}
