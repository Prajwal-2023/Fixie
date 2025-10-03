import { supabase } from '@/supabaseClient';
import { RealtimeEvent } from '@/types/enhanced-types';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type RealtimeCallback = (event: RealtimeEvent) => void;

interface PayloadChange {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Record<string, unknown>;
  old: Record<string, unknown>;
}

class RealtimeService {
  private callbacks: Map<string, RealtimeCallback[]> = new Map();
  private channel: RealtimeChannel | null = null;
  private isConnected = false;

  /**
   * Initialize real-time connection
   */
  initialize() {
    if (this.isConnected) return;

    this.channel = supabase
      .channel('fixie-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tickets' }, 
        (payload) => this.handleTicketChange(payload)
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'ticket_comments' }, 
        (payload) => this.handleCommentChange(payload)
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'notifications' }, 
        (payload) => this.handleNotificationChange(payload)
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.isConnected = true;
          console.log('✅ Real-time connection established');
        }
      });
  }

  /**
   * Subscribe to specific event types
   */
  subscribe(eventType: string, callback: RealtimeCallback) {
    if (!this.callbacks.has(eventType)) {
      this.callbacks.set(eventType, []);
    }
    this.callbacks.get(eventType)?.push(callback);
  }

  /**
   * Unsubscribe from event type
   */
  unsubscribe(eventType: string, callback: RealtimeCallback) {
    const callbacks = this.callbacks.get(eventType);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Broadcast event to all subscribers
   */
  private broadcast(eventType: string, data: unknown) {
    const event: RealtimeEvent = {
      type: eventType as RealtimeEvent['type'],
      data,
      timestamp: new Date().toISOString(),
    };

    const callbacks = this.callbacks.get(eventType);
    if (callbacks) {
      callbacks.forEach(callback => callback(event));
    }

    // Also broadcast to 'all' subscribers
    const allCallbacks = this.callbacks.get('all');
    if (allCallbacks) {
      allCallbacks.forEach(callback => callback(event));
    }
  }

  /**
   * Handle ticket changes
   */
  private handleTicketChange(payload: PayloadChange) {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    switch (eventType) {
      case 'INSERT':
        this.broadcast('ticket_created', newRecord);
        break;
      case 'UPDATE':
        this.broadcast('ticket_updated', { new: newRecord, old: oldRecord });
        if (newRecord.assigned_to !== oldRecord?.assigned_to) {
          this.broadcast('ticket_assigned', newRecord);
        }
        break;
      case 'DELETE':
        this.broadcast('ticket_deleted', oldRecord);
        break;
    }
  }

  /**
   * Handle comment changes
   */
  private handleCommentChange(payload: PayloadChange) {
    const { eventType, new: newRecord } = payload;
    
    if (eventType === 'INSERT') {
      this.broadcast('comment_added', newRecord);
    }
  }

  /**
   * Handle notification changes
   */
  private handleNotificationChange(payload: PayloadChange) {
    const { eventType, new: newRecord } = payload;
    
    if (eventType === 'INSERT') {
      this.broadcast('notification', newRecord);
    }
  }

  /**
   * Send a custom real-time event
   */
  async sendEvent(eventType: string, data: unknown, organizationId?: string) {
    try {
      await supabase.from('analytics_events').insert({
        event_type: eventType,
        event_data: data,
        organization_id: organizationId,
        session_id: this.generateSessionId(),
      });
    } catch (error) {
      console.error('Failed to send real-time event:', error);
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Disconnect from real-time service
   */
  disconnect() {
    if (this.channel) {
      this.channel.unsubscribe();
      this.channel = null;
    }
    this.isConnected = false;
    this.callbacks.clear();
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService();
