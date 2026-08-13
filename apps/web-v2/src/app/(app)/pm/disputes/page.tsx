import type { Metadata } from "next";

import { PmDisputesWorkspace } from "@/features/pm-disputes/components/pm-disputes-workspace";

export const metadata: Metadata = {
  title: "PM Disputes | Hassad",
};

export default function PmDisputesPage() {
  return <PmDisputesWorkspace />;
}
