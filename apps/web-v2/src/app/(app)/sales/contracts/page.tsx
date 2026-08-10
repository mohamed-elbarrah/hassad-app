import type { Metadata } from "next";

import { ScreenPlaceholder } from "@/components/patterns/screen-placeholder";

export const metadata: Metadata = {
  title: "Sales Contracts | Hassad",
};

export default function ContractsPage() {
  return <ScreenPlaceholder label="Contracts" />;
}
