import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StateBlock } from "@/components/patterns/state-block";

export default function NotFound() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-6">
      <StateBlock
        title="Page not found"
        description="The route you opened does not exist or is no longer available."
        action={
          <Button variant="outline" nativeButton={false} render={<Link href="/" />}>
            <ArrowLeftIcon data-icon="inline-start" />
            Back to overview
          </Button>
        }
      />
    </main>
  );
}
