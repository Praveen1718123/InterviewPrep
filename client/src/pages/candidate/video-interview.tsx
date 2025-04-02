import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { CandidateLayout } from "@/components/layouts/candidate-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRecorder } from "@/lib/use-recorder";
import { Loader2, AlertCircle, Video, StopCircle, RefreshCw } from "lucide-react";
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

export default function VideoInterview() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<any[]>([]);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  
  const { 
    status, 
    startRecording, 
    stopRecording, 
    resetRecording, 
    videoBlob, 
    mediaStream,
    error: recordingError 
  } = useRecorder();

  // Define the assessment data type (simplified)
  interface AssessmentData {
    id: number;
    candidateId: number;
    assessmentId: number;
    status: string;
    startedAt?: string;
    completedAt?: string;
    responses?: any[];
    assessment: {
      id: number;
      title: string;
      type: string;
      questions: {
        id: number;
        text: string;
        timeLimit: number;
      }[];
    };
  }

  // Fetch assessment details
  const { data: assessmentData, isLoading, error } = useQuery<AssessmentData>({
    queryKey: [`/api/candidate/assessment/${id}`],
    enabled: !!id,
  });

  // Start assessment mutation
  const startAssessmentMutation = useMutation({
    mutationFn: async () => {
      if (!assessmentData) {
        throw new Error("Assessment data not loaded");
      }
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
      if (!assessmentData) {
        throw new Error("Assessment data not loaded");
      }
      const res = await apiRequest("POST", "/api/candidate/submit-video", {
        candidateAssessmentId: assessmentData.id,
        responses,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Assessment Submitted",
        description: "Your video responses have been recorded successfully.",
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
            videoUrl: "",
          }))
        );
      }
    }
  }, [assessmentData]);

  // Update video preview when recording
  useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream]);

  // Update video preview when stopped
  useEffect(() => {
    if (videoRef.current && videoBlob && status === "stopped") {
      videoRef.current.srcObject = null;
      videoRef.current.src = URL.createObjectURL(videoBlob);
      
      // Save video blob as response
      if (responses[currentQuestionIndex]) {
        const newResponses = [...responses];
        
        // In a real app, you would upload the video to a server/cloud storage
        // and store the URL. For this example, we'll use a data URL.
        const reader = new FileReader();
        reader.readAsDataURL(videoBlob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          newResponses[currentQuestionIndex].videoUrl = base64data;
          setResponses(newResponses);
        };
      }
    }
  }, [videoBlob, status]);

  // Handle recording timer
  useEffect(() => {
    if (status === "recording" && assessmentData) {
      const question = assessmentData.assessment.questions[currentQuestionIndex];
      const timeLimit = question.timeLimit;
      
      if (timeLimit) {
        setRemainingTime(timeLimit);
        
        const timer = setInterval(() => {
          setRemainingTime((prev) => {
            if (prev === null || prev <= 1) {
              clearInterval(timer);
              stopRecording();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        return () => clearInterval(timer);
      }
    } else {
      setRemainingTime(null);
    }
  }, [status, currentQuestionIndex, assessmentData]);

  if (isLoading) {
    return (
      <CandidateLayout title="Video Interview">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </CandidateLayout>
    );
  }

  if (error || !assessmentData) {
    return (
      <CandidateLayout title="Video Interview">
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

  // Format time remaining
  const formatTimeRemaining = () => {
    if (remainingTime === null) return "";
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Navigate to next/previous question
  const goToPrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      resetRecording();
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      resetRecording();
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  // Jump to specific question
  const jumpToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      resetRecording();
      setCurrentQuestionIndex(index);
    }
  };

  // Get question status class
  const getQuestionStatusClass = (index: number) => {
    if (index === currentQuestionIndex) {
      return "border-2 border-primary text-primary font-bold";
    }
    if (responses[index]?.videoUrl) {
      return "bg-primary text-white";
    }
    return "bg-gray-200 text-gray-500";
  };

  // Submit assessment
  const handleSubmit = () => {
    submitAssessmentMutation.mutate();
  };

  // Check if all questions have been answered
  const allQuestionsAnswered = responses.every(r => r.videoUrl);

  return (
    <CandidateLayout title={assessmentData.assessment.title}>
      <div>
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="mb-3">
              <h2 className="text-xl font-semibold">{assessmentData.assessment.title}</h2>
            </div>
            
            <div className="border-b border-gray-200 pb-6 mb-6">
              <div className="flex items-center mb-5 border-b border-gray-200 pb-3">
                <div className="bg-primary text-white text-sm py-1 px-3 rounded-md mr-3">
                  Question No. {currentQuestionIndex + 1}
                </div>
                
                {remainingTime !== null ? (
                  <div className="flex items-center mr-4">
                    <div className="flex items-center">
                      <span className="mr-2">⏱️</span>
                      <span className="text-sm font-medium mr-1">Time Remaining:</span>
                    </div>
                    <div className="bg-blue-500 text-white text-sm py-1 px-3 rounded-md ml-1 flex items-center font-medium min-w-[50px] justify-center">
                      {formatTimeRemaining()}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center mr-4">
                    <div className="flex items-center">
                      <span className="mr-2">⏱️</span>
                      <span className="text-sm font-medium mr-1">Max time:</span>
                    </div>
                    <div className="bg-gray-200 text-gray-700 text-sm py-1 px-3 rounded-md ml-1 flex items-center font-medium min-w-[50px] justify-center">
                      {currentQuestion.timeLimit}s
                    </div>
                  </div>
                )}
                
                <div className="flex items-center text-xs ml-auto">
                  <div className="flex items-center">
                    <span className="inline-block w-4 h-4 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px] mr-1">✓</span>
                    <span className="mr-2">{responses.filter(r => r.videoUrl).length}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="inline-block w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] mr-1">✗</span>
                    <span>{responses.filter(r => !r.videoUrl).length}</span>
                  </div>
                </div>
              </div>
              
              {/* Only show the question when recording has started or stopped */}
              {(status === "recording" || status === "stopped" || responses[currentQuestionIndex]?.videoUrl) && (
                <div className="bg-gray-50 p-4 rounded-md mb-6">
                  <p className="text-gray-800">{currentQuestion.text}</p>
                </div>
              )}
              
              {/* Show instruction when not recording */}
              {status === "inactive" && !responses[currentQuestionIndex]?.videoUrl && (
                <div className="bg-blue-50 p-4 rounded-md mb-6">
                  <p className="text-blue-800 text-center">Press "Start Recording" to reveal the question and begin your response</p>
                </div>
              )}
              
              <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg mb-6 overflow-hidden">
                {recordingError ? (
                  <div className="flex items-center justify-center h-full bg-red-50">
                    <div className="text-center p-4">
                      <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
                      <p className="text-red-600">{recordingError}</p>
                      <p className="text-gray-500 mt-2">
                        Please ensure your camera and microphone are connected and you've granted permission to use them.
                      </p>
                    </div>
                  </div>
                ) : status === "inactive" && !responses[currentQuestionIndex]?.videoUrl ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Video className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Your video will appear here</p>
                    </div>
                  </div>
                ) : (
                  <video 
                    ref={videoRef} 
                    className="h-full w-full object-cover"
                    autoPlay 
                    playsInline
                    muted={status === "recording"}
                    controls={status === "stopped" || !!responses[currentQuestionIndex]?.videoUrl}
                  />
                )}
              </div>
              
              <div className="flex justify-center space-x-4">
                {status === "inactive" && !responses[currentQuestionIndex]?.videoUrl ? (
                  <div className="text-center">
                    <Button
                      onClick={startRecording}
                      size="lg"
                      className="flex items-center px-6 py-6 text-lg animate-pulse"
                    >
                      <Video className="mr-2 h-5 w-5" />
                      Start Recording to Reveal Question
                    </Button>
                    <p className="text-sm text-gray-500 mt-2">You will see the question after you start recording</p>
                  </div>
                ) : (
                  <>
                    <Button
                      onClick={startRecording}
                      disabled={status !== "inactive"}
                      className="flex items-center"
                    >
                      <Video className="mr-2 h-4 w-4" />
                      Start Recording
                    </Button>
                    <Button
                      variant="outline"
                      onClick={stopRecording}
                      disabled={status !== "recording"}
                      className="flex items-center"
                    >
                      <StopCircle className="mr-2 h-4 w-4" />
                      Stop Recording
                    </Button>
                    <Button
                      variant="outline"
                      onClick={resetRecording}
                      disabled={status !== "stopped" && !responses[currentQuestionIndex]?.videoUrl}
                      className="flex items-center"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Re-record
                    </Button>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={goToPrevQuestion}
                disabled={currentQuestionIndex === 0 || status === "recording"}
              >
                Previous Question
              </Button>
              <Button
                onClick={goToNextQuestion}
                disabled={currentQuestionIndex === questions.length - 1 || status === "recording"}
              >
                Next Question
              </Button>
            </div>
            
            <div className="mt-8">
              <div className="bg-gray-50 p-3 rounded-md">
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {questions.map((question, index: number) => (
                      <button
                        key={index}
                        className={`h-8 w-8 rounded-full flex items-center justify-center text-sm ${getQuestionStatusClass(
                          index
                        )}`}
                        onClick={() => status !== "recording" && jumpToQuestion(index)}
                        disabled={status === "recording"}
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>
                  <AlertDialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="default" 
                        className="bg-green-600 hover:bg-green-700 text-white"
                        disabled={submitAssessmentMutation.isPending || status === "recording" || !allQuestionsAnswered}
                      >
                        {submitAssessmentMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          "Submit All Responses"
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Submit Video Interview</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to submit your video interview? You won't be able to change
                          your responses after submission.
                          
                          {!allQuestionsAnswered && (
                            <p className="mt-2 text-red-500">
                              Warning: You have unrecorded questions. Please record all questions before submitting.
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
    </CandidateLayout>
  );
}
