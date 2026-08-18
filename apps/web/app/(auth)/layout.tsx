import { AuthLayout } from "@/components/auth/AuthLayout";

export default function AuthRouteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AuthLayout>{children}</AuthLayout>;
}
