"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const labels: Record<string, string> = {
  admin: "Admin",
  sales: "Sales",
  pm: "PM",
  team: "Team",
  marketing: "Marketing",
  employees: "Employees",
  activity: "Activity",
  sessions: "Sessions",
  clients: "Clients",
  projects: "Projects",
  crm: "CRM",
  orders: "Orders",
  leads: "Orders",
  offers: "Offers",
  proposals: "Proposals",
  contracts: "Contracts",
  disputes: "Disputes",
  tasks: "Tasks",
  chat: "Chat",
  campaigns: "Campaigns",
  reports: "Reports",
  settings: "Settings",
  finance: "Finance",
  invoices: "Invoices",
  payments: "Payments",
  payroll: "Payroll",
  "payment-issues": "Payment Issues",
  deliverables: "Deliverables",
  periods: "Periods",
  forbidden: "Forbidden",
};

export function AppBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const crumbs = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`;
    return {
      href,
      label: labels[segment] ?? "Detail",
    };
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;

          return (
            <Fragment key={crumb.href}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink render={<Link href={crumb.href} />}>
                    {crumb.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
