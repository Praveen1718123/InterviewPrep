import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, 
  ArrowLeft,
  User,
  Mail,
  Calendar,
  Clock,
  Edit,
  UserX,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Key,
  Copy
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function ViewCandidate() {
  const params = useParams<{ id: string }>();
  const candidateId = parseInt(params.id);
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("details");
  const { toast } = useToast();

  // Fetch candidate details
  const { data: candidate, isLoading: candidateLoading } = useQuery({
    queryKey: [`/api/admin/candidates/${candidateId}`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/admin/candidates/${candidateId}`);
      return response.json();
    },
    enabled: !isNaN(candidateId),
  });

  // Fetch candidate's assessments
  const { data: assessments, isLoading: assessmentsLoading } = useQuery({
    queryKey: [`/api/admin/candidates/${candidateId}/assessments`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/admin/candidates/${candidateId}/assessments`);
      return response.json();
    },
    enabled: !isNaN(candidateId),
  });

  if (candidateLoading) {
    return (
      <DashboardLayout title="Candidate Details">
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!candidate) {
    return (
      <DashboardLayout title="Candidate Not Found">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Candidate Not Found</h2>
            <p className="text-gray-600 mb-6">
              The candidate you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate("/admin/candidates")}>
              Back to Candidates List
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      case "suspended":
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  const getAssessmentStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-gray-100 text-gray-600">Pending</Badge>;
      case "in-progress":
        return <Badge className="bg-blue-500 hover:bg-blue-600">In Progress</Badge>;
      case "completed":
        return <Badge className="bg-amber-500 hover:bg-amber-600">Completed</Badge>;
      case "reviewed":
        return <Badge className="bg-green-500 hover:bg-green-600">Reviewed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  const copyCredentialsToClipboard = () => {
    const credentialText = `
Username: ${candidate.username}
Password: ${candidate.password}
Email: ${candidate.email}
    `.trim();
    
    navigator.clipboard.writeText(credentialText)
      .then(() => {
        toast({
          title: "Credentials Copied",
          description: "Candidate credentials have been copied to clipboard.",
        });
      })
      .catch(() => {
        toast({
          title: "Failed to copy",
          description: "Unable to copy credentials to clipboard.",
          variant: "destructive",
        });
      });
  };

  return (
    <DashboardLayout title="Candidate Details">
      <div className="mb-6">
        <Link href="/admin/candidates">
          <Button variant="ghost" className="text-gray-600 hover:text-gray-900 pl-0">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Candidates
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Candidate Info Card */}
        <Card className="lg:col-span-1">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <User size={32} />
                </div>
                <div className="ml-4">
                  <h2 className="text-xl font-semibold">{candidate.fullName}</h2>
                  <div className="flex items-center mt-1">
                    {getStatusBadge(candidate.status || "active")}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4 text-sm">
              <div className="flex items-start">
                <User className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                <div>
                  <p className="text-gray-600 mb-1">Username</p>
                  <p className="font-medium">{candidate.username}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Mail className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                <div>
                  <p className="text-gray-600 mb-1">Email</p>
                  <p className="font-medium break-all">{candidate.email}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Calendar className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                <div>
                  <p className="text-gray-600 mb-1">Registered On</p>
                  <p className="font-medium">
                    {candidate.createdAt ? 
                      format(new Date(candidate.createdAt), 'PPP') : 
                      'Not available'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Key className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                <div>
                  <p className="text-gray-600 mb-1">Password</p>
                  <div className="flex items-center">
                    <p className="font-medium">{candidate.password}</p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 ml-2 text-gray-500 hover:text-gray-700"
                      onClick={copyCredentialsToClipboard}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-8">
              <Button 
                className="flex-1"
                onClick={() => navigate(`/admin/candidates/${candidateId}/edit`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Candidate
              </Button>
              <Button 
                variant="outline"
                size="icon"
                onClick={copyCredentialsToClipboard}
                title="Copy Credentials"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Details and Assessments */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="assessments">Assessments</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Candidate Profile</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-600">Account Status</h4>
                      <p className="mt-1 flex items-center">
                        {candidate.status === "active" ? (
                          <>
                            <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                            This account is active and can login to the platform
                          </>
                        ) : candidate.status === "inactive" ? (
                          <>
                            <XCircle className="h-5 w-5 text-gray-500 mr-2" />
                            This account is inactive and cannot login to the platform
                          </>
                        ) : (
                          <>
                            <UserX className="h-5 w-5 text-red-500 mr-2" />
                            This account is suspended due to policy violations
                          </>
                        )}
                      </p>
                    </div>

                    {/* We could add more candidate details here */}
                    <div>
                      <h4 className="font-medium text-gray-600">Assessment Summary</h4>
                      <div className="mt-2 grid grid-cols-2 gap-4 text-center">
                        <div className="p-4 bg-primary/5 rounded-md">
                          <p className="text-2xl font-bold text-primary">
                            {assessmentsLoading ? (
                              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                            ) : assessments?.length || 0}
                          </p>
                          <p className="text-gray-600 text-sm mt-1">Total Assessments</p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-md">
                          <p className="text-2xl font-bold text-green-600">
                            {assessmentsLoading ? (
                              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                            ) : assessments?.filter((a: any) => a.status === "completed" || a.status === "reviewed").length || 0}
                          </p>
                          <p className="text-gray-600 text-sm mt-1">Completed</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="assessments" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Assessment History</h3>
                  
                  {assessmentsLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : !assessments || assessments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <h4 className="text-lg font-medium mb-1">No Assessments Found</h4>
                      <p className="text-sm max-w-md mx-auto">
                        This candidate doesn't have any assessments assigned yet.
                      </p>
                      <Button 
                        className="mt-4"
                        variant="outline"
                        onClick={() => navigate("/admin/bulk-assignment")}
                      >
                        Assign Assessment
                      </Button>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {assessments.map((assessment: any) => (
                        <div key={assessment.id} className="py-4 first:pt-0 last:pb-0">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{assessment.assessment.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">
                                {assessment.assessment.type === "mcq" ? "Multiple Choice Questions" : 
                                 assessment.assessment.type === "fill-in-blanks" ? "Fill in the Blanks" : 
                                 "Video Interview"}
                              </p>
                              
                              <div className="flex items-center mt-2 text-sm">
                                {getAssessmentStatusBadge(assessment.status)}
                                
                                {assessment.startedAt && (
                                  <span className="flex items-center text-gray-500 ml-3">
                                    <Clock className="h-3.5 w-3.5 mr-1" />
                                    Started: {format(new Date(assessment.startedAt), 'PPp')}
                                  </span>
                                )}
                              </div>
                              
                              {assessment.completedAt && (
                                <p className="text-sm text-gray-500 mt-1">
                                  Completed: {format(new Date(assessment.completedAt), 'PPp')}
                                </p>
                              )}
                              
                              {assessment.score !== null && (
                                <p className="text-sm font-medium mt-2">
                                  Score: {assessment.score}%
                                </p>
                              )}
                              
                              {assessment.feedback && (
                                <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                                  <p className="font-medium text-gray-700">Feedback:</p>
                                  <p className="text-gray-600 mt-1">{assessment.feedback}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
}