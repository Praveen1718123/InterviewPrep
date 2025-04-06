import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Loader2, 
  CheckCircle,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Assessment, User } from "@shared/schema";

export default function AssignAssessment() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [search, setSearch] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [assignmentResults, setAssignmentResults] = useState<any>(null);

  // Fetch assessment details
  const { data: assessment, isLoading: isLoadingAssessment } = useQuery<Assessment>({
    queryKey: [`/api/admin/assessments/${id}`],
    enabled: !!id,
  });

  // Fetch candidates
  const { data: candidates = [], isLoading: isLoadingCandidates } = useQuery<User[]>({
    queryKey: ["/api/admin/candidates"],
  });

  // Filter candidates based on search
  const filteredCandidates = candidates.filter(candidate => 
    candidate.username.toLowerCase().includes(search.toLowerCase()) || 
    (candidate.email && candidate.email.toLowerCase().includes(search.toLowerCase())) ||
    (candidate.batch && candidate.batch.toLowerCase().includes(search.toLowerCase()))
  );

  // Handle select all change
  useEffect(() => {
    if (selectAll) {
      setSelectedCandidates(filteredCandidates.map(c => c.id));
    } else if (selectedCandidates.length === filteredCandidates.length) {
      // If all were selected and selectAll is unchecked, deselect all
      setSelectedCandidates([]);
    }
  }, [selectAll, filteredCandidates]);

  // Update selectAll when individual selections change
  useEffect(() => {
    if (filteredCandidates.length > 0 && selectedCandidates.length === filteredCandidates.length) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedCandidates, filteredCandidates]);

  // Toggle candidate selection
  const toggleCandidateSelection = (id: number) => {
    if (selectedCandidates.includes(id)) {
      setSelectedCandidates(selectedCandidates.filter(cid => cid !== id));
    } else {
      setSelectedCandidates([...selectedCandidates, id]);
    }
  };

  // Bulk assign mutation
  const bulkAssignMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/bulk-assign-assessment", {
        candidateIds: selectedCandidates,
        assessmentId: parseInt(id!),
        scheduledFor: date ? date.toISOString() : null
      });
      return res.json();
    },
    onSuccess: (data) => {
      setAssignmentResults(data);
      setSuccessDialogOpen(true);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/assessments"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to assign assessment: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle confirm assign
  const handleConfirmAssign = () => {
    setConfirmDialogOpen(false);
    bulkAssignMutation.mutate();
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  return (
    <DashboardLayout title="Assign Assessment">
      <div className="max-w-5xl mx-auto">
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
            Assign Assessment to Candidates
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
        
        <Card>
          <CardContent className="p-6">
            {(isLoadingAssessment || isLoadingCandidates) ? (
              <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-gray-500">Loading...</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-60">
                      <Input 
                        type="text" 
                        placeholder="Search candidates..." 
                        value={search}
                        onChange={handleSearchChange}
                      />
                    </div>
                    
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-52 justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "PPP") : "Schedule for (optional)"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    
                    {date && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setDate(undefined)}
                      >
                        Clear date
                      </Button>
                    )}
                  </div>
                  
                  <Button
                    disabled={selectedCandidates.length === 0}
                    onClick={() => setConfirmDialogOpen(true)}
                  >
                    Assign to {selectedCandidates.length} Candidate{selectedCandidates.length !== 1 ? 's' : ''}
                  </Button>
                </div>
                
                <div className="border rounded-md">
                  <div className="border-b px-6 py-3 bg-muted/50">
                    <div className="flex items-center">
                      <Checkbox 
                        id="select-all" 
                        checked={selectAll} 
                        onCheckedChange={() => setSelectAll(!selectAll)}
                      />
                      <label htmlFor="select-all" className="ml-2 text-sm font-medium">
                        Select All ({filteredCandidates.length})
                      </label>
                    </div>
                  </div>
                  
                  <div className="divide-y">
                    {filteredCandidates.length > 0 ? (
                      filteredCandidates.map((candidate) => (
                        <div 
                          key={candidate.id}
                          className="flex items-center px-6 py-4 hover:bg-muted/30"
                        >
                          <Checkbox 
                            id={`candidate-${candidate.id}`} 
                            checked={selectedCandidates.includes(candidate.id)}
                            onCheckedChange={() => toggleCandidateSelection(candidate.id)}
                          />
                          <div className="ml-4 flex-1">
                            <div className="flex justify-between">
                              <div>
                                <p className="font-medium">{candidate.username}</p>
                                {candidate.email && (
                                  <p className="text-sm text-gray-500">{candidate.email}</p>
                                )}
                              </div>
                              {candidate.batch && (
                                <Badge variant="outline">{candidate.batch}</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-4 px-6 text-center text-gray-500">
                        No candidates found matching your search.
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Assignment</DialogTitle>
            <DialogDescription>
              You are about to assign this assessment to {selectedCandidates.length} candidate{selectedCandidates.length !== 1 ? 's' : ''}.
              {date && (
                <span className="block mt-2">
                  Scheduled for: {format(date, "PPP")}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmAssign}>
              {bulkAssignMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Success Dialog */}
      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              Assignment Complete
            </DialogTitle>
            <DialogDescription>
              Assessment has been successfully assigned to {assignmentResults?.results?.length || 0} candidate{assignmentResults?.results?.length !== 1 ? 's' : ''}.
              
              {assignmentResults?.errors?.length > 0 && (
                <div className="mt-4">
                  <p className="text-yellow-600 font-medium">
                    {assignmentResults.errors.length} assignment{assignmentResults.errors.length !== 1 ? 's' : ''} failed:
                  </p>
                  <ul className="mt-2 text-sm list-disc pl-5">
                    {assignmentResults.errors.map((error: any, index: number) => (
                      <li key={index}>
                        Candidate ID {error.candidateId}: {error.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => {
              setSuccessDialogOpen(false);
              setLocation("/admin/assessments");
            }}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}