import type { Metadata } from "next";

import { ScreenPlaceholder } from "@/components/patterns/screen-placeholder";

export const metadata: Metadata = {
  title: "Requests | Hassad",
};

export default function RequestsPage() {
  return <ScreenPlaceholder label="Requests" />;
}
