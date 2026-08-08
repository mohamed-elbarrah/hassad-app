import type { Metadata } from "next";

import { ScreenPlaceholder } from "@/components/patterns/screen-placeholder";

export const metadata: Metadata = {
  title: "Contract Detail | Hassad",
};

export default function ContractDetailPage() {
  return <ScreenPlaceholder label="Contract Detail" />;
}
