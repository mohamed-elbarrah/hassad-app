"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Bug, CheckCircle2, ChevronLeft, ChevronRight, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppSelector } from "@/lib/hooks";
import {
  useGetActiveAnnouncementsQuery,
  useViewAnnouncementMutation,
} from "@/features/communication/communicationApi";
import { IssueReportDialog } from "./IssueReportDialog";
import styles from "./AnnouncementBar.module.css";

const typeConfig = {
  INFO: { icon: Info, variant: "secondary" as const },
  SUCCESS: { icon: CheckCircle2, variant: "secondary" as const },
  WARNING: { icon: AlertTriangle, variant: "warning" as const },
  CRITICAL: { icon: AlertTriangle, variant: "destructive" as const },
};

export function AnnouncementBar({ surface }: { surface: "dashboard" | "portal" }) {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { data: announcements = [], isLoading } = useGetActiveAnnouncementsQuery(surface, { skip: !isAuthenticated });
  const [viewAnnouncement] = useViewAnnouncementMutation();
  const [reportOpen, setReportOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const firstCopyRef = useRef<HTMLSpanElement>(null);
  const [marqueeDistance, setMarqueeDistance] = useState(0);
  const current = announcements[index] ?? announcements[0];

  useEffect(() => {
    setIndex(0);
  }, [announcements.length]);

  useEffect(() => {
    if (current) void viewAnnouncement({ surface, id: current.id });
  }, [current?.id, surface, viewAnnouncement]);

  useEffect(() => {
    const copy = firstCopyRef.current;
    if (!copy) return;

    const measure = () => setMarqueeDistance(copy.getBoundingClientRect().width);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(copy);
    return () => observer.disconnect();
  }, [current?.body]);

  const config = useMemo(() => typeConfig[current?.type ?? "INFO"], [current?.type]);
  const Icon = config.icon;

  return (
    <>
      <div className="h-11 shrink-0" aria-hidden="true" />
      <div className="absolute inset-x-0 top-0 z-40 h-11 border-b border-border bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80" dir="rtl" role="region" aria-label="الإعلانات">
        <div className="flex h-full w-full items-center gap-2 px-3 lg:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden" aria-live="polite">
            {isLoading ? <Skeleton className="h-4 w-48" /> : current ? <>
              <Badge variant={config.variant} className="shrink-0 gap-1"><Icon data-icon="inline-start" />{current.title}</Badge>
              <div className="min-w-0 flex-1 overflow-hidden whitespace-nowrap text-sm text-foreground" title={current.body}>
                <span
                  dir="ltr"
                  className={`${styles.track} ${styles.marquee}`}
                  style={{
                    "--announcement-marquee-distance": `${marqueeDistance}px`,
                    "--announcement-marquee-duration": `${Math.max(12, marqueeDistance / 60)}s`,
                  } as React.CSSProperties}
                >
                  {Array.from({ length: 80 }, (_, copy) => (
                    <span ref={copy === 0 ? firstCopyRef : undefined} key={copy} dir="rtl" aria-hidden={copy > 0} className={styles.copy}>
                      {current.body}
                    </span>
                  ))}
                </span>
              </div>
              {current.actionUrl ? <Button asChild variant="link" size="sm" className="h-8 shrink-0 px-1"><Link href={current.actionUrl}>{current.actionLabel ?? "عرض"}</Link></Button> : null}
              {announcements.length > 1 ? <div className="flex shrink-0 items-center gap-1"><Button variant="ghost" size="icon" className="size-10" onClick={() => setIndex((value) => (value + announcements.length - 1) % announcements.length)} aria-label="الإعلان السابق"><ChevronRight data-icon="inline-start" /></Button><span className="text-xs text-muted-foreground">{index + 1}/{announcements.length}</span><Button variant="ghost" size="icon" className="size-10" onClick={() => setIndex((value) => (value + 1) % announcements.length)} aria-label="الإعلان التالي"><ChevronLeft data-icon="inline-start" /></Button></div> : null}
              {/* Dismissal will be enabled in a later iteration. */}
            </> : <span className="sr-only">لا توجد إعلانات</span>}
          </div>
          <Button variant="outline" size="sm" className="min-h-10 shrink-0 gap-1" onClick={() => setReportOpen(true)}><Bug data-icon="inline-start" />الإبلاغ عن مشكلة</Button>
        </div>
      </div>
      <IssueReportDialog surface={surface} open={reportOpen} onOpenChange={setReportOpen} />
    </>
  );
}
