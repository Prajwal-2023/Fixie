import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus, 
  Edit,
  Trash2,
  User,
  Mail,
  Shield,
  Clock,
  MoreHorizontal
} from 'lucide-react';
import { User as UserType } from '@/types/enhanced-types';

// Mock users data
const mockUsers: UserType[] = [
  {
    id: '1',
    email: 'admin@company.com',
    name: 'Admin User',
    role: 'admin',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    email: 'agent@company.com',
    name: 'Support Agent',
    role: 'agent',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    email: 'user@company.com',
    name: 'Regular User',
    role: 'user',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export function UsersPage() {
  const [users] = useState<UserType[]>(mockUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'agent' | 'user'>('all');

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchQuery === '' || 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500';
      case 'agent': return 'bg-blue-500';
      case 'user': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'agent': return 'default';
      case 'user': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground">Manage user accounts and permissions</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as 'all' | 'admin' | 'agent' | 'user')}
              className="px-3 py-2 border rounded-md bg-background text-sm"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="agent">Agent</option>
              <option value="user">User</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Users Grid */}
      <div className="grid gap-4">
        {filteredUsers.map(user => (
          <Card key={user.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.name} className="rounded-full" />
                    ) : (
                      <User className="h-6 w-6 text-primary-foreground" />
                    )}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{user.name}</h3>
                      <Badge variant={getRoleBadgeVariant(user.role) as 'destructive' | 'default' | 'secondary' | 'outline'}>
                        <Shield className="h-3 w-3 mr-1" />
                        {user.role}
                      </Badge>
                      {!user.is_active && (
                        <Badge variant="outline" className="text-red-600">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {user.email}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Joined {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stats */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-red-600">
                {users.filter(u => u.role === 'admin').length}
              </div>
              <div className="text-sm text-muted-foreground">Admins</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {users.filter(u => u.role === 'agent').length}
              </div>
              <div className="text-sm text-muted-foreground">Agents</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {users.filter(u => u.role === 'user').length}
              </div>
              <div className="text-sm text-muted-foreground">Users</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {users.filter(u => u.is_active).length}
              </div>
              <div className="text-sm text-muted-foreground">Active</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
