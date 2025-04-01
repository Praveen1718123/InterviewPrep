import { Switch, Route, Link } from "wouter";
import { AuthProvider } from "./hooks/use-auth";
import NotFound from "@/pages/not-found";
import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";

// Lazy load components to reduce initial bundle size
const AuthPage = lazy(() => import("@/pages/auth-page"));
const CandidateDashboard = lazy(() => import("@/pages/candidate/dashboard"));
const MCQAssessment = lazy(() => import("@/pages/candidate/mcq-assessment"));
const FillBlanksAssessment = lazy(() => import("@/pages/candidate/fill-blanks-assessment"));
const VideoInterview = lazy(() => import("@/pages/candidate/video-interview"));
const AdminDashboard = lazy(() => import("@/pages/admin/dashboard"));
const AdminCandidates = lazy(() => import("@/pages/admin/candidates"));
const AdminAssessments = lazy(() => import("@/pages/admin/assessments"));
const CreateAssessment = lazy(() => import("@/pages/admin/create-assessment"));

// Loading fallback for lazy-loaded components
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// Simple welcome page for unauthenticated users
const WelcomePage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-50">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold text-primary mb-4">Interview Preparation Platform</h1>
        <p className="text-gray-600 mb-6">
          Welcome to the interview preparation platform. Please
          <Link href="/auth" className="text-primary mx-1 hover:underline">
            login or register
          </Link>
          to continue.
        </p>
        <Link 
          href="/auth"
          className="block w-full text-center bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded-md transition duration-200"
        >
          Get Started
        </Link>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<LoadingFallback />}>
        <Switch>
          {/* Public Routes */}
          <Route path="/auth" component={AuthPage} />
          <Route path="/" component={WelcomePage} />
          
          {/* We'll restore the protected routes later, after confirming basic routing works */}
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin/candidates" component={AdminCandidates} />
          <Route path="/admin/assessments" component={AdminAssessments} />
          <Route path="/admin/assessments/create" component={CreateAssessment} />
          <Route path="/candidate" component={CandidateDashboard} />
          <Route path="/assessment/mcq/:id" component={MCQAssessment} />
          <Route path="/assessment/fill-blanks/:id" component={FillBlanksAssessment} />
          <Route path="/assessment/video/:id" component={VideoInterview} />
          
          {/* Fallback to 404 */}
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </AuthProvider>
  );
}

export default App;
