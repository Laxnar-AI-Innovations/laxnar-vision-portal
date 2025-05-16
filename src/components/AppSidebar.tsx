
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import LaxnarLogo from './LaxnarLogo';
import { cn } from '@/lib/utils';
import { 
  Sidebar, 
  SidebarContent,
  SidebarGroup, 
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar';
import { Webcam } from 'lucide-react';

const navItems = [
  {
    title: "Object Detector",
    icon: Webcam,
    path: "/object-detector",
  },
  // More AI models will be added here
];

const AppSidebar = () => {
  const location = useLocation();

  return (
    <Sidebar>
      <SidebarContent className="pt-5 pb-10">
        {/* Logo Header */}
        <div className="px-6 mb-8">
          <LaxnarLogo />
        </div>
        
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground text-xs uppercase">
            AI Models
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link 
                      to={item.path}
                      className={cn(
                        location.pathname === item.path ? 'text-laxnar-primary bg-sidebar-accent' : 'text-sidebar-foreground'
                      )}
                    >
                      <item.icon size={20} />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <div className="px-6 mt-auto pt-8">
          <div className="p-4 rounded-lg border border-laxnar-primary/30 bg-laxnar-dark/50">
            <h4 className="font-medium text-sm text-laxnar-primary mb-2">Coming Soon</h4>
            <p className="text-xs text-muted-foreground">
              More AI models will be added to this portal. Stay tuned!
            </p>
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;
