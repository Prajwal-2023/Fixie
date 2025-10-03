// Enhanced types for all new features
export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  theme_color: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  role: 'admin' | 'agent' | 'user';
  organization_id?: string;
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
  organization?: Organization;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  category?: string;
  tags: string[];
  author_id?: string;
  organization_id?: string;
  is_published: boolean;
  view_count: number;
  helpful_count: number;
  not_helpful_count: number;
  created_at: string;
  updated_at: string;
  author?: User;
}

export interface EnhancedTicket {
  id: string;
  ticket_id: string;
  issue: string;
  resolution: string;
  confidence: number;
  status: 'Worked' | 'Routed';
  date: string;
  created_at: string;
  
  // New enhanced fields
  organization_id?: string;
  assigned_to?: string;
  created_by?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  sla_due_at?: string;
  resolved_at?: string;
  tags: string[];
  custom_fields: Record<string, string | number | boolean>;
  attachments: TicketAttachment[];
  sentiment_score?: number;
  ai_category?: string;
  estimated_resolution_time?: number;
  
  // Relations
  organization?: Organization;
  assignee?: User;
  creator?: User;
  comments?: TicketComment[];
}

export interface TicketComment {
  id: string;
  ticket_id: string;
  user_id?: string;
  content: string;
  is_internal: boolean;
  attachments: TicketAttachment[];
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface TicketAttachment {
  id: string;
  filename: string;
  url: string;
  size: number;
  type: string;
  uploaded_at: string;
}

export interface TicketTemplate {
  id: string;
  name: string;
  description?: string;
  template_data: {
    issue?: string;
    priority?: string;
    tags?: string[];
    custom_fields?: Record<string, string | number | boolean>;
  };
  organization_id?: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
}

export interface SLAPolicy {
  id: string;
  name: string;
  organization_id?: string;
  conditions: Record<string, string | number | boolean>;
  response_time_minutes?: number;
  resolution_time_minutes?: number;
  is_active: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  action_url?: string;
  created_at: string;
}

export interface AnalyticsEvent {
  id: string;
  organization_id?: string;
  event_type: string;
  event_data: Record<string, unknown>;
  user_id?: string;
  session_id?: string;
  created_at: string;
}

export interface AdvancedAnalytics {
  total_tickets: number;
  worked_count: number;
  routed_count: number;
  success_rate: number;
  
  // Enhanced analytics
  average_resolution_time: number;
  sla_compliance_rate: number;
  tickets_by_priority: Record<string, number>;
  tickets_by_category: Record<string, number>;
  agent_performance: Array<{
    agent_id: string;
    agent_name: string;
    tickets_resolved: number;
    avg_resolution_time: number;
    satisfaction_score: number;
  }>;
  sentiment_analysis: {
    positive: number;
    neutral: number;
    negative: number;
  };
  trending_issues: Array<{
    issue: string;
    count: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  predictive_insights: {
    expected_volume_next_week: number;
    high_risk_tickets: string[];
    recommended_actions: string[];
  };
}

export interface SearchFilters {
  query?: string;
  status?: string[];
  priority?: string[];
  assigned_to?: string[];
  created_by?: string[];
  tags?: string[];
  date_range?: {
    start: string;
    end: string;
  };
  custom_fields?: Record<string, string | number | boolean>;
}

export interface RealtimeEvent {
  type: 'ticket_created' | 'ticket_updated' | 'ticket_assigned' | 'comment_added' | 'notification';
  data: unknown;
  timestamp: string;
  user_id?: string;
  organization_id?: string;
}

export interface IntegrationConfig {
  type: 'slack' | 'email' | 'teams' | 'webhook';
  name: string;
  config: Record<string, unknown>;
  is_active: boolean;
  organization_id?: string;
}

export interface AIInsight {
  type: 'category_suggestion' | 'resolution_suggestion' | 'similar_tickets' | 'sentiment_analysis';
  confidence: number;
  data: unknown;
  generated_at: string;
}
