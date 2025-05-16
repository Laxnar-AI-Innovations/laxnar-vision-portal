import * as onnx from 'onnxruntime-web';

// YOLOv5 model configuration
const modelConfig = {
  modelUrl: '/models/yolov5s.onnx',  // Path where the model will be stored
  inputShape: [1, 3, 640, 640],      // Standard YOLOv5 input shape [batch, channels, height, width]
  scoreThreshold: 0.45,              // Default confidence threshold
  iouThreshold: 0.45,                // Default IOU threshold for NMS
  classNames: [
    'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat', 
    'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat', 
    'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe', 'backpack', 
    'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee', 'skis', 'snowboard', 'sports ball', 
    'kite', 'baseball bat', 'baseball glove', 'skateboard', 'surfboard', 'tennis racket', 
    'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple', 
    'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair', 
    'couch', 'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop', 'mouse', 'remote', 
    'keyboard', 'cell phone', 'microwave', 'oven', 'toaster', 'sink', 'refrigerator', 'book', 
    'clock', 'vase', 'scissors', 'teddy bear', 'hair drier', 'toothbrush'
  ]
};

// Detection result type
export interface DetectionResult {
  box: [number, number, number, number]; // [x, y, width, height]
  label: string;
  confidence: number;
  color?: string;
}

class YOLOv5Service {
  private session: onnx.InferenceSession | null = null;
  private modelLoading: boolean = false;
  private modelLoaded: boolean = false;
  private colors: string[] = [];

  constructor() {
    // Generate random colors for each class (for visualization)
    for (let i = 0; i < modelConfig.classNames.length; i++) {
      this.colors.push(this.getRandomColor());
    }
  }

  // Load the YOLOv5 ONNX model
  async loadModel(): Promise<boolean> {
    if (this.modelLoaded) return true;
    if (this.modelLoading) return false;

    try {
      this.modelLoading = true;
      
      console.log('Loading YOLOv5 model...');
      
      // Set up ONNX runtime environment
      // Fix: Use the correct property names for wasmPaths
      const wasmPath = '/node_modules/onnxruntime-web/dist';
      onnx.env.wasm.wasmPaths = {
        'ort-wasm.wasm': `${wasmPath}/ort-wasm.wasm`,
        'ort-wasm-threaded.wasm': `${wasmPath}/ort-wasm-threaded.wasm`,
        'ort-wasm-simd.wasm': `${wasmPath}/ort-wasm-simd.wasm`,
        'ort-wasm-simd-threaded.wasm': `${wasmPath}/ort-wasm-simd-threaded.wasm`,
      };
      
      // Try to use WebGL backend for better performance
      const options = {
        executionProviders: ['webgl'],
        graphOptimizationLevel: 'all',
      };
      
      // Create inference session with binary data instead of URL
      // Fix: Fetch the model data as ArrayBuffer and create the session with it
      const modelResponse = await fetch(modelConfig.modelUrl);
      if (!modelResponse.ok) {
        throw new Error(`Failed to fetch model: ${modelResponse.status} ${modelResponse.statusText}`);
      }
      
      const modelArrayBuffer = await modelResponse.arrayBuffer();
      const modelData = new Uint8Array(modelArrayBuffer);
      
      this.session = await onnx.InferenceSession.create(modelData, options);
      
      this.modelLoaded = true;
      this.modelLoading = false;
      console.log('YOLOv5 model loaded successfully');
      return true;
    } catch (error) {
      this.modelLoading = false;
      console.error('Failed to load YOLOv5 model:', error);
      throw new Error(`Failed to load YOLOv5 model: ${error}`);
    }
  }

  // Check if the model is loaded
  isModelLoaded(): boolean {
    return this.modelLoaded;
  }

