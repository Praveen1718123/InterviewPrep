import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function MCQAssessment() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<any[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);

  // Fetch assessment details
  const { data: assessmentData, isLoading, error } = useQuery({
    queryKey: [`/api/candidate/assessment/${id}`],
    enabled: !!id,
  });

  // Start assessment mutation
  const startAssessmentMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/candidate/start-assessment", {
        candidateAssessmentId: assessmentData.id,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/candidate/assessment/${id}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to start assessment: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Submit assessment mutation
  const submitAssessmentMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/candidate/submit-mcq", {
        candidateAssessmentId: assessmentData.id,
        responses,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Assessment Submitted",
        description: "Your responses have been recorded successfully.",
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to submit assessment: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Start assessment if not already started
  useEffect(() => {
    if (
      assessmentData &&
      assessmentData.status === "pending" &&
      !startAssessmentMutation.isPending
    ) {
      startAssessmentMutation.mutate();
    }
  }, [assessmentData]);

  // Initialize responses
  useEffect(() => {
    if (assessmentData && assessmentData.status === "in-progress") {
      // If there are existing responses, use them
      if (assessmentData.responses) {
        setResponses(assessmentData.responses);
      } else {
        // Initialize empty responses for each question
        const questions = assessmentData.assessment.questions;
        setResponses(
          questions.map((q: any) => ({
            questionId: q.id,
            selectedOptionId: "",
          }))
        );
      }

      // Set up timer if needed
      if (assessmentData.assessment.timeLimit) {
        const startTime = new Date(assessmentData.startedAt).getTime();
        const timeLimit = assessmentData.assessment.timeLimit * 60 * 1000; // convert to ms
        const endTime = startTime + timeLimit;
        const now = Date.now();
        const remaining = Math.max(0, endTime - now);
        
        setTimeRemaining(Math.floor(remaining / 1000));
        
        const timer = setInterval(() => {
          setTimeRemaining((prev) => {
            if (prev === null || prev <= 1) {
              clearInterval(timer);
              submitAssessmentMutation.mutate();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        return () => clearInterval(timer);
      }
    }
  }, [assessmentData]);

  if (isLoading) {
    return (
      <DashboardLayout title="MCQ Assessment">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !assessmentData) {
    return (
      <DashboardLayout title="MCQ Assessment">
        <div className="flex flex-col items-center justify-center h-64">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium">Error Loading Assessment</h3>
          <p className="text-gray-600 mt-2">
            {error instanceof Error ? error.message : "Assessment not found or not assigned to you."}
          </p>
          <Button className="mt-4" onClick={() => setLocation("/")}>
            Return to Dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const questions = assessmentData.assessment.questions;
  const currentQuestion = questions[currentQuestionIndex];

  // Format time remaining
  const formatTimeRemaining = () => {
    if (timeRemaining === null) return "";
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Handle response selection
  const handleResponseChange = (optionId: string) => {
    const newResponses = [...responses];
    newResponses[currentQuestionIndex].selectedOptionId = optionId;
    setResponses(newResponses);
  };

  // Navigate to next/previous question
  const goToPrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  // Jump to specific question
  const jumpToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
    }
  };

  // Get question status class
  const getQuestionStatusClass = (index: number) => {
    if (index === currentQuestionIndex) {
      return "border-2 border-primary text-primary font-bold";
    }
    if (responses[index]?.selectedOptionId) {
      return "bg-primary text-white";
    }
    return "bg-gray-200 text-gray-500";
  };

  // Submit assessment
  const handleSubmit = () => {
    submitAssessmentMutation.mutate();
  };

  return (
    <DashboardLayout title={assessmentData.assessment.title}>
      <div className="max-w-3xl mx-auto">
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold">{assessmentData.assessment.title}</h2>
                <p className="text-gray-500 text-sm mt-1">Complete all questions before submitting</p>
              </div>
              <div className="flex items-center">
                {timeRemaining !== null && (
                  <div className="text-sm text-gray-600 mr-4">
                    Time remaining: <span className="font-medium">{formatTimeRemaining()}</span>
                  </div>
                )}
                <div className="bg-primary text-white text-sm py-1 px-3 rounded-full">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </div>
              </div>
            </div>
            
            <div className="border-b border-gray-200 pb-6 mb-6">
              <h3 className="text-lg font-medium mb-4">{currentQuestion.text}</h3>
              
              <RadioGroup
                value={responses[currentQuestionIndex]?.selectedOptionId || ""}
                onValueChange={handleResponseChange}
                className="space-y-3"
              >
                {currentQuestion.options.map((option: any) => (
                  <div key={option.id} className="flex items-center">
                    <RadioGroupItem id={option.id} value={option.id} />
                    <Label htmlFor={option.id} className="ml-3">
                      {option.text}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={goToPrevQuestion}
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </Button>
              <Button
                onClick={goToNextQuestion}
                disabled={currentQuestionIndex === questions.length - 1}
              >
                Next
              </Button>
            </div>
            
            <div className="mt-8">
              <div className="bg-gray-50 p-3 rounded-md">
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {questions.map((_, index) => (
                      <button
                        key={index}
                        className={`h-8 w-8 rounded-full flex items-center justify-center text-sm ${getQuestionStatusClass(
                          index
                        )}`}
                        onClick={() => jumpToQuestion(index)}
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>
                  <AlertDialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
                    <AlertDialogTrigger asChild>
                      <Button variant="success" disabled={submitAssessmentMutation.isPending}>
                        {submitAssessmentMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          "Submit Assessment"
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Submit Assessment</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to submit your assessment? You won't be able to change
                          your answers after submission.
                          
                          {responses.some(r => !r.selectedOptionId) && (
                            <p className="mt-2 text-red-500">
                              Warning: You have unanswered questions. Please check all questions before submitting.
                            </p>
                          )}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleSubmit}>Submit</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
