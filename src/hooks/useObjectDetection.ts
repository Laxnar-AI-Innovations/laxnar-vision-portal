
import { useState, useEffect, useRef } from 'react';
import yolov5Service, { DetectionResult } from '../services/yolov5Service';
import { toast } from 'sonner';

interface ObjectDetectionProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isDetecting: boolean;
  confidenceThreshold?: number;
  showBoundingBoxes?: boolean;
  showLabels?: boolean;
  detectionInterval?: number;
}

export const useObjectDetection = ({
  videoRef,
  canvasRef,
  isDetecting,
  confidenceThreshold = 0.45,
  showBoundingBoxes = true,
  showLabels = true,
  detectionInterval = 100
}: ObjectDetectionProps) => {
  const [detections, setDetections] = useState<DetectionResult[]>([]);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const detectionIntervalRef = useRef<number | null>(null);
  
  // Load the model
  useEffect(() => {
    const loadModel = async () => {
      if (!isModelLoaded && !isModelLoading) {
        try {
          setIsModelLoading(true);
          await yolov5Service.loadModel();
          setIsModelLoaded(true);
          toast.success("YOLOv5 model loaded successfully");
        } catch (error) {
          console.error("Failed to load YOLOv5 model:", error);
          toast.error("Failed to load YOLOv5 model. Check console for details.");
        } finally {
          setIsModelLoading(false);
        }
      }
    };
    
    loadModel();
  }, [isModelLoaded, isModelLoading]);
  
  // Process video frames and run object detection
  useEffect(() => {
    if (!isDetecting || !isModelLoaded || !videoRef.current || !canvasRef.current) {
      if (detectionIntervalRef.current) {
        window.clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
      return;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    
    // Start detection loop
    const startDetection = () => {
      if (detectionIntervalRef.current) {
        window.clearInterval(detectionIntervalRef.current);
      }
      
      detectionIntervalRef.current = window.setInterval(async () => {
        if (video.readyState !== 4 || video.paused || video.ended) return;
        
        try {
          // Draw the current video frame
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Get the image data from the canvas
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          // Run detection
          const results = await yolov5Service.detect(imageData, confidenceThreshold);
          setDetections(results);
          
          // Draw detections
          if (showBoundingBoxes) {
            results.forEach(detection => {
              const [x, y, width, height] = detection.box;
              
              // Draw bounding box
              ctx.strokeStyle = detection.color || "#9b87f5";
              ctx.lineWidth = 2;
              ctx.strokeRect(x, y, width, height);
              
              // Draw label if enabled
              if (showLabels) {
                const label = `${detection.label} ${Math.round(detection.confidence * 100)}%`;
                
                // Draw label background
                ctx.fillStyle = detection.color || "#9b87f5";
                const textWidth = ctx.measureText(label).width + 10;
                ctx.fillRect(x, y - 25, textWidth, 25);
                
                // Draw label text
                ctx.fillStyle = "#ffffff";
                ctx.font = "16px Arial";
                ctx.fillText(label, x + 5, y - 8);
              }
            });
          }
        } catch (error) {
          console.error("Error during detection:", error);
        }
      }, detectionInterval);
    };
    
    startDetection();
    
    return () => {
      if (detectionIntervalRef.current) {
        window.clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
    };
  }, [
    isDetecting, 
    isModelLoaded, 
    videoRef, 
    canvasRef, 
    confidenceThreshold, 
    showBoundingBoxes, 
    showLabels, 
    detectionInterval
  ]);
  
  return {
    detections,
    isModelLoaded,
    isModelLoading
  };
};
