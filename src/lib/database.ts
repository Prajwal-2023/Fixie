// IndexedDB wrapper for storing feedback data
export interface FeedbackData {
  id?: number;
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

class FeedbackDatabase {
  private dbName = 'FixieFeedbackDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create feedback store
        if (!db.objectStoreNames.contains('feedback')) {
          const store = db.createObjectStore('feedback', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          store.createIndex('ticket_id', 'ticket_id', { unique: false });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async saveFeedback(feedback: Omit<FeedbackData, 'id' | 'timestamp'>): Promise<void> {
    if (!this.db) await this.init();

    const feedbackWithTimestamp: Omit<FeedbackData, 'id'> = {
      ...feedback,
      timestamp: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['feedback'], 'readwrite');
      const store = transaction.objectStore('feedback');
      const request = store.add(feedbackWithTimestamp);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllFeedback(): Promise<FeedbackData[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['feedback'], 'readonly');
      const store = transaction.objectStore('feedback');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAnalyticsData(): Promise<AnalyticsData> {
    const tickets = await this.getAllFeedback();
    
    const total_tickets = tickets.length;
    const worked_count = tickets.filter(t => t.status === 'Worked').length;
    const routed_count = tickets.filter(t => t.status === 'Routed').length;
    const success_rate = total_tickets > 0 ? (worked_count / total_tickets) * 100 : 0;

    // Calculate top working resolutions
    const resolutionStats = new Map<string, { worked: number; total: number }>();
    
    tickets.forEach(ticket => {
      const key = ticket.resolution.substring(0, 100); // Truncate for grouping
      const stats = resolutionStats.get(key) || { worked: 0, total: 0 };
      stats.total += 1;
      if (ticket.status === 'Worked') {
        stats.worked += 1;
      }
      resolutionStats.set(key, stats);
    });

    const top_working_resolutions = Array.from(resolutionStats.entries())
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
    
    tickets.forEach(ticket => {
      const ticketDate = new Date(ticket.timestamp);
      const issue = ticket.issue.substring(0, 50); // Truncate for grouping
      const stats = issueStats.get(issue) || { total: 0, recent: 0 };
      stats.total += 1;
      if (ticketDate >= sevenDaysAgo) {
        stats.recent += 1;
      }
      issueStats.set(issue, stats);
    });

    const trending_issues = Array.from(issueStats.entries())
      .map(([issue, stats]) => ({
        issue,
        count: stats.total,
        recent_count: stats.recent
      }))
      .sort((a, b) => b.recent_count - a.recent_count)
      .slice(0, 10);

    return {
      total_tickets,
      worked_count,
      routed_count,
      success_rate,
      top_working_resolutions,
      trending_issues,
      tickets
    };
  }

  async exportToCSV(): Promise<string> {
    const tickets = await this.getAllFeedback();
    const headers = ["ID", "Ticket ID", "Issue", "Resolution", "Status", "Timestamp", "Confidence", "Agent Notes"];
    const rows = tickets.map(ticket => [
      ticket.id?.toString() || "",
      ticket.ticket_id,
      `"${ticket.issue.replace(/"/g, '""')}"`,
      `"${ticket.resolution.replace(/"/g, '""')}"`,
      ticket.status,
      ticket.timestamp,
      ticket.confidence_before.toString(),
      `"${(ticket.agent_notes || "").replace(/"/g, '""')}"`
    ]);
    
    return [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
  }
}

// Create singleton instance
export const feedbackDB = new FeedbackDatabase();
