"use client";

import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminStatusBadge } from "@/components/dashboard/admin/shared/AdminStatusBadge";
import { CLIENT_KIND_AR, type AdminOverviewResponse, type ClientKind } from "@hassad/shared";
import { formatCurrency, formatNumber, formatShortDateLong } from "@/lib/format";
import { UNKNOWN_STATUS_LABEL } from "@/lib/i18n";

type LeadOrder = AdminOverviewResponse["leadOrders"][number];
type SalesLeader = AdminOverviewResponse["salesLeaders"][number];
type ActiveProject = AdminOverviewResponse["activeProjects"][number];
type AdminClient = AdminOverviewResponse["clients"][number];

function formatLastSeen(value: string | null | undefined) {
  if (!value || value === "—") return "—";
  if (value === "Online") return "متصل الآن";
  return Number.isNaN(new Date(value).getTime()) ? "—" : formatShortDateLong(value);
}

function EmptyRow({ label, colSpan }: { label: string; colSpan: number }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-24 text-center text-muted-foreground">
        {label}
      </TableCell>
    </TableRow>
  );
}

function LeadOrdersTable({ rows }: { rows: LeadOrder[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>الطلبات والفرص</CardTitle>
        <CardDescription>أهم ست فرص تحتاج متابعة تجارية.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <caption className="sr-only">قائمة الطلبات والفرص التجارية</caption>
            <TableHeader>
              <TableRow>
                <TableHead>العميل</TableHead>
                <TableHead>المرحلة</TableHead>
                <TableHead>التواصل</TableHead>
                <TableHead>القيمة</TableHead>
                <TableHead>المسؤول</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? <EmptyRow label="لا توجد طلبات حالياً" colSpan={5} /> : rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Link href={`/dashboard/admin/requests/${row.id}`} className="flex min-w-44 flex-col gap-1 hover:text-primary">
                      <span className="font-medium">{row.clientName}</span>
                      <span className="text-xs text-muted-foreground">{row.companyName}</span>
                    </Link>
                  </TableCell>
                  <TableCell><AdminStatusBadge domain="lead" status={row.crmStage ?? row.stage} /></TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-xs">
                      <span>{formatNumber(row.calls)} مكالمات</span>
                      <span className="text-muted-foreground">{formatNumber(row.meetings)} اجتماعات</span>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{formatCurrency(row.value, row.currency)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <Avatar className="size-8"><AvatarFallback>{row.ownerInitials}</AvatarFallback></Avatar>
                      <span>{row.owner}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function SalesLeadersTable({ rows }: { rows: SalesLeader[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>أفضل مسؤولي المبيعات</CardTitle>
        <CardDescription>أفضل ستة مستخدمين حسب العقود والإيرادات المحققة.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <caption className="sr-only">أفضل مسؤولي المبيعات والعقود</caption>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>المستخدم</TableHead>
                <TableHead>الصفقات</TableHead>
                <TableHead>العقود</TableHead>
                <TableHead>الإيرادات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? <EmptyRow label="لا توجد بيانات مبيعات حالياً" colSpan={5} /> : rows.map((row, index) => (
                <TableRow key={row.id}>
                  <TableCell><Badge variant={index === 0 ? "secondary" : "outline"}>{index + 1}</Badge></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <Avatar className="size-8"><AvatarFallback>{row.initials}</AvatarFallback></Avatar>
                      <Link href={`/dashboard/admin/employees/${row.id}`} className="font-medium hover:text-primary">
                        {row.name}
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell>{formatNumber(row.deals)}</TableCell>
                  <TableCell>{formatNumber(row.contracts)}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatCurrency(row.revenue, row.currency)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function ActiveProjectsTable({ rows }: { rows: ActiveProject[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>المشاريع النشطة</CardTitle>
        <CardDescription>المشاريع الجارية التي تحتاج متابعة تشغيلية.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <caption className="sr-only">المشاريع النشطة الحالية</caption>
            <TableHeader><TableRow><TableHead>المشروع</TableHead><TableHead>العميل</TableHead><TableHead>الحالة</TableHead><TableHead>التقدم</TableHead><TableHead>مدير المشروع</TableHead><TableHead>القيمة</TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.length === 0 ? <EmptyRow label="لا توجد مشاريع نشطة حالياً" colSpan={6} /> : rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell><Link href={`/dashboard/admin/projects/${row.id}`} className="font-medium hover:text-primary">{row.name}</Link></TableCell>
                  <TableCell>{row.clientName}</TableCell>
                  <TableCell><AdminStatusBadge domain="project" status={row.state} /></TableCell>
                  <TableCell>{row.progress}%</TableCell>
                  <TableCell><div className="flex items-center gap-2 whitespace-nowrap"><Avatar className="size-8"><AvatarFallback>{row.pmInitials}</AvatarFallback></Avatar><span>{row.pm}</span></div></TableCell>
                  <TableCell className="whitespace-nowrap">{formatCurrency(row.value, row.currency)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function ClientsTable({ rows }: { rows: AdminClient[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>العملاء</CardTitle>
        <CardDescription>آخر حالة للعملاء ونشاط مشاريعهم.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <caption className="sr-only">قائمة العملاء ونشاطهم</caption>
            <TableHeader><TableRow><TableHead>العميل</TableHead><TableHead>النوع</TableHead><TableHead>آخر ظهور</TableHead><TableHead>المشاريع</TableHead><TableHead>الرصيد المستحق</TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.length === 0 ? <EmptyRow label="لا توجد بيانات عملاء حالياً" colSpan={5} /> : rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell><Link href={`/dashboard/admin/clients/${row.id}`} className="flex min-w-44 flex-col gap-1 hover:text-primary"><span className="font-medium">{row.clientName}</span><span className="text-xs text-muted-foreground">{row.companyName}</span></Link></TableCell>
                  <TableCell><Badge variant={row.kind === "CLIENT" ? "secondary" : "outline"}>{CLIENT_KIND_AR[row.kind as ClientKind] ?? UNKNOWN_STATUS_LABEL}</Badge></TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatLastSeen(row.lastSeen)}
                  </TableCell>
                  <TableCell><div className="flex flex-col gap-1"><span>{formatNumber(row.totalProjects)} إجمالي</span><span className="text-xs text-muted-foreground">{formatNumber(row.activeProjects)} نشط</span></div></TableCell>
                  <TableCell className="whitespace-nowrap">{formatCurrency(row.balance, row.currency)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminOverviewTables({ leadOrders, salesLeaders, activeProjects, clients }: { leadOrders: LeadOrder[]; salesLeaders: SalesLeader[]; activeProjects: ActiveProject[]; clients: AdminClient[] }) {
  return (
    <section className="grid gap-6 xl:grid-cols-2" aria-label="ملخص الإدارة">
      <LeadOrdersTable rows={leadOrders} />
      <SalesLeadersTable rows={salesLeaders} />
      <ActiveProjectsTable rows={activeProjects} />
      <ClientsTable rows={clients} />
    </section>
  );
}
