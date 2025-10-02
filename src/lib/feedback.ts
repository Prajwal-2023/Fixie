export interface FeedbackData {
  ticket_id: string;
  issue: string;
  resolution: string;
  status: "Worked" | "Routed";
  timestamp: string;
  confidence_before: number;
  agent_notes?: string;
}

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

// Local storage key
export const FEEDBACK_STORAGE_KEY = "fixie-feedback-data";

// Initialize feedback storage
export const initializeFeedbackStorage = (): AnalyticsData => {
  const stored = localStorage.getItem(FEEDBACK_STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  
  const initialData: AnalyticsData = {
    total_tickets: 0,
    worked_count: 0,
    routed_count: 0,
    success_rate: 0,
    top_working_resolutions: [],
    trending_issues: [],
    tickets: []
  };
  
  localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(initialData));
  return initialData;
};

// Save feedback
export const saveFeedback = (feedback: Omit<FeedbackData, "timestamp">): void => {
  const data = initializeFeedbackStorage();
  
  const newFeedback: FeedbackData = {
    ...feedback,
    timestamp: new Date().toISOString()
  };
  
  data.tickets.push(newFeedback);
  data.total_tickets += 1;
  
  if (feedback.status === "Worked") {
    data.worked_count += 1;
  } else {
    data.routed_count += 1;
  }
  
  data.success_rate = data.total_tickets > 0 ? (data.worked_count / data.total_tickets) * 100 : 0;
  
  // Update analytics
  updateAnalytics(data);
  
  localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(data));
};

// Update analytics calculations
const updateAnalytics = (data: AnalyticsData): void => {
  // Calculate top working resolutions
  const resolutionStats = new Map<string, { worked: number; total: number }>();
  
  data.tickets.forEach(ticket => {
    const key = ticket.resolution.substring(0, 100); // Truncate for grouping
    const stats = resolutionStats.get(key) || { worked: 0, total: 0 };
    stats.total += 1;
    if (ticket.status === "Worked") {
      stats.worked += 1;
    }
    resolutionStats.set(key, stats);
  });
  
  data.top_working_resolutions = Array.from(resolutionStats.entries())
    .map(([resolution, stats]) => ({
      resolution,
      count: stats.worked,
      success_rate: (stats.worked / stats.total) * 100
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  // Calculate trending issues (last 7 days)
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const issueStats = new Map<string, { total: number; recent: number }>();
  
  data.tickets.forEach(ticket => {
    const ticketDate = new Date(ticket.timestamp);
    const issue = ticket.issue.substring(0, 50); // Truncate for grouping
    const stats = issueStats.get(issue) || { total: 0, recent: 0 };
    stats.total += 1;
    if (ticketDate >= sevenDaysAgo) {
      stats.recent += 1;
    }
    issueStats.set(issue, stats);
  });
  
  data.trending_issues = Array.from(issueStats.entries())
    .map(([issue, stats]) => ({
      issue,
      count: stats.total,
      recent_count: stats.recent
    }))
    .sort((a, b) => b.recent_count - a.recent_count)
    .slice(0, 10);
};

// Get analytics data
export const getAnalyticsData = (): AnalyticsData => {
  return initializeFeedbackStorage();
};

// Export to CSV
export const exportToCSV = (): string => {
  const data = getAnalyticsData();
  const headers = ["Ticket ID", "Issue", "Resolution", "Status", "Timestamp", "Agent Notes"];
  const rows = data.tickets.map(ticket => [
    ticket.ticket_id,
    `"${ticket.issue.replace(/"/g, '""')}"`,
    `"${ticket.resolution.replace(/"/g, '""')}"`,
    ticket.status,
    ticket.timestamp,
    `"${(ticket.agent_notes || "").replace(/"/g, '""')}"`
  ]);
  
  return [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
};
