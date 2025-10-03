import { useState, useEffect, useCallback } from 'react';
import { getAllTickets, testSupabaseConnection, type SupabaseTicketResponse } from '@/lib/supabase-tickets';
import { toast } from 'sonner';

export interface UseTicketsReturn {
  tickets: SupabaseTicketResponse[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isSupabaseConnected: boolean;
}

export interface UseTicketsOptions {
  sortBy?: 'date' | 'created_at';
  sortOrder?: 'asc' | 'desc';
  autoRefetch?: boolean;
  refetchInterval?: number;
}

/**
 * Custom React hook to fetch and manage tickets from Supabase
 * 
 * Features:
 * - Fetches all tickets from Supabase
 * - Sorts by date descending by default
 * - Handles loading and error states
 * - Tests Supabase connection
 * - Provides refetch functionality
 * - Optional auto-refresh capabilities
 * 
 * @param options Configuration options for the hook
 * @returns Object containing tickets, loading state, error state, and refetch function
 */
export function useTickets(options: UseTicketsOptions = {}): UseTicketsReturn {
  const {
    sortBy = 'date',
    sortOrder = 'desc',
    autoRefetch = false,
    refetchInterval = 30000 // 30 seconds default
  } = options;

  const [tickets, setTickets] = useState<SupabaseTicketResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(false);

  /**
   * Fetch tickets from Supabase with error handling
   */
  const fetchTickets = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Test Supabase connection first
      const connectionResult = await testSupabaseConnection();
      setIsSupabaseConnected(connectionResult.success);

      if (!connectionResult.success) {
        throw new Error(`Supabase connection failed: ${connectionResult.message}`);
      }

      // Fetch tickets
      const fetchedTickets = await getAllTickets();
      
      // Sort tickets
      const sortedTickets = [...fetchedTickets].sort((a, b) => {
        const aValue = new Date(a[sortBy]).getTime();
        const bValue = new Date(b[sortBy]).getTime();
        
        return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
      });

      setTickets(sortedTickets);
      console.log(`✅ Loaded ${sortedTickets.length} tickets from Supabase`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setIsSupabaseConnected(false);
      console.error('❌ Error fetching tickets:', err);
      
      // Show toast notification for user feedback
      toast.error(`Failed to load tickets: ${errorMessage}`);
      
    } finally {
      setLoading(false);
    }
  }, [sortBy, sortOrder]);

  /**
   * Refetch tickets - can be called manually
   */
  const refetch = async (): Promise<void> => {
    await fetchTickets();
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Auto-refetch functionality
  useEffect(() => {
    if (!autoRefetch || refetchInterval <= 0) return;

    const intervalId = setInterval(() => {
      if (!loading) {
        fetchTickets();
      }
    }, refetchInterval);

    return () => clearInterval(intervalId);
  }, [autoRefetch, refetchInterval, loading, fetchTickets]);

  return {
    tickets,
    loading,
    error,
    refetch,
    isSupabaseConnected
  };
}

export default useTickets;
