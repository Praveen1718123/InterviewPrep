import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, useLocation } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: React.ComponentType<any>;
}) {
  const [location] = useLocation();
  
  return (
    <Route path={path}>
      {() => {
        try {
          const { user, isLoading } = useAuth();
          const adminRoute = path.startsWith("/admin");

          // Debug info
          console.log("Protected route access:", {
            path,
            isLoading,
            userExists: !!user,
            userRole: user?.role,
            adminRoute
          });

          // Show loading spinner while checking auth status
          if (isLoading) {
            return (
              <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            );
          }

          // Redirect to login if no user
          if (!user) {
            console.log("No authenticated user, redirecting to /auth");
            return <Redirect to="/auth" />;
          }

          // Redirect candidate trying to access admin routes
          if (adminRoute && user.role !== "admin") {
            console.log("Non-admin trying to access admin route, redirecting to /");
            return <Redirect to="/" />;
          }

          // Redirect admin on candidate home page to admin dashboard
          if (!adminRoute && user.role === "admin" && location === "/") {
            console.log("Admin on home page, redirecting to /admin");
            return <Redirect to="/admin" />;
          }

          // Render the protected component
          console.log("Authorized access granted to:", path);
          return <Component />;
        } catch (error) {
          // Fallback for auth context errors
          console.error("Auth context error:", error);
          return <Redirect to="/auth" />;
        }
      }}
    </Route>
  );
}
