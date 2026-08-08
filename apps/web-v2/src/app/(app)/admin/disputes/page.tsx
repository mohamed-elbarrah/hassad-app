import type { Metadata } from "next";

import { ScreenPlaceholder } from "@/components/patterns/screen-placeholder";

export const metadata: Metadata = {
  title: "Disputes | Hassad",
};

export default function DisputesPage() {
  return <ScreenPlaceholder label="Disputes" />;
}
