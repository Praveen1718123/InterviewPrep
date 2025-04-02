import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { User } from "lucide-react";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, loginMutation, registerMutation, isLoading } = useAuth();
  
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

  // Register form state
  const [registerData, setRegisterData] = useState({
    username: "",
    email: "",
    fullName: "",
    password: "",
    role: "candidate" as "admin" | "candidate", // Type assertion to match schema
  });

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginData);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(registerData);
  };

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'role') {
      // Make sure role values are correct type
      setRegisterData(prev => ({ 
        ...prev, 
        [name]: value as "admin" | "candidate" 
      }));
    } else {
      setRegisterData(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
          </div>
          
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="w-full mb-8 border-b border-gray-200 grid grid-cols-2">
              <TabsTrigger value="login" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 pb-2 text-lg font-medium">Login</TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 pb-2 text-lg font-medium">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
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
                
                <div className="text-center mt-4">
                  <p className="text-gray-700">
                    If you are an admin, <Button variant="link" className="p-0 font-normal text-blue-700" onClick={() => {
                      setLoginData({
                        username: "admin",
                        password: "admin123"
                      });
                      loginMutation.mutate({ username: "admin", password: "admin123" });
                    }}>click here to login</Button>.
                  </p>
                </div>
              </form>
            </TabsContent>
            
            <TabsContent value="register">
              <form onSubmit={handleRegisterSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="reg-username" className="text-xl font-medium">
                    Username
                  </label>
                  <Input
                    id="reg-username"
                    name="username"
                    value={registerData.username}
                    onChange={handleRegisterChange}
                    placeholder="Choose a username"
                    required
                    minLength={3}
                    className="p-3 text-base rounded-md"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="email" className="text-xl font-medium">
                    Email
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={registerData.email}
                    onChange={handleRegisterChange}
                    placeholder="Your email address"
                    required
                    className="p-3 text-base rounded-md"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="fullName" className="text-xl font-medium">
                    Full Name
                  </label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={registerData.fullName}
                    onChange={handleRegisterChange}
                    placeholder="Your full name"
                    required
                    minLength={2}
                    className="p-3 text-base rounded-md"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="reg-password" className="text-xl font-medium">
                    Password
                  </label>
                  <Input
                    id="reg-password"
                    name="password"
                    type="password"
                    value={registerData.password}
                    onChange={handleRegisterChange}
                    placeholder="Create a password"
                    required
                    minLength={6}
                    className="p-3 text-base rounded-md"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full py-6 text-lg bg-blue-500 hover:bg-blue-600" 
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? "Creating account..." : "Sign Up"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
