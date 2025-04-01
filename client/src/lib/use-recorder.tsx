import { useState, useRef, useCallback } from "react";

type RecorderStatus = "inactive" | "recording" | "paused" | "stopped";

interface UseRecorderReturn {
  status: RecorderStatus;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  resetRecording: () => void;
  videoBlob: Blob | null;
  mediaStream: MediaStream | null;
  error: string | null;
}

export function useRecorder(): UseRecorderReturn {
  const [status, setStatus] = useState<RecorderStatus>("inactive");
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    setError(null);
    chunksRef.current = [];
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      setMediaStream(stream);
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setVideoBlob(blob);
        setStatus("stopped");
        
        // Stop all tracks
        if (mediaStream) {
          mediaStream.getTracks().forEach(track => track.stop());
        }
      };
      
      mediaRecorder.start();
      setStatus("recording");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred while trying to access the camera");
      }
      setStatus("inactive");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && status === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, [status]);

  const resetRecording = useCallback(() => {
    setVideoBlob(null);
    setStatus("inactive");
    
    // Stop media stream if it exists
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
  }, [mediaStream]);

  return {
    status,
    startRecording,
    stopRecording,
    resetRecording,
    videoBlob,
    mediaStream,
    error
  };
}
