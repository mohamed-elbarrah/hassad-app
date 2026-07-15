"use client";

import { useState } from "react";
import { Bot, X } from "lucide-react";
import { AiAssistantPanel } from "./AiAssistantPanel";

export function AiAssistantWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end">
          <div
            className="absolute inset-0 bg-black/20"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 w-[720px] h-[560px] bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden m-4 flex flex-col">
            <AiAssistantPanel onClose={() => setOpen(false)} />
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className={`fixed bottom-6 left-6 z-40 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all ${
          open
            ? "bg-neutral-700 text-white rotate-90 scale-95"
            : "bg-secondary-500 text-white hover:bg-secondary-600 hover:scale-105"
        }`}
      >
        {open ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
      </button>
    </>
  );
}
