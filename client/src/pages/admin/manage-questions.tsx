
import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import { PlusCircle, Pencil, Trash2, MoveVertical } from "lucide-react";

export default function ManageQuestions() {
  const { id } = useParams();
  const { toast } = useToast();
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);

  // Fetch assessment details
  const { data: assessment, isLoading } = useQuery({
    queryKey: [`/api/admin/assessments/${id}`],
  });

  // Add question mutation
  const addQuestionMutation = useMutation({
    mutationFn: async (questionData) => {
      const res = await apiRequest("POST", `/api/admin/assessments/${id}/questions`, questionData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries([`/api/admin/assessments/${id}`]);
      setQuestionDialogOpen(false);
      toast({
        title: "Question Added",
        description: "The question has been added successfully.",
      });
    },
  });

  // Update question mutation
  const updateQuestionMutation = useMutation({
    mutationFn: async ({ questionId, data }) => {
      const res = await apiRequest("PUT", `/api/admin/assessments/${id}/questions/${questionId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries([`/api/admin/assessments/${id}`]);
      setQuestionDialogOpen(false);
      toast({
        title: "Question Updated",
        description: "The question has been updated successfully.",
      });
    },
  });

  // Delete question mutation
  const deleteQuestionMutation = useMutation({
    mutationFn: async (questionId) => {
      const res = await apiRequest("DELETE", `/api/admin/assessments/${id}/questions/${questionId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries([`/api/admin/assessments/${id}`]);
      toast({
        title: "Question Deleted",
        description: "The question has been deleted successfully.",
      });
    },
  });

  // Reorder questions mutation
  const reorderQuestionsMutation = useMutation({
    mutationFn: async (questions) => {
      const res = await apiRequest("PUT", `/api/admin/assessments/${id}/questions/reorder`, { questions });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries([`/api/admin/assessments/${id}`]);
    },
  });

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const questions = Array.from(assessment.questions);
    const [reorderedItem] = questions.splice(result.source.index, 1);
    questions.splice(result.destination.index, 0, reorderedItem);
    
    reorderQuestionsMutation.mutate(questions);
  };

  return (
    <DashboardLayout title="Manage Questions">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold">{assessment?.title}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {assessment?.type === 'mcq' ? 'Multiple Choice Questions' : 
                   assessment?.type === 'fill-in-blanks' ? 'Fill in the Blanks' : 
                   'Video Interview Questions'}
                </p>
              </div>
              <Dialog open={questionDialogOpen} onOpenChange={setQuestionDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Question
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingQuestion ? 'Edit Question' : 'Add New Question'}
                    </DialogTitle>
                  </DialogHeader>
                  <QuestionForm
                    type={assessment?.type}
                    onSubmit={(data) => {
                      if (editingQuestion) {
                        updateQuestionMutation.mutate({
                          questionId: editingQuestion.id,
                          data
                        });
                      } else {
                        addQuestionMutation.mutate(data);
                      }
                    }}
                    initialData={editingQuestion}
                  />
                </DialogContent>
              </Dialog>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="questions">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-4"
                  >
                    {assessment?.questions.map((question, index) => (
                      <Draggable
                        key={question.id}
                        draggableId={question.id}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="border rounded-lg p-4 bg-white"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center">
                                  <div {...provided.dragHandleProps} className="mr-2">
                                    <MoveVertical className="h-4 w-4 text-gray-400" />
                                  </div>
                                  <p className="font-medium">Question {index + 1}</p>
                                </div>
                                <p className="mt-2">{question.text}</p>
                                
                                {assessment.type === 'mcq' && (
                                  <div className="mt-2 space-y-1">
                                    {question.options.map((option) => (
                                      <div
                                        key={option.id}
                                        className={`text-sm ${
                                          option.id === question.correctOptionId
                                            ? 'text-green-600 font-medium'
                                            : 'text-gray-600'
                                        }`}
                                      >
                                        • {option.text}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                {assessment.type === 'fill-in-blanks' && (
                                  <div className="mt-2 space-y-1">
                                    {question.blanks.map((blank, i) => (
                                      <div key={blank.id} className="text-sm text-gray-600">
                                        Blank {i + 1}: {blank.correctAnswer}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                {assessment.type === 'video' && (
                                  <div className="mt-2 text-sm text-gray-600">
                                    Time limit: {question.timeLimit} seconds
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingQuestion(question);
                                    setQuestionDialogOpen(true);
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-500"
                                  onClick={() => deleteQuestionMutation.mutate(question.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

const QuestionForm = ({ type, onSubmit, initialData }) => {
  const [formData, setFormData] = useState(
    initialData || {
      text: "",
      options: type === 'mcq' ? [
        { id: crypto.randomUUID(), text: "" },
        { id: crypto.randomUUID(), text: "" }
      ] : [],
      correctOptionId: "",
      blanks: type === 'fill-in-blanks' ? [
        { id: crypto.randomUUID(), correctAnswer: "" }
      ] : [],
      timeLimit: type === 'video' ? 120 : undefined
    }
  );

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      onSubmit(formData);
    }}>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Question Text</label>
          <Textarea
            value={formData.text}
            onChange={(e) => setFormData({ ...formData, text: e.target.value })}
            placeholder="Enter your question"
            required
          />
        </div>

        {type === 'mcq' && (
          <div>
            <label className="text-sm font-medium">Options</label>
            <div className="space-y-2">
              {formData.options.map((option, index) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    checked={formData.correctOptionId === option.id}
                    onChange={() => setFormData({ ...formData, correctOptionId: option.id })}
                  />
                  <Input
                    value={option.text}
                    onChange={(e) => {
                      const newOptions = [...formData.options];
                      newOptions[index].text = e.target.value;
                      setFormData({ ...formData, options: newOptions });
                    }}
                    placeholder={`Option ${index + 1}`}
                  />
                  {formData.options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          options: formData.options.filter((_, i) => i !== index)
                        });
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
                onClick={() => {
                  setFormData({
                    ...formData,
                    options: [...formData.options, { id: crypto.randomUUID(), text: "" }]
                  });
                }}
              >
                Add Option
              </Button>
            </div>
          </div>
        )}

        {type === 'fill-in-blanks' && (
          <div>
            <label className="text-sm font-medium">Correct Answers</label>
            <div className="space-y-2">
              {formData.blanks.map((blank, index) => (
                <div key={blank.id} className="flex items-center space-x-2">
                  <Input
                    value={blank.correctAnswer}
                    onChange={(e) => {
                      const newBlanks = [...formData.blanks];
                      newBlanks[index].correctAnswer = e.target.value;
                      setFormData({ ...formData, blanks: newBlanks });
                    }}
                    placeholder={`Answer for blank ${index + 1}`}
                  />
                  {formData.blanks.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          blanks: formData.blanks.filter((_, i) => i !== index)
                        });
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
                onClick={() => {
                  setFormData({
                    ...formData,
                    blanks: [...formData.blanks, { id: crypto.randomUUID(), correctAnswer: "" }]
                  });
                }}
              >
                Add Blank
              </Button>
            </div>
          </div>
        )}

        {type === 'video' && (
          <div>
            <label className="text-sm font-medium">Time Limit (seconds)</label>
            <Input
              type="number"
              value={formData.timeLimit}
              onChange={(e) => setFormData({ ...formData, timeLimit: parseInt(e.target.value) })}
              min="10"
              required
            />
          </div>
        )}

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => setQuestionDialogOpen(false)}>
            Cancel
          </Button>
          <Button type="submit">
            {initialData ? 'Update Question' : 'Add Question'}
          </Button>
        </div>
      </div>
    </form>
  );
};
