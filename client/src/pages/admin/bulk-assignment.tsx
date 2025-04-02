import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Loader2, 
  CheckCircle2,
  XCircle,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export default function BulkAssignment() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<number | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Fetch candidates
  const { data: candidates, isLoading: loadingCandidates } = useQuery<any[]>({
    queryKey: ["/api/admin/candidates"],
  });

  // Fetch assessments
  const { data: assessments, isLoading: loadingAssessments } = useQuery<any[]>({
    queryKey: ["/api/admin/assessments"],
  });

  // Handle "Select All" checkbox
  useEffect(() => {
    if (selectAll && candidates) {
      setSelectedCandidates(candidates.map(candidate => candidate.id));
    } else if (!selectAll) {
      setSelectedCandidates([]);
    }
  }, [selectAll, candidates]);

  // Toggle individual candidate selection
  const toggleCandidateSelection = (candidateId: number) => {
    if (selectedCandidates.includes(candidateId)) {
      setSelectedCandidates(selectedCandidates.filter(id => id !== candidateId));
    } else {
      setSelectedCandidates([...selectedCandidates, candidateId]);
    }
  };

  // Check if all candidates are selected
  useEffect(() => {
    if (candidates && candidates.length > 0 && selectedCandidates.length === candidates.length) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedCandidates, candidates]);

  // Bulk assignment mutation
  const bulkAssignMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/bulk-assign-assessment", data);
      return res.json();
    },
    onSuccess: (data) => {
      setIsConfirmDialogOpen(false);
      
      if (data.success) {
        toast({
          title: "Assessments assigned successfully",
          description: `${data.assigned} candidates were assigned. ${data.failed} failed.`,
        });
        
        // Invalidate candidate assessments query
        queryClient.invalidateQueries({ queryKey: ["/api/admin/candidates"] });
        
        // Navigate back to candidates page
        setLocation("/admin/candidates");
      } else {
        toast({
          title: "Assignment failed",
          description: "Failed to assign assessments. Please try again.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      setIsConfirmDialogOpen(false);
      toast({
        title: "Assignment failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleAssignAssessments = () => {
    if (selectedCandidates.length === 0) {
      toast({
        title: "No candidates selected",
        description: "Please select at least one candidate",
        variant: "destructive",
      });
      return;
    }

    if (!selectedAssessment) {
      toast({
        title: "No assessment selected",
        description: "Please select an assessment to assign",
        variant: "destructive",
      });
      return;
    }

    setIsConfirmDialogOpen(true);
  };

  const confirmAssignment = () => {
    bulkAssignMutation.mutate({
      candidateIds: selectedCandidates,
      assessmentId: selectedAssessment,
      scheduledFor: scheduledDate ? scheduledDate.toISOString() : null
    });
  };

  const formatScheduledDate = () => {
    if (!scheduledDate) return "Not scheduled";
    return format(scheduledDate, "PPP");
  };

  // Get selected candidate names for confirmation dialog
  const getSelectedCandidateNames = () => {
    if (!candidates) return [];
    return selectedCandidates.map(id => {
      const candidate = candidates.find(c => c.id === id);
      return candidate ? candidate.fullName : `Candidate ${id}`;
    });
  };
  
  // Get selected assessment name for confirmation dialog
  const getSelectedAssessmentName = () => {
    if (!assessments || !selectedAssessment) return "Unknown assessment";
    const assessment = assessments.find(a => a.id === selectedAssessment);
    return assessment ? assessment.title : `Assessment ${selectedAssessment}`;
  };

  return (
    <DashboardLayout title="Bulk Assessment Assignment">
      <div className="max-w-7xl mx-auto">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <h2 className="text-xl font-semibold">Assign Assessments in Bulk</h2>
              <div className="flex space-x-2">
                <Link href="/admin/candidates">
                  <Button variant="outline">Cancel</Button>
                </Link>
                <Button 
                  onClick={handleAssignAssessments}
                  disabled={selectedCandidates.length === 0 || !selectedAssessment || bulkAssignMutation.isPending}
                >
                  {bulkAssignMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    "Assign Assessments"
                  )}
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Assessment Selection */}
              <div>
                <h3 className="text-lg font-medium mb-3">Select Assessment</h3>
                {loadingAssessments ? (
                  <div className="flex items-center justify-center h-40 bg-gray-50 rounded-md">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Select 
                      value={selectedAssessment?.toString() || ""} 
                      onValueChange={(value) => setSelectedAssessment(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an assessment" />
                      </SelectTrigger>
                      <SelectContent>
                        {assessments && assessments.map((assessment) => (
                          <SelectItem 
                            key={assessment.id} 
                            value={assessment.id.toString()}
                          >
                            {assessment.title} ({assessment.type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Schedule For (Optional)</label>
                      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !scheduledDate && "text-muted-foreground"
                            )}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {scheduledDate ? formatScheduledDate() : "Schedule date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={scheduledDate}
                            onSelect={(date) => {
                              setScheduledDate(date);
                              setIsCalendarOpen(false);
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      {scheduledDate && (
                        <Button 
                          variant="ghost" 
                          className="mt-2 h-auto p-0 text-sm text-gray-500"
                          onClick={() => setScheduledDate(undefined)}
                        >
                          Clear date
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Selected Candidate Count */}
              <div>
                <h3 className="text-lg font-medium mb-3">Selection Summary</h3>
                <div className="p-6 border rounded-md">
                  <div className="text-3xl font-bold mb-2">
                    {selectedCandidates.length} 
                    <span className="text-gray-500 text-lg font-normal"> / {candidates?.length || 0}</span>
                  </div>
                  <div className="text-gray-500">Candidates selected</div>
                  
                  {selectedCandidates.length > 0 && selectedAssessment && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-md">
                      <div className="font-medium text-blue-800">Ready to assign:</div>
                      <div className="text-sm text-blue-700">
                        {getSelectedAssessmentName()} will be assigned to {selectedCandidates.length} candidate{selectedCandidates.length !== 1 ? 's' : ''}
                      </div>
                      {scheduledDate && (
                        <div className="text-sm text-blue-700 flex items-center mt-1">
                          <Calendar className="h-4 w-4 mr-1" />
                          Scheduled for {formatScheduledDate()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Candidate Selection Table */}
            <div>
              <h3 className="text-lg font-medium mb-3">Select Candidates</h3>
              {loadingCandidates ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left">
                          <div className="flex items-center">
                            <Checkbox 
                              id="select-all"
                              checked={selectAll} 
                              onCheckedChange={() => setSelectAll(!selectAll)}
                            />
                            <label 
                              htmlFor="select-all" 
                              className="ml-2 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            >
                              Select All
                            </label>
                          </div>
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {candidates && candidates.length > 0 ? (
                        candidates.map((candidate: any) => (
                          <tr 
                            key={candidate.id} 
                            className={cn(
                              "transition-colors",
                              selectedCandidates.includes(candidate.id) ? "bg-blue-50" : "hover:bg-gray-50"
                            )}
                            onClick={() => toggleCandidateSelection(candidate.id)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Checkbox 
                                checked={selectedCandidates.includes(candidate.id)}
                                onCheckedChange={() => {}}
                                className="cursor-pointer"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{candidate.fullName}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{candidate.email}</div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                            No candidates found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Confirmation Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Assessment Assignment</DialogTitle>
            <DialogDescription>
              You are about to assign <span className="font-medium">{getSelectedAssessmentName()}</span> to 
              {selectedCandidates.length > 3 
                ? <> <span className="font-medium">{selectedCandidates.length}</span> candidates</>
                : getSelectedCandidateNames().map((name, index, arr) => (
                    <span key={index}>
                      {index > 0 && index === arr.length - 1 ? ' and ' : index > 0 ? ', ' : ' '}
                      <span className="font-medium">{name}</span>
                    </span>
                  ))
              }
              {scheduledDate && (
                <>, scheduled for <span className="font-medium">{formatScheduledDate()}</span></>
              )}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmAssignment} disabled={bulkAssignMutation.isPending}>
              {bulkAssignMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                "Confirm Assignment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}