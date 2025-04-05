import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Loader2, 
  Plus, 
  Trash2, 
  Check,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { insertAssessmentSchema } from "@shared/schema";
import { v4 as uuidv4 } from "uuid";

// Create assessment validation schema based on shared schema
const createAssessmentSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  type: z.enum(["mcq", "fill-in-blanks", "video", "brief-answer"]),
  questions: z.array(
    z.object({
      id: z.string().default(() => uuidv4()),
      text: z.string().min(1, "Question text is required"),
      // For MCQ
      options: z.array(
        z.object({
          id: z.string().default(() => uuidv4()),
          text: z.string().min(1, "Option text is required"),
        })
      ).optional(),
      correctOptionId: z.string().optional(),
      // For Fill-in-Blanks
      blanks: z.array(
        z.object({
          id: z.string().default(() => uuidv4()),
          correctAnswer: z.string().min(1, "Correct answer is required"),
        })
      ).optional(),
      // For Video
      timeLimit: z.number().int().min(10, "Time limit must be at least 10 seconds").optional(),
    })
  ),
});

type FormValues = z.infer<typeof createAssessmentSchema>;

export default function CreateAssessment() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [questionType, setQuestionType] = useState<string>("mcq");

  // Create assessment form
  const form = useForm<FormValues>({
    resolver: zodResolver(createAssessmentSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "mcq",
      questions: [
        {
          id: uuidv4(),
          text: "",
          options: [
            { id: uuidv4(), text: "" },
            { id: uuidv4(), text: "" },
            { id: uuidv4(), text: "" },
            { id: uuidv4(), text: "" },
          ],
          correctOptionId: "",
        },
      ],
    },
  });

  // Questions field array
  const { fields: questions, append: appendQuestion, remove: removeQuestion } = useFieldArray({
    control: form.control,
    name: "questions",
  });

  // Use a fixed number of field arrays based on the maximum number of questions
  // This ensures we call the same number of hooks on every render
  const MAX_QUESTIONS = 20; // Reasonable upper limit
  
  const optionsFieldArrays = [...Array(MAX_QUESTIONS)].map((_, index) => {
    // Options field array (for MCQ)
    return useFieldArray({
      control: form.control,
      name: `questions.${index}.options` as const,
    });
  });
  
  const blanksFieldArrays = [...Array(MAX_QUESTIONS)].map((_, index) => {
    // Blanks field array (for Fill-in-Blanks)
    return useFieldArray({
      control: form.control,
      name: `questions.${index}.blanks` as const,
    });
  });

  // Handle assessment type change
  const handleTypeChange = (value: string) => {
    if (value === form.getValues("type")) return;
    
    // Reset questions when changing type
    form.setValue("type", value as "mcq" | "fill-in-blanks" | "video" | "brief-answer");
    form.setValue("questions", []);
    setQuestionType(value);
    
    // Initialize with appropriate default question
    if (value === "mcq") {
      form.setValue("questions", [
        {
          id: uuidv4(),
          text: "",
          options: [
            { id: uuidv4(), text: "" },
            { id: uuidv4(), text: "" },
            { id: uuidv4(), text: "" },
            { id: uuidv4(), text: "" },
          ],
          correctOptionId: "",
        },
      ]);
    } else if (value === "fill-in-blanks") {
      form.setValue("questions", [
        {
          id: uuidv4(),
          text: "Enter question with blanks like [[blank1]] and [[blank2]]",
          blanks: [
            { id: uuidv4(), correctAnswer: "" },
            { id: uuidv4(), correctAnswer: "" },
          ],
        },
      ]);
    } else if (value === "video") {
      form.setValue("questions", [
        {
          id: uuidv4(),
          text: "",
          timeLimit: 120, // 2 minutes
        },
      ]);
    } else if (value === "brief-answer") {
      form.setValue("questions", [
        {
          id: uuidv4(),
          text: "",
          timeLimit: 180, // 3 minutes
        },
      ]);
    }
  };

  // Add a new question
  const addQuestion = () => {
    const type = form.getValues("type");
    
    if (type === "mcq") {
      appendQuestion({
        id: uuidv4(),
        text: "",
        options: [
          { id: uuidv4(), text: "" },
          { id: uuidv4(), text: "" },
          { id: uuidv4(), text: "" },
          { id: uuidv4(), text: "" },
        ],
        correctOptionId: "",
      });
    } else if (type === "fill-in-blanks") {
      appendQuestion({
        id: uuidv4(),
        text: "Enter question with blanks like [[blank1]] and [[blank2]]",
        blanks: [
          { id: uuidv4(), correctAnswer: "" },
          { id: uuidv4(), correctAnswer: "" },
        ],
      });
    } else if (type === "video") {
      appendQuestion({
        id: uuidv4(),
        text: "",
        timeLimit: 120, // 2 minutes
      });
    } else if (type === "brief-answer") {
      appendQuestion({
        id: uuidv4(),
        text: "",
        timeLimit: 180, // 3 minutes
      });
    }
  };

  // Parse blanks from text (for Fill-in-Blanks)
  const parseBlanks = (text: string, questionIndex: number) => {
    const blankPattern = /\[\[(.*?)\]\]/g;
    // Instead of using matchAll, use exec in a loop (better compatibility)
    let match;
    const matches = [];
    while ((match = blankPattern.exec(text)) !== null) {
      matches.push(match);
    }
    
    // Create blank fields if they don't exist
    const currentBlanks = form.getValues(`questions.${questionIndex}.blanks`) || [];
    const newBlanks = [];
    
    for (let i = 0; i < matches.length; i++) {
      if (i < currentBlanks.length) {
        newBlanks.push(currentBlanks[i]);
      } else {
        newBlanks.push({
          id: uuidv4(),
          correctAnswer: "",
        });
      }
    }
    
    // Update blanks
    form.setValue(`questions.${questionIndex}.blanks`, newBlanks);
  };

  // Create assessment mutation
  const createAssessmentMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest("POST", "/api/admin/assessments", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Assessment Created",
        description: "Your assessment has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/assessments"] });
      setLocation("/admin/assessments");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create assessment: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Submit form
  const onSubmit = (data: FormValues) => {
    createAssessmentMutation.mutate(data);
  };

  return (
    <DashboardLayout title="Create Assessment">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Assessment Details</h2>
                  
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assessment Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter assessment title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter assessment description" 
                            className="min-h-20"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assessment Type</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            handleTypeChange(value);
                          }}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select assessment type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="mcq">Multiple Choice Questions</SelectItem>
                            <SelectItem value="fill-in-blanks">Fill-in-the-Blanks</SelectItem>
                            <SelectItem value="video">Video Interview</SelectItem>
                            <SelectItem value="brief-answer">Brief Answer</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {field.value === "mcq" && "Create multiple-choice questions with one correct answer."}
                          {field.value === "fill-in-blanks" && "Create questions with text blanks that candidates need to fill in."}
                          {field.value === "video" && "Create questions that candidates will answer via recorded video."}
                          {field.value === "brief-answer" && "Create questions that candidates will answer with short text responses."}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Questions</h2>
                    <Button 
                      type="button" 
                      onClick={addQuestion}
                      variant="outline"
                      className="flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Question
                    </Button>
                  </div>
                  
                  <div className="space-y-6">
                    {questions.map((question, questionIndex) => (
                      <Card key={question.id} className="relative">
                        <CardContent className="p-4">
                          <div className="absolute right-2 top-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-red-500"
                              onClick={() => {
                                if (questions.length > 1) {
                                  removeQuestion(questionIndex);
                                } else {
                                  toast({
                                    title: "Cannot Remove",
                                    description: "You must have at least one question.",
                                    variant: "destructive",
                                  });
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-500 mb-2">Question {questionIndex + 1}</p>
                            <FormField
                              control={form.control}
                              name={`questions.${questionIndex}.text`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Question Text</FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      placeholder="Enter question text" 
                                      className="min-h-20"
                                      {...field}
                                      onChange={(e) => {
                                        field.onChange(e);
                                        if (form.getValues("type") === "fill-in-blanks") {
                                          parseBlanks(e.target.value, questionIndex);
                                        }
                                      }}
                                    />
                                  </FormControl>
                                  {form.getValues("type") === "fill-in-blanks" && (
                                    <FormDescription>
                                      Use double brackets to mark blanks: [[blank1]], [[blank2]]
                                    </FormDescription>
                                  )}
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          {/* MCQ Options */}
                          {form.getValues("type") === "mcq" && (
                            <div className="space-y-4">
                              <p className="text-sm font-medium">Answer Options</p>
                              
                              {optionsFieldArrays[questionIndex]?.fields.map((option, optionIndex) => (
                                <div key={option.id} className="flex items-start gap-2">
                                  <FormField
                                    control={form.control}
                                    name={`questions.${questionIndex}.correctOptionId`}
                                    render={({ field }) => (
                                      <FormItem className="flex items-center space-x-1 space-y-0 pt-2">
                                        <FormControl>
                                          <input 
                                            type="radio" 
                                            className="h-4 w-4 text-primary"
                                            checked={field.value === option.id}
                                            onChange={() => field.onChange(option.id)}
                                          />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                  
                                  <FormField
                                    control={form.control}
                                    name={`questions.${questionIndex}.options.${optionIndex}.text`}
                                    render={({ field }) => (
                                      <FormItem className="flex-1">
                                        <FormControl>
                                          <Input 
                                            placeholder={`Option ${optionIndex + 1}`}
                                            {...field}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  
                                  {optionsFieldArrays[questionIndex]?.fields.length > 2 && (
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      className="h-9 w-9 p-0 text-red-500"
                                      onClick={() => {
                                        optionsFieldArrays[questionIndex]?.remove(optionIndex);
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                              
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="flex items-center"
                                onClick={() => {
                                  optionsFieldArrays[questionIndex]?.append({
                                    id: uuidv4(),
                                    text: "",
                                  });
                                }}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Option
                              </Button>
                            </div>
                          )}
                          
                          {/* Fill-in-Blanks Answers */}
                          {form.getValues("type") === "fill-in-blanks" && form.getValues(`questions.${questionIndex}.blanks`) && (
                            <div className="space-y-4">
                              <p className="text-sm font-medium">Correct Answers for Blanks</p>
                              
                              {(form.getValues(`questions.${questionIndex}.blanks`) || []).map((blank, blankIndex) => (
                                <FormField
                                  key={blank.id}
                                  control={form.control}
                                  name={`questions.${questionIndex}.blanks.${blankIndex}.correctAnswer`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Blank {blankIndex + 1}</FormLabel>
                                      <FormControl>
                                        <Input 
                                          placeholder="Enter correct answer"
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              ))}
                            </div>
                          )}
                          
                          {/* Video Question Time Limit */}
                          {form.getValues("type") === "video" && (
                            <FormField
                              control={form.control}
                              name={`questions.${questionIndex}.timeLimit`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Time Limit (seconds)</FormLabel>
                                  <FormControl>
                                    <div className="flex items-center">
                                      <Input 
                                        type="number"
                                        min={10}
                                        {...field}
                                        onChange={(e) => field.onChange(parseInt(e.target.value) || 60)}
                                      />
                                      <Clock className="ml-2 h-4 w-4 text-gray-400" />
                                    </div>
                                  </FormControl>
                                  <FormDescription>
                                    How long candidates have to answer this question (in seconds)
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                          
                          {/* Brief Answer Time Limit */}
                          {form.getValues("type") === "brief-answer" && (
                            <FormField
                              control={form.control}
                              name={`questions.${questionIndex}.timeLimit`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Time Limit (seconds)</FormLabel>
                                  <FormControl>
                                    <div className="flex items-center">
                                      <Input 
                                        type="number"
                                        min={10}
                                        {...field}
                                        onChange={(e) => field.onChange(parseInt(e.target.value) || 180)}
                                      />
                                      <Clock className="ml-2 h-4 w-4 text-gray-400" />
                                    </div>
                                  </FormControl>
                                  <FormDescription>
                                    How long candidates have to provide their brief answer (in seconds)
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => setLocation("/admin/assessments")}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createAssessmentMutation.isPending}
                    className="flex items-center"
                  >
                    {createAssessmentMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Create Assessment
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
