"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckIcon, CopyIcon, ExternalLinkIcon, FileIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import type {
  ClientBusinessField,
  ClientBusinessGroup,
} from "@/features/clients/lib/client-detail";

function normalizeHref(value: string) {
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return `https://${value}`;
}

function isExternalReference(value: string) {
  return (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("www.")
  );
}

function isRenderableImage(value: string) {
  return (
    value.startsWith("data:image/") ||
    /\.(png|jpe?g|gif|webp|svg)$/i.test(value) ||
    value.includes("placehold.co/")
  );
}

function FileLink({ value }: { value: string }) {
  if (!isExternalReference(value)) {
    return <span className="text-sm font-medium">{value}</span>;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-auto justify-start px-0 text-sm font-medium"
      nativeButton={false}
      render={
        <Link
          href={normalizeHref(value)}
          target="_blank"
          rel="noreferrer noopener"
        />
      }
    >
      <ExternalLinkIcon data-icon="inline-start" />
      {value}
    </Button>
  );
}

function CopyableCode({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Button variant="ghost" size="sm" className="h-7 px-2" onClick={handleCopy}>
      {copied ? <CheckIcon data-icon="inline-start" /> : <CopyIcon data-icon="inline-start" />}
      {value}
    </Button>
  );
}

function ColorFieldValue({ values }: { values: string[] }) {
  return (
    <div className="grid gap-2">
      {values.map((value) => (
        <div
          key={value}
          className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
        >
          <div className="flex items-center gap-3">
            <span
              className="size-5 rounded-full border"
              style={{ backgroundColor: value }}
              aria-hidden="true"
            />
            <span className="font-mono text-sm">{value}</span>
          </div>
          <CopyableCode value={value} />
        </div>
      ))}
    </div>
  );
}

function ListFieldValue({ values }: { values: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {values.map((value) => (
        <Badge key={value} variant="outline">
          {value}
        </Badge>
      ))}
    </div>
  );
}

function FileListValue({ values }: { values: string[] }) {
  return (
    <div className="flex flex-col gap-2">
      {values.map((value) => (
        <div key={value} className="flex items-center gap-2 rounded-lg border px-3 py-2">
          <FileIcon className="size-4 text-muted-foreground" />
          <FileLink value={value} />
        </div>
      ))}
    </div>
  );
}

function ImageFieldValue({ value }: { value: string }) {
  if (!isRenderableImage(value)) {
    return (
      <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
        <FileIcon className="size-4 text-muted-foreground" />
        <FileLink value={value} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-28 items-center justify-center overflow-hidden rounded-lg border bg-muted/30">
        <img src={value} alt="" className="h-full w-full object-contain" />
      </div>
      <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
        <span className="truncate text-sm font-medium">{value}</span>
        <FileLink value={value} />
      </div>
    </div>
  );
}

function ImageListValue({ values }: { values: string[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {values.map((value) => (
        <div key={value} className="flex flex-col gap-2 rounded-lg border p-2">
          <div className="flex h-24 items-center justify-center overflow-hidden rounded-md bg-muted/30">
            {isRenderableImage(value) ? (
              <img src={value} alt="" className="h-full w-full object-cover" />
            ) : (
              <FileIcon className="size-5 text-muted-foreground" />
            )}
          </div>
          <span className="truncate text-xs text-muted-foreground">{value}</span>
        </div>
      ))}
    </div>
  );
}

function FaqFieldValue({
  items,
}: {
  items: NonNullable<Extract<ClientBusinessField, { type: "faq" }>["items"]>;
}) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((item, index) => (
        <div key={`${item.question}-${index}`} className="rounded-lg border px-3 py-3">
          <div className="text-sm font-medium">{item.question}</div>
          <p className="mt-1 text-sm text-muted-foreground">{item.answer}</p>
        </div>
      ))}
    </div>
  );
}

function BusinessFieldValue({ field }: { field: ClientBusinessField }) {
  switch (field.type) {
    case "text":
    case "enum":
      return field.value ? <span className="text-sm font-medium">{field.value}</span> : null;
    case "file":
      return field.value ? <FileLink value={field.value} /> : null;
    case "long-text":
      return field.value ? (
        <p className="text-sm leading-6 text-foreground">{field.value}</p>
      ) : null;
    case "boolean":
      return typeof field.value === "boolean" ? (
        <Badge variant="outline">
          {field.value ? field.trueLabel ?? "Yes" : field.falseLabel ?? "No"}
        </Badge>
      ) : null;
    case "currency":
      return typeof field.value === "number" ? (
        <span className="text-sm font-medium">
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
          }).format(field.value)}
        </span>
      ) : null;
    case "list":
      return field.values?.length ? <ListFieldValue values={field.values} /> : null;
    case "colors":
      return field.values?.length ? <ColorFieldValue values={field.values} /> : null;
    case "file-list":
      return field.values?.length ? <FileListValue values={field.values} /> : null;
    case "image":
      return field.value ? <ImageFieldValue value={field.value} /> : null;
    case "image-list":
      return field.values?.length ? <ImageListValue values={field.values} /> : null;
    case "faq":
      return field.items?.length ? <FaqFieldValue items={field.items} /> : null;
    default:
      return null;
  }
}

function hasFieldContent(field: ClientBusinessField) {
  switch (field.type) {
    case "boolean":
    case "currency":
      return field.value !== undefined && field.value !== null;
    case "faq":
      return Boolean(field.items?.length);
    case "list":
    case "colors":
    case "file-list":
    case "image-list":
      return Boolean(field.values?.length);
    default:
      return Boolean(field.value);
  }
}

export function ClientBusinessSectionContent({
  section,
}: {
  section: ClientBusinessGroup;
}) {
  const visibleFields = section.fields.filter(hasFieldContent);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <div className="text-sm font-medium">{section.label}</div>
        <p className="text-sm text-muted-foreground">{section.description}</p>
      </div>

      {visibleFields.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No business details</EmptyTitle>
            <EmptyDescription>
              This section has no collected intake data yet.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        visibleFields.map((field, index) => (
          <div key={`${section.key}-${field.label}`} className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <span className="text-sm text-muted-foreground">{field.label}</span>
              <BusinessFieldValue field={field} />
            </div>
            {index < visibleFields.length - 1 ? <Separator /> : null}
          </div>
        ))
      )}
    </div>
  );
}
