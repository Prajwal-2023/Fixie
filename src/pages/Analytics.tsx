import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Download, 
  Search, 
  TrendingUp, 
  CheckCircle, 
  XCircle, 
  BarChart3,
  Filter,
  Calendar,
  ArrowLeft,
  Home
} from "lucide-react";
import { toast } from "sonner";
import { FeedbackData } from "@/components/FeedbackForm";

export interface AnalyticsData {
  total_tickets: number;
  worked_count: number;
  routed_count: number;
  success_rate: number;
  top_working_resolutions: Array<{
    resolution: string;
    count: number;
    success_rate: number;
  }>;
  trending_issues: Array<{
    issue: string;
    count: number;
    recent_count: number;
  }>;
  tickets: FeedbackData[];
}
import { useNavigate } from "react-router-dom";

export function AnalyticsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Worked" | "Routed">("All");
  const [filteredTickets, setFilteredTickets] = useState<FeedbackData[]>([]);

  useEffect(() => {
    const loadData = () => {
      const savedFeedback = localStorage.getItem('fixie-feedback') || '[]';
      const tickets: FeedbackData[] = JSON.parse(savedFeedback);
      
      const total_tickets = tickets.length;
      const worked_count = tickets.filter(t => t.status === 'Worked').length;
      const routed_count = tickets.filter(t => t.status === 'Routed').length;
      const success_rate = total_tickets > 0 ? (worked_count / total_tickets) * 100 : 0;
      
      const analyticsData: AnalyticsData = {
        total_tickets,
        worked_count,
        routed_count,
        success_rate,
        top_working_resolutions: [],
        trending_issues: [],
        tickets
      };
      
      setData(analyticsData);
      setFilteredTickets(analyticsData.tickets);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!data) return;
    
    let filtered = data.tickets;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(ticket => 
        ticket.ticket_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.issue.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.resolution.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter !== "All") {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }
    
    setFilteredTickets(filtered);
  }, [data, searchTerm, statusFilter]);

  const handleExportCSV = async () => {
    try {
      const savedFeedback = localStorage.getItem('fixie-feedback') || '[]';
      const tickets: FeedbackData[] = JSON.parse(savedFeedback);
      
      const headers = ["ID", "Ticket ID", "Issue", "Resolution", "Status", "Date", "Confidence", "Agent Notes"];
      const rows = tickets.map(ticket => [
        ticket.id || "",
        ticket.ticket_id,
        `"${ticket.issue.replace(/"/g, '""')}"`,
        `"${ticket.resolution.replace(/"/g, '""')}"`,
        ticket.status,
        ticket.date,
        ticket.confidence.toString(),
        `"${(ticket.agent_notes || "").replace(/"/g, '""')}"`
      ]);
      
      const csvData = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fixie-analytics-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Analytics data exported to CSV");
    } catch (error) {
      toast.error("Failed to export data");
    }
  };

  if (!data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading analytics...</div>
      </div>
    );
  }

  const pieData = [
    { name: 'Worked', value: data.worked_count, color: '#22c55e' },
    { name: 'Routed', value: data.routed_count, color: '#f59e0b' }
  ];

  const trendingData = data.trending_issues.slice(0, 5).map(issue => ({
    name: issue.issue.substring(0, 30) + (issue.issue.length > 30 ? '...' : ''),
    total: issue.count,
    recent: issue.recent_count
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Fixie Analytics</h1>
                  <p className="text-xs text-muted-foreground">Resolution Performance Dashboard</p>
                </div>
              </div>
            </div>
            <Button onClick={handleExportCSV} className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.total_tickets}</p>
                <p className="text-sm text-muted-foreground">Total Tickets</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.worked_count}</p>
                <p className="text-sm text-muted-foreground">Resolved Successfully</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300">
                <XCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.routed_count}</p>
                <p className="text-sm text-muted-foreground">Escalated/Routed</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.success_rate.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Success Rate</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Success Rate Pie Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Resolution Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Trending Issues */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Trending Issues (Last 7 Days)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="recent" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  name="Recent Issues" 
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#94a3b8" 
                  strokeWidth={2}
                  name="Total Issues"
                  dot={{ fill: '#94a3b8', strokeWidth: 2, r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Top Working Resolutions */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Top Working Resolutions</h3>
          <div className="space-y-3">
            {data.top_working_resolutions.map((resolution, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium">{resolution.resolution.substring(0, 100)}...</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {resolution.count} successful resolutions • {resolution.success_rate.toFixed(1)}% success rate
                  </p>
                </div>
                <Badge variant="secondary">{resolution.count}</Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Tickets Table */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">All Tickets</h3>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <div className="flex gap-1">
                {["All", "Worked", "Routed"].map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter(status as "All" | "Worked" | "Routed")}
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Ticket ID</th>
                  <th className="text-left p-2">Issue</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-mono text-xs">{ticket.ticket_id}</td>
                    <td className="p-2 max-w-xs truncate">{ticket.issue}</td>
                    <td className="p-2">
                      <Badge 
                        variant={ticket.status === "Worked" ? "default" : "secondary"}
                        className={ticket.status === "Worked" ? "bg-green-600" : "bg-orange-600"}
                      >
                        {ticket.status}
                      </Badge>
                    </td>
                    <td className="p-2 text-muted-foreground">
                      {new Date(ticket.date).toLocaleDateString()}
                    </td>
                    <td className="p-2">{ticket.confidence}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  );
}
