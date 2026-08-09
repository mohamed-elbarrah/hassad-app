import type { UserRole } from "@hassad/shared";

export type AuthSession = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: string[];
  departments: string[];
  isActive: boolean;
  phoneWhatsapp: string | null;
  avatarUrl: string | null;
  provider: string | null;
  createdAt: string;
  updatedAt: string;
  intakeCompleted: boolean;
  clientId?: string;
};

export type AuthState = {
  status: "unknown" | "authenticated" | "unauthenticated";
  session: AuthSession | null;
};
