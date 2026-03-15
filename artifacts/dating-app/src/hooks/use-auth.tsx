import { createContext, useContext, ReactNode, useEffect, useState } from "react";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import type { User, LoginRequest, RegisterRequest } from "@workspace/api-client-react/src/generated/api.schemas";
import { login as apiLogin, register as apiRegister } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('dating_token'));
  const queryClient = useQueryClient();

  const { data: user, isLoading, isError, error } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
    },
    request: {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    }
  });

  useEffect(() => {
    if (isError) {
      // Clear invalid token
      logout();
    }
  }, [isError]);

  const login = async (data: LoginRequest) => {
    const res = await apiLogin(data);
    localStorage.setItem('dating_token', res.token);
    setToken(res.token);
    queryClient.setQueryData(getGetMeQueryKey(), res.user);
  };

  const register = async (data: RegisterRequest) => {
    const res = await apiRegister(data);
    localStorage.setItem('dating_token', res.token);
    setToken(res.token);
    queryClient.setQueryData(getGetMeQueryKey(), res.user);
  };

  const logout = () => {
    localStorage.removeItem('dating_token');
    setToken(null);
    queryClient.setQueryData(getGetMeQueryKey(), null);
    queryClient.clear();
  };

  return (
    <AuthContext.Provider value={{ user: user || null, isLoading, login, register, logout, token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
