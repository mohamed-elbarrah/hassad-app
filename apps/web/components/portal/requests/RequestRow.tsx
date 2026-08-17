"use client";

import { useState } from "react";
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  ExternalLink,
  FileText,
  PenTool,
  User,
} from "lucide-react";
import Link from "next/link";

import type { PortalRequestSummary } from "@/features/portal/portalApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  getRequestAction,
  getRequestActionLabel,
  getRequestStatusLabel,
  resolveStatusGroup,
} from "@/lib/utils/requestStatus";

interface RequestRowProps {
  request: PortalRequestSummary;
}

function RequestStatusBadge({ status }: { status: string }) {
  const group = resolveStatusGroup(status);
  const variant =
    group === "cancelled"
      ? "destructive"
      : group === "signed"
        ? "default"
        : "secondary";

  return <Badge variant={variant}>{getRequestStatusLabel(status)}</Badge>;
}

export function RequestRow({ request }: RequestRowProps) {
  const [expanded, setExpanded] = useState(false);
  const action = getRequestAction(request);
  const services = request.services
    .map((service) => service.nameAr ?? service.name)
    .join("، ");
  const servicesPreview = request.services
    .slice(0, 2)
    .map((service) => service.nameAr ?? service.name)
    .join("، ");
  const servicesMore =
    request.services.length > 2 ? ` +${request.services.length - 2}` : "";

  return (
    <>
      <TableRow>
        <TableCell>
          <RequestActionCell action={action} />
        </TableCell>
        <TableCell>
          <RequestStatusBadge status={request.status} />
        </TableCell>
        <TableCell className="text-muted-foreground">
          <span title={services}>{servicesPreview}</span>
          {servicesMore ? (
            <span className="text-xs">{servicesMore}</span>
          ) : null}
        </TableCell>
        <TableCell>
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-medium" title={request.companyName}>
              {request.companyName}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="size-3 shrink-0" />
              <span className="truncate" title={request.contactName}>
                {request.contactName}
              </span>
            </span>
          </div>
        </TableCell>
        <TableCell>
          <time
            className="flex items-center gap-1.5 text-muted-foreground"
            dateTime={request.createdAt}
          >
            <Calendar className="size-3.5 shrink-0" />
            {new Date(request.createdAt).toLocaleDateString("ar-SA-u-nu-latn")}
          </time>
        </TableCell>
        <TableCell>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            aria-label={expanded ? "إخفاء التفاصيل" : "عرض التفاصيل"}
          >
            <ChevronDown className={expanded ? "rotate-180" : undefined} />
          </Button>
        </TableCell>
      </TableRow>
      {expanded ? (
        <TableRow>
          <TableCell colSpan={6}>
            <RequestDetail request={request} />
          </TableCell>
        </TableRow>
      ) : null}
    </>
  );
}

function RequestActionCell({
  action,
}: {
  action: ReturnType<typeof getRequestAction>;
}) {
  switch (action.kind) {
    case "sign-contract":
      return (
        <Button asChild size="sm">
          <Link href={action.href}>
            <PenTool />
            {getRequestActionLabel(action)}
          </Link>
        </Button>
      );
    case "review-proposal":
      return (
        <Button asChild variant="outline" size="sm">
          <Link href={action.href}>
            <FileText />
            {getRequestActionLabel(action)}
          </Link>
        </Button>
      );
    case "in-progress":
      return (
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="size-4" />
          {getRequestActionLabel(action)}
        </span>
      );
    case "completed":
      return (
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <CheckCircle2 className="size-4" />
          {getRequestActionLabel(action)}
        </span>
      );
  }
}

function RequestDetail({ request }: { request: PortalRequestSummary }) {
  const description = getRequestDescription(request.notes);

  return (
    <Card className="bg-muted/30">
      <CardContent className="flex flex-col gap-5 pt-6">
        <div>
          <p className="text-sm font-medium">
            {request.status === "SIGNED"
              ? "تم توقيع العقد وتحويل الطلب إلى مشروع."
              : "حالة الطلب"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {request.stageLabel}
          </p>
          {description ? (
            <Card className="mt-4">
              <CardContent className="pt-6">
                <p className="text-sm font-medium">ملاحظاتك</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {description}
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>
        <Separator />
        <div className="grid gap-5 md:grid-cols-2">
          {request.services.length ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium">
                الخدمات المطلوبة ({request.services.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {request.services.map((service) => (
                  <Badge key={service.id} variant="outline">
                    <FileText />
                    {service.nameAr ?? service.name}
                    {service.quantity > 1 ? ` ×${service.quantity}` : ""}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium">المستندات</p>
            <div className="flex flex-wrap gap-2">
              {request.latestProposal?.url ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={request.latestProposal.url}>
                    <FileText />
                    عرض فني
                    <ExternalLink />
                  </Link>
                </Button>
              ) : (
                <span className="text-sm text-muted-foreground">
                  لا يوجد عرض فني بعد
                </span>
              )}
              {request.latestContract?.url ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={request.latestContract.url}>
                    <PenTool />
                    {request.latestContract.status === "SENT"
                      ? "توقيع العقد"
                      : "العقد"}
                    <ExternalLink />
                  </Link>
                </Button>
              ) : (
                <span className="text-sm text-muted-foreground">
                  لا يوجد عقد بعد
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getRequestDescription(notes?: string | null): string | null {
  if (!notes) return null;
  try {
    const parsed = JSON.parse(notes) as { description?: string };
    return typeof parsed?.description === "string" && parsed.description.trim()
      ? parsed.description.trim()
      : null;
  } catch {
    const trimmed = notes.trim();
    return trimmed.startsWith("{") || trimmed.startsWith("[")
      ? null
      : trimmed || null;
  }
}

export { getRequestDescription };
