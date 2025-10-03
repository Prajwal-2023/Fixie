import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme-provider";
import { EnhancedNavigation } from "@/components/EnhancedNavigation";
import Index from "./pages/Index";
import { AnalyticsPage } from "./pages/Analytics";
import { TicketsPage } from "./pages/TicketsPage";
import { UsersPage } from "./pages/UsersPage";
import { SettingsPage } from "./pages/SettingsPage";
import { realtimeService } from "@/services/realtime-service";

const queryClient = new QueryClient();

// Mock user data - in production, get from authentication
const mockUser = {
  id: 'user-123',
  name: 'John Doe',
  email: 'john.doe@company.com',
  role: 'admin' as const,
  avatar_url: undefined
};

const App = () => {
  const [currentPage, setCurrentPage] = useState('home');

  // Initialize real-time service
  useEffect(() => {
    realtimeService.initialize();
    
    return () => {
      realtimeService.disconnect();
    };
  }, []);

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return <Index />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'tickets':
        return <TicketsPage />;
      case 'users':
        return <UsersPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Index />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="fixie-ui-theme">
        <TooltipProvider>
          <div className="min-h-screen bg-background">
            <EnhancedNavigation 
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              user={mockUser}
            />
            
            {/* Main Content Area */}
            <div className="lg:pl-64">
              {renderCurrentPage()}
            </div>
          </div>
          
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
