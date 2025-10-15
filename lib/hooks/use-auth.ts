"use client";

import { useState, useEffect } from "react";
import pb, { auth } from "@/lib/pocketbase";
import type { UsersResponse } from "@/lib/types/pocketbase";

interface UseAuthReturn {
  user: UsersResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<boolean>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<UsersResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAuth = async (): Promise<boolean> => {
    try {
      const isValid = await auth.checkAuth();
      if (isValid) {
        const currentUser = auth.user() as UsersResponse;
        setUser(currentUser);
        return true;
      } else {
        setUser(null);
        return false;
      }
    } catch (error) {
      console.error("Error refreshing auth:", error);
      setUser(null);
      return false;
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    try {
      await auth.login(email, password);
      const currentUser = auth.user() as UsersResponse;
      setUser(currentUser);
    } catch (error) {
      console.error("Error in login:", error);
      throw error;
    }
  };

  const logout = (): void => {
    auth.logout();
    setUser(null);
  };

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      await refreshAuth();
      setIsLoading(false);
    };

    initAuth();

    // Escuchar cambios en el auth store
    const unsubscribe = pb.authStore.onChange(() => {
      const currentUser = auth.user() as UsersResponse;
      setUser(currentUser);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    user,
    isAuthenticated: !!user && auth.isValid(),
    isLoading,
    login,
    logout,
    refreshAuth,
  };
}
