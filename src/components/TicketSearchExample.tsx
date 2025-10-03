import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Search, Loader2, CheckCircle, XCircle, AlertCircle, Ticket } from 'lucide-react';
import { toast } from 'sonner';
import { getTicketById, type SupabaseTicketResponse } from '@/lib/supabase-tickets';

/**
 * Component to search and display a single ticket by ID
 * Demonstrates usage of the getTicketById function
 */
export function TicketSearchExample() {
  const [ticketId, setTicketId] = useState('');
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState<SupabaseTicketResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!ticketId.trim()) {
      toast.error('Please enter a ticket ID');
      return;
    }

    setLoading(true);
    setError(null);
    setTicket(null);
    setSearched(false);

    try {
      console.log(`🔍 Searching for ticket: ${ticketId}`);
      const result = await getTicketById(ticketId.trim());
      
      setTicket(result);
      setSearched(true);
      
      if (result) {
        toast.success(`Found ticket: ${result.ticket_id}`);
      } else {
        toast.info(`No ticket found with ID: ${ticketId}`);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast.error(`Search failed: ${errorMessage}`);
      console.error('❌ Ticket search error:', err);
      
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setTicketId('');
    setTicket(null);
    setError(null);
    setSearched(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Ticket by ID
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="ticketSearch" className="text-sm font-medium">
                Ticket ID
              </Label>
              <Input
                id="ticketSearch"
                placeholder="e.g., INC0012345"
                value={ticketId}
                onChange={(e) => setTicketId(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                className="mt-1"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button 
                onClick={handleSearch} 
                disabled={loading || !ticketId.trim()}
                className="gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Search
              </Button>
              {(ticket || error || searched) && (
                <Button 
                  onClick={clearSearch}
                  variant="outline"
                  size="default"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-lg font-medium">Searching for ticket...</p>
              <p className="text-sm text-muted-foreground">Looking up: {ticketId}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card className="border-destructive">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-destructive/10 text-destructive">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-destructive">Search Error</h3>
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button 
                  onClick={handleSearch} 
                  size="sm" 
                  variant="outline" 
                  className="mt-2 gap-2"
                >
                  <Search className="h-4 w-4" />
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {searched && !ticket && !error && !loading && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <h3 className="text-lg font-semibold">No Ticket Found</h3>
              <p className="text-sm text-muted-foreground">
                No ticket exists with ID: <code className="bg-muted px-1 rounded">{ticketId}</code>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success - Ticket Found */}
      {ticket && !loading && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Ticket Found
              </CardTitle>
              <Badge variant="outline">{ticket.ticket_id}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Ticket Status */}
            <div className="flex items-center gap-2">
              <Badge 
                variant={ticket.status === 'Worked' ? 'default' : 'secondary'}
                className="flex items-center gap-1"
              >
                {ticket.status === 'Worked' ? (
                  <CheckCircle className="h-3 w-3" />
                ) : (
                  <XCircle className="h-3 w-3" />
                )}
                {ticket.status}
              </Badge>
              {ticket.confidence && (
                <Badge variant="outline">
                  {ticket.confidence}% confidence
                </Badge>
              )}
            </div>

            <Separator />

            {/* Ticket Details */}
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Issue</Label>
                <p className="text-sm font-medium">{ticket.issue}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Resolution</Label>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {ticket.resolution}
                </p>
              </div>

              {ticket.agent_notes && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Agent Notes</Label>
                  <p className="text-sm text-muted-foreground">{ticket.agent_notes}</p>
                </div>
              )}

              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                <span>
                  Created: {new Date(ticket.created_at).toLocaleString()}
                </span>
                <span>
                  Date: {new Date(ticket.date).toLocaleDateString()}
                </span>
                <span>
                  ID: {ticket.id}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>getTicketById Function Usage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-muted p-3 rounded-lg font-mono text-sm">
            <div>import &#123; getTicketById &#125; from '@/lib/supabase-tickets';</div>
            <div></div>
            <div>const ticket = await getTicketById('INC0012345');</div>
            <div>if (ticket) &#123;</div>
            <div className="ml-4">console.log('Found:', ticket.issue);</div>
            <div>&#125; else &#123;</div>
            <div className="ml-4">console.log('Ticket not found');</div>
            <div>&#125;</div>
          </div>
          <Separator />
          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong>Parameters:</strong> ticketId (string) - The ticket ID to search for</p>
            <p><strong>Returns:</strong> Promise&lt;SupabaseTicketResponse | null&gt;</p>
            <p><strong>Error Handling:</strong> Validates input, handles "not found" cases, provides detailed error messages</p>
            <p><strong>Logging:</strong> Console logs search attempts and results for debugging</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default TicketSearchExample;
