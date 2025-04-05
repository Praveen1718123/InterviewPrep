import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { useMutation, UseMutationResult, useQuery } from "@tanstack/react-query";
import { User as SelectUser, InsertUser } from "@shared/schema";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: SelectUser | null | undefined; // Allow undefined during loading
  isLoading: boolean;
  error: Error | null | unknown;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
};

type LoginData = Pick<InsertUser, "username" | "password">;

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  // Use React Query to fetch the current user and handle caching
  const {
    data: user,
    error,
    isLoading,
    refetch: refetchUser
  } = useQuery<SelectUser | null>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      try {
        console.log("Fetching user data from API");
        const response = await fetch('/api/user', {
          credentials: 'include', // Important: include cookies with the request
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (response.status === 401) {
          console.log("User not authenticated");
          return null;
        }
        
        if (!response.ok) {
          console.error(`Error fetching user: ${response.status}`);
          return null;
        }
        
        const userData = await response.json();
        console.log("User data fetched successfully:", userData.username);
        return userData;
      } catch (err) {
        console.error('Error in user query:', err);
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 1 // Only retry once
  });
  
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      console.log("Attempting login with credentials:", credentials.username);
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (userData: SelectUser) => {
      console.log("Login successful, updating user data cache");
      queryClient.setQueryData(["/api/user"], userData);
      // Refetch user data to ensure we have the latest
      refetchUser();
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${userData.fullName}!`,
      });
    },
    onError: (errorData: Error) => {
      console.error("Login error:", errorData);
      toast({
        title: "Login failed",
        description: "Invalid username or password. Please try again.",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: (userData: SelectUser) => {
      console.log("Registration successful, updating user data cache");
      queryClient.setQueryData(["/api/user"], userData);
      refetchUser();
      
      toast({
        title: "Registration successful",
        description: `Welcome, ${userData.fullName}!`,
      });
    },
    onError: (errorData: Error) => {
      console.error("Registration error:", errorData);
      toast({
        title: "Registration failed",
        description: errorData.message || "Registration failed. Please try again.",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      console.log("Logout successful");
      queryClient.setQueryData(["/api/user"], null);
      refetchUser();
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    },
    onError: (errorData: Error) => {
      console.error("Logout error:", errorData);
      toast({
        title: "Logout failed",
        description: "Could not log out. Please try again.",
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
