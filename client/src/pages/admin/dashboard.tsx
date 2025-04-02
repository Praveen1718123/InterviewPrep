import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Loader2, 
  Users, 
  CheckCircle, 
  Clock,
  ChevronUp,
  Search,
  MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminDashboard() {
  // Fetch candidates
  const { data: candidates, isLoading: isLoadingCandidates } = useQuery({
    queryKey: ["/api/admin/candidates"],
  });

  // Fetch assessments
  const { data: assessments, isLoading: isLoadingAssessments } = useQuery({
    queryKey: ["/api/admin/assessments"],
  });

  // Get stats
  const getStats = () => {
    if (!candidates || !assessments) return { totalCandidates: 0, completedAssessments: 0, pendingReviews: 0 };

    const totalCandidates = candidates.length;
    
    // Calculate completed assessments and pending reviews
    let completedAssessments = 0;
    let pendingReviews = 0;

    if (candidates) {
      candidates.forEach((candidate: any) => {
        if (candidate.assessments) {
          candidate.assessments.forEach((assessment: any) => {
            if (assessment.status === "completed" || assessment.status === "reviewed") {
              completedAssessments++;
            }
            if (assessment.status === "completed" && !assessment.feedback) {
              pendingReviews++;
            }
          });
        }
      });
    }

    return {
      totalCandidates,
      completedAssessments,
      pendingReviews
    };
  };

  const stats = getStats();

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric", 
      year: "numeric"
    });
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch(status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "in-progress":
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case "review-pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Review Pending</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout title="Dashboard">
      <div className="max-w-7xl mx-auto">
        {(isLoadingCandidates || isLoadingAssessments) ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-blue-100 mr-4">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Total Candidates</p>
                      <h3 className="text-2xl font-bold">{stats.totalCandidates}</h3>
                    </div>
                  </div>
                  <div className="mt-4 text-sm">
                    <span className="text-green-500 font-medium">
                      <ChevronUp className="h-4 w-4 inline" />12%
                    </span>
                    <span className="text-gray-500 ml-1">since last month</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-green-100 mr-4">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Completed Assessments</p>
                      <h3 className="text-2xl font-bold">{stats.completedAssessments}</h3>
                    </div>
                  </div>
                  <div className="mt-4 text-sm">
                    <span className="text-green-500 font-medium">
                      <ChevronUp className="h-4 w-4 inline" />18%
                    </span>
                    <span className="text-gray-500 ml-1">since last month</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-yellow-100 mr-4">
                      <Clock className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Pending Reviews</p>
                      <h3 className="text-2xl font-bold">{stats.pendingReviews}</h3>
                    </div>
                  </div>
                  <div className="mt-4 text-sm">
                    <span className="text-red-500 font-medium">
                      <ChevronUp className="h-4 w-4 inline" />5%
                    </span>
                    <span className="text-gray-500 ml-1">since last week</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Candidates */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Recent Candidates</h2>
                  <div className="flex space-x-2">
                    <div className="relative">
                      <Input 
                        type="text" 
                        placeholder="Search candidates" 
                        className="pl-10"
                      />
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    </div>
                    <Link href="/admin/candidates/new">
                      <Button>Add New</Button>
                    </Link>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Progress
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {candidates && candidates.length > 0 ? (
                        candidates.slice(0, 3).map((candidate: any) => (
                          <tr key={candidate.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <Avatar>
                                    <AvatarFallback>{getInitials(candidate.fullName)}</AvatarFallback>
                                  </Avatar>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{candidate.fullName}</div>
                                  <div className="text-sm text-gray-500">Candidate</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{candidate.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="w-full bg-gray-200 rounded-full h-2.5 w-32">
                                <div 
                                  className="bg-primary h-2.5 rounded-full" 
                                  style={{ width: `${(candidate.progress || 0) * 100}%` }}
                                ></div>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {Math.round((candidate.progress || 0) * 3)}/3 Completed
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(candidate.status || "active")}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <Link to={`/admin/candidates/${candidate.id}`} className="text-primary hover:text-primary-dark mr-3">
                                View
                              </Link>
                              <Link to={`/admin/candidates/${candidate.id}/edit`} className="text-gray-600 hover:text-gray-900">
                                Edit
                              </Link>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                            No candidates found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Showing 1 to {Math.min(candidates?.length || 0, 3)} of {candidates?.length || 0} entries
                  </div>
                  <Link to="/admin/candidates">
                    <Button variant="outline">View All Candidates</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Assessment Management */}
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Assessment Management</h2>
                  <Link to="/admin/assessments/create">
                    <Button>Create New Assessment</Button>
                  </Link>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Assessment
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Candidates
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {assessments && assessments.length > 0 ? (
                        assessments.slice(0, 3).map((assessment: any) => (
                          <tr key={assessment.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{assessment.title}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge 
                                className={`
                                  ${assessment.type === 'mcq' ? 'bg-blue-100 text-blue-800' : ''} 
                                  ${assessment.type === 'fill-in-blanks' ? 'bg-purple-100 text-purple-800' : ''} 
                                  ${assessment.type === 'video' ? 'bg-green-100 text-green-800' : ''}
                                `}
                              >
                                {assessment.type === 'mcq' ? 'MCQ' : 
                                 assessment.type === 'fill-in-blanks' ? 'Fill-in-Blanks' : 
                                 assessment.type === 'video' ? 'Video Interview' : assessment.type}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {assessment.candidateCount || 0} assigned
                              </div>
                              <div className="text-xs text-gray-500">
                                {assessment.completedCount || 0} completed
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(assessment.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem asChild>
                                    <Link to={`/admin/assessments/${assessment.id}/edit`}>
                                      Edit
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link to={`/admin/assessments/${assessment.id}/duplicate`}>
                                      Duplicate
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600">
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                            No assessments found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-4 flex justify-end">
                  <Link to="/admin/assessments">
                    <Button variant="outline">View All Assessments</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
