import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Loader2, 
  ArrowLeft,
  Save,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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

// Define validation schema
const editCandidateSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters"),
  email: z.string().email("Please enter a valid email"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  status: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
});

type EditCandidateFormValues = z.infer<typeof editCandidateSchema>;

export default function EditCandidate() {
  const params = useParams<{ id: string }>();
  const candidateId = parseInt(params.id);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [isPasswordChanged, setIsPasswordChanged] = useState(false);

  // Fetch candidate details
  const { data: candidate, isLoading } = useQuery({
    queryKey: [`/api/admin/candidates/${candidateId}`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/admin/candidates/${candidateId}`);
      return response.json();
    },
    enabled: !isNaN(candidateId),
  });

  // Initialize form
  const form = useForm<EditCandidateFormValues>({
    resolver: zodResolver(editCandidateSchema),
    defaultValues: {
      fullName: "",
      email: "",
      username: "",
      status: "",
      password: "",
    },
  });

  // Update form when candidate data is loaded
  useEffect(() => {
    if (candidate) {
      form.reset({
        fullName: candidate.fullName || "",
        email: candidate.email || "",
        username: candidate.username || "",
        status: candidate.status || "active",
        password: "", // Password field is always empty by default
      });
    }
  }, [candidate, form]);

  // Update candidate mutation
  const updateCandidateMutation = useMutation({
    mutationFn: async (data: EditCandidateFormValues) => {
      // Remove empty password if it's not being changed
      const updateData = !data.password ? 
        { ...data, password: undefined } : 
        data;
      
      const response = await apiRequest("PATCH", `/api/admin/candidates/${candidateId}`, updateData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Candidate updated",
        description: "Candidate details have been updated successfully.",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/admin/candidates"] });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/candidates/${candidateId}`] });
      
      setIsSuccessful(true);
      
      // Check if password was changed
      setIsPasswordChanged(!!form.getValues("password"));
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update candidate",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (data: EditCandidateFormValues) => {
    updateCandidateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Edit Candidate">
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!candidate) {
    return (
      <DashboardLayout title="Candidate Not Found">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Candidate Not Found</h2>
            <p className="text-gray-600 mb-6">
              The candidate you're trying to edit doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate("/admin/candidates")}>
              Back to Candidates List
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Edit Candidate">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href={`/admin/candidates/${candidateId}`}>
            <Button variant="ghost" className="text-gray-600 hover:text-gray-900 pl-0">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Candidate Details
            </Button>
          </Link>
        </div>
        
        <Card>
          <CardContent className="p-6">
            {isSuccessful ? (
              <div className="text-center p-6">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Candidate Updated Successfully</h2>
                <p className="text-gray-600 mb-6">
                  The candidate details have been updated.
                  {isPasswordChanged && (
                    <div className="mt-2 text-yellow-600">
                      Note: The password for this account has been changed.
                    </div>
                  )}
                </p>
                <div className="flex space-x-4 justify-center">
                  <Button onClick={() => navigate("/admin/candidates")}>
                    View All Candidates
                  </Button>
                  <Button variant="outline" onClick={() => navigate(`/admin/candidates/${candidateId}`)}>
                    Return to Candidate
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-semibold mb-4">Edit Candidate</h2>
                <p className="text-gray-600 mb-6">
                  Update the candidate's information below. Leave the password field empty if you don't want to change it.
                </p>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select 
                              value={field.value} 
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                                <SelectItem value="suspended">Suspended</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Leave empty to keep current password"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Minimum 6 characters
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-4">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => navigate(`/admin/candidates/${candidateId}`)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={updateCandidateMutation.isPending}
                      >
                        {updateCandidateMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}