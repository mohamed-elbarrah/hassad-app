"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PortalReportsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/portal/campaigns");
  }, [router]);
  return null;
}
