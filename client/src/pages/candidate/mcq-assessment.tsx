
import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { CandidateLayout } from "@/components/layouts/candidate-layout";
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

interface MCQOption {
  id: string;
  text: string;
}

interface MCQQuestion {
  id: string;
  text: string;
  options: MCQOption[];
  correctOptionId: string;
  timeLimit?: number;
}

interface Assessment {
  id: number;
  title: string;
  description: string;
  timeLimit?: number;
  questions: MCQQuestion[];
}

interface MCQResponse {
  questionId: string;
  selectedOptionId: string;
}

interface AssessmentData {
  id: number;
  status: 'pending' | 'in-progress' | 'completed' | 'reviewed';
  startedAt: string;
  responses?: MCQResponse[];
  assessment: Assessment;
}

export default function MCQAssessment() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<MCQResponse[]>([]);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);

  // Fetch assessment details
  const { data: assessmentData, isLoading, error } = useQuery<AssessmentData>({
    queryKey: [`/api/candidate/assessment/${id}`],
    enabled: !!id,
  });

  // Start assessment mutation
  const startAssessmentMutation = useMutation({
    mutationFn: async () => {
      if (!assessmentData) return null;
      
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
      if (!assessmentData) return null;
      
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
      setLocation(`/candidate/fill-blanks-assessment/${id}`);
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
  }, [assessmentData, startAssessmentMutation]);

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
          questions.map((q) => ({
            questionId: q.id,
            selectedOptionId: "",
          }))
        );
      }
    }
  }, [assessmentData]);



  if (isLoading) {
    return (
      <CandidateLayout title="MCQ Assessment">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </CandidateLayout>
    );
  }

  if (error || !assessmentData) {
    return (
      <CandidateLayout title="MCQ Assessment">
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
      </CandidateLayout>
    );
  }

  const questions = assessmentData.assessment.questions;
  const currentQuestion = questions[currentQuestionIndex];

  // Handle response selection
  const handleResponseChange = (optionId: string) => {
    const newResponses = [...responses];
    // Make sure the response exists before trying to set its property
    if (!newResponses[currentQuestionIndex]) {
      newResponses[currentQuestionIndex] = {
        questionId: questions[currentQuestionIndex].id,
        selectedOptionId: ""
      };
    }
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
    if (responses && responses[index]?.selectedOptionId) {
      return "bg-primary text-white";
    }
    return "bg-gray-200 text-gray-500";
  };

  // Submit assessment
  const handleSubmit = () => {
    submitAssessmentMutation.mutate();
  };
  
  // Calculate assessment completion percentage
  const getCompletionPercentage = () => {
    if (!responses || !responses.length) return 0;
    const answeredCount = responses.filter(r => r && r.selectedOptionId).length;
    return Math.round((answeredCount / questions.length) * 100);
  };

  return (
    <CandidateLayout title={assessmentData.assessment.title}>
      <div>
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="mb-3">
              <h2 className="text-xl font-semibold">{assessmentData.assessment.title}</h2>
            </div>
            
            <div className="flex items-center mb-5 border-b border-gray-200 pb-3">
              <div className="bg-primary text-white text-sm py-1 px-3 rounded-md mr-3">
                Question No. {currentQuestionIndex + 1}
              </div>
              

              
              <div className="flex items-center text-xs ml-auto">
                <div className="flex items-center">
                  <span className="inline-block w-4 h-4 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px] mr-1">✓</span>
                  <span className="mr-2">{responses ? responses.filter(r => r?.selectedOptionId).length : 0}</span>
                </div>
                <div className="flex items-center">
                  <span className="inline-block w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] mr-1">✗</span>
                  <span>{responses ? responses.filter(r => !r?.selectedOptionId).length : questions.length}</span>
                </div>
              </div>
            </div>
            
            <div className="border-b border-gray-200 pb-6 mb-6">
              <h3 className="text-lg font-medium mb-4">{currentQuestion.text}</h3>
              

              
              <RadioGroup
                value={
                  responses.find((r) => r.questionId === currentQuestion.id)?.selectedOptionId || ""
                }
                onValueChange={(value) => {
                  const updated = [...responses];
                  const index = updated.findIndex((r) => r.questionId === currentQuestion.id);
                  if (index !== -1) {
                    updated[index].selectedOptionId = value;
                  } else {
                    updated.push({ questionId: currentQuestion.id, selectedOptionId: value });
                  }
                  setResponses(updated);
                }}
              >
                {currentQuestion.options.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.id} id={option.id} />
                    <Label htmlFor={option.id}>{option.text}</Label>
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
                    {questions.map((_q, index) => (
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
                      <Button variant="secondary" disabled={submitAssessmentMutation.isPending}>
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
                          
                          {responses && responses.some(r => !r?.selectedOptionId) && (
                            <p className="mt-2 text-red-500">
                              Warning: You have unanswered questions. Please check all questions before submitting.
                            </p>
                          )}
                          
                          <div className="mt-4">
                            <p className="mb-1 text-sm">Assessment completion: {getCompletionPercentage()}%</p>
                            <div className="w-full h-2 bg-gray-200 rounded-full">
                              <div 
                                className="h-2 bg-primary rounded-full"
                                style={{ width: `${getCompletionPercentage()}%`}}
                              ></div>
                            </div>
                          </div>
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
    </CandidateLayout>
  );
}