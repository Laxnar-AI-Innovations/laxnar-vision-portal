
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "./components/AppSidebar";
import Dashboard from "./pages/Dashboard";
import ObjectDetector from "./pages/ObjectDetector";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const MainLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-screen bg-background">
    <AppSidebar />
    <div className="flex-1">
      <div className="flex justify-between items-center p-4">
        <SidebarTrigger />
      </div>
      <main className="py-2">{children}</main>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SidebarProvider>
        <BrowserRouter>
          <Routes>
            <Route 
              path="/" 
              element={
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              } 
            />
            <Route 
              path="/object-detector" 
              element={
                <MainLayout>
                  <ObjectDetector />
                </MainLayout>
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
        <Sonner />
      </SidebarProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
