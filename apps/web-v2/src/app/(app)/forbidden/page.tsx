import type { Metadata } from "next";
import Link from "next/link";
import { LockKeyholeIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export const metadata: Metadata = {
  title: "Forbidden | Hassad",
};

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-[calc(100svh-7rem)] items-center">
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <LockKeyholeIcon />
          </EmptyMedia>
          <EmptyTitle>Access denied</EmptyTitle>
          <EmptyDescription>
            Your account is signed in, but this workspace is not available for the
            current role yet.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button render={<Link href="/" />}>Go to available workspace</Button>
        </EmptyContent>
      </Empty>
    </main>
  );
}
