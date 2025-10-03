import { AIInsight, EnhancedTicket } from '@/types/enhanced-types';

/**
 * AI Service for intelligent ticket analysis and suggestions
 * This is a mock implementation - in production, you'd integrate with
 * OpenAI, Anthropic, or other AI services
 */
class AIService {
  private apiKey: string | null = null;

  constructor() {
    // In production, load from environment variables
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || null;
  }

  /**
   * Analyze sentiment of a ticket issue/description
   */
  async analyzeSentiment(text: string): Promise<{
    score: number; // -1 (negative) to 1 (positive)
    confidence: number;
    label: 'positive' | 'neutral' | 'negative';
  }> {
    // Mock implementation - replace with actual AI service
    const words = text.toLowerCase().split(' ');
    const positiveWords = ['good', 'great', 'excellent', 'working', 'solved', 'happy', 'thanks'];
    const negativeWords = ['bad', 'terrible', 'broken', 'error', 'failed', 'angry', 'frustrated'];
    
    let score = 0;
    words.forEach(word => {
      if (positiveWords.includes(word)) score += 0.1;
      if (negativeWords.includes(word)) score -= 0.1;
    });
    
    // Clamp score between -1 and 1
    score = Math.max(-1, Math.min(1, score));
    
    const label = score > 0.2 ? 'positive' : score < -0.2 ? 'negative' : 'neutral';
    
    return {
      score,
      confidence: Math.abs(score) * 0.8 + 0.2, // Mock confidence
      label
    };
  }

  /**
   * Categorize ticket automatically
   */
  async categorizeTicket(issue: string): Promise<AIInsight> {
    // Mock categorization logic
    const categories = [
      { name: 'Hardware', keywords: ['hardware', 'computer', 'laptop', 'screen', 'keyboard', 'mouse'] },
      { name: 'Software', keywords: ['software', 'application', 'program', 'install', 'update'] },
      { name: 'Network', keywords: ['network', 'internet', 'wifi', 'connection', 'email'] },
      { name: 'Password', keywords: ['password', 'login', 'access', 'account', 'authentication'] },
      { name: 'Printer', keywords: ['printer', 'print', 'scan', 'paper', 'toner'] },
    ];

    const issueLower = issue.toLowerCase();
    let bestMatch = { category: 'General', confidence: 0.3 };

    categories.forEach(category => {
      const matches = category.keywords.filter(keyword => 
        issueLower.includes(keyword)
      ).length;
      const confidence = Math.min(0.95, matches * 0.2 + 0.3);
      
      if (confidence > bestMatch.confidence) {
        bestMatch = { category: category.name, confidence };
      }
    });

    return {
      type: 'category_suggestion',
      confidence: bestMatch.confidence,
      data: {
        category: bestMatch.category,
        reasons: [`Keywords matched: ${bestMatch.category.toLowerCase()}`]
      },
      generated_at: new Date().toISOString()
    };
  }

  /**
   * Suggest resolution based on issue description
   */
  async suggestResolution(issue: string): Promise<AIInsight> {
    // Mock resolution suggestions
    const resolutionTemplates = [
      {
        keywords: ['password', 'login', 'access'],
        resolution: 'Reset user password through Active Directory. Verify account is not locked. Test login functionality.',
        confidence: 0.8
      },
      {
        keywords: ['printer', 'print'],
        resolution: 'Check printer connection and drivers. Clear print queue. Test with different document. Replace toner if necessary.',
        confidence: 0.75
      },
      {
        keywords: ['network', 'internet', 'wifi'],
        resolution: 'Test network connectivity. Check cables and WiFi connection. Restart network adapter. Contact ISP if issue persists.',
        confidence: 0.7
      },
      {
        keywords: ['software', 'application'],
        resolution: 'Restart the application. Check for updates. Reinstall if necessary. Verify system requirements.',
        confidence: 0.65
      }
    ];

    const issueLower = issue.toLowerCase();
    let bestMatch = {
      resolution: 'Investigate the reported issue. Gather additional information from the user. Apply appropriate troubleshooting steps.',
      confidence: 0.4
    };

    resolutionTemplates.forEach(template => {
      const matches = template.keywords.filter(keyword => 
        issueLower.includes(keyword)
      ).length;
      
      if (matches > 0) {
        const confidence = Math.min(0.9, template.confidence + (matches - 1) * 0.1);
        if (confidence > bestMatch.confidence) {
          bestMatch = { resolution: template.resolution, confidence };
        }
      }
    });

    return {
      type: 'resolution_suggestion',
      confidence: bestMatch.confidence,
      data: {
        suggested_resolution: bestMatch.resolution,
        estimated_time: this.estimateResolutionTime(issue)
      },
      generated_at: new Date().toISOString()
    };
  }

