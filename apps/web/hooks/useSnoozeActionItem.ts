"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import {
  useSnoozeActionItemMutation,
  useUnsnoozeActionItemMutation,
} from "@/features/portal/portalApi";
import {
  portalSnoozeErrorMessage,
  portalSnoozeSuccessMessage,
  portalUnsnoozeErrorMessage,
  portalUnsnoozeSuccessMessage,
} from "@/lib/i18n";

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
        toast.success(portalSnoozeSuccessMessage());
      } catch {
        toast.error(portalSnoozeErrorMessage());
      }
    },
    [snooze],
  );

  const unsnoozeItem = useCallback(
    async (itemType: string, itemId: string) => {
      try {
        await unsnooze({ itemType, itemId: stripPrefix(itemId) }).unwrap();
        toast.success(portalUnsnoozeSuccessMessage());
      } catch {
        toast.error(portalUnsnoozeErrorMessage());
      }
    },
    [unsnooze],
  );

  return { snoozeItem, unsnoozeItem };
}
