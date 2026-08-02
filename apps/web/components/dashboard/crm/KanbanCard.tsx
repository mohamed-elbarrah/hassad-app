"use client";

import { useDraggable } from "@dnd-kit/core";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { RequestItem } from "@/features/requests/requestsApi";
import { cn } from "@/lib/utils";
import {
  Building2,
  Clock,
  FileText,
  GripVertical,
  History,
  PenLine,
  Phone,
} from "lucide-react";
import { RequestStatus } from "@hassad/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface KanbanCardProps {
  client: RequestItem;
  isOverlay?: boolean;
  onCreateProposal?: (request: RequestItem) => void;
  onEditProposal?: (request: RequestItem) => void;
  onCreateContract?: (request: RequestItem) => void;
  onEditContract?: (request: RequestItem) => void;
}

function parseDescription(notes?: string | null): string | null {
  if (!notes) return null;
  try {
    const parsed = JSON.parse(notes) as { description?: string };
    return parsed.description?.trim() || null;
  } catch {
    return notes.trim() || null;
  }
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) return "الآن";
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  if (hours < 24) return `منذ ${hours} ساعة`;
  if (days === 1) return "أمس";
  if (days < 7) return `منذ ${days} أيام`;
  return new Intl.DateTimeFormat("ar-SA-u-nu-latn", {
    day: "numeric",
    month: "short",
  }).format(new Date(dateStr));
}

function getPrimaryAction(request: RequestItem) {
  const proposalId = request.proposals?.[0]?.id;
  const contractId = request.contracts?.[0]?.id;

  switch (request.status) {
    case RequestStatus.PROPOSAL_IN_PROGRESS:
      return {
        href: proposalId
          ? `/dashboard/sales/proposals/${proposalId}`
          : `/dashboard/sales/requests/${request.id}`,
        label: proposalId ? "فتح العرض" : "إكمال العرض",
        icon: FileText,
      };
    case RequestStatus.PROPOSAL_SENT:
    case RequestStatus.NEGOTIATION:
      return {
        href: proposalId
          ? `/dashboard/sales/proposals/${proposalId}`
          : `/dashboard/sales/requests/${request.id}`,
        label: proposalId ? "مراجعة العرض" : "متابعة العرض",
        icon: FileText,
      };
    case RequestStatus.CONTRACT_PREPARATION:
      return {
        href: contractId
          ? `/dashboard/sales/contracts/${contractId}`
          : `/dashboard/sales/requests/${request.id}`,
        label: contractId ? "فتح العقد" : "تجهيز العقد",
        icon: FileText,
      };
    case RequestStatus.CONTRACT_SENT:
      return {
        href: contractId
          ? `/dashboard/sales/contracts/${contractId}`
          : `/dashboard/sales/requests/${request.id}`,
        label: contractId ? "مراجعة العقد" : "متابعة العقد",
        icon: PenLine,
      };
    default:
      return {
        href: `/dashboard/sales/requests/${request.id}`,
        label: "فتح الطلب",
        icon: History,
      };
  }
}

export function KanbanCard({
  client: request,
  isOverlay = false,
  onCreateProposal,
  onEditProposal,
  onCreateContract,
  onEditContract,
}: KanbanCardProps) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: request.id,
    data: { status: request.status },
  });
  const description = parseDescription(request.notes);
  const action = getPrimaryAction(request);

  function handleClick(e: React.MouseEvent) {
    if (isDragging) return;
    e.stopPropagation();
    router.push(`/dashboard/sales/requests/${request.id}`);
  }

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        "group cursor-grab border-border p-4 transition-all duration-150 active:cursor-grabbing hover:border-secondary-500/20 hover:shadow-sm",
        (isDragging || isOverlay) && "rotate-1 scale-[1.02] opacity-60",
        isOverlay && "shadow-lg",
      )}
      {...attributes}
      {...listeners}
      onClick={handleClick}
    >
      <CardHeader className="p-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight text-foreground">
              {request.contactName}
            </p>
            {(request.client?.companyName || request.companyName) && (
              <div className="mt-1 flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <p className="truncate text-xs text-muted-foreground">
                  {request.client?.companyName || request.companyName}
                </p>
              </div>
            )}
            {request.client?.totalProjects != null &&
              request.client.totalProjects > 0 && (
                <Link
                  href={`/dashboard/sales/clients/${request.clientId}`}
                  className="mt-1 flex items-center gap-1 text-xs text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <History className="h-3 w-3" />
                  {request.client.totalProjects} مشاريع سابقة
                </Link>
              )}
          </div>
          <GripVertical className="mt-0.5 h-4 w-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-40 text-muted-foreground" />
        </div>
      </CardHeader>

      {description && (
        <>
          <Separator className="my-3" />
          <CardContent className="p-0">
            <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {description}
            </p>
          </CardContent>
        </>
      )}

      <Separator className="my-3" />

      <CardContent className="flex items-center justify-between gap-2 p-0 text-xs text-muted-foreground">
        <div className="flex min-w-0 items-center gap-1">
          <Phone className="h-3.5 w-3.5 shrink-0" />
          <span dir="ltr" className="truncate">
            {request.phoneWhatsapp}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          <span>{formatRelativeTime(request.updatedAt)}</span>
        </div>
      </CardContent>

      <CardFooter className="mt-3 flex flex-col gap-2 p-0">
        {request.status === RequestStatus.PROPOSAL_IN_PROGRESS &&
          onCreateProposal && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full justify-center"
              onClick={(e) => {
                e.stopPropagation();
                onCreateProposal(request);
              }}
            >
              <FileText data-icon="inline-start" />
              إنشاء عرض فني
            </Button>
          )}
        {request.status === RequestStatus.PROPOSAL_SENT && onEditProposal && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full justify-center"
            onClick={(e) => {
              e.stopPropagation();
              onEditProposal(request);
            }}
          >
            <PenLine data-icon="inline-start" />
            تعديل العرض
          </Button>
        )}
        {request.status === RequestStatus.CONTRACT_PREPARATION &&
          onCreateContract && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full justify-center"
              onClick={(e) => {
                e.stopPropagation();
                onCreateContract(request);
              }}
            >
              <FileText data-icon="inline-start" />
              إنشاء عقد
            </Button>
          )}
        {request.status === RequestStatus.CONTRACT_SENT && onEditContract && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full justify-center"
            onClick={(e) => {
              e.stopPropagation();
              onEditContract(request);
            }}
          >
            <PenLine data-icon="inline-start" />
            تعديل العقد
          </Button>
        )}
        <Button
          type="button"
          variant={request.status === RequestStatus.SIGNED ? "secondary" : "default"}
          size="sm"
          className="w-full justify-center"
          onClick={(e) => {
            e.stopPropagation();
            router.push(action.href);
          }}
        >
          <action.icon data-icon="inline-start" />
          {action.label}
        </Button>
      </CardFooter>
    </Card>
  );
}
