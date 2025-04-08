import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, useLocation } from "wouter";
import { useEffect } from "react";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: React.ComponentType<any>;
}) {
  try {
    const { user, isLoading } = useAuth();
    const [location, setLocation] = useLocation();

    const adminRoute = path.startsWith("/admin");
    const isHomePage = path === "/";

    // Logging for debugging
    useEffect(() => {
      console.log("ProtectedRoute:", {
        path,
        isLoading,
        user: user ? `${user.username} (${user.role})` : "not logged in",
        currentLocation: location,
        adminRoute
      });
    }, [path, user, isLoading, location, adminRoute]);

    // While loading auth state, show a spinner
    if (isLoading) {
      return (
        <Route path={path}>
          <div className="flex flex-col items-center justify-center min-h-screen">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading your profile...</p>
          </div>
        </Route>
      );
    }

    // If not authenticated, redirect to auth page
    if (!user) {
      // Only redirect if we're actually on this route
      if (location === path || (isHomePage && location === "/")) {
        return (
          <Route path={path}>
            <Redirect to="/auth" />
          </Route>
        );
      }
      return <Route path={path}><Redirect to="/auth" /></Route>;
    }

    // If user is trying to access admin route but is not admin
    if (adminRoute && user.role !== "admin") {
      return (
        <Route path={path}>
          <Redirect to="/candidate" />
        </Route>
      );
    }

    // If candidate is at the root path, redirect to candidate dashboard
    if (isHomePage && user.role === "candidate") {
      return (
        <Route path={path}>
          <Redirect to="/candidate" />
        </Route>
      );
    }

    // If admin is at the root path, redirect to admin dashboard
    if (isHomePage && user.role === "admin") {
      return (
        <Route path={path}>
          <Redirect to="/admin" />
        </Route>
      );
    }

    // User is authenticated and has proper access, render the component
    return (
      <Route path={path}>
        <Component />
      </Route>
    );
  } catch (error) {
    console.error("Auth context error:", error);
    // Fallback to login page on auth context error
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }
}
