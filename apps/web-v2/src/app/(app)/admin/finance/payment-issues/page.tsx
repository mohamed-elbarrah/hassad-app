import type { Metadata } from "next";

import { ScreenPlaceholder } from "@/components/patterns/screen-placeholder";

export const metadata: Metadata = {
  title: "Payment Issues | Hassad",
};

export default function PaymentIssuesPage() {
  return <ScreenPlaceholder label="Payment Issues" />;
}
