import type { ReactNode } from "react";
import Image from "next/image";

interface AuthPageProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function AuthPage({ title, description, children }: AuthPageProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-center">
        <Image
          src="/masar.svg"
          alt="شعار مسار"
          width={100}
          height={100}
          priority
        />
      </div>

      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {children}
    </div>
  );
}