  // Process input image for the model
  private async preprocess(imageData: ImageData): Promise<Float32Array> {
    const [batch, channels, height, width] = modelConfig.inputShape;
    const inputData = new Float32Array(batch * channels * height * width);
    
    const imgData = imageData.data;
    const imgWidth = imageData.width;
    const imgHeight = imageData.height;
    
    // Resize and normalize image (0-255 to 0-1)
    const resizeRatio = Math.min(
      width / imgWidth,
      height / imgHeight
    );
    
    const resizedWidth = Math.floor(imgWidth * resizeRatio);
    const resizedHeight = Math.floor(imgHeight * resizeRatio);
    
    const offsetX = (width - resizedWidth) / 2;
    const offsetY = (height - resizedHeight) / 2;
    
    // Process each pixel - normalize and transpose from RGBA to RGB
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Calculate if this pixel is within the resized image area
        const isInside = 
          x >= offsetX && 
          x < offsetX + resizedWidth && 
          y >= offsetY && 
          y < offsetY + resizedHeight;
        
        if (isInside) {
          // Calculate corresponding position in the original image
          const origX = Math.floor((x - offsetX) / resizeRatio);
          const origY = Math.floor((y - offsetY) / resizeRatio);
          
          const origPos = (origY * imgWidth + origX) * 4; // RGBA (4 channels)
          
          // YOLO expects RGB channels normalized to 0-1
          const r = imgData[origPos] / 255.0;
          const g = imgData[origPos + 1] / 255.0;
          const b = imgData[origPos + 2] / 255.0;
          
          // Store in planar format (NCHW) expected by ONNX runtime
          inputData[0 * height * width + y * width + x] = r;
          inputData[1 * height * width + y * width + x] = g;
          inputData[2 * height * width + y * width + x] = b;
        } else {
          // Fill padding area with zeros
          inputData[0 * height * width + y * width + x] = 0;
          inputData[1 * height * width + y * width + x] = 0;
          inputData[2 * height * width + y * width + x] = 0;
        }
      }
    }
    
    return inputData;
  }

  // Convert YOLOv5 output to bounding boxes
  private async postprocess(
    output: any, 
    imgWidth: number, 
    imgHeight: number,
    confidenceThreshold: number = modelConfig.scoreThreshold
  ): Promise<DetectionResult[]> {
    if (!output || !output.length) return [];
    
    const results: DetectionResult[] = [];
    const [modelHeight, modelWidth] = [modelConfig.inputShape[2], modelConfig.inputShape[3]];
    
    // YOLOv5 output is typically a tensor of shape [batch, num_detections, 5+num_classes]
    // where each detection is [x, y, width, height, confidence, class_scores...]
    const predictions = output[0].data;
    const numDetections = output[0].dims[1];
    const dimensions = output[0].dims[2]; // 5 + num_classes
    
    for (let i = 0; i < numDetections; i++) {
      const baseOffset = i * dimensions;
      const confidence = predictions[baseOffset + 4];
      
      if (confidence > confidenceThreshold) {
        // Find class with highest score
        let maxClassScore = 0;
        let maxClassIndex = 0;
        
        for (let j = 5; j < dimensions; j++) {
          const score = predictions[baseOffset + j];
          if (score > maxClassScore) {
            maxClassScore = score;
            maxClassIndex = j - 5;
          }
        }
        
        const combinedScore = confidence * maxClassScore;
        
        if (combinedScore > confidenceThreshold) {
          // Get normalized coordinates (0-1) from model output
          let x = predictions[baseOffset];
          let y = predictions[baseOffset + 1];
          let width = predictions[baseOffset + 2];
          let height = predictions[baseOffset + 3];
          
          // Convert to actual coordinates
          const imageScaleX = imgWidth / modelWidth;
          const imageScaleY = imgHeight / modelHeight;
          
          x = x * modelWidth * imageScaleX;
          y = y * modelHeight * imageScaleY;
          width = width * modelWidth * imageScaleX;
          height = height * modelHeight * imageScaleY;
          
          // Convert center coordinates to top-left for drawing rectangle
          const left = x - width / 2;
          const top = y - height / 2;
          
          results.push({
            box: [left, top, width, height],
            label: modelConfig.classNames[maxClassIndex],
            confidence: combinedScore,
            color: this.colors[maxClassIndex],
          });
        }
      }
    }
    
    // Apply non-maximum suppression (simplified version)
    return this.nonMaxSuppression(results, modelConfig.iouThreshold);
  }

  // Non-maximum suppression to remove overlapping bounding boxes
  private nonMaxSuppression(boxes: DetectionResult[], iouThreshold: number): DetectionResult[] {
    const selectedBoxes: DetectionResult[] = [];
    
    // Sort boxes by confidence score (highest first)
    boxes.sort((a, b) => b.confidence - a.confidence);
    
    const isSelected = new Array(boxes.length).fill(false);
    
    for (let i = 0; i < boxes.length; i++) {
      if (isSelected[i]) continue;
      
      selectedBoxes.push(boxes[i]);
      isSelected[i] = true;
      
      const box1 = boxes[i].box;
      
      for (let j = i + 1; j < boxes.length; j++) {
        if (isSelected[j]) continue;
        
        const box2 = boxes[j].box;
        
        // Only perform IoU for boxes of same class
        if (boxes[i].label === boxes[j].label) {
          const iou = this.calculateIoU(box1, box2);
          if (iou > iouThreshold) {
            isSelected[j] = true;
          }
        }
      }
    }
    
    return selectedBoxes;
  }

  // Calculate Intersection over Union for two bounding boxes
  private calculateIoU(box1: [number, number, number, number], box2: [number, number, number, number]): number {
    // Convert [x, y, width, height] to [x1, y1, x2, y2]
    const [x1, y1, w1, h1] = box1;
    const [x2, y2, w2, h2] = box2;
    
    const box1Right = x1 + w1;
    const box1Bottom = y1 + h1;
    const box2Right = x2 + w2;
    const box2Bottom = y2 + h2;
    
    // Calculate intersection area
    const intersectLeft = Math.max(x1, x2);
    const intersectTop = Math.max(y1, y2);
    const intersectRight = Math.min(box1Right, box2Right);
    const intersectBottom = Math.min(box1Bottom, box2Bottom);
    
    if (intersectRight < intersectLeft || intersectBottom < intersectTop) {
      return 0; // No intersection
    }
    
    const intersectArea = (intersectRight - intersectLeft) * (intersectBottom - intersectTop);
    
    // Calculate union area
    const box1Area = w1 * h1;
    const box2Area = w2 * h2;
    const unionArea = box1Area + box2Area - intersectArea;
    
    return intersectArea / unionArea;
  }

  // Run inference on the input image
  async detect(
    imageData: ImageData, 
    confidenceThreshold?: number
  ): Promise<DetectionResult[]> {
    if (!this.modelLoaded) {
      await this.loadModel();
    }
    
    // Preprocess the image
    const preprocessedData = await this.preprocess(imageData);
    
    // Create input tensor
    const inputTensor = new onnx.Tensor(
      'float32',
      preprocessedData,
      modelConfig.inputShape
    );
    
    // Run inference
    const feeds = { images: inputTensor };
    const outputData = await this.session!.run(feeds);
    
    // Get the model output - name might be different based on the YOLOv5 export
    // Common output names: output, output0, predictions, etc.
    const output = Object.values(outputData);
    
    // Postprocess results
    const detections = await this.postprocess(
      output,
      imageData.width,
      imageData.height,
      confidenceThreshold || modelConfig.scoreThreshold
    );
    
    return detections;
  }
  
  // Generate a random color for visualization
  private getRandomColor(): string {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }
}

// Create and export a singleton instance
const yolov5Service = new YOLOv5Service();
export default yolov5Service;
