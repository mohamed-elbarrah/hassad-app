import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlertIcon } from "lucide-react";

import { PageScaffold } from "@/components/patterns/page-scaffold";
import { StateBlock } from "@/components/patterns/state-block";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Forbidden | Hassad",
};

export default function EmployeesForbiddenPage() {
  return (
    <PageScaffold
      title="Permission required"
      description="This preview validates the first-slice forbidden state for permission-dependent commands."
    >
      <StateBlock
        icon={<ShieldAlertIcon />}
        title="You do not have permission to manage employees"
        description="Ask an administrator for people-and-access permissions before changing account state, roles, sessions, or direct grants."
        action={
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/admin/employees" />}
          >
            Back to employees
          </Button>
        }
      />
    </PageScaffold>
  );
}
