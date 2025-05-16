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
import { Camera, Download, Play, Pause, AlertTriangle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useObjectDetection } from '@/hooks/useObjectDetection';

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
  
  // Use our custom hook for object detection
  const { detections, isModelLoaded, isModelLoading, modelLoadError } = useObjectDetection({
    videoRef,
    canvasRef,
    isDetecting,
    confidenceThreshold,
    showBoundingBoxes,
    showLabels,
    detectionInterval
  });

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

  // Stop object detection
  const stopDetection = () => {
    setIsDetecting(false);
    toast.info("Object detection stopped");
  };

  // Download YOLOv5 model
  const downloadModel = async () => {
    toast.info("Downloading YOLOv5 model...");
    
    try {
      // Use the custom model from Google Drive
      const googleDriveURL = "https://drive.google.com/file/d/1boXFc76v6kiEQM43m_qdIXbgnU1jhBV5/view?usp=drive_link";
      
      // Convert Google Drive link to a direct download link
      const fileId = googleDriveURL.match(/\/d\/(.+?)\//)![1];
      const directURL = `https://drive.google.com/uc?export=download&id=${fileId}`;
      
      toast.info("Preparing download from Google Drive...");
      
      // Create a download link for the model
      const a = document.createElement('a');
      a.href = directURL;
      a.download = 'yolov5s.onnx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast.success("YOLOv5 model download initiated.", { duration: 5000 });
      toast.info(
        "Important: Place the downloaded model file in your project's 'public/models/' directory, then refresh the page.", 
        { duration: 10000 }
      );
    } catch (error) {
      console.error("Error downloading model:", error);
      toast.error(`Failed to download YOLOv5 model: ${error}`);
    }
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
                <div className="flex gap-2">
                  {!isModelLoaded && (
                    <Button 
                      onClick={downloadModel} 
                      className="bg-laxnar-primary hover:bg-laxnar-primary/90"
                      disabled={isModelLoading}
                    >
                      <Download size={18} className="mr-2" />
                      {isModelLoading ? "Loading Model..." : "Download Custom Model"}
                    </Button>
                  )}
                  <Button 
                    onClick={toggleDetection} 
                    className={isDetecting ? "bg-red-500 hover:bg-red-600" : "bg-laxnar-primary hover:bg-laxnar-primary/90"}
                    disabled={!isModelLoaded || !webcamActive}
                  >
                    {isDetecting ? (
                      <>
                        <Pause size={18} className="mr-2" />
                        Stop Detection
                      </>
                    ) : (
                      <>
                        <Play size={18} className="mr-2" />
                        Start Detection
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-1 bg-black rounded-md overflow-hidden relative">
              {modelLoadError && !webcamActive && (
                <div className="absolute top-0 right-0 left-0 bg-red-500/90 text-white px-4 py-2 flex items-center gap-2">
                  <AlertTriangle size={18} />
                  <span className="text-sm">Model loading error: Please download and place the model in public/models/</span>
                </div>
              )}
              
              {!webcamActive ? (
                <div className="flex flex-col items-center justify-center h-[480px] w-full">
                  <Camera size={48} className="text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Webcam access required</p>
                  <Button onClick={startWebcam} variant="outline" className="mt-4">
                    Enable Webcam
                  </Button>
                  
                  {modelLoadError && (
                    <div className="mt-6 bg-red-500/20 p-4 rounded-md max-w-md text-center">
                      <AlertTriangle className="mx-auto mb-2 text-red-500" size={24} />
                      <p className="text-sm text-red-500 font-medium">Model loading error</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {modelLoadError}
                      </p>
                      <div className="mt-4">
                        <Button variant="outline" onClick={downloadModel} size="sm">
                          Download Custom Model
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="relative w-full h-full">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-[480px] object-contain hidden"
                      style={{ display: "none" }}
                    />
                    <canvas
                      ref={canvasRef}
                      className="w-full h-[480px] object-contain"
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
              {/* Model status */}
              <div className="bg-secondary/50 p-3 rounded-md">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">YOLOv5 Model:</span>
                  <span className={`text-sm px-2 py-1 rounded ${isModelLoaded ? 'bg-green-500/20 text-green-500' : modelLoadError ? 'bg-red-500/20 text-red-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                    {isModelLoaded ? 'Loaded' : isModelLoading ? 'Loading...' : modelLoadError ? 'Error' : 'Not Loaded'}
                  </span>
                </div>
              </div>

              {/* Instructions for custom model */}
              <div className="bg-blue-500/10 p-3 rounded-md border border-blue-500/20">
                <h3 className="font-medium text-sm text-blue-500 mb-1">Custom Model Instructions</h3>
                <ol className="list-decimal list-inside text-xs text-muted-foreground space-y-1">
                  <li>Click "Download Custom Model" button</li>
                  <li>Save the downloaded file as "yolov5s.onnx"</li>
                  <li>Place the file in your "public/models/" folder</li>
                  <li>Refresh the page to load the model</li>
                </ol>
              </div>

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
                {isDetecting && detections.length > 0 ? (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {detections.map((detection, index) => (
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
                    {isDetecting ? "No objects detected" : "Start detection to see results"}
                  </p>
                )}
              </div>

              {/* Instructions */}
              <div className="bg-secondary/50 p-3 rounded-md mt-6">
                <p className="text-xs text-muted-foreground">
                  To use YOLOv5 model:
                  <ol className="list-decimal list-inside mt-1">
                    <li>Download the model using the button above</li>
                    <li>Place the model in the 'public/models/' folder</li>
                    <li>Refresh the page to apply changes</li>
                  </ol>
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
