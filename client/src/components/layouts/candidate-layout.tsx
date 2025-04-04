import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Home, User, LogOut } from "lucide-react";

interface CandidateLayoutProps {
  children: React.ReactNode;
  title: string;
  className?: string;
}

export function CandidateLayout({ children, title, className }: CandidateLayoutProps) {
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <img 
                src="/assets/Switchbee Solution LLP.svg" 
                alt="Switchbee Solutions LLP Logo" 
                className="h-8" 
              />
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/candidate" className="text-gray-700 hover:text-primary flex items-center">
                <Home className="h-5 w-5 mr-1" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              <Link href="/skill-analysis" className="text-gray-700 hover:text-primary flex items-center">
                <User className="h-5 w-5 mr-1" />
                <span className="hidden sm:inline">Skill Analysis</span>
              </Link>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-700" 
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5 mr-1" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Page Title */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-semibold py-4">{title}</h2>
        </div>
      </div>

      {/* Main Content */}
      <main className={cn("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6", className)}>
        {children}
      </main>
    </div>
  );
}