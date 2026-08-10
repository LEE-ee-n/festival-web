"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { getPersonalServiceAccess } from "@/lib/access/serviceAccess";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { supabase } from "@/lib/supabase/client";

type ServiceAccessState = {
  isAuthenticated: boolean;
  hasPersonalServiceAccess: boolean;
  isLoading: boolean;
  errorMessage: string | null;
  reload: () => Promise<void>;
};

const ServiceAccessContext = createContext<ServiceAccessState | null>(null);

export default function ServiceAccessProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasPersonalServiceAccess, setHasPersonalServiceAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const user = await getCurrentUser();
      setIsAuthenticated(Boolean(user));
      setHasPersonalServiceAccess(user ? await getPersonalServiceAccess() : false);
    } catch (error) {
      console.error("Failed to load service access", error);
      setHasPersonalServiceAccess(false);
      setErrorMessage("서비스 이용권을 확인하지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;

    queueMicrotask(() => {
      if (!isCancelled) void reload();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      queueMicrotask(() => {
        if (!isCancelled) void reload();
      });
    });

    return () => {
      isCancelled = true;
      subscription.unsubscribe();
    };
  }, [reload]);

  const value = useMemo<ServiceAccessState>(() => ({
    isAuthenticated,
    hasPersonalServiceAccess,
    isLoading,
    errorMessage,
    reload,
  }), [errorMessage, hasPersonalServiceAccess, isAuthenticated, isLoading, reload]);

  return (
    <ServiceAccessContext.Provider value={value}>
      {children}
    </ServiceAccessContext.Provider>
  );
}

export function useServiceAccess(): ServiceAccessState {
  const value = useContext(ServiceAccessContext);

  if (!value) {
    throw new Error("useServiceAccess must be used inside ServiceAccessProvider");
  }

  return value;
}
