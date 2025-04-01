import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import { ProtectedRoute } from "./lib/protected-route";
import CandidateDashboard from "./pages/candidate/dashboard";
import MCQAssessment from "./pages/candidate/mcq-assessment";
import FillBlanksAssessment from "./pages/candidate/fill-blanks-assessment";
import VideoInterview from "./pages/candidate/video-interview";
import AdminDashboard from "./pages/admin/dashboard";
import AdminCandidates from "./pages/admin/candidates";
import AdminAssessments from "./pages/admin/assessments";
import CreateAssessment from "./pages/admin/create-assessment";

function App() {
  return (
    <>
      <Switch>
        {/* Auth Routes */}
        <Route path="/auth" component={AuthPage} />
        
        {/* Candidate Routes */}
        <ProtectedRoute path="/" component={CandidateDashboard} />
        <ProtectedRoute path="/assessment/mcq/:id" component={MCQAssessment} />
        <ProtectedRoute path="/assessment/fill-blanks/:id" component={FillBlanksAssessment} />
        <ProtectedRoute path="/assessment/video/:id" component={VideoInterview} />
        
        {/* Admin Routes */}
        <ProtectedRoute path="/admin" component={AdminDashboard} />
        <ProtectedRoute path="/admin/candidates" component={AdminCandidates} />
        <ProtectedRoute path="/admin/assessments" component={AdminAssessments} />
        <ProtectedRoute path="/admin/assessments/create" component={CreateAssessment} />
        
        {/* Fallback to 404 */}
        <Route component={NotFound} />
      </Switch>
      <Toaster />
    </>
  );
}

export default App;
