
import React, { useRef, useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Camera } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

const ObjectDetector = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [hasWebcamPermission, setHasWebcamPermission] = useState(false);
  const [webcamActive, setWebcamActive] = useState(false);
  
  // Detection parameters
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.45);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [detectionInterval, setDetectionInterval] = useState(100);
  
  // Mock detection results
  const mockDetections = [
    { label: "person", confidence: 0.92 },
    { label: "chair", confidence: 0.87 },
    { label: "laptop", confidence: 0.78 },
  ];

  // Start webcam stream
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setWebcamActive(true);
          setHasWebcamPermission(true);
          toast.success("Webcam connected successfully");
        };
      }
    } catch (error) {
      console.error("Error accessing webcam:", error);
      toast.error("Could not access webcam. Please check permissions.");
      setWebcamActive(false);
      setHasWebcamPermission(false);
    }
  };

  // Toggle detection
  const toggleDetection = () => {
    if (!isDetecting) {
      if (!webcamActive) {
        startWebcam().then(() => {
          setIsDetecting(true);
          toast.info("Object detection started");
        });
      } else {
        setIsDetecting(true);
        toast.info("Object detection started");
      }
    } else {
      stopDetection();
    }
  };

  // Start object detection
  const startDetection = () => {
    if (webcamActive) {
      setIsDetecting(true);
      toast.info("Object detection started");
    } else {
      startWebcam().then(() => {
        setIsDetecting(true);
        toast.info("Object detection started");
      });
    }
  };

  // Stop object detection
  const stopDetection = () => {
    setIsDetecting(false);
    toast.info("Object detection stopped");
  };

  // Initialize
  useEffect(() => {
    startWebcam();
    
    // Clean up
    return () => {
      if (isDetecting) {
        stopDetection();
      }
      
      // Stop webcam stream
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        setWebcamActive(false);
      }
    };
  }, []);

  // Mock detection rendering - in real app this would use the YOLOv5 model
  useEffect(() => {
    if (!isDetecting || !canvasRef.current || !videoRef.current || !webcamActive) return;

    const drawDetections = () => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      if (!canvas || !video) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw the video frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Only proceed if confidence threshold is met
      if (showBoundingBoxes) {
        // Mock detections - in real app would come from YOLOv5 model
        const detections = [
          { label: "person", confidence: 0.92, box: [50, 50, 200, 350] },
          { label: "chair", confidence: 0.87, box: [300, 200, 100, 150] },
          { label: "laptop", confidence: 0.78, box: [400, 300, 120, 80] },
        ];

        // Draw bounding boxes
        detections.forEach(detection => {
          if (detection.confidence >= confidenceThreshold) {
            const [x, y, width, height] = detection.box;
            
            // Draw rectangle
            ctx.strokeStyle = "#9b87f5";
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, width, height);
            
            // Draw label if enabled
            if (showLabels) {
              // Draw label background
              ctx.fillStyle = "#9b87f5";
              const label = `${detection.label} ${Math.round(detection.confidence * 100)}%`;
              const textWidth = ctx.measureText(label).width + 10;
              ctx.fillRect(x, y - 25, textWidth, 25);
              
              // Draw label text
              ctx.fillStyle = "#ffffff";
              ctx.font = "16px Arial";
              ctx.fillText(label, x + 5, y - 8);
            }
          }
        });
      }
    };

    // Set up animation loop for detections
    const interval = setInterval(drawDetections, detectionInterval);
    return () => clearInterval(interval);
  }, [isDetecting, confidenceThreshold, showBoundingBoxes, showLabels, detectionInterval, webcamActive]);

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main video feed */}
        <div className="w-full lg:w-3/4">
          <Card className="w-full h-full">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>YOLOv5 Object Detector</CardTitle>
                  <CardDescription>Real-time object detection using webcam feed</CardDescription>
                </div>
                <Button 
                  onClick={toggleDetection} 
                  className={isDetecting ? "bg-red-500 hover:bg-red-600" : "bg-laxnar-primary hover:bg-laxnar-primary/90"}
                >
                  {isDetecting ? "Stop Detection" : "Start Detection"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-1 bg-black rounded-md overflow-hidden relative">
              {!webcamActive ? (
                <div className="flex flex-col items-center justify-center h-[480px] w-full">
                  <Camera size={48} className="text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Webcam access required</p>
                  <Button onClick={startWebcam} variant="outline" className="mt-4">
                    Enable Webcam
                  </Button>
                </div>
              ) : (
                <>
                  <div className="relative w-full h-full">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-[480px] object-contain"
                      style={{ display: "block" }}
                    />
                    <canvas
                      ref={canvasRef}
                      className="absolute top-0 left-0 w-full h-full"
                    />
                    {isDetecting && (
                      <div className="absolute top-4 left-4 bg-black/50 rounded-full px-3 py-1 text-white text-xs flex items-center">
                        <span className="mr-2">Detecting</span>
                        <div className="flex gap-1">
                          <span className="ai-processing-dot"></span>
                          <span className="ai-processing-dot"></span>
                          <span className="ai-processing-dot"></span>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Parameters sidebar */}
        <div className="w-full lg:w-1/4">
          <Card className="w-full h-full">
            <CardHeader>
              <CardTitle>Detection Settings</CardTitle>
              <CardDescription>Adjust parameters for object detection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Confidence threshold */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="confidence">Confidence Threshold</Label>
                  <span className="text-sm text-muted-foreground">{confidenceThreshold.toFixed(2)}</span>
                </div>
                <Slider 
                  id="confidence" 
                  min={0.1} 
                  max={1} 
                  step={0.01} 
                  value={[confidenceThreshold]}
                  onValueChange={([value]) => setConfidenceThreshold(value)} 
                />
              </div>

              {/* Detection interval */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="interval">Detection Speed</Label>
                  <span className="text-sm text-muted-foreground">
                    {detectionInterval < 100 ? 'Fast' : detectionInterval < 300 ? 'Normal' : 'Slow'}
                  </span>
                </div>
                <Slider 
                  id="interval" 
                  min={50} 
                  max={500} 
                  step={50} 
                  value={[detectionInterval]}
                  onValueChange={([value]) => setDetectionInterval(value)} 
                />
              </div>

              <Separator />

              {/* Toggle switches */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="boundingBoxes">Show Bounding Boxes</Label>
                  <Switch 
                    id="boundingBoxes" 
                    checked={showBoundingBoxes} 
                    onCheckedChange={setShowBoundingBoxes} 
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="labels">Show Labels</Label>
                  <Switch 
                    id="labels" 
                    checked={showLabels} 
                    onCheckedChange={setShowLabels}
                  />
                </div>
              </div>

              <Separator />

              {/* Detected objects */}
              <div className="space-y-2">
                <h3 className="font-medium">Detected Objects</h3>
                {isDetecting ? (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {mockDetections.map((detection, index) => (
                      <div key={index} className="flex items-center justify-between bg-secondary p-2 rounded-md">
                        <span>{detection.label}</span>
                        <span className="text-sm px-2 py-1 rounded bg-laxnar-primary/20 text-laxnar-primary">
                          {Math.round(detection.confidence * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Start detection to see results
                  </p>
                )}
              </div>

              {/* Notes */}
              <div className="bg-secondary/50 p-3 rounded-md mt-6">
                <p className="text-xs text-muted-foreground">
                  Note: This is a demo interface. In a production environment, YOLOv5 model would be 
                  loaded and processing the webcam feed in real-time.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ObjectDetector;
