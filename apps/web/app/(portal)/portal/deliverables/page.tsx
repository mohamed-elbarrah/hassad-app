"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, Filter, Search, X } from "lucide-react";
import { toast } from "sonner";
import { PORTAL_POLLING_INTERVAL_MS } from "@/lib/constants";
import { useAppSelector } from "@/lib/hooks";
import { useGetProjectReviewDetailQuery, useGetReviewProjectsQuery, type ReviewProject } from "@/features/portal/portalApi";
import { ReviewModal } from "@/components/portal/deliverables";
import { DomainStatusPill } from "@/components/portal/shared/DomainStatusPill";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function PortalDeliverablesPage() {
  const clientId = useAppSelector((state) => state.auth.user?.clientId ?? ""); const params = useSearchParams(); const [search, setSearch] = useState(""); const [statuses, setStatuses] = useState<string[]>([]); const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: projects, isLoading, isError, refetch } = useGetReviewProjectsQuery(undefined, { skip: !clientId, pollingInterval: PORTAL_POLLING_INTERVAL_MS });
  const { data: selectedProject } = useGetProjectReviewDetailQuery(selectedId!, { skip: !selectedId, pollingInterval: PORTAL_POLLING_INTERVAL_MS });
  useEffect(() => { const focus = params.get("focus"); if (focus) setSelectedId(focus); }, [params]);
  const filtered = useMemo(() => { const q = search.trim().toLowerCase(); return (projects ?? []).filter((project) => (!statuses.length || statuses.includes(project.status)) && (!q || project.name.toLowerCase().includes(q) || project.manager?.name.toLowerCase().includes(q))); }, [projects, search, statuses]);
  const toggle = (status: string) => setStatuses((current) => current.includes(status) ? current.filter((value) => value !== status) : [...current, status]);
  const fallback = projects?.find((project) => project.id === selectedId);
  if (!clientId) return <main dir="rtl"><Card><CardContent className="pt-6"><Empty><EmptyHeader><EmptyMedia variant="icon"><Eye /></EmptyMedia><EmptyTitle>حساب العميل غير مرتبط</EmptyTitle><EmptyDescription>يرجى التواصل مع الإدارة لربط حسابك بملف العميل.</EmptyDescription></EmptyHeader></Empty></CardContent></Card></main>;
  const options = [...new Set((projects ?? []).map((project) => project.status))];
  return <main dir="rtl" className="flex flex-col gap-6"><Card><CardHeader><div className="flex items-center gap-3"><Eye className="size-5 text-muted-foreground" /><CardTitle>مراجعة المشاريع</CardTitle></div><CardDescription>راجع أعمال فريقك ووافق عليها أو اطلب تعديلات.</CardDescription></CardHeader></Card><div className="flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="ps-9 pe-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث باسم المشروع أو المدير..." />{search ? <Button variant="ghost" size="icon" className="absolute end-1 top-1/2 size-8 -translate-y-1/2" onClick={() => setSearch("")}><X /></Button> : null}</div><Popover><PopoverTrigger asChild><Button variant="outline"><Filter />الحالة{statuses.length ? <Badge variant="secondary">{statuses.length}</Badge> : null}</Button></PopoverTrigger><PopoverContent className="flex flex-col gap-2" dir="rtl">{options.map((status) => <label key={status} className="flex items-center gap-2"><Checkbox checked={statuses.includes(status)} onCheckedChange={() => toggle(status)} />{status}</label>)}{statuses.length ? <Button variant="ghost" size="sm" onClick={() => setStatuses([])}>مسح الفلاتر</Button> : null}</PopoverContent></Popover></div>{isLoading ? <div className="flex flex-col gap-3">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-14" />)}</div> : isError ? <Card><CardContent className="pt-6"><Empty><EmptyHeader><EmptyMedia variant="icon"><Eye /></EmptyMedia><EmptyTitle>تعذر تحميل المشاريع</EmptyTitle><EmptyDescription>حاول تحديث الصفحة مرة أخرى.</EmptyDescription></EmptyHeader><Button onClick={() => refetch()}>إعادة المحاولة</Button></Empty></CardContent></Card> : filtered.length ? <Card><Table><TableHeader><TableRow><TableHead>المشروع</TableHead><TableHead>المدير</TableHead><TableHead>المرفقات</TableHead><TableHead>الحالة</TableHead><TableHead><span className="sr-only">الإجراء</span></TableHead></TableRow></TableHeader><TableBody>{filtered.map((project) => <TableRow key={project.id}><TableCell><p className="font-medium">{project.name}</p><p className="max-w-md truncate text-sm text-muted-foreground">{project.description ?? "لا يوجد وصف للمشروع."}</p></TableCell><TableCell>{project.manager?.name ?? "بدون مدير"}</TableCell><TableCell>{project.deliverableCount}</TableCell><TableCell><DomainStatusPill domain="project" status={project.status} /></TableCell><TableCell><Button size="sm" onClick={() => setSelectedId(project.id)}><Eye />مراجعة</Button></TableCell></TableRow>)}</TableBody></Table></Card> : <Card><CardContent className="pt-6"><Empty><EmptyHeader><EmptyMedia variant="icon"><Eye /></EmptyMedia><EmptyTitle>لا توجد مشاريع بانتظار المراجعة</EmptyTitle><EmptyDescription>ستظهر هنا المشاريع عندما يقدمها فريقك للمراجعة.</EmptyDescription></EmptyHeader></Empty></CardContent></Card>}<ReviewModal selectedProjectId={selectedId} selectedProject={selectedProject} fallbackProject={fallback} onOpenChange={(open) => !open && setSelectedId(null)} onActionComplete={() => { refetch(); toast.success("تم تحديث قائمة المراجعة"); setSelectedId(null); }} /></main>;
}
