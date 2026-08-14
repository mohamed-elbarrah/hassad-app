"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { AuthSession } from "@/lib/auth/auth-types";
import { clearSession, setSession } from "@/lib/auth/auth-slice";
import { useAppDispatch, useAppSelector } from "@/lib/store";

export function AuthSessionBoundary({
  children,
  session,
}: {
  children: React.ReactNode;
  session: AuthSession;
}) {
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const authStatus = useAppSelector((state) => state.auth.status);
  const sessionExpired = useAppSelector((state) => state.auth.sessionExpired);

  useEffect(() => {
    dispatch(setSession(session));

    return () => {
      dispatch(clearSession());
    };
  }, [dispatch, session]);

  useEffect(() => {
    if (authStatus !== "unauthenticated") {
      return;
    }

    const query = searchParams.toString();
    const next = query ? `${pathname}?${query}` : pathname;
    const reason = sessionExpired ? "&reason=session-expired" : "";
    const target = `/login?next=${encodeURIComponent(next)}${reason}`;

    router.replace(target);
  }, [authStatus, pathname, router, searchParams, sessionExpired]);

  return children;
}
