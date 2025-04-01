import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, useLocation } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  try {
    const { user, isLoading } = useAuth();
    const [location] = useLocation();

    const adminRoute = path.startsWith("/admin");

    if (isLoading) {
      return (
        <Route path={path}>
          <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </Route>
      );
    }

    if (!user) {
      return (
        <Route path={path}>
          <Redirect to="/auth" />
        </Route>
      );
    }

    // Check if admin route but user is not admin
    if (adminRoute && user.role !== "admin") {
      return (
        <Route path={path}>
          <Redirect to="/" />
        </Route>
      );
    }

    // Check if candidate route but user is admin, redirect to admin dashboard
    if (!adminRoute && user.role === "admin" && location === "/") {
      return (
        <Route path={path}>
          <Redirect to="/admin" />
        </Route>
      );
    }

    return <Route path={path} component={Component} />;
  } catch (error) {
    // Fallback for when the auth context is not available
    console.error("Auth context error:", error);
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }
}
