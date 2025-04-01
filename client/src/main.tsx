import { createRoot } from "react-dom/client";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Route, Switch } from "wouter";
import { Toaster } from "./components/ui/toaster";
import NotFound from "./pages/not-found";
import { AuthProvider } from "./hooks/use-auth";

// Simple Auth Page Component
const SimpleAuthPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Login to <span className="text-primary">InterviewPrep</span>
        </h1>
        <p className="text-gray-600 mb-6 text-center">
          Platform is under maintenance. Please check back later.
        </p>
        <a
          href="/"
          className="block w-full text-center bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded-md transition duration-200"
        >
          Back to Home
        </a>
      </div>
    </div>
  );
};

// Initial simplified app structure with minimal authentication
const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Switch>
          <Route path="/auth" component={SimpleAuthPage} />
          <Route path="/">
            <div className="min-h-screen flex items-center justify-center bg-primary-50">
              <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
                <h1 className="text-2xl font-bold text-primary mb-4">Interview Preparation Platform</h1>
                <p className="text-gray-600 mb-6">
                  Welcome to the interview preparation platform. Please
                  <a href="/auth" className="text-primary mx-1 hover:underline">
                    login or register
                  </a>
                  to continue.
                </p>
                <a
                  href="/auth"
                  className="block w-full text-center bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded-md transition duration-200"
                >
                  Get Started
                </a>
              </div>
            </div>
          </Route>
          <Route component={NotFound} />
        </Switch>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
};

createRoot(document.getElementById("root")!).render(<App />);
