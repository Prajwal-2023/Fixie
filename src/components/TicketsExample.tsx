import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, Database, Wifi, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useTickets } from '@/hooks/useTickets';

/**
 * Example component demonstrating useTickets hook usage
 * Shows how to display tickets with loading, error, and success states
 */
export function TicketsExample() {
  const { 
    tickets, 
    loading, 
    error, 
    refetch, 
    isSupabaseConnected 
  } = useTickets({
    sortBy: 'date',
    sortOrder: 'desc',
    autoRefetch: false // Set to true for real-time updates
  });

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Tickets from Supabase
            </CardTitle>
            <div className="flex items-center gap-2">
              {/* Connection Status */}
              <Badge 
                variant={isSupabaseConnected ? 'default' : 'destructive'}
                className="flex items-center gap-1"
              >
                <Wifi className="h-3 w-3" />
                {isSupabaseConnected ? 'Connected' : 'Disconnected'}
              </Badge>
              
              {/* Refresh Button */}
              <Button 
                onClick={refetch} 
                disabled={loading}
                size="sm"
                variant="outline"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Loading tickets...</span>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <div>
                <p className="font-medium text-destructive">Error loading tickets</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
          )}

          {/* Success State - Tickets List */}
          {!loading && !error && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {tickets.length} tickets found
                </p>
              </div>

              {tickets.length === 0 ? (
                <div className="text-center py-8">
                  <Database className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No tickets found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tickets.map((ticket) => (
                    <Card key={ticket.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{ticket.ticket_id}</Badge>
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
                          
                          <h3 className="font-medium mb-1">{ticket.issue}</h3>
                          
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {ticket.resolution}
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>
                              Created: {new Date(ticket.created_at).toLocaleDateString()}
                            </span>
                            <span>
                              Date: {new Date(ticket.date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>useTickets Hook Usage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-muted p-3 rounded-lg font-mono text-sm">
            <div>const &#123; tickets, loading, error, refetch, isSupabaseConnected &#125; = useTickets(&#123;</div>
            <div className="ml-4">sortBy: 'date', // or 'created_at'</div>
            <div className="ml-4">sortOrder: 'desc', // or 'asc'</div>
            <div className="ml-4">autoRefetch: false, // Enable auto-refresh</div>
            <div className="ml-4">refetchInterval: 30000 // 30 seconds</div>
            <div>&#125;);</div>
          </div>
          <Separator />
          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong>tickets:</strong> Array of ticket objects from Supabase</p>
            <p><strong>loading:</strong> Boolean indicating if data is being fetched</p>
            <p><strong>error:</strong> Error message string or null</p>
            <p><strong>refetch:</strong> Function to manually refresh data</p>
            <p><strong>isSupabaseConnected:</strong> Boolean indicating Supabase connection status</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default TicketsExample;
