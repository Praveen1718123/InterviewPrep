import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Trash, ArrowUp, ArrowDown, AlignJustify, Edit, Info, X } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { MCQQuestion, FillInBlanksQuestion, VideoQuestion, BriefAnswerQuestion } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";

// Helper function to generate a UUID for question IDs and option IDs
const generateId = () => uuidv4();

export default function EditAssessment() {
  const { id } = useParams();
  const [location, navigate] = useLocation();
  const assessmentId = id ? parseInt(id) : 0;
  const { toast } = useToast();
  
  // Get the tab from the URL query parameter
  const queryParams = new URLSearchParams(location.split('?')[1] || '');
  const initialTab = queryParams.get('tab') || 'details';
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [reorderedQuestions, setReorderedQuestions] = useState<any[]>([]);
  const [editForm, setEditForm] = useState<{
    title: string;
    description: string;
    timeLimit: number | null;
  }>({
    title: '',
    description: '',
    timeLimit: null
  });

  // Fetch assessment details
  const { data: assessment, isLoading, error } = useQuery<any>({
    queryKey: ['/api/admin/assessments', assessmentId],
    enabled: !isNaN(assessmentId),
    retry: 3, // Retry failed requests up to 3 times
    staleTime: 60000, // Consider data fresh for 1 minute
    refetchOnWindowFocus: false
  });

  useEffect(() => {
    if (assessment) {
      if (assessment.questions) {
        setReorderedQuestions([...assessment.questions]);
      }
      
      // Initialize edit form with assessment data
      setEditForm({
        title: assessment.title || '',
        description: assessment.description || '',
        timeLimit: assessment.timeLimit || null
      });
    }
    // Add debug logging
    console.log("Assessment data:", assessment);
  }, [assessment]);

  // Add question mutation
  const addQuestionMutation = useMutation({
    mutationFn: async (questionData: any) => {
      console.log("Adding question:", questionData);
      const response = await apiRequest(
        "POST", 
        `/api/admin/assessments/${assessmentId}/questions`,
        questionData
      );
      try {
        return await response.json();
      } catch (e) {
        // If response is not JSON, just return success
        return { success: true };
      }
    },
    onSuccess: (data) => {
      console.log("Question added successfully, response:", data);
      queryClient.invalidateQueries({queryKey: ['/api/admin/assessments', assessmentId]});
      setIsAddingQuestion(false);
      toast({
        title: "Success",
        description: "Question added successfully",
      });
    },
    onError: (error) => {
      console.error("Add question error:", error);
      toast({
        title: "Error",
        description: "Failed to add question: " + error.message,
        variant: "destructive",
      });
    }
  });

  // Update question mutation
  const updateQuestionMutation = useMutation({
    mutationFn: async ({ questionId, questionData }: { questionId: string, questionData: any }) => {
      const response = await apiRequest(
        "PUT", 
        `/api/admin/assessments/${assessmentId}/questions/${questionId}`,
        questionData
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['/api/admin/assessments', assessmentId]});
      setIsEditingQuestion(false);
      setCurrentQuestion(null);
      toast({
        title: "Success",
        description: "Question updated successfully",
      });
    },
    onError: (error) => {
      console.error("Update question error:", error);
      toast({
        title: "Error",
        description: "Failed to update question: " + error.message,
        variant: "destructive",
      });
    }
  });

  // Delete question mutation
  const deleteQuestionMutation = useMutation({
    mutationFn: async (questionId: string) => {
      console.log("Deleting question with ID:", questionId);
      const response = await apiRequest(
        "DELETE", 
        `/api/admin/assessments/${assessmentId}/questions/${questionId}`
      );
      // Try to parse the response as JSON if available
      try {
        return await response.json();
      } catch (e) {
        // If response is not JSON, just return success
        return { success: true };
      }
    },
    onSuccess: (data) => {
      console.log("Question deleted successfully, response:", data);
      queryClient.invalidateQueries({queryKey: ['/api/admin/assessments', assessmentId]});
      toast({
        title: "Success",
        description: "Question deleted successfully",
      });
    },
    onError: (error) => {
      console.error("Delete question error:", error);
      toast({
        title: "Error",
        description: "Failed to delete question: " + error.message,
        variant: "destructive",
      });
    }
  });

  // Reorder questions mutation
  const reorderQuestionsMutation = useMutation({
    mutationFn: async (questions: any[]) => {
      const response = await apiRequest(
        "PUT", 
        `/api/admin/assessments/${assessmentId}/questions/reorder`,
        { questions }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['/api/admin/assessments', assessmentId]});
      setIsReordering(false);
      toast({
        title: "Success",
        description: "Questions reordered successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to reorder questions: " + error.message,
        variant: "destructive",
      });
    }
  });
  
  // Update assessment details mutation
  const updateAssessmentMutation = useMutation({
    mutationFn: async (assessmentData: any) => {
      const response = await apiRequest(
        "PUT", 
        `/api/admin/assessments/${assessmentId}`,
        assessmentData
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['/api/admin/assessments', assessmentId]});
      setIsEditingDetails(false);
      toast({
        title: "Success",
        description: "Assessment details updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update assessment details: " + error.message,
        variant: "destructive",
      });
    }
  });
  
  // Handler for clicking the Edit Details button
  const handleEditDetailsClick = () => {
    setIsEditingDetails(true);
  };
  
  // Handler for submitting updated assessment details
  const handleUpdateDetails = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editForm.title.trim()) {
      toast({
        title: "Error",
        description: "Assessment title is required",
        variant: "destructive",
      });
      return;
    }
    
    updateAssessmentMutation.mutate(editForm);
  };

  // MCQ Question Form
  const MCQQuestionForm = ({ onSubmit, initialData = null }: { onSubmit: (data: any) => void, initialData?: any }) => {
    const [options, setOptions] = useState<{id: string, text: string}[]>(
      initialData?.options || [
        {id: generateId(), text: ""}, 
        {id: generateId(), text: ""}, 
        {id: generateId(), text: ""}, 
        {id: generateId(), text: ""}
      ]
    );
    const [correctOptionId, setCorrectOptionId] = useState<string | null>(initialData?.correctOptionId || null);
    const [questionText, setQuestionText] = useState(initialData?.text || "");
    const [timeLimit, setTimeLimit] = useState(initialData?.timeLimit || 60);

    const addOption = () => {
      setOptions([...options, {id: generateId(), text: ""}]);
    };

    const removeOption = (index: number) => {
      const newOptions = [...options];
      if (newOptions[index].id === correctOptionId) {
        setCorrectOptionId(null);
      }
      newOptions.splice(index, 1);
      setOptions(newOptions);
    };

    const updateOption = (index: number, text: string) => {
      const newOptions = [...options];
      newOptions[index].text = text;
      setOptions(newOptions);
    };

    const handleSubmit = () => {
      if (!questionText.trim()) {
        toast({
          title: "Error",
          description: "Question text is required",
          variant: "destructive",
        });
        return;
      }

      if (options.length < 2) {
        toast({
          title: "Error",
          description: "At least two options are required",
          variant: "destructive",
        });
        return;
      }

      if (!correctOptionId) {
        toast({
          title: "Error",
          description: "Please select a correct option",
          variant: "destructive",
        });
        return;
      }

      if (options.some(option => !option.text.trim())) {
        toast({
          title: "Error",
          description: "All options must have text",
          variant: "destructive",
        });
        return;
      }

      const question: MCQQuestion = {
        id: initialData?.id || generateId(),
        text: questionText,
        options,
        correctOptionId,
        timeLimit: timeLimit > 0 ? timeLimit : undefined
      };

      console.log("Submitting MCQ question:", question);
      onSubmit(question);
    };

    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="question">Question</Label>
          <Textarea 
            id="question" 
            value={questionText} 
            onChange={(e) => setQuestionText(e.target.value)}
            className="min-h-[100px]"
            placeholder="Enter the question text"
          />
        </div>

        <div>
          <Label htmlFor="timeLimit">Time Limit (seconds)</Label>
          <Input 
            id="timeLimit" 
            type="number" 
            value={timeLimit} 
            onChange={(e) => setTimeLimit(parseInt(e.target.value))}
            placeholder="Time limit in seconds (optional)"
          />
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label>Options</Label>
            <Button type="button" variant="outline" size="sm" onClick={addOption}>
              <Plus className="h-4 w-4 mr-1" /> Add Option
            </Button>
          </div>
          
          {options.map((option, index) => (
            <div key={option.id} className="flex items-center gap-2">
              <Input
                value={option.text}
                onChange={(e) => updateOption(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
                className="flex-1"
              />
              <Button 
                type="button" 
                variant="ghost" 
                size="sm"
                onClick={() => setCorrectOptionId(option.id)}
                className={correctOptionId === option.id ? "bg-green-100 hover:bg-green-200" : ""}
              >
                {correctOptionId === option.id ? "Correct" : "Set as Correct"}
              </Button>
              {options.length > 1 && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={() => removeOption(index)}
                >
                  <Trash className="h-4 w-4 text-red-500" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => initialData ? setIsEditingQuestion(false) : setIsAddingQuestion(false)}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit}>
            {initialData ? "Update Question" : "Add Question"}
          </Button>
        </div>
      </div>
    );
  };

  // Fill in Blanks Question Form
  const FillInBlanksQuestionForm = ({ onSubmit, initialData = null }: { onSubmit: (data: any) => void, initialData?: any }) => {
    const [questionText, setQuestionText] = useState(initialData?.text || "");
    const [blanks, setBlanks] = useState<{id: string, correctAnswer: string}[]>(
      initialData?.blanks || [
        {id: generateId(), correctAnswer: ""}, 
        {id: generateId(), correctAnswer: ""}
      ]
    );
    const [timeLimit, setTimeLimit] = useState(initialData?.timeLimit || 120);

    const addBlank = () => {
      setBlanks([...blanks, {id: generateId(), correctAnswer: ""}]);
    };

    const removeBlank = (index: number) => {
      const newBlanks = [...blanks];
      newBlanks.splice(index, 1);
      setBlanks(newBlanks);
    };

    const updateBlank = (index: number, correctAnswer: string) => {
      const newBlanks = [...blanks];
      newBlanks[index].correctAnswer = correctAnswer;
      setBlanks(newBlanks);
    };

    const handleSubmit = () => {
      if (!questionText.trim()) {
        toast({
          title: "Error",
          description: "Question text is required",
          variant: "destructive",
        });
        return;
      }

      if (blanks.length < 1) {
        toast({
          title: "Error",
          description: "At least one blank is required",
          variant: "destructive",
        });
        return;
      }

      if (blanks.some(blank => !blank.correctAnswer.trim())) {
        toast({
          title: "Error",
          description: "All blanks must have correct answers",
          variant: "destructive",
        });
        return;
      }

      const question: FillInBlanksQuestion = {
        id: initialData?.id || generateId(),
        text: questionText,
        blanks,
        timeLimit: timeLimit > 0 ? timeLimit : undefined
      };

      console.log("Submitting fill-in-blanks question:", question);
      onSubmit(question);
    };

    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="question">Question Text</Label>
          <p className="text-sm text-gray-500 mb-1">
            Use &#123;&#123;blank&#125;&#125; to mark where blanks should appear in the text.
          </p>
          <Textarea 
            id="question" 
            value={questionText} 
            onChange={(e) => setQuestionText(e.target.value)}
            className="min-h-[100px]"
            placeholder="Example: The HTTP protocol works on port {{blank}} and HTTPS works on port {{blank}}."
          />
        </div>

        <div>
          <Label htmlFor="timeLimit">Time Limit (seconds)</Label>
          <Input 
            id="timeLimit" 
            type="number" 
            value={timeLimit} 
            onChange={(e) => setTimeLimit(parseInt(e.target.value))}
            placeholder="Time limit in seconds (optional)"
          />
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label>Correct Answers</Label>
            <Button type="button" variant="outline" size="sm" onClick={addBlank}>
              <Plus className="h-4 w-4 mr-1" /> Add Answer
            </Button>
          </div>
          
          {blanks.map((blank, index) => (
            <div key={blank.id} className="flex items-center gap-2">
              <div className="flex-none">Blank {index + 1}:</div>
              <Input
                value={blank.correctAnswer}
                onChange={(e) => updateBlank(index, e.target.value)}
                placeholder="Correct answer"
                className="flex-1"
              />
              {blanks.length > 1 && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={() => removeBlank(index)}
                >
                  <Trash className="h-4 w-4 text-red-500" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => initialData ? setIsEditingQuestion(false) : setIsAddingQuestion(false)}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit}>
            {initialData ? "Update Question" : "Add Question"}
          </Button>
        </div>
      </div>
    );
  };

  // Video Question Form
  const VideoQuestionForm = ({ onSubmit, initialData = null }: { onSubmit: (data: any) => void, initialData?: any }) => {
    const [questionText, setQuestionText] = useState(initialData?.text || "");
    const [timeLimit, setTimeLimit] = useState(initialData?.timeLimit || 180);

    const handleSubmit = () => {
      if (!questionText.trim()) {
        toast({
          title: "Error",
          description: "Question text is required",
          variant: "destructive",
        });
        return;
      }

      if (timeLimit <= 0) {
        toast({
          title: "Error",
          description: "Time limit must be greater than 0",
          variant: "destructive",
        });
        return;
      }

      const question: VideoQuestion = {
        id: initialData?.id || generateId(),
        text: questionText,
        timeLimit
      };

      console.log("Submitting video question:", question);
      onSubmit(question);
    };

    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="question">Question</Label>
          <Textarea 
            id="question" 
            value={questionText} 
            onChange={(e) => setQuestionText(e.target.value)}
            className="min-h-[100px]"
            placeholder="Enter the question the candidate should answer in the video response"
          />
        </div>

        <div>
          <Label htmlFor="timeLimit">Time Limit (seconds)</Label>
          <Input 
            id="timeLimit" 
            type="number" 
            value={timeLimit} 
            onChange={(e) => setTimeLimit(parseInt(e.target.value))}
            placeholder="Time limit in seconds"
            min="1"
          />
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => initialData ? setIsEditingQuestion(false) : setIsAddingQuestion(false)}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit}>
            {initialData ? "Update Question" : "Add Question"}
          </Button>
        </div>
      </div>
    );
  };

  // Brief Answer Question Form
  // Brief Answer Question Form Component
  const BriefAnswerQuestionForm = ({ onSubmit, initialData = null }: { onSubmit: (data: any) => void, initialData?: any }) => {
    const [questionText, setQuestionText] = useState(initialData?.text || "");
    const [timeLimit, setTimeLimit] = useState(initialData?.timeLimit || 180);
    const [expectedAnswerLength, setExpectedAnswerLength] = useState<string>(
      initialData?.expectedAnswerLength ? initialData.expectedAnswerLength.toString() : ""
    );

    const handleSubmit = () => {
      if (!questionText.trim()) {
        toast({
          title: "Error",
          description: "Question text is required",
          variant: "destructive",
        });
        return;
      }

      if (timeLimit <= 0) {
        toast({
          title: "Error",
          description: "Time limit must be greater than 0",
          variant: "destructive",
        });
        return;
      }

      // Create a question object that matches the schema
      const question: BriefAnswerQuestion = {
        id: initialData?.id || generateId(),
        text: questionText,
        timeLimit
      };

      // Only add expectedAnswerLength if it's a valid number
      if (expectedAnswerLength) {
        const numLength = parseInt(expectedAnswerLength);
        if (!isNaN(numLength) && numLength > 0) {
          question.expectedAnswerLength = numLength;
        }
      }

      console.log("Submitting brief answer question:", question);
      onSubmit(question);
    };

    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="question">Question</Label>
          <Textarea 
            id="question" 
            value={questionText} 
            onChange={(e) => setQuestionText(e.target.value)}
            className="min-h-[100px]"
            placeholder="Enter the question for the brief answer response"
          />
          <p className="text-xs text-gray-500 mt-1">
            Provide a clear, specific question that requires a written response.
          </p>
        </div>

        <div>
          <Label htmlFor="expectedAnswerLength">Expected Answer Length (optional)</Label>
          <Input 
            id="expectedAnswerLength" 
            value={expectedAnswerLength} 
            onChange={(e) => setExpectedAnswerLength(e.target.value)}
            placeholder="e.g., 100-200 words"
          />
          <p className="text-xs text-gray-500 mt-1">
            Provide guidance on the expected length of the response.
          </p>
        </div>

        <div>
          <Label htmlFor="timeLimit">Time Limit (seconds)</Label>
          <Input 
            id="timeLimit" 
            type="number" 
            value={timeLimit} 
            onChange={(e) => setTimeLimit(parseInt(e.target.value || "0"))}
            placeholder="Time limit in seconds"
            min="1"
          />
          <p className="text-xs text-gray-500 mt-1">
            Recommended: 180-300 seconds (3-5 minutes) for brief answers.
          </p>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => initialData ? setIsEditingQuestion(false) : setIsAddingQuestion(false)}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit}>
            {initialData ? "Update Question" : "Add Question"}
          </Button>
        </div>
      </div>
    );
  };

  // Handle adding a new question
  const handleAddQuestion = (questionData: any) => {
    console.log("handleAddQuestion called with data:", questionData);
    console.log("Assessment ID:", assessmentId);
    addQuestionMutation.mutate(questionData);
  };

  // Handle editing a question
  const handleEditQuestion = (questionData: any) => {
    console.log("Editing question:", questionData);
    updateQuestionMutation.mutate({
      questionId: questionData.id,
      questionData: questionData
    });
  };

  // Handle deleting a question
  const handleDeleteQuestion = (questionId: string) => {
    deleteQuestionMutation.mutate(questionId);
  };

  // Handle reordering questions
  const handleReorderQuestions = () => {
    reorderQuestionsMutation.mutate(reorderedQuestions);
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    if (!reorderedQuestions) return;
    
    const newQuestions = [...reorderedQuestions];
    if (direction === 'up' && index > 0) {
      // Swap with the previous question
      [newQuestions[index], newQuestions[index - 1]] = 
      [newQuestions[index - 1], newQuestions[index]];
    } else if (direction === 'down' && index < newQuestions.length - 1) {
      // Swap with the next question
      [newQuestions[index], newQuestions[index + 1]] = 
      [newQuestions[index + 1], newQuestions[index]];
    }
    
    setReorderedQuestions(newQuestions);
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Loading Assessment...">
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !assessment) {
    return (
      <DashboardLayout title="Error">
        <div className="flex justify-center items-center h-96">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Assessment</h2>
            <p className="text-gray-600 mb-4">
              {error instanceof Error ? error.message : "Unable to load assessment details."}
            </p>
            <Button onClick={() => navigate("/admin/assessments")}>
              Back to Assessments
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`Edit Assessment${assessment?.title ? ': ' + assessment.title : ''}`}>
      <div className="max-w-7xl mx-auto">
        <Tabs 
          defaultValue="questions" 
          className="w-full" 
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="mb-6">
            <TabsTrigger value="details">Assessment Details</TabsTrigger>
            <TabsTrigger value="questions">Questions ({assessment?.questions?.length || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <Card>
              <CardContent className="p-6">
                {/* Add edit mode state */}
                {isEditingDetails ? (
                  <form onSubmit={handleUpdateDetails}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="title">Title</Label>
                            <Input 
                              id="title" 
                              value={editForm.title} 
                              onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                              placeholder="Assessment title"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea 
                              id="description" 
                              value={editForm.description} 
                              onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                              placeholder="Assessment description"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                            <Input 
                              id="timeLimit" 
                              type="number" 
                              value={editForm.timeLimit || ''} 
                              onChange={(e) => setEditForm({...editForm, timeLimit: parseInt(e.target.value) || null})}
                              placeholder="Leave empty for no limit"
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Assessment Info</h3>
                        <div className="space-y-3">
                          <div>
                            <span className="text-sm font-medium text-gray-500">Assessment Type:</span>
                            <p className="capitalize">{assessment?.type}</p>
                            <p className="text-xs text-gray-500 mt-1">(Assessment type cannot be changed)</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">Total Questions:</span>
                            <p>{assessment?.questions?.length || 0}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">Created At:</span>
                            <p>{assessment?.createdAt ? new Date(assessment.createdAt).toLocaleDateString() : ''}</p>
                          </div>
                        </div>
                        <div className="mt-8 flex justify-end space-x-3">
                          <Button type="button" variant="outline" onClick={() => setIsEditingDetails(false)}>
                            Cancel
                          </Button>
                          <Button type="submit">
                            Save Changes
                          </Button>
                        </div>
                      </div>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold">Basic Information</h3>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleEditDetailsClick}
                        >
                          <Edit className="h-4 w-4 mr-1" /> Edit
                        </Button>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm font-medium text-gray-500">Title:</span>
                          <p>{assessment?.title}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Description:</span>
                          <p>{assessment?.description || "No description"}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Type:</span>
                          <p className="capitalize">{assessment?.type}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Time Limit:</span>
                          <p>{assessment?.timeLimit ? `${assessment.timeLimit} minutes` : "No time limit"}</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Questions</h3>
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm font-medium text-gray-500">Total Questions:</span>
                          <p>{assessment?.questions?.length || 0}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Created At:</span>
                          <p>{assessment?.createdAt ? new Date(assessment.createdAt).toLocaleDateString() : ''}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="questions">
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Manage Questions</h2>
                  <div className="flex gap-2">
                    {isReordering ? (
                      <>
                        <Button variant="outline" onClick={() => setIsReordering(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleReorderQuestions}>
                          Save Order
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="outline" onClick={() => setIsReordering(true)}>
                          <AlignJustify className="h-4 w-4 mr-2" />
                          Reorder
                        </Button>
                        <Button onClick={() => {
                          if (assessment) {
                            setIsAddingQuestion(true);
                          } else {
                            toast({
                              title: "Error",
                              description: "Assessment data not loaded. Please try again.",
                              variant: "destructive",
                            });
                          }
                        }}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Question
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Question Creation Section similar to create-assessment.tsx */}
                {isAddingQuestion && assessment && (
                  <div className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Add New Question</h3>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setIsAddingQuestion(false)}
                        className="text-gray-500"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="bg-amber-50 p-3 rounded-md border border-amber-200 mb-4 text-sm">
                      <div className="flex items-start">
                        <Info className="h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-amber-800">Question Tips:</p>
                          <ul className="list-disc pl-5 mt-1 text-amber-700 space-y-1">
                            {assessment.type === "mcq" && (
                              <>
                                <li>Create clear, concise questions with one correct answer</li>
                                <li>Include 4+ options to properly test knowledge</li>
                                <li>Avoid ambiguous wording</li>
                              </>
                            )}
                            {assessment.type === "fill-in-blanks" && (
                              <>
                                <li>Mark blank spots with {"{"}{"{"}"blank"{"}"}{"}"} pattern in your text</li>
                                <li>Provide the correct answers in order</li>
                                <li>Keep blanks focused on key concepts</li>
                              </>
                            )}
                            {assessment.type === "video" && (
                              <>
                                <li>Ask open-ended questions that require demonstration</li>
                                <li>Set an appropriate time limit for responses</li>
                                <li>Clearly state what should be included in the answer</li>
                              </>
                            )}
                            {assessment.type === "brief-answer" && (
                              <>
                                <li>Frame questions that require specific knowledge</li>
                                <li>Indicate expected answer length when appropriate</li>
                                <li>Set a reasonable time limit for responses</li>
                              </>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <Card>
                      <CardContent className="p-4">
                        {(() => {
                          // Self-invoking function to provide better control over rendering
                          if (!assessment.type) {
                            return (
                              <div className="p-4 text-center">
                                <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                                <p>Loading assessment type...</p>
                              </div>
                            );
                          }
                          
                          switch (assessment.type) {
                            case "mcq":
                              return <MCQQuestionForm onSubmit={handleAddQuestion} />;
                            case "fill-in-blanks":
                              return <FillInBlanksQuestionForm onSubmit={handleAddQuestion} />;
                            case "video":
                              return <VideoQuestionForm onSubmit={handleAddQuestion} />;
                            case "brief-answer":
                              return <BriefAnswerQuestionForm onSubmit={handleAddQuestion} />;
                            default:
                              return (
                                <div className="p-4 text-center text-red-500">
                                  <p>Unknown assessment type: {assessment.type}</p>
                                </div>
                              );
                          }
                        })()}
                      </CardContent>
                    </Card>
                  </div>
                )}
                
                {/* Question Creation Section similar to create-assessment.tsx */}
                {isAddingQuestion && assessment && (
                  <Card className="mt-6 mb-6 overflow-visible">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Add New Question</h3>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setIsAddingQuestion(false)}
                          className="text-gray-500"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="bg-amber-50 p-3 rounded-md border border-amber-200 mb-4 text-sm">
                        <div className="flex items-start">
                          <Info className="h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-amber-800">Question Tips:</p>
                            <ul className="list-disc pl-5 mt-1 text-amber-700 space-y-1">
                              {assessment.type === "mcq" && (
                                <>
                                  <li>Create clear, concise questions with one correct answer</li>
                                  <li>Include 4+ options to properly test knowledge</li>
                                  <li>Avoid ambiguous wording</li>
                                </>
                              )}
                              {assessment.type === "fill-in-blanks" && (
                                <>
                                  <li>Mark blank spots with {"{"}{"{"}"blank"{"}"}{"}"} pattern in your text</li>
                                  <li>Provide the correct answers in order</li>
                                  <li>Keep blanks focused on key concepts</li>
                                </>
                              )}
                              {assessment.type === "video" && (
                                <>
                                  <li>Ask open-ended questions that require demonstration</li>
                                  <li>Set an appropriate time limit for responses</li>
                                  <li>Clearly state what should be included in the answer</li>
                                </>
                              )}
                              {assessment.type === "brief-answer" && (
                                <>
                                  <li>Frame questions that require specific knowledge</li>
                                  <li>Indicate expected answer length when appropriate</li>
                                  <li>Set a reasonable time limit for responses</li>
                                </>
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>

                      {(() => {
                        // Self-invoking function to provide better control over rendering
                        if (!assessment.type) {
                          return (
                            <div className="p-4 text-center">
                              <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                              <p>Loading assessment type...</p>
                            </div>
                          );
                        }
                        
                        switch (assessment.type) {
                          case "mcq":
                            return <MCQQuestionForm onSubmit={handleAddQuestion} />;
                          case "fill-in-blanks":
                            return <FillInBlanksQuestionForm onSubmit={handleAddQuestion} />;
                          case "video":
                            return <VideoQuestionForm onSubmit={handleAddQuestion} />;
                          case "brief-answer":
                            return <BriefAnswerQuestionForm onSubmit={handleAddQuestion} />;
                          default:
                            return (
                              <div className="p-4 text-center text-red-500">
                                <p>Unknown assessment type: {assessment.type}</p>
                              </div>
                            );
                        }
                      })()}
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
            
            <Card className="mt-6">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {assessment?.questions && assessment.questions.length > 0 ? (
                    (isReordering ? reorderedQuestions : assessment.questions).map((question: any, index: number) => (
                      <Card key={question.id} className="overflow-hidden">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                          <div className="font-medium">Question {index + 1}</div>
                          <div className="flex gap-2">
                            {isReordering ? (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  disabled={index === 0}
                                  onClick={() => moveQuestion(index, 'up')}
                                >
                                  <ArrowUp className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  disabled={index === reorderedQuestions.length - 1}
                                  onClick={() => moveQuestion(index, 'down')}
                                >
                                  <ArrowDown className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => {
                                    setCurrentQuestion(question);
                                    setIsEditingQuestion(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                
                                {/* Separate Edit Dialog */}
                                <Dialog 
                                  open={isEditingQuestion && !!assessment && currentQuestion?.id === question.id} 
                                  onOpenChange={(open) => {
                                    if (open && (!assessment || !currentQuestion)) {
                                      console.error("Cannot open edit dialog - data not fully loaded");
                                      toast({
                                        title: "Error",
                                        description: "Question data not fully loaded. Please try again.",
                                        variant: "destructive",
                                      });
                                      return;
                                    }
                                    if (!open) {
                                      setIsEditingQuestion(false);
                                      setCurrentQuestion(null);
                                    }
                                  }}
                                >
                                  <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                      <DialogTitle>Edit Question #{index + 1}</DialogTitle>
                                      <DialogDescription>
                                        Update this <span className="capitalize font-medium">{assessment?.type}</span> question. 
                                        Your changes will be saved immediately when you click the Update button.
                                      </DialogDescription>
                                    </DialogHeader>
                                    
                                    <div className="bg-blue-50 p-3 rounded-md border border-blue-200 mb-4 text-sm">
                                      <div className="flex items-start">
                                        <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                                        <div>
                                          <p className="font-medium text-blue-800">Editing Tips:</p>
                                          <ul className="list-disc pl-5 mt-1 text-blue-700 space-y-1">
                                            {assessment?.type === "mcq" && (
                                              <>
                                                <li>Ensure your question text is clear and precise</li>
                                                <li>Check that one option is marked as correct</li>
                                                <li>Use realistic but incorrect options for distractors</li>
                                              </>
                                            )}
                                            {assessment?.type === "fill-in-blanks" && (
                                              <>
                                                <li>Verify that {"{"}{"{"}"blank"{"}"}{"}"} markers are correctly placed</li>
                                                <li>Make sure correct answers are properly ordered</li> 
                                                <li>Use precise wording for expected answers</li>
                                              </>
                                            )}
                                            {assessment?.type === "video" && (
                                              <>
                                                <li>Set appropriate time limits for the complexity</li>
                                                <li>Make sure questions are clear about expectations</li>
                                                <li>Provide enough context for quality responses</li>
                                              </>
                                            )}
                                            {assessment?.type === "brief-answer" && (
                                              <>
                                                <li>Refine wording to prompt specific answer types</li>
                                                <li>Consider adjusting time limits if needed</li>
                                                <li>Include relevant context in the question text</li>
                                              </>
                                            )}
                                          </ul>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {!assessment?.type || !currentQuestion ? (
                                      <div className="p-4 text-center">
                                        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                                        <p>Loading question data...</p>
                                      </div>
                                    ) : assessment.type === "mcq" ? (
                                      <MCQQuestionForm onSubmit={handleEditQuestion} initialData={currentQuestion} />
                                    ) : assessment.type === "fill-in-blanks" ? (
                                      <FillInBlanksQuestionForm onSubmit={handleEditQuestion} initialData={currentQuestion} />
                                    ) : assessment.type === "video" ? (
                                      <VideoQuestionForm onSubmit={handleEditQuestion} initialData={currentQuestion} />
                                    ) : assessment.type === "brief-answer" ? (
                                      <BriefAnswerQuestionForm onSubmit={handleEditQuestion} initialData={currentQuestion} />
                                    ) : (
                                      <div className="p-4 text-center text-red-500">
                                        <p>Unknown assessment type: {assessment.type}</p>
                                      </div>
                                    )}
                                  </DialogContent>
                                </Dialog>
                                
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <Trash className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Question</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete this question? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        className="bg-red-600 text-white hover:bg-red-700"
                                        onClick={() => handleDeleteQuestion(question.id)}
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="mb-4">
                            <div className="font-medium mb-1">Question:</div>
                            <p className="text-gray-700">{question.text}</p>
                          </div>
                          
                          {assessment?.type === "mcq" && (
                            <div>
                              <div className="font-medium mb-1">Options:</div>
                              <ul className="space-y-1">
                                {question.options.map((option: any) => (
                                  <li key={option.id} className="flex items-center">
                                    <span className={`inline-block w-6 h-6 rounded-full mr-2 text-xs flex items-center justify-center 
                                      ${option.id === question.correctOptionId ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
                                      {option.id === question.correctOptionId ? '✓' : ''}
                                    </span>
                                    {option.text}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {assessment?.type === "fill-in-blanks" && (
                            <div>
                              <div className="font-medium mb-1">Blanks:</div>
                              <ul className="space-y-1">
                                {question.blanks.map((blank: any, i: number) => (
                                  <li key={blank.id}>
                                    <span className="font-medium text-gray-600">Blank {i+1}:</span> {blank.correctAnswer}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {assessment?.type === "brief-answer" && (
                            <div>
                              <div className="font-medium mb-1">Response Type:</div>
                              <p className="text-gray-700">Brief written answer required</p>
                            </div>
                          )}
                          
                          {question.timeLimit && (
                            <div className="mt-2 text-sm text-gray-600">
                              Time Limit: {question.timeLimit} seconds
                            </div>
                          )}
                        </div>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <h3 className="text-lg font-medium text-gray-600 mb-2">No Questions Yet</h3>
                      <p className="text-gray-500 mb-4">Start adding questions to your assessment.</p>
                      <div className="flex flex-col gap-3 items-center">
                        <Button 
                          onClick={() => {
                            console.log("Opening add question dialog for:", assessment?.type);
                            console.log("Full assessment data:", assessment);
                            if (!assessment) {
                              console.error("Assessment data is not loaded yet!");
                              return;
                            }
                            setIsAddingQuestion(true);
                          }}
                          className="w-full max-w-xs"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add First Question
                        </Button>
                        
                        <div className="flex gap-3 mt-2">
                          <Button 
                            variant="outline" 
                            onClick={() => navigate(`/admin/assessments`)}
                            size="sm"
                          >
                            Back to Assessments
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            onClick={() => setActiveTab("details")} 
                            size="sm"
                          >
                            Edit Assessment Details
                          </Button>
                        </div>
                        <div className="mt-4 text-sm text-gray-500">
                          <p>Assessment Type: <span className="font-medium capitalize">{assessment?.type}</span></p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}