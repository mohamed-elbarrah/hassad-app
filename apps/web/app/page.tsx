import Link from "next/link";
import { ActionButton } from "@/components/design-system/ActionButton";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="container px-4 md:px-6 flex flex-col items-center text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl text-primary">
          This Home Page
        </h1>
        <p className="max-w-[600px] text-muted-foreground md:text-xl">
          A full-stack SaaS platform for marketing agencies to manage CRM,
          projects, clients, finances, and campaigns.
        </p>
        <div className="flex flex-col gap-4 mt-8 sm:flex-row">
          <ActionButton href="/login" variant="primary" size="lg">
            Login
          </ActionButton>
          <ActionButton href="/signup" variant="outline" size="lg">
            Sign Up
          </ActionButton>
          <ActionButton href="/design-system" variant="action-blue" size="lg">
            Design System
          </ActionButton>
        </div>
      </div>
    </main>
  );
}
