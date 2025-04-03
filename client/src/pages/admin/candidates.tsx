import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Loader2, 
  Search,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Users,
  UserCheck,
  Check,
  Trash2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useLocation } from "wouter";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AdminCandidates() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [batchFilter, setBatchFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBatchActionDialog, setShowBatchActionDialog] = useState(false);
  const [batchAction, setBatchAction] = useState<string | null>(null);
  const [newBatchName, setNewBatchName] = useState("");
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Fetch candidates
  const { data: candidates = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/candidates"],
    refetchOnWindowFocus: true,
    refetchOnMount: true
  });

  const [batchFilter, setBatchFilter] = useState<string | null>(null);

  // Handle batch filter change
  const handleBatchFilterChange = (value: string) => {
    setBatchFilter(value === "all" ? null : value);
    setCurrentPage(1); // Reset to first page on filter change
  };

  // Filter candidates
  const filteredCandidates = candidates
    ? candidates.filter((candidate: any) => {
        // Filter by search term
        const searchMatch = 
          !search || 
          candidate.fullName.toLowerCase().includes(search.toLowerCase()) ||
          candidate.email.toLowerCase().includes(search.toLowerCase());

        // Filter by status
        const statusMatch = !statusFilter || candidate.status === statusFilter;

        // Filter by batch
        const batchMatch = !batchFilter || 
          (batchFilter === "no-batch" && !candidate.batch) || 
          candidate.batch === batchFilter;

        return searchMatch && statusMatch && batchMatch;
      })
    : [];

  // Paginate candidates
  const paginatedCandidates = filteredCandidates.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage);

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  // Handle status filter change
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value === "all" ? null : value);
    setCurrentPage(1); // Reset to first page on filter change
  };

  // Handle pagination
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch(status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "in-progress":
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case "review-pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Review Pending</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status || "Unknown"}</Badge>;
    }
  };

  // Toggle candidate selection
  const toggleCandidateSelection = (candidateId: number) => {
    setSelectedCandidates(prevSelected => {
      if (prevSelected.includes(candidateId)) {
        return prevSelected.filter(id => id !== candidateId);
      } else {
        return [...prevSelected, candidateId];
      }
    });
  };

  // Toggle select all candidates on current page
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedCandidates([]);
      setSelectAll(false);
    } else {
      setSelectedCandidates(paginatedCandidates.map((c: any) => c.id));
      setSelectAll(true);
    }
  };

  // Clear selections when filters change
  useEffect(() => {
    setSelectedCandidates([]);
    setSelectAll(false);
  }, [search, statusFilter, batchFilter]);

  // Handle batch action selection
  const handleBatchAction = (action: string) => {
    setBatchAction(action);
    setShowBatchActionDialog(true);
  };

  // Execute batch action
  const executeBatchAction = async () => {
    if (!batchAction || selectedCandidates.length === 0) return;

    try {
      if (batchAction === "batch") {
        // Assign candidates to a batch
        const response = await fetch('/api/admin/candidates/batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            candidateIds: selectedCandidates,
            batchName: newBatchName,
          }),
        });

        if (!response.ok) throw new Error('Failed to assign batch');

        toast({
          title: "Batch Assignment Successful",
          description: `${selectedCandidates.length} candidates assigned to ${newBatchName}`,
        });
      } else if (batchAction === "status") {
        // Update candidate status
        const response = await fetch('/api/admin/candidates/status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            candidateIds: selectedCandidates,
            status: newBatchName, // reusing the field for status value
          }),
        });

        if (!response.ok) throw new Error('Failed to update status');

        toast({
          title: "Status Update Successful",
          description: `${selectedCandidates.length} candidates updated to ${newBatchName}`,
        });
      } else if (batchAction === "delete") {
        // Delete candidates
        const response = await fetch('/api/admin/candidates/bulk-delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            candidateIds: selectedCandidates,
          }),
        });

        if (!response.ok) throw new Error('Failed to delete candidates');

        toast({
          title: "Deletion Successful",
          description: `${selectedCandidates.length} candidates deleted`,
        });
      }

      // Reset state
      setSelectedCandidates([]);
      setSelectAll(false);
      setBatchAction(null);
      setNewBatchName("");
      setShowBatchActionDialog(false);

      // Refresh candidate list
      refetch();

    } catch (error) {
      toast({
        title: "Action Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout title="Candidates">
      <div className="max-w-7xl mx-auto">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <h2 className="text-xl font-semibold">All Candidates</h2>
              <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 w-full md:w-auto">
                <Select
                  value={batchFilter || "all"}
                  onValueChange={handleBatchFilterChange}
                >
                  <SelectTrigger className="w-full md:w-36">
                    <SelectValue placeholder="Batch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Batches</SelectItem>
                    {Array.from(new Set(candidates?.map(c => c.batch).filter(Boolean) || [])).map(batch => (
                      <SelectItem key={batch} value={batch}>{batch}</SelectItem>
                    ))}
                    <SelectItem value="no-batch">No Batch</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative w-full md:w-64">
                  <Input 
                    type="text" 
                    placeholder="Search candidates" 
                    className="pl-10"
                    value={search}
                    onChange={handleSearchChange}
                  />
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                </div>
                <Select 
                  value={statusFilter || "all"} 
                  onValueChange={handleStatusFilterChange}
                >
                  <SelectTrigger className="w-full md:w-36">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="review-pending">Review Pending</SelectItem>
                  </SelectContent>
                </Select>
                <Link href="/admin/candidates/create">
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add New Candidate
                  </Button>
                </Link>
                <Link href="/admin/bulk-assignment">
                  <Button variant="outline">
                    <Users className="h-4 w-4 mr-2" />
                    Bulk Assign
                  </Button>
                </Link>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500">
                          <div className="flex items-center">
                            <Checkbox
                              checked={selectAll}
                              onCheckedChange={toggleSelectAll}
                              className="mr-2"
                              id="select-all"
                            />
                            <label htmlFor="select-all" className="sr-only">Select All</label>
                          </div>
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Progress
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedCandidates.length > 0 ? (
                        paginatedCandidates.map((candidate: any) => (
                          <tr key={candidate.id} className={selectedCandidates.includes(candidate.id) ? "bg-primary/5" : ""}>
                            <td className="pl-3 pr-1 py-4 whitespace-nowrap">
                              <Checkbox
                                checked={selectedCandidates.includes(candidate.id)}
                                onCheckedChange={() => toggleCandidateSelection(candidate.id)}
                                id={`select-candidate-${candidate.id}`}
                              />
                              <label htmlFor={`select-candidate-${candidate.id}`} className="sr-only">
                                Select {candidate.fullName}
                              </label>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <Avatar>
                                    <AvatarFallback>{getInitials(candidate.fullName)}</AvatarFallback>
                                  </Avatar>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{candidate.fullName}</div>
                                  <div className="text-sm text-gray-500">Candidate</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{candidate.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="w-full bg-gray-200 rounded-full h-2.5 w-32">
                                <div 
                                  className="bg-primary h-2.5 rounded-full" 
                                  style={{ width: `${(candidate.progress || 0) * 100}%` }}
                                ></div>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {Math.round((candidate.progress || 0) * 3)}/3 Completed
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(candidate.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <Link to={`/admin/candidates/${candidate.id}`} className="text-primary hover:text-primary-dark mr-3">
                                View
                              </Link>
                              <Link to={`/admin/candidates/${candidate.id}/edit`} className="text-gray-600 hover:text-gray-900">
                                Edit
                              </Link>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                            {search || statusFilter 
                              ? "No candidates match your filters" 
                              : "No candidates found"}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Batch Action Controls */}
                {selectedCandidates.length > 0 && (
                  <div className="mt-4 flex items-center bg-primary/5 p-4 rounded-md">
                    <div className="mr-4 font-medium">
                      {selectedCandidates.length} candidates selected
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleBatchAction("batch")}
                      >
                        <UserCheck className="h-4 w-4 mr-2" />
                        Assign to Batch
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleBatchAction("status")}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Update Status
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => setShowDeleteDialog(true)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Selected
                      </Button>
                    </div>
                  </div>
                )}

                {/* Batch Action Dialog */}
                <AlertDialog open={showBatchActionDialog} onOpenChange={setShowBatchActionDialog}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {batchAction === "batch" ? "Assign to Batch" : 
                         batchAction === "status" ? "Update Status" : "Batch Action"}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {batchAction === "batch" ? 
                          `You are about to assign ${selectedCandidates.length} candidates to a batch.` : 
                          batchAction === "status" ? 
                          `You are about to update the status of ${selectedCandidates.length} candidates.` : 
                          "Perform batch action on selected candidates."}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="my-4">
                      <label className="text-sm font-medium mb-2 block">
                        {batchAction === "batch" ? "Batch Name" : 
                         batchAction === "status" ? "Status" : "Value"}:
                      </label>
                      {batchAction === "status" ? (
                        <Select value={newBatchName} onValueChange={setNewBatchName}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          type="text"
                          value={newBatchName}
                          onChange={(e) => setNewBatchName(e.target.value)}
                          placeholder={batchAction === "batch" ? "Enter batch name" : "Enter value"}
                        />
                      )}
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={executeBatchAction} 
                        disabled={!newBatchName && batchAction !== "delete"}
                      >
                        Confirm
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                {/* Delete Confirmation Dialog */}
                <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Candidates</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete {selectedCandidates.length} candidates? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="my-4">
                      <div className="flex items-center text-amber-500">
                        <AlertCircle className="mr-2 h-5 w-5" />
                        <p className="text-sm">
                          This will permanently remove all selected candidates and their assessment data.
                        </p>
                      </div>
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => {
                          setBatchAction("delete");
                          setShowDeleteDialog(false);
                          executeBatchAction();
                        }}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                {totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredCandidates.length)} of {filteredCandidates.length} entries
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="ml-1">Previous</span>
                      </Button>

                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        // Calculate which page numbers to show
                        let pageNum;
                        if (totalPages <= 5) {
                          // If 5 or fewer pages, show all
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          // At the start, show first 5 pages
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          // At the end, show last 5 pages
                          pageNum = totalPages - 4 + i;
                        } else {
                          // In the middle, show current page and 2 on each side
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => goToPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}

                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <span className="mr-1">Next</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}