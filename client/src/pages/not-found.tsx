import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50">
      <Card className="w-full max-w-md mx-4 border-[#4D95BC]/20 shadow-md">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center mb-6">
            <AlertCircle className="h-14 w-14 text-[#4D95BC] mb-4" />
            <h1 className="text-3xl font-bold text-[#0E2D4A]">404 Page Not Found</h1>
            <p className="mt-2 text-gray-600">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>

          <div className="flex justify-center mt-6">
            <Button asChild className="bg-[#0E2D4A] hover:bg-[#0c2339]">
              <Link href="/">
                Return to Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
