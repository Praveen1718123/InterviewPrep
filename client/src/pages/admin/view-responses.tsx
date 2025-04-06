import { useState, ChangeEvent } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Loader2, 
  ArrowLeft,
  Search,
  Check,
  X
} from "lucide-react";
import { Assessment, CandidateAssessment, User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Slider } from "@/components/ui/slider";

export default function ViewResponses() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [search, setSearch] = useState("");
  const [candidateId, setCandidateId] = useState<number | null>(null);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState(0);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null);

  // Fetch assessment details
  const { data: assessment, isLoading: isLoadingAssessment } = useQuery<Assessment>({
    queryKey: [`/api/admin/assessments/${id}`],
    enabled: !!id,
  });

  // Define a type for the assignment with candidate info
  type AssignmentWithCandidate = CandidateAssessment & {
    candidate: User;
  };

  // Fetch assessment assignments
  const { data: assignments = [], isLoading: isLoadingAssignments } = useQuery<AssignmentWithCandidate[]>({
    queryKey: [`/api/admin/assessment/${id}/assignments`],
    enabled: !!id,
  });

  // Define a type for the candidate response with assessment details
  type CandidateResponseWithDetails = CandidateAssessment & {
    candidate: User;
    assessment: Assessment;
    mcqResponses?: any[];
    fillInBlanksResponses?: any[];
    videoResponses?: any[];
  };

  // Fetch candidate response details
  const { data: candidateResponse, isLoading: isLoadingResponse } = useQuery<CandidateResponseWithDetails>({
    queryKey: [`/api/admin/candidate-assignment/${candidateId}/${id}`],
    enabled: !!candidateId && !!id,
  });

  // Filter assignments based on search
  const filteredAssignments = assignments.filter(assignment => {
    const candidateName = assignment.candidate?.username || "";
    const searchMatch = candidateName.toLowerCase().includes(search.toLowerCase());
    return searchMatch;
  });

  // Submit feedback mutation
  const feedbackMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/provide-feedback", {
        candidateAssessmentId: selectedAssignmentId,
        feedback,
        score
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Feedback submitted successfully",
      });
      setFeedbackDialogOpen(false);
      
      // Clear form
      setFeedback("");
      setScore(0);
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/admin/assessment/${id}/assignments`] });
      if (candidateId) {
        queryClient.invalidateQueries({ queryKey: [`/api/admin/candidate-assignment/${candidateId}/${id}`] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to submit feedback: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleCandidateSelect = (id: number) => {
    setCandidateId(id);
  };

  const handleProvideFeedback = (assignmentId: number) => {
    setSelectedAssignmentId(assignmentId);
    
    // Pre-fill existing feedback if available
    const assignment = assignments.find(a => a.id === assignmentId);
    if (assignment) {
      setFeedback(assignment.feedback || "");
      setScore(assignment.score || 0);
    }
    
    setFeedbackDialogOpen(true);
  };

  const submitFeedback = () => {
    feedbackMutation.mutate();
  };

  // Format date
  const formatDate = (dateValue: string | Date | null) => {
    if (!dateValue) return "N/A";
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    return format(date, "PPp");
  };

  // Get initials from username
  const getInitials = (username: string) => {
    return username.substring(0, 2).toUpperCase();
  };

  return (
    <DashboardLayout title="View Responses">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            className="mb-4" 
            onClick={() => setLocation("/admin/assessments")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Assessments
          </Button>
          
          <h1 className="text-2xl font-bold mb-2">
            Assessment Responses
          </h1>
          {!isLoadingAssessment && assessment && (
            <div className="flex items-center">
              <h2 className="text-lg font-medium">{assessment.title}</h2>
              <Badge className="ml-2" variant="outline">
                {assessment.type === 'mcq' ? 'Multiple Choice Questions' : 
                 assessment.type === 'fill-in-blanks' ? 'Fill in the Blanks' : 
                 'Video Interview'}
              </Badge>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card>
              <CardContent className="p-6">
                <div className="mb-4 relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    type="text" 
                    placeholder="Search candidates..." 
                    value={search}
                    onChange={handleSearchChange}
                    className="pl-9"
                  />
                </div>
                
                {isLoadingAssignments ? (
                  <div className="flex flex-col items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p className="text-gray-500">Loading candidates...</p>
                  </div>
                ) : filteredAssignments.length > 0 ? (
                  <div className="space-y-2">
                    {filteredAssignments.map((assignment) => (
                      <div 
                        key={assignment.id}
                        className={`p-3 rounded-md cursor-pointer transition-colors ${
                          candidateId === assignment.candidateId 
                            ? 'bg-primary text-white' 
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => handleCandidateSelect(assignment.candidateId)}
                      >
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-3">
                            <AvatarFallback>{getInitials(assignment.candidate.username)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className={`font-medium ${candidateId === assignment.candidateId ? 'text-white' : ''}`}>
                              {assignment.candidate.username}
                            </p>
                            <p className={`text-xs ${candidateId === assignment.candidateId ? 'text-white/70' : 'text-gray-500'}`}>
                              Status: {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                            </p>
                          </div>
                          {assignment.score !== null && (
                            <Badge variant={candidateId === assignment.candidateId ? "outline" : "secondary"}>
                              {assignment.score}/100
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 text-center text-gray-500">
                    No candidates have been assigned to this assessment.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="md:col-span-2">
            {candidateId ? (
              isLoadingResponse ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                  <p className="text-gray-500">Loading responses...</p>
                </div>
              ) : candidateResponse ? (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-lg font-medium mb-1">{candidateResponse.candidate.username}'s Responses</h3>
                        <div className="flex space-x-4 text-sm text-gray-500">
                          <span>Started: {formatDate(candidateResponse.startedAt)}</span>
                          {candidateResponse.completedAt && (
                            <span>Completed: {formatDate(candidateResponse.completedAt)}</span>
                          )}
                        </div>
                      </div>
                      
                      <Button onClick={() => handleProvideFeedback(candidateResponse.id)}>
                        {candidateResponse.feedback ? "Update Feedback" : "Provide Feedback"}
                      </Button>
                    </div>
                    
                    {/* Display existing feedback if available */}
                    {candidateResponse.feedback && (
                      <Card className="mb-6 bg-muted/30">
                        <CardContent className="p-4">
                          <h4 className="font-medium mb-2">Feedback</h4>
                          <p className="text-sm mb-2">{candidateResponse.feedback}</p>
                          
                          {candidateResponse.score !== null && (
                            <div className="flex items-center mt-3">
                              <span className="text-sm font-medium mr-2">Score:</span>
                              <Badge variant="outline">{candidateResponse.score}/100</Badge>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                    
                    {/* Display responses based on assessment type */}
                    {candidateResponse.assessment.type === 'mcq' && candidateResponse.mcqResponses && (
                      <div className="space-y-8">
                        <h4 className="font-medium text-lg mb-4">MCQ Responses</h4>
                        
                        {(candidateResponse.assessment.questions as any[]).map((question: any, questionIndex: number) => {
                          const response = candidateResponse.mcqResponses?.find(
                            (r: any) => r.questionId === questionIndex
                          );
                          
                          return (
                            <div key={questionIndex} className="border rounded-md p-4">
                              <p className="font-medium mb-3">{questionIndex + 1}. {question.text}</p>
                              
                              <div className="space-y-2 mt-3">
                                {question.options.map((option: string, optionIndex: number) => {
                                  const isSelected = response?.selectedOption === optionIndex;
                                  const isCorrect = optionIndex === question.correctOption;
                                  
                                  return (
                                    <div 
                                      key={optionIndex}
                                      className={`p-2 rounded flex items-center ${
                                        isSelected && isCorrect
                                          ? 'bg-green-100'
                                          : isSelected && !isCorrect
                                            ? 'bg-red-100'
                                            : !isSelected && isCorrect
                                              ? 'bg-green-50'
                                              : ''
                                      }`}
                                    >
                                      {isSelected ? (
                                        isCorrect ? (
                                          <Check className="h-4 w-4 text-green-600 mr-2" />
                                        ) : (
                                          <X className="h-4 w-4 text-red-600 mr-2" />
                                        )
                                      ) : (
                                        <div className="w-4 h-4 mr-2" />
                                      )}
                                      <span className={isCorrect ? 'font-medium' : ''}>{option}</span>
                                      
                                      {!isSelected && isCorrect && (
                                        <span className="ml-2 text-sm text-green-600">(Correct answer)</span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {candidateResponse.assessment.type === 'fill-in-blanks' && candidateResponse.fillInBlanksResponses && (
                      <div className="space-y-8">
                        <h4 className="font-medium text-lg mb-4">Fill-in-the-Blanks Responses</h4>
                        
                        {(candidateResponse.assessment.questions as any[]).map((question: any, questionIndex: number) => {
                          const response = candidateResponse.fillInBlanksResponses?.find(
                            (r: any) => r.questionId === questionIndex
                          );
                          
                          return (
                            <div key={questionIndex} className="border rounded-md p-4">
                              <p className="font-medium mb-3">{questionIndex + 1}. {question.text}</p>
                              
                              <div className="space-y-4 mt-5">
                                {question.blanks.map((blank: any, blankIndex: number) => {
                                  const userAnswer = response?.answers[blankIndex] || '';
                                  const isCorrect = userAnswer.toLowerCase() === blank.answer.toLowerCase();
                                  
                                  return (
                                    <div key={blankIndex} className="flex flex-col space-y-1">
                                      <div className="flex items-center">
                                        <span className="text-sm font-medium mr-2">Blank {blankIndex + 1}:</span>
                                        <Badge variant="outline" className="font-mono">
                                          {blank.placeholder}
                                        </Badge>
                                      </div>
                                      
                                      <div className="flex items-center mt-1">
                                        <div className="text-sm">
                                          <span className="font-medium mr-2">Expected:</span>
                                          <Badge variant="secondary" className="font-mono">
                                            {blank.answer}
                                          </Badge>
                                        </div>
                                        
                                        <div className="text-sm ml-6">
                                          <span className="font-medium mr-2">Provided:</span>
                                          <Badge 
                                            variant={isCorrect ? "default" : "destructive"} 
                                            className="font-mono"
                                          >
                                            {userAnswer || '(No answer)'}
                                          </Badge>
                                          {isCorrect && <Check className="h-4 w-4 text-green-600 ml-2 inline" />}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {candidateResponse.assessment.type === 'video' && candidateResponse.videoResponses && (
                      <div className="space-y-8">
                        <h4 className="font-medium text-lg mb-4">Video Responses</h4>
                        
                        {(candidateResponse.assessment.questions as any[]).map((question: any, questionIndex: number) => {
                          const response = candidateResponse.videoResponses?.find(
                            (r: any) => r.questionId === questionIndex
                          );
                          
                          return (
                            <div key={questionIndex} className="border rounded-md p-4">
                              <p className="font-medium mb-3">{questionIndex + 1}. {question.text}</p>
                              
                              {response ? (
                                <div className="mt-4">
                                  <h5 className="text-sm font-medium mb-2">Response:</h5>
                                  
                                  {response.videoUrl ? (
                                    <div className="aspect-video bg-black rounded-md overflow-hidden">
                                      <video 
                                        src={response.videoUrl} 
                                        controls 
                                        className="w-full h-full"
                                      />
                                    </div>
                                  ) : (
                                    <p className="text-gray-500 italic">No video recorded</p>
                                  )}
                                </div>
                              ) : (
                                <p className="text-gray-500 italic mt-2">No response provided</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center h-64">
                    <p className="text-gray-500">Failed to load candidate responses. Please try again.</p>
                    <Button variant="outline" className="mt-4" onClick={() => setCandidateId(null)}>
                      Select another candidate
                    </Button>
                  </CardContent>
                </Card>
              )
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center h-64">
                  <p className="text-gray-500">Select a candidate to view their responses.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      
      {/* Feedback Dialog */}
      <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Provide Feedback</DialogTitle>
            <DialogDescription>
              Add feedback and a score for this candidate's assessment.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Feedback:</label>
              <Textarea 
                placeholder="Enter your feedback..." 
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={5}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Score (out of 100):</label>
                <span className="text-sm font-bold">{score}</span>
              </div>
              <Slider
                value={[score]}
                onValueChange={(value) => setScore(value[0])}
                min={0}
                max={100}
                step={1}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setFeedbackDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitFeedback}>
              {feedbackMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Feedback"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}