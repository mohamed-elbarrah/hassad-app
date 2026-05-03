"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useGetProfileQuery } from "@/features/auth/authApi";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { setCredentials, setInitialized } from "@/features/auth/authSlice";

const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/proposal/",
  "/contract/",
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p),
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
    if (isPublic) {
      if (!isInitialized) dispatch(setInitialized(true));
      return;
    }
    if (isSuccess && user) {
      dispatch(setCredentials({ user }));
    } else if (isError) {
      dispatch(setInitialized(true));
    }
  }, [isSuccess, user, isError, dispatch, isPublic, isInitialized]);

  return <>{children}</>;
}
