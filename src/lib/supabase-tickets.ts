// Use the existing Supabase client to avoid multiple instances
import { supabase } from '../supabaseClient.js';

// Get env vars for debugging only
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

// Define the ticket interface matching your requirements
export interface TicketData {
  id?: string;
  ticket_id: string;
  issue: string;
  resolution: string; // min 500 chars
  status: string;
  confidence: number;
  date: string;
  agent_notes?: string;
}

// Define the database response type
export interface SupabaseTicketResponse {
  id: string;
  ticket_id: string;
  issue: string;
  resolution: string;
  status: string;
  confidence: number;
  date: string;
  agent_notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Insert a new ticket into Supabase tickets table
 * @param ticketData - The ticket data to insert
 * @returns Promise with inserted data or throws error
 */
export async function insertTicket(ticketData: Omit<TicketData, 'id'>): Promise<SupabaseTicketResponse> {
  try {
    // Validate resolution is not empty
    if (!ticketData.resolution || ticketData.resolution.trim() === '') {
      throw new Error('Resolution cannot be empty');
    }

    // Validate required fields
    if (!ticketData.ticket_id || !ticketData.issue || !ticketData.status) {
      throw new Error('Missing required fields: ticket_id, issue, or status');
    }

    // Validate confidence range
    if (ticketData.confidence < 0 || ticketData.confidence > 100) {
      throw new Error('Confidence must be between 0 and 100');
    }

    // Insert data into Supabase
    const { data, error } = await supabase
      .from('tickets')
      .insert([
        {
          ticket_id: ticketData.ticket_id,
          issue: ticketData.issue,
          resolution: ticketData.resolution,
          status: ticketData.status,
          confidence: ticketData.confidence,
          date: ticketData.date,
          agent_notes: ticketData.agent_notes || null
        }
      ])
      .select('*')
      .single();

    if (error) {
      console.error('Supabase insertion error:', error);
      throw new Error(`Failed to insert ticket: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from insertion');
    }

    console.log('✅ Ticket inserted successfully:', data.id);
    return data;

  } catch (error) {
    console.error('❌ Error inserting ticket:', error);
    
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Unknown error occurred while inserting ticket');
    }
  }
}

/**
 * Get all tickets from Supabase
 * @returns Promise with array of tickets
 */
export async function getAllTickets(): Promise<SupabaseTicketResponse[]> {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase fetch error:', error);
      throw new Error(`Failed to fetch tickets: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error fetching tickets:', error);
    throw error;
  }
}

/**
 * Get a single ticket by ticket_id from Supabase
 * @param ticketId - The ticket ID to search for (e.g., "INC0012345")
 * @returns Promise with the ticket data or null if not found
 */
export async function getTicketById(ticketId: string): Promise<SupabaseTicketResponse | null> {
  try {
    // Validate input
    if (!ticketId || typeof ticketId !== 'string') {
      throw new Error('Ticket ID is required and must be a string');
    }

    const trimmedTicketId = ticketId.trim();
    if (trimmedTicketId.length === 0) {
      throw new Error('Ticket ID cannot be empty');
    }

    console.log(`🔍 Fetching ticket with ID: ${trimmedTicketId}`);

    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('ticket_id', trimmedTicketId)
      .single(); // Use .single() since we expect only one result

    if (error) {
      // Handle "not found" case specifically
      if (error.code === 'PGRST116') {
        console.log(`📭 No ticket found with ID: ${trimmedTicketId}`);
        return null;
      }
      
      console.error('Supabase fetch error:', error);
      throw new Error(`Failed to fetch ticket: ${error.message}`);
    }

    if (!data) {
      console.log(`📭 No ticket found with ID: ${trimmedTicketId}`);
      return null;
    }

    console.log(`✅ Found ticket: ${data.id} - ${data.issue}`);
    return data;

  } catch (error) {
    console.error('❌ Error fetching ticket by ID:', error);
    
    // Re-throw validation errors as-is
    if (error instanceof Error && error.message.includes('required')) {
      throw error;
    }
    
    // Wrap other errors with context
    throw new Error(`Failed to fetch ticket with ID "${ticketId}": ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Update fields for an existing ticket in Supabase
 * @param ticketId - The ticket ID to update (e.g., "INC0012345")
 * @param updateData - Object containing fields to update
 * @returns Promise with the updated ticket data
 */
export async function updateTicket(
  ticketId: string, 
  updateData: Partial<Omit<TicketData, 'ticket_id'>>
): Promise<SupabaseTicketResponse> {
  try {
    // Validate ticket ID
    if (!ticketId || typeof ticketId !== 'string') {
      throw new Error('Ticket ID is required and must be a string');
    }

    const trimmedTicketId = ticketId.trim();
    if (trimmedTicketId.length === 0) {
      throw new Error('Ticket ID cannot be empty');
    }

    // Validate update data
    if (!updateData || typeof updateData !== 'object') {
      throw new Error('Update data is required and must be an object');
    }

    const updateFields = Object.keys(updateData);
    if (updateFields.length === 0) {
      throw new Error('At least one field must be provided for update');
    }

    // Validate resolution length if being updated
    if (updateData.resolution !== undefined) {
      if (typeof updateData.resolution !== 'string') {
        throw new Error('Resolution must be a string');
      }
      
      if (!updateData.resolution || updateData.resolution.trim() === '') {
        throw new Error('Resolution cannot be empty');
      }
    }

    // Validate confidence range if being updated
    if (updateData.confidence !== undefined) {
      if (typeof updateData.confidence !== 'number' || updateData.confidence < 0 || updateData.confidence > 100) {
        throw new Error('Confidence must be a number between 0 and 100');
      }
    }

    // Validate status if being updated
    if (updateData.status !== undefined) {
      if (!['Worked', 'Routed'].includes(updateData.status)) {
        throw new Error('Status must be either "Worked" or "Routed"');
      }
    }

    console.log(`🔄 Updating ticket: ${trimmedTicketId}`, { fields: updateFields });

    // First check if ticket exists
    const existingTicket = await getTicketById(trimmedTicketId);
    if (!existingTicket) {
      throw new Error(`Ticket with ID "${trimmedTicketId}" not found`);
    }

    // Prepare update object (filter out undefined values)
    const filteredUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    // Add updated_at timestamp if not explicitly provided
    if (!filteredUpdateData.updated_at) {
      filteredUpdateData.updated_at = new Date().toISOString();
    }

    // Perform the update
    const { data, error } = await supabase
      .from('tickets')
      .update(filteredUpdateData)
      .eq('ticket_id', trimmedTicketId)
      .select('*')
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      throw new Error(`Failed to update ticket: ${error.message}`);
    }

    if (!data) {
      throw new Error('Update operation did not return updated data');
    }

    console.log(`✅ Ticket updated successfully: ${data.id} - ${data.issue}`);
    return data;

  } catch (error) {
    console.error('❌ Error updating ticket:', error);
    
    // Re-throw validation errors as-is
    if (error instanceof Error && (
      error.message.includes('required') ||
      error.message.includes('must be') ||
      error.message.includes('not found')
    )) {
      throw error;
    }
    
    // Wrap other errors with context
    throw new Error(`Failed to update ticket with ID "${ticketId}": ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete a ticket by ticket_id from Supabase
 * @param ticketId - The ticket ID to delete (e.g., "INC0012345")
 * @param options - Optional configuration for deletion behavior
 * @returns Promise with deletion confirmation and deleted ticket data
 */
export async function deleteTicket(
  ticketId: string,
  options: {
    confirmDelete?: boolean;
    softDelete?: boolean;
    reason?: string;
  } = {}
): Promise<{
  success: boolean;
  deletedTicket: SupabaseTicketResponse | null;
  message: string;
}> {
  const { confirmDelete = true, softDelete = false, reason } = options;

  try {
    // Validate ticket ID
    if (!ticketId || typeof ticketId !== 'string') {
      throw new Error('Ticket ID is required and must be a string');
    }

    const trimmedTicketId = ticketId.trim();
    if (trimmedTicketId.length === 0) {
      throw new Error('Ticket ID cannot be empty');
    }

    console.log(`🗑️ Attempting to delete ticket: ${trimmedTicketId}`);

    // First, verify ticket exists and get its data
    const existingTicket = await getTicketById(trimmedTicketId);
    if (!existingTicket) {
      throw new Error(`Ticket with ID "${trimmedTicketId}" not found`);
    }

    console.log(`📋 Found ticket to delete: ${existingTicket.issue} (Status: ${existingTicket.status})`);

    // Confirmation check (can be bypassed by setting confirmDelete: false)
    if (confirmDelete) {
      console.log(`⚠️ Confirmation required for deleting ticket: ${trimmedTicketId}`);
      console.log(`📄 Ticket details: ${existingTicket.issue}`);
      // In a real application, this would typically involve user interaction
      // For this implementation, we'll log the confirmation requirement
    }

    let result;
    let message: string;

    if (softDelete) {
      // Soft delete: Mark as deleted but keep in database
      console.log(`🔄 Performing soft delete on ticket: ${trimmedTicketId}`);
      
      const softDeleteData = {
        status: 'Deleted', // Soft delete status
        agent_notes: `${existingTicket.agent_notes || ''}\n\n[DELETED] ${new Date().toISOString()}${reason ? ` - Reason: ${reason}` : ''}`.trim(),
        updated_at: new Date().toISOString()
      };

      result = await updateTicket(trimmedTicketId, softDeleteData);
      message = `Ticket ${trimmedTicketId} soft deleted successfully`;
      
    } else {
      // Hard delete: Remove from database permanently
      console.log(`🗑️ Performing hard delete on ticket: ${trimmedTicketId}`);
      
      const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('ticket_id', trimmedTicketId);

      if (error) {
        console.error('Supabase delete error:', error);
        throw new Error(`Failed to delete ticket: ${error.message}`);
      }

      result = existingTicket; // Return the deleted ticket data
      message = `Ticket ${trimmedTicketId} permanently deleted from database`;
    }

    console.log(`✅ ${message}`);
    
    // Log deletion details for audit trail
    console.log(`📊 Deletion summary:`, {
      ticketId: trimmedTicketId,
      deleteType: softDelete ? 'soft' : 'hard',
      reason: reason || 'No reason provided',
      deletedAt: new Date().toISOString(),
      originalStatus: existingTicket.status
    });

    return {
      success: true,
      deletedTicket: result,
      message
    };

  } catch (error) {
    console.error('❌ Error deleting ticket:', error);
    
    // Re-throw validation and not found errors as-is
    if (error instanceof Error && (
      error.message.includes('required') ||
      error.message.includes('cannot be empty') ||
      error.message.includes('not found')
    )) {
      throw error;
    }
    
    // Wrap other errors with context
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to delete ticket with ID "${ticketId}": ${errorMessage}`);
  }
}

/**
 * Delete multiple tickets by their IDs
 * @param ticketIds - Array of ticket IDs to delete
 * @param options - Optional configuration for deletion behavior
 * @returns Promise with deletion results for each ticket
 */
export async function deleteMultipleTickets(
  ticketIds: string[],
  options: {
    confirmDelete?: boolean;
    softDelete?: boolean;
    reason?: string;
    continueOnError?: boolean;
  } = {}
): Promise<{
  successful: Array<{ ticketId: string; deletedTicket: SupabaseTicketResponse | null }>;
  failed: Array<{ ticketId: string; error: string }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}> {
  const { continueOnError = true } = options;
  const successful: Array<{ ticketId: string; deletedTicket: SupabaseTicketResponse | null }> = [];
  const failed: Array<{ ticketId: string; error: string }> = [];

  try {
    // Validate input
    if (!Array.isArray(ticketIds) || ticketIds.length === 0) {
      throw new Error('Ticket IDs array is required and must not be empty');
    }

    console.log(`🗑️ Starting bulk deletion of ${ticketIds.length} tickets`);

    for (const ticketId of ticketIds) {
      try {
        const result = await deleteTicket(ticketId, { ...options, confirmDelete: false });
        successful.push({
          ticketId,
          deletedTicket: result.deletedTicket
        });
        console.log(`✅ Successfully deleted: ${ticketId}`);
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        failed.push({ ticketId, error: errorMessage });
        console.error(`❌ Failed to delete ${ticketId}:`, errorMessage);
        
        if (!continueOnError) {
          console.log(`🛑 Stopping bulk deletion due to error and continueOnError=false`);
          break;
        }
      }
    }

    const summary = {
      total: ticketIds.length,
      successful: successful.length,
      failed: failed.length
    };

    console.log(`📊 Bulk deletion complete:`, summary);

    return { successful, failed, summary };

  } catch (error) {
    console.error('❌ Error in bulk deletion:', error);
    throw error;
  }
}

/**
 * Get tickets by status
 * @param status - The status to filter by
 * @returns Promise with filtered tickets
 */
export async function getTicketsByStatus(status: string): Promise<SupabaseTicketResponse[]> {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase fetch error:', error);
      throw new Error(`Failed to fetch tickets by status: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error fetching tickets by status:', error);
    throw error;
  }
}

/**
 * Update ticket status
 * @param ticketId - The ticket ID to update
 * @param newStatus - The new status
 * @returns Promise with updated ticket data
 */
export async function updateTicketStatus(ticketId: string, newStatus: string): Promise<SupabaseTicketResponse> {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('ticket_id', ticketId)
      .select('*')
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      throw new Error(`Failed to update ticket status: ${error.message}`);
    }

    if (!data) {
      throw new Error('Ticket not found');
    }

    console.log('✅ Ticket status updated:', data.id);
    return data;
  } catch (error) {
    console.error('❌ Error updating ticket status:', error);
    throw error;
  }
}

/**
 * Get analytics data from tickets
 * @returns Promise with analytics summary
 */
export async function getTicketAnalytics() {
  try {
    const tickets = await getAllTickets();
    
    // Convert Supabase format to FeedbackData format for compatibility
    const feedbackTickets = tickets.map(ticket => ({
      id: ticket.id,
      ticket_id: ticket.ticket_id,
      issue: ticket.issue,
      resolution: ticket.resolution,
      status: ticket.status,
      confidence: ticket.confidence,
      date: ticket.date,
      agent_notes: ticket.agent_notes || ''
    }));

    // Calculate top working resolutions
    const workingTickets = feedbackTickets.filter(t => t.status === 'Worked');
    const resolutionCounts = workingTickets.reduce((acc, ticket) => {
      const res = ticket.resolution.substring(0, 50) + '...'; // Truncate for display
      acc[res] = (acc[res] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const top_working_resolutions = Object.entries(resolutionCounts)
      .map(([resolution, count]) => ({
        resolution,
        count,
        success_rate: 100 // All working tickets are successful
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate trending issues
    const issueCounts = feedbackTickets.reduce((acc, ticket) => {
      acc[ticket.issue] = (acc[ticket.issue] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const trending_issues = Object.entries(issueCounts)
      .map(([issue, count]) => ({
        issue,
        count,
        recent_count: count // Simplified - could be enhanced with date filtering
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    const analytics = {
      total_tickets: tickets.length,
      worked_count: tickets.filter(t => t.status === 'Worked').length,
      routed_count: tickets.filter(t => t.status === 'Routed').length,
      success_rate: tickets.length > 0 
        ? Math.round((tickets.filter(t => t.status === 'Worked').length / tickets.length) * 100)
        : 0,
      top_working_resolutions,
      trending_issues,
      tickets: feedbackTickets
    };

    return analytics;
  } catch (error) {
    console.error('❌ Error getting analytics:', error);
    throw error;
  }
}

/**
 * Test Supabase connection
 * @returns Promise with connection status
 */
export async function testSupabaseConnection(): Promise<{ success: boolean; message: string; url?: string; tableExists?: boolean }> {
  try {
    console.log('🔍 Testing Supabase connection...');
    console.log('URL:', supabaseUrl);
    console.log('Key present:', !!supabaseKey);
    
    // First, try a simple query to test the connection
    const { data, error } = await supabase
      .from('tickets')
      .select('ticket_id, issue')
      .limit(1);

    console.log('Query result:', { data, error });

    if (error) {
      console.error('Supabase error details:', error);
      
      // Check for specific table not found error
      if (error.message.includes('table') && error.message.includes('not found')) {
        return {
          success: false,
          message: `❌ Table 'tickets' not found in database. Please run the SQL schema from 'sql/create-tickets-table.sql' in your Supabase SQL editor to create the table.`,
          url: supabaseUrl,
          tableExists: false
        };
      }
      
      // Check for schema cache error (another way the table not found error appears)
      if (error.message.includes('schema cache') || error.message.includes('Could not find the table')) {
        return {
          success: false,
          message: `❌ The 'tickets' table doesn't exist. Please create it by running the SQL schema from 'sql/create-tickets-table.sql' in your Supabase dashboard.`,
          url: supabaseUrl,
          tableExists: false
        };
      }

      // Check for permission/RLS errors
      if (error.message.includes('permission') || error.message.includes('RLS')) {
        return {
          success: false,
          message: `❌ Permission denied. Please check your Supabase RLS policies or run the complete SQL schema to set up proper permissions.`,
          url: supabaseUrl,
          tableExists: true
        };
      }

      // Check for authentication errors
      if (error.message.includes('JWT') || error.message.includes('API key')) {
        return {
          success: false,
          message: `❌ Authentication failed. Please check your VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your .env file.`,
          url: supabaseUrl,
          tableExists: false
        };
      }

      return {
        success: false,
        message: `Connection failed: ${error.message}`,
        url: supabaseUrl,
        tableExists: false
      };
    }

    console.log('✅ Connection successful, data received:', data);
    return {
      success: true,
      message: 'Successfully connected to Supabase tickets table',
      url: supabaseUrl,
      tableExists: true
    };
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Additional error handling for network/connection issues
    if (errorMessage.includes('fetch')) {
      return {
        success: false,
        message: `❌ Network error: Cannot reach Supabase. Check your VITE_SUPABASE_URL and internet connection.`,
        url: supabaseUrl,
        tableExists: false
      };
    }

    return {
      success: false,
      message: `Connection error: ${errorMessage}`,
      url: supabaseUrl,
      tableExists: false
    };
  }
}

export default supabase;
