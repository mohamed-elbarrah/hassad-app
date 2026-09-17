"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useGetProfileQuery } from "@/features/auth/authApi";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { setCredentials, setInitialized } from "@/features/auth/authSlice";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/forgot-password",
  "/reset-password",
  "/setup-password",
  "/proposal/",
  "/contract/",
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) =>
    p === "/" ? pathname === p : pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { isInitialized } = useAppSelector((state) => state.auth);
  const pathname = usePathname();
  const isPublic = isPublicPath(pathname);

  const {
    data: user,
    isSuccess,
    isError,
  } = useGetProfileQuery(undefined, {
    skip: isInitialized || isPublic,
  });

  useEffect(() => {
    // Public routes intentionally do not initialize auth state. This keeps the
    // homepage and onboarding pages free of an auth request while allowing a
    // later protected-route navigation to discover an existing session.
    if (isPublic) return;
    if (isSuccess && user) {
      dispatch(setCredentials({ user }));
    } else if (isError) {
      dispatch(setInitialized(true));
    }
  }, [isSuccess, user, isError, dispatch, isPublic, isInitialized]);

  return <>{children}</>;
}
