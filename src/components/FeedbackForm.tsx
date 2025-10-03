import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle, MessageSquare, Ticket, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { insertTicket, type TicketData } from "@/lib/supabase-tickets";

export interface FeedbackData {
  id?: string;
  ticket_id: string;
  issue: string;
  resolution: string;
  status: "Worked" | "Routed";
  confidence: number;
  date: string;
  agent_notes?: string;
}

interface FeedbackFormProps {
  issue: string;
  resolution: string;
  confidence: number;
  onFeedbackSubmitted: (status: "Worked" | "Routed") => void;
}

export function FeedbackForm({ issue, resolution, confidence, onFeedbackSubmitted }: FeedbackFormProps) {
  const [ticketId, setTicketId] = useState("");
  const [agentNotes, setAgentNotes] = useState("");
  const [showTicketInput, setShowTicketInput] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<"Worked" | "Routed" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStatusSelect = (status: "Worked" | "Routed") => {
    setSelectedStatus(status);
    setShowTicketInput(true);
  };

  const handleSubmitFeedback = async () => {
    if (!selectedStatus || !ticketId.trim()) {
      toast.error("Please provide ticket ID");
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare ticket data for Supabase
      const ticketData: Omit<TicketData, "id"> = {
        ticket_id: ticketId.trim(),
        issue: issue,
        resolution: resolution,
        status: selectedStatus,
        confidence: confidence,
        date: new Date().toISOString(),
        agent_notes: agentNotes.trim() || undefined
      };

      // Validate resolution is not empty
      if (!resolution || resolution.trim() === '') {
        toast.error('Resolution cannot be empty');
        return;
      }

      // Insert into Supabase tickets table
      const insertedTicket = await insertTicket(ticketData);
      
      // Also save to localStorage as backup
      const savedFeedback = localStorage.getItem('fixie-feedback') || '[]';
      const feedbackList = JSON.parse(savedFeedback);
      
      const newFeedback = {
        ...ticketData,
        id: insertedTicket.id
      };
      
      feedbackList.push(newFeedback);
      localStorage.setItem('fixie-feedback', JSON.stringify(feedbackList));
      
      toast.success(
        selectedStatus === "Worked" 
          ? `✅ Ticket ${insertedTicket.ticket_id} saved! Resolution marked as successful` 
          : `📋 Ticket ${insertedTicket.ticket_id} saved to Supabase. Consider escalation if needed`
      );
      
      onFeedbackSubmitted(selectedStatus);
    } catch (error) {
      toast.error("Failed to save feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowTicketInput(false);
    setSelectedStatus(null);
    setTicketId("");
    setAgentNotes("");
  };

  if (showTicketInput && selectedStatus) {
    return (
      <Card className="p-6 border-primary/20 bg-primary/5">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Save Resolution Feedback</h3>
            <span className={`ml-auto px-2 py-1 rounded-full text-xs font-medium ${
              selectedStatus === "Worked" 
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                : "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
            }`}>
              {selectedStatus === "Worked" ? "✅ Worked" : "📋 Routed"}
            </span>
          </div>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="ticketId" className="text-sm font-medium">
                Ticket Number (INC ID) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ticketId"
                placeholder="e.g., INC0012345"
                value={ticketId}
                onChange={(e) => setTicketId(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Resolution Length Indicator */}
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Resolution Length Check
                </Label>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  resolution.length >= 500 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                }`}>
                  {resolution.length}/500 chars
                </span>
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      resolution.length >= 500 
                        ? 'bg-green-500' 
                        : resolution.length >= 250 
                        ? 'bg-orange-500' 
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min((resolution.length / 500) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Characters: {resolution.length}
                </p>
              </div>
            </div>
            
            <div>
              <Label htmlFor="agentNotes" className="text-sm font-medium">
                Additional Notes (Optional)
              </Label>
              <Textarea
                id="agentNotes"
                placeholder="Any additional context or observations..."
                value={agentNotes}
                onChange={(e) => setAgentNotes(e.target.value)}
                rows={2}
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button 
              onClick={handleSubmitFeedback} 
              disabled={!ticketId.trim() || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? "Saving..." : "Save Feedback"}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100">
            Did this resolution work?
          </h3>
        </div>
        
        <p className="text-sm text-amber-800 dark:text-amber-200">
          Your feedback helps Fixie learn and improve future recommendations.
        </p>
        
        <Separator className="bg-amber-200 dark:bg-amber-800" />
        
        <div className="flex gap-4">
          <Button
            onClick={() => handleStatusSelect("Worked")}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Yes, it worked!
          </Button>
          
          <Button
            onClick={() => handleStatusSelect("Routed")}
            variant="outline"
            className="flex-1 border-orange-300 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-950 gap-2"
          >
            <XCircle className="h-4 w-4" />
            No, needs escalation
          </Button>
        </div>
      </div>
    </Card>
  );
}
