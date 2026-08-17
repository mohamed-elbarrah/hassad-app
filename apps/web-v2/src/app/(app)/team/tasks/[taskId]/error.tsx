"use client";

import { RotateCcwIcon } from "lucide-react";
import { StateBlock } from "@/components/patterns/state-block";
import { Button } from "@/components/ui/button";

export default function TeamTaskError({ reset }: { reset: () => void }) {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <StateBlock
        title="Task detail failed to load"
        description="The task could not be loaded. It may be unavailable or no longer assigned to you."
        action={<Button onClick={reset}><RotateCcwIcon data-icon="inline-start" />Try again</Button>}
      />
    </main>
  );
}
