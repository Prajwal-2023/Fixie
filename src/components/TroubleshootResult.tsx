import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Clock,
  TrendingUp,
  MessageSquare,
  ArrowUpCircle
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
}

interface TroubleshootResultProps {
  result: TroubleshootResultData;
}

export function TroubleshootResult({ result }: TroubleshootResultProps) {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
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

      {/* Resolution Steps */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <h3 className="text-lg font-bold">Resolution Steps</h3>
          </div>
        </div>
        <ol className="space-y-3">
          {result.resolution_steps.map((step, index) => (
            <li key={index} className="flex gap-3">
              <span className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                {index + 1}
              </span>
              <p className="flex-1 pt-1 leading-relaxed">{step}</p>
            </li>
          ))}
        </ol>
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
    </div>
  );
}
