import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Home, 
  BarChart3, 
  BookOpen, 
  Settings, 
  Users, 
  Ticket,
  MessageSquare,
  Calendar,
  Search,
  Plus,
  Moon,
  Sun,
  Menu,
  X,
  Bell,
  User,
  Zap
} from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import { NotificationSystem } from '@/components/NotificationSystem';
import { KnowledgeBase } from '@/components/KnowledgeBase';
import { realtimeService } from '@/services/realtime-service';

interface EnhancedNavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  user?: {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'agent' | 'user';
    avatar_url?: string;
  };
}

export function EnhancedNavigation({ currentPage, onPageChange, user }: EnhancedNavigationProps) {
  const { theme, setTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [showKnowledgeBase, setShowKnowledgeBase] = useState(false);

  // Initialize real-time connection
  useEffect(() => {
    realtimeService.initialize();
    
    // Check connection status periodically
    const interval = setInterval(() => {
      setIsConnected(realtimeService.getConnectionStatus());
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const navigationItems = [
    {
      id: 'home',
      label: 'Smart Assistant',
      icon: Home,
      description: 'Submit new tickets',
      roles: ['admin', 'agent', 'user']
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      description: 'Performance dashboard',
      roles: ['admin', 'agent']
    },
    {
      id: 'tickets',
      label: 'Tickets',
      icon: Ticket,
      description: 'Manage tickets',
      roles: ['admin', 'agent']
    },
    {
      id: 'knowledge-base',
      label: 'Knowledge Base',
      icon: BookOpen,
      description: 'Help articles',
      roles: ['admin', 'agent', 'user']
    },
    {
      id: 'users',
      label: 'Users',
      icon: Users,
      description: 'User management',
      roles: ['admin']
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      description: 'System settings',
      roles: ['admin']
    }
  ];

  // Filter navigation items based on user role
  const visibleItems = navigationItems.filter(item => 
    !user || item.roles.includes(user.role)
  );

  const handleNavigation = (pageId: string) => {
    if (pageId === 'knowledge-base') {
      setShowKnowledgeBase(true);
    } else {
      setShowKnowledgeBase(false);
      onPageChange(pageId);
    }
    setIsMobileMenuOpen(false);
  };

  if (showKnowledgeBase) {
    return (
      <KnowledgeBase onBack={() => setShowKnowledgeBase(false)} />
    );
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:bg-background lg:border-r lg:border-border">
        <div className="flex flex-col h-full">
          {/* Logo/Brand */}
          <div className="flex items-center gap-3 p-6 border-b">
            <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
              <Zap className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Fixie Pro</h1>
              <p className="text-xs text-muted-foreground">Service Desk</p>
            </div>
          </div>

          {/* Connection Status */}
          <div className="px-6 py-3 border-b">
            <div className="flex items-center gap-2 text-xs">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-muted-foreground">
                {isConnected ? 'Connected' : 'Connecting...'}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="px-6 py-4 border-b">
            <Button size="sm" className="w-full mb-2" onClick={() => handleNavigation('home')}>
              <Plus className="h-4 w-4 mr-2" />
              New Ticket
            </Button>
            <Button variant="outline" size="sm" className="w-full">
              <Search className="h-4 w-4 mr-2" />
              Quick Search
            </Button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 px-4 py-4">
            <div className="space-y-2">
              {visibleItems.map(item => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? 'secondary' : 'ghost'}
                    className="w-full justify-start h-12"
                    onClick={() => handleNavigation(item.id)}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    <div className="flex-1 text-left">
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-muted-foreground">{item.description}</div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </nav>

          {/* User Profile & Settings */}
          <div className="p-4 border-t">
            {user && (
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.name} className="rounded-full" />
                  ) : (
                    <User className="h-4 w-4 text-primary-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{user.name}</div>
                  <div className="text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-xs">
                      {user.role}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              
              <NotificationSystem userId={user?.id} />
              
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">Fixie Pro</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <NotificationSystem userId={user?.id} />
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="fixed inset-y-0 left-0 w-80 bg-background border-r" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col h-full">
              {/* Mobile Menu Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                  <Zap className="h-6 w-6 text-primary" />
                  <span className="text-lg font-bold">Fixie Pro</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Mobile Navigation */}
              <nav className="flex-1 p-4">
                <div className="space-y-2">
                  {visibleItems.map(item => {
                    const Icon = item.icon;
                    const isActive = currentPage === item.id;
                    
                    return (
                      <Button
                        key={item.id}
                        variant={isActive ? 'secondary' : 'ghost'}
                        className="w-full justify-start h-12"
                        onClick={() => handleNavigation(item.id)}
                      >
                        <Icon className="h-5 w-5 mr-3" />
                        <div className="flex-1 text-left">
                          <div className="font-medium">{item.label}</div>
                          <div className="text-xs text-muted-foreground">{item.description}</div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </nav>

              {/* Mobile User Profile */}
              {user && (
                <div className="p-4 border-t">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.name} className="rounded-full" />
                      ) : (
                        <User className="h-5 w-5 text-primary-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{user.name}</div>
                      <div className="text-sm text-muted-foreground truncate">{user.email}</div>
                      <Badge variant="outline" className="text-xs mt-1">
                        {user.role}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
