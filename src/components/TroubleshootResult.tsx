import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FeedbackForm } from "@/components/FeedbackForm";
import { 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Clipboard,
  Clock,
  TrendingUp,
  MessageSquare,
  ArrowUpCircle,
  FileText,
  Send,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

export interface TroubleshootResultData {
  root_cause: string;
  resolution_steps: string[];
  work_note: string;
  follow_up_questions: string[];
  escalation: {
    when: string;
    to: string;
  };
  eta: string;
  confidence: number;
  short_note?: string;
}

interface TroubleshootResultProps {
  result: TroubleshootResultData;
  onRegenerateSteps?: (question: string) => void;
}

export function TroubleshootResult({ result, onRegenerateSteps }: TroubleshootResultProps) {
  const [userQuestion, setUserQuestion] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showFeedback, setShowFeedback] = useState(true);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const copyAllResolutionSteps = () => {
    const stepsText = result.resolution_steps
      .map((step, index) => `${index + 1}. ${step}`)
      .join('\n');
    copyToClipboard(stepsText, "Resolution steps");
  };

  const handleRegenerateSteps = async () => {
    if (!userQuestion.trim() || !onRegenerateSteps) return;
    
    setIsRegenerating(true);
    try {
      await onRegenerateSteps(userQuestion);
      setUserQuestion("");
      toast.success("Resolution steps updated based on your question");
      // Reset feedback form when steps are regenerated
      setShowFeedback(true);
      setFeedbackSubmitted(false);
    } catch (error) {
      toast.error("Failed to regenerate steps");
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleFeedbackSubmitted = (status: "Worked" | "Routed") => {
    setFeedbackSubmitted(true);
    setShowFeedback(false);
    
    if (status === "Routed") {
      // Show the regeneration section when routed
      toast.info("💡 Consider asking a specific question below to get alternative steps");
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-success";
    if (confidence >= 60) return "text-warning";
    return "text-destructive";
  };

  return (
    <div className="space-y-6">
      {/* Header with confidence and ETA */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Diagnosis Complete</h2>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {result.eta}
            </Badge>
            <Badge variant="secondary" className={`gap-1.5 ${getConfidenceColor(result.confidence)}`}>
              {result.confidence}% Confidence
            </Badge>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <h3 className="font-semibold text-sm text-muted-foreground mb-2">ROOT CAUSE</h3>
          <p className="text-foreground leading-relaxed">{result.root_cause}</p>
        </div>
      </Card>

      {/* Short Issue Note */}
      <Card className="p-6 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200/50 dark:border-blue-800/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">Issue Summary</h3>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-blue-700 border-blue-300 dark:text-blue-300 dark:border-blue-700">
              ETA: {result.eta}
            </Badge>
            <Badge variant="outline" className="text-blue-700 border-blue-300 dark:text-blue-300 dark:border-blue-700">
              Priority: Medium
            </Badge>
          </div>
        </div>
        <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-lg p-4 border border-blue-200/30 dark:border-blue-800/30">
          <p className="text-blue-800 dark:text-blue-200 leading-relaxed font-medium mb-3">
            {result.short_note || `This ${result.root_cause.toLowerCase()} requires immediate attention. The issue appears to be affecting user productivity and should be resolved following the steps below.`}
          </p>
          <div className="flex items-center gap-4 text-sm text-blue-700 dark:text-blue-300">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Estimated: {result.eta}</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              <span>Confidence: {result.confidence}%</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              <span>{result.resolution_steps.length} Steps</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Resolution Steps */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <h3 className="text-lg font-bold">Resolution Steps</h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={copyAllResolutionSteps}
            className="gap-2"
          >
            <Clipboard className="h-4 w-4" />
            Copy Steps
          </Button>
        </div>
        <ol className="space-y-3 mb-6">
          {result.resolution_steps.map((step, index) => (
            <li key={index} className="flex gap-3">
              <span className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                {index + 1}
              </span>
              <p className="flex-1 pt-1 leading-relaxed">{step}</p>
            </li>
          ))}
        </ol>
        
        {/* Regenerate Steps Section */}
        {onRegenerateSteps && (
          <div className="border-t pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="h-4 w-4 text-primary" />
                <Label className="text-sm font-semibold">Need different steps? Ask a specific question:</Label>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-3">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  💡 <strong>Examples:</strong> "What if the user doesn't have admin rights?", "What about Mac users?", "Steps for older Windows versions?"
                </p>
              </div>
              <div className="flex gap-3">
                <Textarea
                  placeholder="Type your specific question or scenario here..."
                  value={userQuestion}
                  onChange={(e) => setUserQuestion(e.target.value)}
                  className="flex-1 min-h-[80px] resize-none"
                  disabled={isRegenerating}
                />
                <Button
                  onClick={handleRegenerateSteps}
                  disabled={!userQuestion.trim() || isRegenerating}
                  className="px-4 h-fit self-end"
                >
                  {isRegenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {feedbackSubmitted && (
                <div className="text-xs text-muted-foreground">
                  💡 Since the previous solution was escalated, try asking about alternative approaches or specific user scenarios.
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Work Note */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Work Note</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard(result.work_note, "Work note")}
            className="gap-2"
          >
            <Copy className="h-4 w-4" />
            Copy
          </Button>
        </div>
        <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap">
          {result.work_note}
        </div>
      </Card>

      {/* Follow-up Questions */}
      {result.follow_up_questions && result.follow_up_questions.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="h-5 w-5 text-info" />
            <h3 className="text-lg font-bold">Follow-up Questions</h3>
          </div>
          <ul className="space-y-2">
            {result.follow_up_questions.map((question, index) => (
              <li key={index} className="flex gap-2 items-start">
                <span className="text-info mt-1">•</span>
                <p className="flex-1">{question}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Escalation */}
      <Card className="p-6 border-accent/50 bg-accent/5">
        <div className="flex items-center gap-2 mb-4">
          <ArrowUpCircle className="h-5 w-5 text-accent" />
          <h3 className="text-lg font-bold">Escalation Guidance</h3>
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold text-muted-foreground mb-1">WHEN TO ESCALATE</p>
            <p className="leading-relaxed">{result.escalation.when}</p>
          </div>
          <Separator />
          <div>
            <p className="text-sm font-semibold text-muted-foreground mb-1">ESCALATE TO</p>
            <Badge variant="outline" className="text-accent border-accent">
              {result.escalation.to}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Feedback Form */}
      {showFeedback && !feedbackSubmitted && (
        <FeedbackForm
          issue={result.root_cause}
          resolution={result.resolution_steps.join(". ")}
          confidence={result.confidence}
          onFeedbackSubmitted={handleFeedbackSubmitted}
        />
      )}

      {/* Success Message */}
      {feedbackSubmitted && (
        <Card className="p-4 bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800">
          <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm font-medium">
              Thank you! Your feedback helps Fixie learn and improve.
            </span>
          </div>
        </Card>
      )}
    </div>
  );
}
