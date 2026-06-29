"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import {
  useSnoozeActionItemMutation,
  useUnsnoozeActionItemMutation,
} from "@/features/portal/portalApi";

const SNOOZE_PREFIX_RE = /^(del|inv|prop|con|strat)-/;

function stripPrefix(id: string): string {
  return id.replace(SNOOZE_PREFIX_RE, "");
}

export function useSnoozeActionItem() {
  const [snooze] = useSnoozeActionItemMutation();
  const [unsnooze] = useUnsnoozeActionItemMutation();

  const snoozeItem = useCallback(
    async (itemType: string, itemId: string) => {
      try {
        await snooze({ itemType, itemId: stripPrefix(itemId) }).unwrap();
        toast.success("تم تأجيل التذكير");
      } catch {
        toast.error("حدث خطأ أثناء تأجيل التذكير");
      }
    },
    [snooze],
  );

  const unsnoozeItem = useCallback(
    async (itemType: string, itemId: string) => {
      try {
        await unsnooze({ itemType, itemId: stripPrefix(itemId) }).unwrap();
        toast.success("تم إلغاء التأجيل");
      } catch {
        toast.error("حدث خطأ أثناء إلغاء التأجيل");
      }
    },
    [unsnooze],
  );

  return { snoozeItem, unsnoozeItem };
}
