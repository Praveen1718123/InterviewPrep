import { useState, useEffect, useCallback } from "react";
import { AlertCircle, Clock } from "lucide-react";
import { Progress } from "./progress";
import { Badge } from "./badge";
import { cn } from "@/lib/utils";

type VariantType = "default" | "destructive" | "secondary" | "outline";

interface AssessmentTimerProps {
  durationInSeconds: number;
  startTime?: string; // ISO date string
  onTimeEnd?: () => void;
  className?: string;
  showProgress?: boolean;
}

export function AssessmentTimer({
  durationInSeconds,
  startTime,
  onTimeEnd,
  className,
  showProgress = true,
}: AssessmentTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [percentRemaining, setPercentRemaining] = useState(100);
  
  // Format time remaining
  const formatTimeRemaining = useCallback(() => {
    if (timeRemaining === null) return "--:--";
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, [timeRemaining]);
  
  // Get time status
  const getTimeStatus = useCallback((): VariantType => {
    if (timeRemaining === null) return "default";
    if (timeRemaining <= 30) return "destructive";
    if (timeRemaining <= 60) return "secondary";
    return "default";
  }, [timeRemaining]);

  // Initialize and start timer
  useEffect(() => {
    if (!durationInSeconds) return;
    
    let startTimeMs: number;
    
    if (startTime) {
      // If assessment already started, calculate time remaining
      startTimeMs = new Date(startTime).getTime();
      const endTimeMs = startTimeMs + (durationInSeconds * 1000);
      const now = Date.now();
      const remaining = Math.max(0, endTimeMs - now);
      
      setTimeRemaining(Math.floor(remaining / 1000));
      setPercentRemaining(Math.round((remaining / (durationInSeconds * 1000)) * 100));
    } else {
      // New assessment, use full duration
      setTimeRemaining(durationInSeconds);
      setPercentRemaining(100);
    }
    
    // Start countdown
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          onTimeEnd?.();
          return 0;
        }
        
        // Update percentage
        const newTime = prev - 1;
        setPercentRemaining(Math.round((newTime / durationInSeconds) * 100));
        
        return newTime;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [durationInSeconds, startTime, onTimeEnd]);

  // No timer
  if (timeRemaining === null) return null;

  return (
    <div className={cn("", className)}>
      {formatTimeRemaining()}
      
      {showProgress && (
        <Progress 
          value={percentRemaining} 
          className={cn(
            "h-1.5 mt-1",
            timeRemaining <= 30 && "bg-destructive/20",
            timeRemaining > 30 && timeRemaining <= 60 && "bg-yellow-200"
          )}
        />
      )}
    </div>
  );
}