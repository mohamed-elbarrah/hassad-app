"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AiAssistantPanel } from "./AiAssistantPanel";

export function AiAssistantWidget() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) triggerRef.current?.focus();
  }, [open]);

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-3 sm:p-4" role="dialog" aria-modal="true" aria-label="المساعد الذكي">
          <button
            type="button"
            className="absolute inset-0 cursor-default bg-background/80 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-label="إغلاق المساعد الذكي"
          />
          <div className="relative z-10 flex h-[min(560px,calc(100dvh-1.5rem))] w-full max-w-3xl flex-col overflow-hidden rounded-lg border bg-background shadow-lg sm:h-[560px]">
            <AiAssistantPanel onClose={() => setOpen(false)} />
          </div>
        </div>
      )}

      <Button
        ref={triggerRef}
        type="button"
        variant={open ? "secondary" : "default"}
        size="icon"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-4 left-4 z-40 size-14 rounded-full shadow-lg transition-transform hover:scale-105 sm:bottom-6 sm:left-6"
        aria-label={open ? "إغلاق المساعد الذكي" : "فتح المساعد الذكي"}
        aria-expanded={open}
      >
        {open ? <X /> : <Bot />}
      </Button>
    </>
  );
}
