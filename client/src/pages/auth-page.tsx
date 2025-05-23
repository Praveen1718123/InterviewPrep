import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { User, Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, loginMutation, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false);
  
  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      setLocation(user.role === "admin" ? "/admin" : "/candidate");
    }
  }, [user, setLocation]);

  // Login form state
  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
  });

  // Admin login form state
  const [adminLoginData, setAdminLoginData] = useState({
    username: "",
    password: "",
  });

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if the username is "admin" - prevent admin login through main form
    if (loginData.username.toLowerCase() === "admin") {
      toast({
        title: "Invalid credentials",
        description: "Please check your username and password.",
        variant: "destructive",
      });
      return;
    }
    
    loginMutation.mutate(loginData, {
      onSuccess: (user) => {
        // Verify the user is not an admin - silently enforce role separation
        if (user.role === "admin") {
          // Log the user out immediately without specific messaging
          loginMutation.reset();
          setTimeout(() => logoutMutation.mutate(), 500);
        }
      }
    });
  };

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate admin fields
    if (!adminLoginData.username || !adminLoginData.password) {
      toast({
        title: "Please enter credentials",
        description: "Username and password are required",
        variant: "destructive",
      });
      return;
    }

    // Ensure the username is "admin" - prevent candidate login through admin form
    if (adminLoginData.username.toLowerCase() !== "admin") {
      toast({
        title: "Invalid credentials",
        description: "Please check your username and password.",
        variant: "destructive", 
      });
      return;
    }

    // Attempt login with admin credentials
    loginMutation.mutate(adminLoginData, {
      onSuccess: (user) => {
        if (user.role !== "admin") {
          toast({
            title: "Invalid credentials",
            description: "Please check your username and password.",
            variant: "destructive",
          });
          // Log out immediately if role is not admin
          loginMutation.reset();
          setTimeout(() => logoutMutation.mutate(), 500);
        } else {
          setIsAdminDialogOpen(false);
          toast({
            title: "Welcome Administrator",
            description: "You have successfully logged in",
            variant: "default",
          });
        }
      },
      onError: () => {
        toast({
          title: "Invalid credentials",
          description: "Please check your username and password.",
          variant: "destructive",
        });
      }
    });
  };

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData(prev => ({ ...prev, [name]: value }));
  };

  const handleAdminLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAdminLoginData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="flex justify-center mb-10">
            <img 
              src="/assets/Asset 1.svg" 
              alt="Company Logo" 
              className="h-28" 
            />
          </div>
          
          <form onSubmit={handleLoginSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="username" className="text-xl font-medium">
                Username
              </label>
              <Input
                id="username"
                name="username"
                value={loginData.username}
                onChange={handleLoginChange}
                placeholder="Enter your username"
                required
                minLength={3}
                className="p-3 text-base rounded-md"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="text-xl font-medium">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                value={loginData.password}
                onChange={handleLoginChange}
                placeholder="Enter your password"
                required
                minLength={6}
                className="p-3 text-base rounded-md"
              />
            </div>
            
            <div className="flex justify-end">
              <Button 
                type="button" 
                variant="link" 
                className="px-0 font-normal text-[#4D95BC]"
              >
                Forgot password?
              </Button>
            </div>
            
            <Button 
              type="submit" 
              className="w-full py-6 text-lg bg-[#0E2D4A] hover:bg-[#0c2339]" 
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Logging in..." : "Login"}
            </Button>
            
            <div className="text-center mt-6">
              <p className="text-gray-500 mb-2">Are you an administrator?</p>
              <Dialog open={isAdminDialogOpen} onOpenChange={setIsAdminDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="px-6"
                  >
                    Admin Login
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Lock className="h-5 w-5 text-[#4D95BC]" />
                      Administrator Login
                    </DialogTitle>
                    <DialogDescription>
                      Please enter your administrator credentials to access the admin dashboard.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleAdminLoginSubmit} className="space-y-4 mt-2">
                    <div className="space-y-2">
                      <label htmlFor="admin-username" className="text-sm font-medium">
                        Admin Username
                      </label>
                      <Input
                        id="admin-username"
                        name="username"
                        value={adminLoginData.username}
                        onChange={handleAdminLoginChange}
                        placeholder="Enter admin username"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="admin-password" className="text-sm font-medium">
                        Admin Password
                      </label>
                      <Input
                        id="admin-password"
                        name="password"
                        type="password"
                        value={adminLoginData.password}
                        onChange={handleAdminLoginChange}
                        placeholder="Enter admin password"
                        required
                      />
                    </div>
                    
                    <div className="flex justify-end gap-2 mt-4">
                      <DialogClose asChild>
                        <Button type="button" variant="outline">
                          Cancel
                        </Button>
                      </DialogClose>
                      <Button 
                        type="submit" 
                        className="bg-[#0E2D4A] hover:bg-[#0c2339]"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? "Logging in..." : "Login"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
