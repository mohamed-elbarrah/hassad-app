import type { Metadata } from "next";

import { DisputesWorkspace } from "@/features/disputes/components/disputes-workspace";

export const metadata: Metadata = {
  title: "Disputes | Hassad",
};

export default function DisputesPage() {
  return <DisputesWorkspace />;
}
