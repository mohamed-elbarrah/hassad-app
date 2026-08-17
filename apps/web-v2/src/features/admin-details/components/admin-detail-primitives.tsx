"use client";

import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function buildInitials(value: string | null | undefined) {
  if (!value) return "--";

  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return "—";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return "—";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatCurrency(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return "—";

  const amount = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(amount)) return String(value);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function DetailCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function DetailFields({
  fields,
}: {
  fields: Array<{ label: string; value: ReactNode }>;
}) {
  return (
    <dl className="flex flex-col gap-4 text-sm">
      {fields.map((field) => (
        <div
          key={field.label}
          className="flex items-start justify-between gap-4"
        >
          <dt className="text-muted-foreground">{field.label}</dt>
          <dd className="text-right font-medium">{field.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function DetailMetricsGrid({
  items,
}: {
  items: Array<{ label: string; value: ReactNode; description?: string }>;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardHeader className="gap-1 pb-2">
            <CardDescription>{item.label}</CardDescription>
            <CardTitle className="text-2xl">{item.value}</CardTitle>
          </CardHeader>
          {item.description ? (
            <CardContent className="pt-0 text-sm text-muted-foreground">
              {item.description}
            </CardContent>
          ) : null}
        </Card>
      ))}
    </div>
  );
}

export function DetailTableCard({
  title,
  description,
  columns,
  rows,
  emptyMessage = "No records available.",
}: {
  title: string;
  description?: string;
  columns: Array<{ key: string; label: string }>;
  rows: Array<Record<string, ReactNode>>;
  emptyMessage?: string;
}) {
  return (
    <DetailCard title={title} description={description}>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key}>{column.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={String(row.id ?? index)}>
                {columns.map((column) => (
                  <TableCell key={column.key}>{row[column.key] ?? "—"}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </DetailCard>
  );
}
