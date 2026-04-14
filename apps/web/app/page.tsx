import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="container px-4 md:px-6 flex flex-col items-center text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl text-primary">
          This Home Page
        </h1>
        <p className="max-w-[600px] text-muted-foreground md:text-xl">
          A full-stack SaaS platform for marketing agencies to manage CRM, projects, clients, finances, and campaigns.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Link href="/login">
            <Button size="lg" className="w-full sm:w-auto">
              Login
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Sign Up
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
