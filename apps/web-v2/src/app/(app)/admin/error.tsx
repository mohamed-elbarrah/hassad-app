"use client";

import { RotateCcwIcon } from "lucide-react";

import { StateBlock } from "@/components/patterns/state-block";
import { Button } from "@/components/ui/button";

export default function AdminError({ retry }: { retry: () => void }) {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <StateBlock
        title="Admin workspace failed to load"
        description="The route state could not be rendered. Try again before continuing."
        action={
          <Button onClick={() => retry()}>
            <RotateCcwIcon data-icon="inline-start" />
            Try again
          </Button>
        }
      />
    </main>
  );
}
