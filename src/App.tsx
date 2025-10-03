import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { EnhancedNavigation } from "@/components/EnhancedNavigation";
import Index from "./pages/Index";
import { AnalyticsPage } from "./pages/Analytics";
import { TicketsPage } from "@/pages/TicketsPage";
import { UsersPage } from "@/pages/UsersPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { realtimeService } from "@/services/realtime-service";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="fixie-ui-theme">
        <AuthProvider>
          <TooltipProvider>
            <ProtectedRoute>
              <MainApp />
            </ProtectedRoute>
            <Toaster />
            <Sonner />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

// Main authenticated app component
const MainApp = () => {
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
        return (
          <ProtectedRoute requireRole="agent">
            <UsersPage />
          </ProtectedRoute>
        );
      case 'settings':
        return (
          <ProtectedRoute requireRole="admin">
            <SettingsPage />
          </ProtectedRoute>
        );
      default:
        return <Index />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <EnhancedNavigation 
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
      
      {/* Main Content Area */}
      <div className="lg:pl-64">
        {renderCurrentPage()}
      </div>
    </div>
  );
};

export default App;
