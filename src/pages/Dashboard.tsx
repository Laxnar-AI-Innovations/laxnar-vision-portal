
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LaxnarLogo from '@/components/LaxnarLogo';
import { useNavigate } from 'react-router-dom';
import { Webcam } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  
  const aiModels = [
    {
      id: 1,
      title: "Object Detector",
      description: "Real-time object detection using YOLOv5",
      icon: <Webcam size={24} />,
      path: "/object-detector",
      active: true,
    },
    {
      id: 2,
      title: "Image Segmentation",
      description: "Pixel-level image segmentation",
      icon: <Webcam size={24} />,
      path: "#",
      active: false,
    },
    {
      id: 3,
      title: "Pose Estimation",
      description: "Human pose detection and tracking",
      icon: <Webcam size={24} />,
      path: "#",
      active: false,
    },
    {
      id: 4,
      title: "Face Recognition",
      description: "Advanced facial recognition system",
      icon: <Webcam size={24} />,
      path: "#",
      active: false,
    },
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col items-center justify-center mb-12">
        <div className="relative">
          <div className="absolute -z-10 h-40 w-40 rounded-full bg-laxnar-primary/20 blur-3xl"></div>
          <LaxnarLogo size="lg" />
        </div>
        <h1 className="text-4xl font-bold mt-6 text-center">Advanced AI Models Portal</h1>
        <p className="text-muted-foreground mt-2 text-center max-w-xl">
          Explore our collection of state-of-the-art AI models for computer vision and beyond
        </p>
      </div>

      {/* AI Models Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        {aiModels.map((model) => (
          <Card 
            key={model.id}
            className={`model-card relative overflow-hidden ${
              model.active 
                ? 'border-laxnar-primary/40 hover:border-laxnar-primary cursor-pointer'
                : 'opacity-60 cursor-not-allowed'
            }`}
            onClick={() => model.active && navigate(model.path)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-md bg-laxnar-primary/10 text-laxnar-primary">
                  {model.icon}
                </div>
                {!model.active && (
                  <span className="px-2 py-1 text-xs rounded bg-muted text-muted-foreground">
                    Coming Soon
                  </span>
                )}
              </div>
              <CardTitle className="mt-3">{model.title}</CardTitle>
              <CardDescription>{model.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {model.active ? (
                <div className="flex items-center text-sm text-laxnar-primary">
                  <span>Explore Model</span>
                  <svg className="ml-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              ) : (
                <div className="flex items-center text-sm text-muted-foreground">
                  <span>In Development</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Footer Info */}
      <div className="text-center mt-16 text-sm text-muted-foreground">
        <p>Powered by Laxnar.ai - Advanced AI Solutions</p>
      </div>
    </div>
  );
};

export default Dashboard;
