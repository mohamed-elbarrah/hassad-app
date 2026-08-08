import type { Metadata } from "next";

import { ScreenPlaceholder } from "@/components/patterns/screen-placeholder";

export const metadata: Metadata = {
  title: "Clients | Hassad",
};

export default function ClientsPage() {
  return <ScreenPlaceholder label="Clients" />;
}
