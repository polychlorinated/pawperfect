import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { mcpAPI } from "@/lib/mcpAPI";
import { mcpClient, ClientRole } from "@/lib/mcpClient";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  isAdmin: boolean;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
};

type LoginData = Pick<InsertUser, "username" | "password">;

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [lastAuthAttempt, setLastAuthAttempt] = useState<string | null>(null);
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  
  // Effect to update last auth attempt when user data changes
  useEffect(() => {
    if (user) {
      setLastAuthAttempt(`${user.id}-${Date.now()}`);
    } else {
      setLastAuthAttempt(null);
    }
  }, [user]);

  // Effect to authenticate based on user role (admin or customer with ownerId)
  // This effect runs when lastAuthAttempt changes (which happens when user data loads or changes)
  useEffect(() => {
    if (!user || !lastAuthAttempt) return;
    
    // Ensure we have a valid user object with the expected properties
    if (typeof user !== 'object' || !('id' in user)) return;
    
    // Helper function to attempt authentication
    const attemptAuth = () => {
      // Check if MCP client is already connected
      if (!mcpClient.isConnected()) {
        mcpClient.connect();
      }
      
      // Wait a short delay to ensure connection is established
      setTimeout(() => {
        // Need to type-cast user as SelectUser to avoid TypeScript errors
        const typedUser = user as SelectUser;
        
        if (typedUser.isAdmin) {
          // Authenticate as admin
          console.log("Authenticating as admin", typedUser.id);
          mcpClient.authenticate({ adminKey: "admin123" });
          setIsAdmin(true);
        } else if (typedUser.ownerId) {
          // Authenticate as customer with ownerId
          console.log("Authenticating as customer with ownerId", typedUser.ownerId);
          mcpClient.authenticate({ ownerId: typedUser.ownerId });
          setIsAdmin(false);
        } else {
          console.log("User has no role for authentication");
        }
      }, 300);
    };
    
    // Force a reconnection to ensure clean authentication state
    mcpClient.disconnect();
    
    // Wait a short delay before reconnecting
    setTimeout(attemptAuth, 200);
  }, [user, lastAuthAttempt]);

  // Additional effect to check MCP client role for admin status
  useEffect(() => {
    const handleAuthentication = (success: boolean, role?: ClientRole) => {
      if (success && role === ClientRole.ADMIN) {
        setIsAdmin(true);
      }
    };
    
    const unsubscribe = mcpClient.onAuthentication(handleAuthentication);
    return unsubscribe;
  }, []);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      
      // Force a reconnection to ensure clean authentication state
      mcpClient.disconnect();
      
      setTimeout(() => {
        mcpClient.connect();
        
        setTimeout(() => {
          if (user.isAdmin) {
            // Authenticate as admin
            mcpClient.authenticate({ adminKey: "admin123" });
            setIsAdmin(true);
          } else if (user.ownerId) {
            // Authenticate as customer with ownerId
            mcpClient.authenticate({ ownerId: user.ownerId });
          }
        }, 300);
      }, 200);
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.username}!`,
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Registration successful",
        description: "Your account has been created.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
      // Reset MCP role to guest
      mcpClient.disconnect();
      mcpClient.connect();
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      setIsAdmin(false);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Cast user to SelectUser to avoid type errors
  const typedUser = user as SelectUser | undefined;
  
  return (
    <AuthContext.Provider
      value={{
        user: typedUser ?? null,
        isLoading,
        error,
        isAdmin,
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