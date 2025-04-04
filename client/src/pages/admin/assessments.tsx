import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Loader2, 
  Search,
  MoreHorizontal,
  PlusCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

export default function AdminAssessments() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  // Fetch assessments
  const { data: assessments, isLoading } = useQuery({
    queryKey: ["/api/admin/assessments"],
  });

  // Filter assessments
  const filteredAssessments = assessments
    ? assessments.filter((assessment: any) => {
        // Filter by search term
        const searchMatch = 
          !search || 
          assessment.title.toLowerCase().includes(search.toLowerCase()) ||
          (assessment.description && assessment.description.toLowerCase().includes(search.toLowerCase()));

        // Filter by type
        const typeMatch = !typeFilter || assessment.type === typeFilter;

        return searchMatch && typeMatch;
      })
    : [];

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  // Handle type filter change
  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value === "all" ? null : value);
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric", 
      year: "numeric"
    });
  };

  // Handle delete
  const handleDelete = (id: number) => {
    // In a real app, this would be an API call
    toast({
      title: "Assessment deleted",
      description: "The assessment has been successfully deleted.",
    });
  };

  const handleDuplicate = (id: number) => {
    // Implement duplicate functionality here.  This would typically involve an API call.
    console.log("Duplicating assessment:", id);
    toast({
      title: "Duplicating Assessment",
      description: "The assessment is being duplicated. Please wait."
    })
  };

  const handleExport = (id: number) => {
    // Implement export functionality here. This would typically involve an API call to download a file.
    console.log("Exporting assessment questions:", id);
    toast({
      title: "Exporting Questions",
      description: "The questions are being exported. Please wait."
    })
  };

  const handleImport = (id: number) => {
    // Implement import functionality here. This would typically involve a file upload and API call.
    console.log("Importing questions to assessment:", id);
    toast({
      title: "Importing Questions",
      description: "The questions are being imported. Please wait."
    })
  };


  return (
    <DashboardLayout title="Assessments">
      <div className="max-w-7xl mx-auto">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <h2 className="text-xl font-semibold">Assessment Management</h2>
              <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 w-full md:w-auto">
                <div className="relative w-full md:w-64">
                  <Input 
                    type="text" 
                    placeholder="Search assessments" 
                    className="pl-10"
                    value={search}
                    onChange={handleSearchChange}
                  />
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                </div>
                <Select 
                  value={typeFilter || "all"} 
                  onValueChange={handleTypeFilterChange}
                >
                  <SelectTrigger className="w-full md:w-36">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="mcq">MCQ</SelectItem>
                    <SelectItem value="fill-in-blanks">Fill-in-Blanks</SelectItem>
                    <SelectItem value="video">Video Interview</SelectItem>
                  </SelectContent>
                </Select>
                <Link href="/admin/assessments/create">
                  <Button className="flex items-center">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create New
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
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Assessment
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Candidates
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredAssessments.length > 0 ? (
                        filteredAssessments.map((assessment: any) => (
                          <tr key={assessment.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{assessment.title}</div>
                              {assessment.description && (
                                <div className="text-xs text-gray-500 truncate max-w-xs">{assessment.description}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge 
                                className={`
                                  ${assessment.type === 'mcq' ? 'bg-blue-100 text-blue-800' : ''} 
                                  ${assessment.type === 'fill-in-blanks' ? 'bg-purple-100 text-purple-800' : ''} 
                                  ${assessment.type === 'video' ? 'bg-green-100 text-green-800' : ''}
                                `}
                              >
                                {assessment.type === 'mcq' ? 'MCQ' : 
                                 assessment.type === 'fill-in-blanks' ? 'Fill-in-Blanks' : 
                                 assessment.type === 'video' ? 'Video Interview' : assessment.type}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {assessment.candidateCount || 0} assigned
                              </div>
                              <div className="text-xs text-gray-500">
                                {assessment.completedCount || 0} completed
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(assessment.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <Link href={`/admin/assessments/${assessment.id}/edit`}>
                                    <DropdownMenuItem>Edit Assessment</DropdownMenuItem>
                                  </Link>
                                  <Link href={`/admin/assessments/${assessment.id}/edit?tab=questions`}>
                                    <DropdownMenuItem>Manage Questions</DropdownMenuItem>
                                  </Link>
                                  <DropdownMenuItem onClick={() => window.location.href=`/admin/assessments/${assessment.id}/assign`}>
                                    Assign to Candidates
                                  </DropdownMenuItem>
                                  <Link href={`/admin/assessments/${assessment.id}/view`}>
                                    <DropdownMenuItem>View Responses</DropdownMenuItem>
                                  </Link>
                                  <DropdownMenuItem onClick={() => handleDuplicate(assessment.id)}>
                                    Duplicate Assessment
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleExport(assessment.id)}>
                                    Export Questions
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleImport(assessment.id)}>
                                    Import Questions
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-red-600"
                                    onClick={() => handleDelete(assessment.id)}
                                  >
                                    Delete Assessment
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                            {search || typeFilter 
                              ? "No assessments match your filters" 
                              : "No assessments found. Create your first assessment!"}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}