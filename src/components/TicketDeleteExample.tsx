import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, Loader2, Search, AlertTriangle, CheckCircle, XCircle, FileX, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { getTicketById, deleteTicket, deleteMultipleTickets, type SupabaseTicketResponse } from '@/lib/supabase-tickets';

/**
 * Component to demonstrate ticket deletion functionality
 * Shows both single and bulk deletion with confirmation
 */
export function TicketDeleteExample() {
  const [searchId, setSearchId] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [ticket, setTicket] = useState<SupabaseTicketResponse | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Deletion state
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [softDelete, setSoftDelete] = useState(true);
  const [deleteReason, setDeleteReason] = useState('');
  const [bulkIds, setBulkIds] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchId.trim()) {
      toast.error('Please enter a ticket ID');
      return;
    }

    setSearchLoading(true);
    setSearchError(null);
    setTicket(null);

    try {
      const result = await getTicketById(searchId.trim());
      
      if (result) {
        setTicket(result);
        toast.success(`Found ticket: ${result.ticket_id}`);
      } else {
        setSearchError(`No ticket found with ID: ${searchId}`);
        toast.error('Ticket not found');
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setSearchError(errorMessage);
      toast.error(`Search failed: ${errorMessage}`);
      
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSingleDelete = async () => {
    if (!ticket) return;

    setDeleteLoading(true);

    try {
      const result = await deleteTicket(ticket.ticket_id, {
        confirmDelete: false, // We handle confirmation in UI
        softDelete,
        reason: deleteReason || undefined
      });

      if (result.success) {
        toast.success(result.message);
        // Clear the ticket from display after successful deletion
        setTicket(null);
        setSearchId('');
        setDeleteReason('');
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      toast.error(`Deletion failed: ${errorMessage}`);
      console.error('❌ Delete error:', err);
      
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!bulkIds.trim()) {
      toast.error('Please enter ticket IDs');
      return;
    }

    setBulkLoading(true);

    try {
      // Parse ticket IDs (comma or newline separated)
      const ticketIds = bulkIds
        .split(/[,\n]/)
        .map(id => id.trim())
        .filter(id => id.length > 0);

      if (ticketIds.length === 0) {
        toast.error('No valid ticket IDs found');
        return;
      }

      const result = await deleteMultipleTickets(ticketIds, {
        confirmDelete: false,
        softDelete,
        reason: deleteReason || undefined,
        continueOnError: true
      });

      // Show summary
      toast.success(
        `Bulk deletion complete: ${result.summary.successful} successful, ${result.summary.failed} failed`
      );

      // Log details
      console.log('Bulk deletion results:', result);

      // Clear form on success
      if (result.summary.successful > 0) {
        setBulkIds('');
        setDeleteReason('');
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      toast.error(`Bulk deletion failed: ${errorMessage}`);
      console.error('❌ Bulk delete error:', err);
      
    } finally {
      setBulkLoading(false);
    }
  };

  const clearForm = () => {
    setSearchId('');
    setTicket(null);
    setSearchError(null);
    setDeleteReason('');
    setBulkIds('');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Ticket to Delete
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="searchId" className="text-sm font-medium">
                Ticket ID
              </Label>
              <Input
                id="searchId"
                placeholder="e.g., INC0012345"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                disabled={searchLoading}
                className="mt-1"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button 
                onClick={handleSearch} 
                disabled={searchLoading || !searchId.trim()}
                className="gap-2"
              >
                {searchLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Search
              </Button>
              {ticket && (
                <Button onClick={clearForm} variant="outline">
                  Clear
                </Button>
              )}
            </div>
          </div>

          {searchError && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-destructive">{searchError}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Single Ticket Deletion */}
      {ticket && (
        <Card className="border-orange-200 dark:border-orange-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                <Trash2 className="h-5 w-5" />
                Delete Ticket: {ticket.ticket_id}
              </CardTitle>
              <Badge variant="outline">{ticket.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Ticket Details */}
            <div className="bg-muted p-3 rounded-lg">
              <h4 className="font-medium mb-2">{ticket.issue}</h4>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {ticket.resolution}
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                <span>Created: {new Date(ticket.created_at).toLocaleDateString()}</span>
                <span>Confidence: {ticket.confidence}%</span>
              </div>
            </div>

            {/* Delete Options */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="softDelete"
                  checked={softDelete}
                  onCheckedChange={(checked) => setSoftDelete(checked as boolean)}
                />
                <Label htmlFor="softDelete" className="text-sm">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Soft delete (keep in database, mark as deleted)
                  </div>
                </Label>
              </div>

              <div>
                <Label htmlFor="deleteReason" className="text-sm font-medium">
                  Reason for deletion (optional)
                </Label>
                <Textarea
                  id="deleteReason"
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="e.g., Duplicate ticket, Test data, User request..."
                  className="mt-1"
                  rows={2}
                />
              </div>
            </div>

            <Separator />

            {/* Delete Confirmation */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  disabled={deleteLoading}
                  className="gap-2"
                >
                  {deleteLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  {softDelete ? 'Soft Delete' : 'Permanently Delete'} Ticket
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Confirm Ticket Deletion
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    <div className="space-y-2">
                      <p>Are you sure you want to delete this ticket?</p>
                      <div className="bg-muted p-3 rounded">
                        <p className="font-medium">Ticket: {ticket.ticket_id}</p>
                        <p className="text-sm">Issue: {ticket.issue}</p>
                        <p className="text-sm">Status: {ticket.status}</p>
                      </div>
                      <p className="text-sm">
                        {softDelete 
                          ? "This will mark the ticket as deleted but keep it in the database."
                          : "This action cannot be undone. The ticket will be permanently removed from the database."
                        }
                      </p>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleSingleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {softDelete ? 'Soft Delete' : 'Permanently Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      )}

      {/* Bulk Deletion Section */}
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
            <FileX className="h-5 w-5" />
            Bulk Delete Tickets
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="bulkIds" className="text-sm font-medium">
              Ticket IDs (comma or newline separated)
            </Label>
            <Textarea
              id="bulkIds"
              value={bulkIds}
              onChange={(e) => setBulkIds(e.target.value)}
              placeholder="INC0012345, INC0012346, INC0012347&#10;or one per line..."
              className="mt-1"
              rows={4}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="bulkSoftDelete"
              checked={softDelete}
              onCheckedChange={(checked) => setSoftDelete(checked as boolean)}
            />
            <Label htmlFor="bulkSoftDelete" className="text-sm">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Soft delete all tickets
              </div>
            </Label>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                disabled={bulkLoading || !bulkIds.trim()}
                className="gap-2"
              >
                {bulkLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileX className="h-4 w-4" />
                )}
                Bulk Delete Tickets
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Confirm Bulk Deletion
                </AlertDialogTitle>
                <AlertDialogDescription>
                  <div className="space-y-2">
                    <p>Are you sure you want to delete multiple tickets?</p>
                    <p className="text-sm">
                      {softDelete 
                        ? "This will mark all tickets as deleted but keep them in the database."
                        : "This action cannot be undone. All tickets will be permanently removed from the database."
                      }
                    </p>
                    <p className="text-sm font-medium">
                      Deletion will continue even if some tickets fail to delete.
                    </p>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleBulkDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Bulk {softDelete ? 'Soft Delete' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>deleteTicket Function Usage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-muted p-3 rounded-lg font-mono text-sm">
            <div>import &#123; deleteTicket, deleteMultipleTickets &#125; from '@/lib/supabase-tickets';</div>
            <div></div>
            <div>// Single deletion</div>
            <div>const result = await deleteTicket('INC0012345', &#123;</div>
            <div className="ml-4">confirmDelete: false,</div>
            <div className="ml-4">softDelete: true,</div>
            <div className="ml-4">reason: 'Duplicate ticket'</div>
            <div>&#125;);</div>
            <div></div>
            <div>// Bulk deletion</div>
            <div>const bulkResult = await deleteMultipleTickets(['INC001', 'INC002']);</div>
          </div>
          <Separator />
          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong>Parameters:</strong> ticketId (string), options (object)</p>
            <p><strong>Options:</strong> confirmDelete, softDelete, reason, continueOnError</p>
            <p><strong>Returns:</strong> Promise with success status, deleted ticket data, and message</p>
            <p><strong>Safety:</strong> Verifies ticket exists, provides confirmation, detailed logging</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default TicketDeleteExample;
