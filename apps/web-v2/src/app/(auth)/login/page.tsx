import type { Metadata } from "next";

import { LoginForm } from "@/features/auth/components/login-form";
import { redirectAuthenticatedUser } from "@/lib/auth/server-session";

export const metadata: Metadata = {
  title: "Login | Hassad",
};

export default async function LoginPage() {
  await redirectAuthenticatedUser();

  return (
    <main className="flex min-h-svh bg-background">
      <section className="mx-auto flex w-full max-w-md flex-col justify-center gap-8 p-6">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-muted-foreground">Hassad</p>
          <h1 className="text-2xl font-semibold tracking-normal">
            Sign in to your workspace
          </h1>
          <p className="text-sm text-muted-foreground">
            Use your Hassad account to continue to the operational workspace.
          </p>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
