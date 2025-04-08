import { createContext, ReactNode, useContext, useState, useEffect, useCallback } from "react";
import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { User as SelectUser, InsertUser } from "@shared/schema";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
  refreshUser: () => Promise<void>;
};

type LoginData = Pick<InsertUser, "username" | "password">;

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [user, setUser] = useState<SelectUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Function to refresh the user data from the server
  const refreshUser = useCallback(async () => {
    setIsLoading(true);
    
    try {
      console.log('Fetching user data...');
      const res = await fetch('/api/user', {
        credentials: 'include',  // Send cookies for session authentication
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache' // Ensure fresh response
        }
      });
      
      console.log('User API response status:', res.status);
      
      if (res.ok) {
        const userData = await res.json();
        console.log('User authenticated:', userData.username, userData.role);
        
        // Update user state AND query cache for consistency
        setUser(userData);
        queryClient.setQueryData(['/api/user'], userData);
      } else {
        console.log('User not authenticated, status:', res.status);
        // Clear user data on auth failure
        setUser(null);
        queryClient.setQueryData(['/api/user'], null);
      }
    } catch (err) {
      console.error('Error fetching user:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch user data'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch user data on initial load
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      console.log('Attempting login for:', credentials.username);
      const res = await apiRequest("POST", "/api/login", credentials);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Invalid credentials');
      }
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      console.log('Login successful for:', user.username, 'with role:', user.role);
      setUser(user);
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.fullName}!`,
      });
    },
    onError: (error: Error) => {
      console.error('Login error:', error.message);
      setError(error);
      toast({
        title: "Login failed",
        description: "Invalid username or password.",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Registration failed');
      }
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      setUser(user);
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Registration successful",
        description: `Welcome, ${user.fullName}!`,
      });
    },
    onError: (error: Error) => {
      setError(error);
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/logout");
      if (!res.ok) {
        throw new Error('Failed to logout');
      }
    },
    onSuccess: () => {
      console.log('Logout successful');
      setUser(null);
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    },
    onError: (error: Error) => {
      console.error('Logout error:', error);
      setError(error);
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        refreshUser,
      }}
    >
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
