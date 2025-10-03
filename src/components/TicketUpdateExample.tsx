import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Save, Loader2, Search, CheckCircle, XCircle, AlertCircle, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { getTicketById, updateTicket, type SupabaseTicketResponse, type TicketData } from '@/lib/supabase-tickets';

/**
 * Component to search for and update tickets
 * Demonstrates usage of the updateTicket function with validation
 */
export function TicketUpdateExample() {
  const [searchId, setSearchId] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [ticket, setTicket] = useState<SupabaseTicketResponse | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Update form state
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateData, setUpdateData] = useState({
    issue: '',
    resolution: '',
    status: '',
    confidence: '',
    agent_notes: ''
  });

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
        // Pre-populate form with current values
        setUpdateData({
          issue: result.issue,
          resolution: result.resolution,
          status: result.status,
          confidence: result.confidence.toString(),
          agent_notes: result.agent_notes || ''
        });
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

  const handleUpdate = async () => {
    if (!ticket) return;

    setUpdateLoading(true);

    try {
      // Build update object with only changed fields
      const updates: Partial<Omit<TicketData, 'ticket_id'>> = {};
      
      if (updateData.issue !== ticket.issue) {
        updates.issue = updateData.issue;
      }
      
      if (updateData.resolution !== ticket.resolution) {
        updates.resolution = updateData.resolution;
      }
      
      if (updateData.status !== ticket.status) {
        updates.status = updateData.status;
      }
      
      if (updateData.confidence !== ticket.confidence.toString()) {
        updates.confidence = parseInt(updateData.confidence);
      }
      
      if (updateData.agent_notes !== (ticket.agent_notes || '')) {
        updates.agent_notes = updateData.agent_notes;
      }

      if (Object.keys(updates).length === 0) {
        toast.info('No changes detected');
        return;
      }

      console.log('Updating ticket with:', updates);
      const updatedTicket = await updateTicket(ticket.ticket_id, updates);
      
      setTicket(updatedTicket);
      toast.success('Ticket updated successfully!');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      toast.error(`Update failed: ${errorMessage}`);
      console.error('❌ Update error:', err);
      
    } finally {
      setUpdateLoading(false);
    }
  };

  const clearForm = () => {
    setSearchId('');
    setTicket(null);
    setSearchError(null);
    setUpdateData({
      issue: '',
      resolution: '',
      status: '',
      confidence: '',
      agent_notes: ''
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Ticket to Update
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
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-destructive">{searchError}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Update Form */}
      {ticket && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Update Ticket: {ticket.ticket_id}
              </CardTitle>
              <Badge variant="outline">{ticket.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Issue Field */}
            <div>
              <Label htmlFor="issue" className="text-sm font-medium">
                Issue <span className="text-destructive">*</span>
              </Label>
              <Input
                id="issue"
                value={updateData.issue}
                onChange={(e) => setUpdateData(prev => ({ ...prev, issue: e.target.value }))}
                placeholder="Brief description of the issue"
                className="mt-1"
              />
            </div>

            {/* Resolution Field with Character Counter */}
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="resolution" className="text-sm font-medium">
                  Resolution <span className="text-destructive">*</span>
                </Label>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  updateData.resolution.length >= 500 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                }`}>
                  {updateData.resolution.length}/500 chars
                </span>
              </div>
              <Textarea
                id="resolution"
                value={updateData.resolution}
                onChange={(e) => setUpdateData(prev => ({ ...prev, resolution: e.target.value }))}
                placeholder="Detailed resolution steps"
                className="mt-1 min-h-32"
                rows={6}
              />
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Characters: {updateData.resolution.length}
              </p>
            </div>

            {/* Status and Confidence Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status" className="text-sm font-medium">
                  Status <span className="text-destructive">*</span>
                </Label>
                <Select 
                  value={updateData.status} 
                  onValueChange={(value) => setUpdateData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Worked">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Worked
                      </div>
                    </SelectItem>
                    <SelectItem value="Routed">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-orange-600" />
                        Routed
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="confidence" className="text-sm font-medium">
                  Confidence (0-100)
                </Label>
                <Input
                  id="confidence"
                  type="number"
                  min="0"
                  max="100"
                  value={updateData.confidence}
                  onChange={(e) => setUpdateData(prev => ({ ...prev, confidence: e.target.value }))}
                  placeholder="85"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Agent Notes */}
            <div>
              <Label htmlFor="agent_notes" className="text-sm font-medium">
                Agent Notes
              </Label>
              <Textarea
                id="agent_notes"
                value={updateData.agent_notes}
                onChange={(e) => setUpdateData(prev => ({ ...prev, agent_notes: e.target.value }))}
                placeholder="Additional notes for internal tracking"
                className="mt-1"
                rows={3}
              />
            </div>

            <Separator />

            {/* Update Button */}
            <div className="flex justify-end gap-2">
              <Button 
                onClick={handleUpdate}
                disabled={updateLoading || updateData.resolution.length < 500}
                className="gap-2"
              >
                {updateLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Update Ticket
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>updateTicket Function Usage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-muted p-3 rounded-lg font-mono text-sm">
            <div>import &#123; updateTicket &#125; from '@/lib/supabase-tickets';</div>
            <div></div>
            <div>const updatedTicket = await updateTicket('INC0012345', &#123;</div>
            <div className="ml-4">issue: 'Updated issue description',</div>
            <div className="ml-4">resolution: 'New resolution with 500+ chars...',</div>
            <div className="ml-4">status: 'Worked',</div>
            <div className="ml-4">confidence: 95</div>
            <div>&#125;);</div>
          </div>
          <Separator />
          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong>Parameters:</strong> ticketId (string), updateData (partial object)</p>
            <p><strong>Validation:</strong> Resolution cannot be empty, confidence 0-100, status 'Worked'/'Routed'</p>
            <p><strong>Returns:</strong> Promise&lt;SupabaseTicketResponse&gt; - Updated ticket object</p>
            <p><strong>Error Handling:</strong> Validates inputs, checks ticket exists, provides detailed error messages</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default TicketUpdateExample;
