"use client";

import { RotateCcwIcon } from "lucide-react";
import { StateBlock } from "@/components/patterns/state-block";
import { Button } from "@/components/ui/button";

export default function TeamError({ reset }: { reset: () => void }) {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <StateBlock
        title="Team workspace failed to load"
        description="The task board could not be rendered. Try again before continuing."
        action={<Button onClick={reset}><RotateCcwIcon data-icon="inline-start" />Try again</Button>}
      />
    </main>
  );
}
