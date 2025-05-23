import { useQuery } from "@tanstack/react-query";
import { CandidateLayout } from "@/components/layouts/candidate-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Loader2, CheckCircle, Clock, Calendar, FileText, PenSquare, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function CandidateDashboard() {
  const { user } = useAuth();

  const { data: candidateAssessments = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/candidate/assessments"],
    enabled: !!user,
  });

  // Calculate progress
  const calculateProgress = () => {
    if (!candidateAssessments) return 0;
    
    const completed = candidateAssessments.filter(
      (assessment: any) => assessment.status === "completed" || assessment.status === "reviewed"
    ).length;
    
    return candidateAssessments.length > 0
      ? Math.round((completed / candidateAssessments.length) * 100)
      : 0;
  };
  
  // Calculate assessment statistics
  const getAssessmentStats = () => {
    if (!candidateAssessments || candidateAssessments.length === 0) {
      return {
        total: 0,
        completed: 0,
        inProgress: 0,
        pending: 0,
        averageScore: 0
      };
    }
    
    const completed = candidateAssessments.filter(
      (assessment: any) => assessment.status === "completed" || assessment.status === "reviewed"
    );
    
    const inProgress = candidateAssessments.filter(
      (assessment: any) => assessment.status === "in-progress"
    );
    
    const pending = candidateAssessments.filter(
      (assessment: any) => assessment.status === "pending"
    );
    
    // Calculate average score from completed assessments with scores
    const assessmentsWithScores = completed.filter(a => a.score !== undefined && a.score !== null);
    const averageScore = assessmentsWithScores.length > 0 
      ? Math.round(assessmentsWithScores.reduce((sum, a) => sum + a.score, 0) / assessmentsWithScores.length) 
      : 0;
    
    return {
      total: candidateAssessments.length,
      completed: completed.length,
      inProgress: inProgress.length,
      pending: pending.length,
      averageScore
    };
  };

  // Find upcoming assessment
  const getUpcomingAssessment = () => {
    if (!candidateAssessments) return null;
    
    return candidateAssessments.find(
      (assessment: any) => assessment.status === "pending" || assessment.status === "in-progress"
    );
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric", 
      year: "numeric"
    });
  };

  // Get assessment route based on type
  const getAssessmentRoute = (assessment: any) => {
    if (!assessment) return "";
    
    const { type } = assessment.assessment;
    const assessmentId = assessment.assessmentId;
    
    switch (type) {
      case "mcq":
        return `/assessment/mcq/${assessmentId}`;
      case "fill-in-blanks":
        return `/assessment/fill-blanks/${assessmentId}`;
      case "video":
        return `/assessment/video/${assessmentId}`;
      default:
        return "";
    }
  };

  const upcomingAssessment = getUpcomingAssessment();

  return (
    <CandidateLayout title="Dashboard">
      <div>
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Progress Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              {/* Overall Progress */}
              <Card className="col-span-1 md:col-span-2">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Overall Progress</h2>
                    <Button variant="outline" asChild size="sm">
                      <Link href="/skill-analysis">
                        View Skill Analysis
                      </Link>
                    </Button>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="relative h-32 w-32">
                      <svg className="h-full w-full" viewBox="0 0 100 100">
                        {/* Background circle */}
                        <circle
                          className="text-gray-200"
                          strokeWidth="10"
                          stroke="currentColor"
                          fill="transparent"
                          r="40"
                          cx="50"
                          cy="50"
                        />
                        {/* Progress circle */}
                        <circle
                          className="text-primary"
                          strokeWidth="10"
                          strokeDasharray={calculateProgress() * 2.51}
                          strokeDashoffset={0}
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="transparent"
                          r="40"
                          cx="50"
                          cy="50"
                          style={{
                            transformOrigin: "center",
                            transform: "rotate(-90deg)",
                            transition: "stroke-dasharray 0.5s",
                          }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold">{calculateProgress()}%</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-2">Your Progress</h3>
                      <p className="text-gray-600 mb-1">
                        {getAssessmentStats().completed} of {getAssessmentStats().total} assessments completed
                      </p>
                      {getAssessmentStats().inProgress > 0 && (
                        <p className="text-blue-600">
                          {getAssessmentStats().inProgress} in progress
                        </p>
                      )}
                      {getAssessmentStats().pending > 0 && (
                        <p className="text-yellow-600">
                          {getAssessmentStats().pending} pending
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Your Assessments Overview */}
              <Card className="col-span-1 md:col-span-2">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Your Assessments</h2>
                    <Link href="/skill-analysis" className="text-primary text-sm hover:underline">
                      View all
                    </Link>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                    <div 
                      className="bg-primary h-2.5 rounded-full" 
                      style={{ width: `${calculateProgress()}%` }}
                    ></div>
                  </div>
                  
                  <div className="space-y-4">
                    {candidateAssessments?.slice(0, 3).map((assessment: any) => (
                      <div key={assessment.id} className="flex items-center">
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center mr-3 ${
                          assessment.status === "completed" || assessment.status === "reviewed"
                            ? "bg-green-100"
                            : assessment.status === "in-progress"
                            ? "bg-blue-100"
                            : "bg-yellow-100"
                        }`}>
                          {assessment.status === "completed" || assessment.status === "reviewed" ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : assessment.status === "in-progress" ? (
                            <Clock className="h-4 w-4 text-blue-500" />
                          ) : (
                            <Calendar className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{assessment.assessment.title}</p>
                          <p className="text-xs text-gray-500">
                            {assessment.status === "completed" || assessment.status === "reviewed" 
                              ? `Completed on: ${formatDate(assessment.completedAt)}`
                              : assessment.status === "in-progress"
                              ? "In Progress"
                              : "Scheduled"}
                          </p>
                        </div>
                        {assessment.score !== undefined && (
                          <div className="text-sm font-medium">
                            Score: {assessment.score}/100
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Mock Interview Rounds */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-xl">Attend 3 mock interview rounds</CardTitle>
                <CardDescription>Complete each round to improve your interview skills</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* MCQ Round */}
                  <Card className="border-2 border-primary/20 h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3 mx-auto">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-center">MCQs</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center text-sm text-gray-600">
                      Test your knowledge with multiple-choice questions covering key technical concepts.
                      <div className="mt-2 text-xs flex items-center justify-center text-gray-500">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>5 min timer per question</span>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0 flex flex-col gap-2 items-center">
                      <Button asChild variant="outline" size="sm" className="w-full">
                        <Link href="/assessment/mcq/1">Start Round</Link>
                      </Button>
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Completed
                      </span>
                    </CardFooter>
                  </Card>

                  {/* Fill-in-the-Blanks Round */}
                  <Card className="border-2 border-primary/20 h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3 mx-auto">
                        <PenSquare className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-center">Fill-in-the-Blanks</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center text-sm text-gray-600">
                      Practice your applied knowledge by filling in missing code segments and technical terms.
                      <div className="mt-2 text-xs flex items-center justify-center text-gray-500">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>5 min timer per question</span>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0 flex flex-col gap-2 items-center">
                      <Button asChild variant="outline" size="sm" className="w-full">
                        <Link href="/assessment/fill-blanks/2">Start Round</Link>
                      </Button>
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Completed
                      </span>
                    </CardFooter>
                  </Card>

                  {/* Video Interview Round */}
                  <Card className="border-2 border-primary/20 h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3 mx-auto">
                        <Video className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-center">Video Interview</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center text-sm text-gray-600">
                      Record video responses to common behavioral and technical questions asked in interviews.
                      <div className="mt-2 text-xs flex items-center justify-center text-gray-500">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>5 min timer per question</span>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0 flex flex-col gap-2 items-center">
                      <Button asChild variant="outline" size="sm" className="w-full">
                        <Link href="/assessment/video/3">Start Round</Link>
                      </Button>
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Completed
                      </span>
                    </CardFooter>
                  </Card>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center border-t pt-6">
                <div className="text-center max-w-md">
                  <h3 className="text-base font-semibold mb-2">Get feedback and track your progress</h3>
                  <p className="text-sm text-gray-600">Complete all three rounds to receive comprehensive feedback from our experts and track your improvement over time.</p>
                </div>
              </CardFooter>
            </Card>
            
            {/* Upcoming Assessment */}
            {upcomingAssessment && (
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Upcoming Assessment</h2>
                    <Link href="/assessments" className="text-primary hover:text-primary-dark font-medium">
                      View all
                    </Link>
                  </div>
                  
                  <div className="bg-primary bg-opacity-5 border border-primary border-opacity-20 rounded-lg p-5">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">{upcomingAssessment.assessment.title}</h3>
                        <p className="text-gray-600 mb-4">{upcomingAssessment.assessment.description}</p>
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="mr-2 h-4 w-4" />
                          {upcomingAssessment.scheduledFor ? (
                            <span>Scheduled for {formatDate(upcomingAssessment.scheduledFor)}</span>
                          ) : (
                            <span>Ready to start</span>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 md:mt-0">
                        <Button asChild>
                          <Link href={getAssessmentRoute(upcomingAssessment)}>
                            {upcomingAssessment.status === "in-progress" ? "Continue" : "Start"} Assessment
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Feedback */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Recent Feedback</h2>
                
                <div className="space-y-4">
                  {candidateAssessments
                    ?.filter((a: any) => a.status === "reviewed" && a.feedback)
                    .map((assessment: any) => (
                      <div key={assessment.id} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium">{assessment.assessment.title} Feedback</h3>
                          <span className="text-sm text-gray-500">
                            {formatDate(assessment.completedAt)}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-3">{assessment.feedback}</p>
                        {assessment.score !== undefined && (
                          <div className="flex items-center">
                            <div className="flex items-center mr-4">
                              {[1, 2, 3, 4, 5].map((star) => {
                                const score = assessment.score / 20; // Convert to 5 scale
                                return star <= Math.floor(score) ? (
                                  <svg key={star} className="h-4 w-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ) : star - Math.floor(score) < 1 && star - Math.floor(score) > 0 ? (
                                  <svg key={star} className="h-4 w-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" clipPath="inset(0 50% 0 0)" />
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" fill="none" stroke="currentColor" />
                                  </svg>
                                ) : (
                                  <svg key={star} className="h-4 w-4 text-yellow-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                );
                              })}
                            </div>
                            <span className="text-sm font-medium">{(assessment.score / 20).toFixed(1)}/5.0</span>
                          </div>
                        )}
                      </div>
                    ))}

                  {candidateAssessments?.filter((a: any) => a.status === "reviewed" && a.feedback).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>No feedback received yet. Complete an assessment to get feedback.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </CandidateLayout>
  );
}
