import type { Metadata } from "next";

import { ScreenPlaceholder } from "@/components/patterns/screen-placeholder";

export const metadata: Metadata = {
  title: "Proposals | Hassad",
};

export default function ProposalsPage() {
  return <ScreenPlaceholder label="Proposals" />;
}
