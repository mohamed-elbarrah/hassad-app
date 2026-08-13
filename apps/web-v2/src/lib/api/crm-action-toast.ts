"use client";

import { toast } from "@/components/ui/toast";

export type CrmActionToast = {
  type: "success" | "error" | "info" | "warning" | "loading";
  title: string;
  description?: string;
};

export function showCrmActionToast(payload: CrmActionToast) {
  toast.add({
    type: payload.type,
    title: payload.title,
    description: payload.description,
  });
}

export function showApiErrorToast(error: unknown) {
  const message =
    typeof error === "object" && error !== null && "data" in error &&
    typeof (error as { data?: unknown }).data === "object" &&
    (error as { data?: { message?: unknown } }).data?.message
      ? String((error as { data?: { message?: unknown } }).data?.message)
      : typeof error === "object" && error !== null && "message" in error &&
          typeof (error as { message?: unknown }).message === "string"
        ? String((error as { message?: unknown }).message)
        : "Request failed";

  toast.add({
    type: "error",
    description: message,
  });
}
