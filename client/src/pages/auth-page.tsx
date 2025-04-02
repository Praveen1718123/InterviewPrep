import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { User } from "lucide-react";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, loginMutation } = useAuth();
  
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

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginData);
  };

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-center mb-8">Interview Prep Platform</h1>
          
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
                className="px-0 font-normal text-blue-700"
              >
                Forgot password?
              </Button>
            </div>
            
            <Button 
              type="submit" 
              className="w-full py-6 text-lg bg-blue-500 hover:bg-blue-600" 
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Logging in..." : "Login"}
            </Button>
            
            <div className="grid grid-cols-2 gap-3 mt-6">
              <Button 
                type="button" 
                variant="outline" 
                className="p-3"
                onClick={() => {
                  setLoginData({
                    username: "admin",
                    password: "admin123"
                  });
                  loginMutation.mutate({ username: "admin", password: "admin123" });
                }}
              >
                Admin Login
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                className="p-3"
                onClick={() => {
                  setLoginData({
                    username: "candidate",
                    password: "candidate123"
                  });
                  loginMutation.mutate({ username: "candidate", password: "candidate123" });
                }}
              >
                Candidate Login
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
