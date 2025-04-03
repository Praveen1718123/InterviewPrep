
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus } from "lucide-react";

export default function AdminBatches() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newBatch, setNewBatch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch batches
  const { data: batches = [], isLoading } = useQuery<string[]>({
    queryKey: ["/api/admin/batches"],
  });

  // Create batch mutation
  const createBatchMutation = useMutation({
    mutationFn: async (batchName: string) => {
      const res = await fetch("/api/admin/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: batchName }),
      });
      if (!res.ok) throw new Error("Failed to create batch");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/batches"] });
      toast({
        title: "Batch created",
        description: "The batch has been created successfully.",
      });
      setNewBatch("");
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create batch. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateBatch = () => {
    if (!newBatch.trim()) {
      toast({
        title: "Error",
        description: "Please enter a batch name",
        variant: "destructive",
      });
      return;
    }
    createBatchMutation.mutate(newBatch);
  };

  return (
    <DashboardLayout title="Batch Management">
      <div className="max-w-7xl mx-auto">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">All Batches</h2>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Batch
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Batch</DialogTitle>
                    <DialogDescription>
                      Enter a name for the new batch (e.g., "Jan 2025")
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Input
                      value={newBatch}
                      onChange={(e) => setNewBatch(e.target.value)}
                      placeholder="Enter batch name"
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={handleCreateBatch}
                      disabled={createBatchMutation.isPending}
                    >
                      {createBatchMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Create Batch
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {batches.map((batch) => (
                  <Card key={batch}>
                    <CardContent className="p-4">
                      <div className="font-medium">{batch}</div>
                    </CardContent>
                  </Card>
                ))}
                {batches.length === 0 && (
                  <div className="col-span-3 text-center text-gray-500 py-8">
                    No batches created yet
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