  /**
   * Find similar tickets
   */
  async findSimilarTickets(issue: string, existingTickets: EnhancedTicket[]): Promise<AIInsight> {
    // Simple similarity matching based on keywords
    const issueWords = issue.toLowerCase().split(' ').filter(word => word.length > 3);
    
    const similarities = existingTickets.map(ticket => {
      const ticketWords = ticket.issue.toLowerCase().split(' ').filter(word => word.length > 3);
      const commonWords = issueWords.filter(word => ticketWords.includes(word));
      const similarity = commonWords.length / Math.max(issueWords.length, ticketWords.length);
      
      return { ticket, similarity };
    });

    const similarTickets = similarities
      .filter(s => s.similarity > 0.3)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3)
      .map(s => ({
        ticket_id: s.ticket.ticket_id,
        issue: s.ticket.issue,
        resolution: s.ticket.resolution,
        similarity: s.similarity,
        status: s.ticket.status
      }));

    return {
      type: 'similar_tickets',
      confidence: similarTickets.length > 0 ? 0.8 : 0.2,
      data: {
        similar_tickets: similarTickets,
        count: similarTickets.length
      },
      generated_at: new Date().toISOString()
    };
  }

  /**
   * Estimate resolution time based on issue complexity
   */
  private estimateResolutionTime(issue: string): number {
    const issueLower = issue.toLowerCase();
    
    // Complex issues (hours)
    if (issueLower.includes('hardware') || issueLower.includes('install') || issueLower.includes('network')) {
      return 120; // 2 hours
    }
    
    // Medium issues (30-60 minutes)
    if (issueLower.includes('software') || issueLower.includes('application')) {
      return 45;
    }
    
    // Simple issues (15-30 minutes)
    if (issueLower.includes('password') || issueLower.includes('printer')) {
      return 20;
    }
    
    // Default
    return 30;
  }

  /**
   * Generate comprehensive AI insights for a ticket
   */
  async generateInsights(issue: string, existingTickets: EnhancedTicket[]): Promise<{
    sentiment: Awaited<ReturnType<typeof this.analyzeSentiment>>;
    category: AIInsight;
    resolution: AIInsight;
    similarTickets: AIInsight;
  }> {
    const [sentiment, category, resolution, similarTickets] = await Promise.all([
      this.analyzeSentiment(issue),
      this.categorizeTicket(issue),
      this.suggestResolution(issue),
      this.findSimilarTickets(issue, existingTickets)
    ]);

    return {
      sentiment,
      category,
      resolution,
      similarTickets
    };
  }

  /**
   * Analyze trends in ticket data
   */
  async analyzeTrends(tickets: EnhancedTicket[]): Promise<{
    trending_issues: Array<{ issue: string; count: number; trend: 'up' | 'down' | 'stable' }>;
    category_distribution: Record<string, number>;
    resolution_patterns: Array<{ pattern: string; success_rate: number }>;
  }> {
    // Group tickets by similar issues
    const issueGroups: Record<string, EnhancedTicket[]> = {};
    
    tickets.forEach(ticket => {
      const key = this.extractKeywords(ticket.issue).join(' ');
      if (!issueGroups[key]) issueGroups[key] = [];
      issueGroups[key].push(ticket);
    });

    const trending_issues = Object.entries(issueGroups)
      .map(([issue, tickets]) => ({
        issue,
        count: tickets.length,
        trend: 'stable' as const // Mock trend - in production, compare with historical data
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Mock category distribution
    const category_distribution: Record<string, number> = {};
    tickets.forEach(ticket => {
      const category = ticket.ai_category || 'General';
      category_distribution[category] = (category_distribution[category] || 0) + 1;
    });

    // Mock resolution patterns
    const resolution_patterns = [
      { pattern: 'Password reset', success_rate: 0.95 },
      { pattern: 'Software reinstall', success_rate: 0.85 },
      { pattern: 'Hardware replacement', success_rate: 0.90 },
      { pattern: 'Network configuration', success_rate: 0.80 }
    ];

    return {
      trending_issues,
      category_distribution,
      resolution_patterns
    };
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    return text.toLowerCase()
      .split(' ')
      .filter(word => word.length > 3 && !stopWords.includes(word))
      .slice(0, 3); // Take top 3 keywords
  }
}

export const aiService = new AIService();
