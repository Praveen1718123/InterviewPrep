import { useState } from "react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Loader2, 
  ArrowLeft,
  Mail,
  CheckCircle
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
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
const candidateFormSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters"),
  email: z.string().email("Please enter a valid email"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  batch: z.string().min(1, "Please select a batch"),
  sendCredentials: z.boolean().default(false),
});

type CandidateFormValues = z.infer<typeof candidateFormSchema>;

export default function CreateCandidate() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [createdUser, setCreatedUser] = useState<{ id: number; fullName: string; email: string } | null>(null);

  // Initialize form
  const form = useForm<CandidateFormValues>({
    resolver: zodResolver(candidateFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      username: "",
      password: "",
      sendCredentials: false,
    },
  });

  // Create candidate mutation
  const createCandidateMutation = useMutation({
    mutationFn: async (data: CandidateFormValues) => {
      const { sendCredentials, ...userData } = data;
      
      // Create the candidate
      const response = await apiRequest("POST", "/api/admin/candidates", userData);
      const newUser = await response.json();
      
      // If sendCredentials is checked, send an email with login details
      if (sendCredentials) {
        await apiRequest("POST", "/api/admin/send-credentials", {
          email: userData.email,
          username: userData.username,
          password: userData.password,
        });
      }
      
      return newUser;
    },
    onSuccess: (data) => {
      toast({
        title: "Candidate created",
        description: "Candidate account has been created successfully.",
      });
      // Invalidate candidates query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/admin/candidates"] });
      setCreatedUser(data);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create candidate",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (data: CandidateFormValues) => {
    createCandidateMutation.mutate(data);
  };

  return (
    <DashboardLayout title="Create Candidate">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href="/admin/candidates">
            <Button variant="ghost" className="text-gray-600 hover:text-gray-900 pl-0">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Candidates List
            </Button>
          </Link>
        </div>
        
        <Card>
          <CardContent className="p-6">
            {createdUser ? (
              <div className="text-center p-6">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Candidate Created Successfully</h2>
                <p className="text-gray-600 mb-6">
                  {createdUser.fullName} has been added to your candidates list.
                  {form.getValues("sendCredentials") && (
                    <> Login credentials have been sent to {createdUser.email}</>
                  )}
                </p>
                <div className="flex space-x-4 justify-center">
                  <Button onClick={() => navigate("/admin/candidates")}>
                    View All Candidates
                  </Button>
                  <Button variant="outline" onClick={() => {
                    form.reset();
                    setCreatedUser(null);
                  }}>
                    Create Another Candidate
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-semibold mb-4">Create New Candidate</h2>
                <p className="text-gray-600 mb-6">
                  Fill in the details below to create a new candidate account. The candidate will use these
                  credentials to access the assessment platform.
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
                            <Input placeholder="Enter candidate's full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter candidate's email" type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Create a username" {...field} />
                            </FormControl>
                            <FormDescription>
                              The username the candidate will use to log in
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input placeholder="Create a password" type="password" {...field} />
                            </FormControl>
                            <FormDescription>
                              Minimum 6 characters
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="batch"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Batch</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select batch" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 12 }, (_, i) => {
                                const date = new Date();
                                date.setMonth(date.getMonth() + i);
                                const batchName = date.toLocaleString('default', { month: 'short', year: 'numeric' });
                                return (
                                  <SelectItem key={batchName} value={batchName}>
                                    {batchName}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sendCredentials"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Send login credentials</FormLabel>
                            <FormDescription>
                              Send an email with login details to the candidate's email address
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={createCandidateMutation.isPending}
                        className="min-w-[150px]"
                      >
                        {createCandidateMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          "Create Candidate"
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