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
  Loader2,
  HelpCircle,
  ChevronRight,
  RotateCcw
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

// Define the wizard flow structure
interface WizardStep {
  id: string;
  question: string;
  options: { label: string; nextStep: string | null; generateQuery?: string }[];
}

const wizardFlow: WizardStep[] = [
  {
    id: "start",
    question: "Is the user having trouble following these steps?",
    options: [
      { label: "Yes, steps are unclear", nextStep: "clarity" },
      { label: "No, but steps don't work", nextStep: "not-working" },
      { label: "User lacks permissions", nextStep: "permissions" },
      { label: "Different user scenario", nextStep: "scenario" }
    ]
  },
  {
    id: "clarity",
    question: "What type of clarification is needed?",
    options: [
      { label: "More detailed steps", nextStep: null, generateQuery: "The user needs more detailed instructions. Break down each step into smaller sub-steps, include what exactly to click/type, and mention what they should expect to see at each stage." },
      { label: "Simpler language", nextStep: null, generateQuery: "The user needs simpler, non-technical language. Remove jargon, explain technical terms, and use everyday language that a beginner can understand." },
      { label: "Visual guide needed", nextStep: null, generateQuery: "The user needs visual guidance. Describe what buttons/menus look like, their locations on screen, and provide clear visual landmarks for each step." }
    ]
  },
  {
    id: "not-working",
    question: "What's happening when they try the steps?",
    options: [
      { label: "Error messages appear", nextStep: "errors" },
      { label: "Nothing happens", nextStep: null, generateQuery: "The user followed these steps exactly but nothing happened - no changes, no responses, no progress. Provide troubleshooting steps to diagnose why the steps aren't taking effect and offer alternative approaches that might work better." },
      { label: "Different result than expected", nextStep: null, generateQuery: "The user completed the steps but got different results than expected. Provide common reasons why this happens and alternative methods to achieve the intended outcome." }
    ]
  },
  {
    id: "errors",
    question: "What type of error are they seeing?",
    options: [
      { label: "Permission denied", nextStep: null, generateQuery: "The user gets 'Permission Denied' or 'Access Denied' errors when trying these steps. Provide alternative approaches that work without administrator privileges, or explain how to safely elevate permissions if needed." },
      { label: "File not found", nextStep: null, generateQuery: "The user gets 'File Not Found' or 'Path Not Found' errors. The files or folders mentioned in the steps don't exist on their system. Provide alternative file locations and ways to find the correct paths." },
      { label: "System/app crashes", nextStep: null, generateQuery: "The system, application, or process crashes when the user tries these steps. Provide safer alternative methods that won't cause crashes and include recovery steps if crashes occur." }
    ]
  },
  {
    id: "permissions",
    question: "What type of permissions issue?",
    options: [
      { label: "No admin rights", nextStep: null, generateQuery: "The user doesn't have administrator/root privileges on their system. Modify these steps to work with standard user permissions, or provide clear instructions on how to safely request elevated access from their IT team." },
      { label: "Account restrictions", nextStep: null, generateQuery: "The user's account has corporate or parental restrictions that prevent them from completing these steps. Provide workarounds that respect these security constraints while still solving the problem." },
      { label: "System policies block action", nextStep: null, generateQuery: "Group policies, security software, or system restrictions are blocking the user from completing these steps. Provide alternative approaches that work within these policy constraints." }
    ]
  },
  {
    id: "scenario",
    question: "What's different about their setup?",
    options: [
      { label: "Different operating system", nextStep: "os" },
      { label: "Older software version", nextStep: null, generateQuery: "The user is running an older version of the software/application. The current steps may not work with legacy versions. Adapt these steps to work with older versions, including different menu locations and feature availability." },
      { label: "Corporate/managed environment", nextStep: null, generateQuery: "The user is in a corporate or managed environment with IT restrictions, security policies, and limited user privileges. Modify these steps to work within enterprise constraints while maintaining security compliance." }
    ]
  },
  {
    id: "os",
    question: "Which operating system?",
    options: [
      { label: "macOS", nextStep: null, generateQuery: "The user is on macOS. Adapt these Windows-based steps for Mac users, including Mac-specific keyboard shortcuts (Cmd instead of Ctrl), file paths (/Users/ instead of C:\\Users\\), application locations (Applications folder, System Preferences), and macOS-specific terminology." },
      { label: "Linux", nextStep: null, generateQuery: "The user is on Linux. Adapt these steps for Linux users, including terminal commands, package managers (apt, yum, pacman), file paths (/home/ instead of C:\\Users\\), and different desktop environments (GNOME, KDE, etc.)." },
      { label: "Mobile (iOS/Android)", nextStep: null, generateQuery: "The user is on a mobile device (iOS or Android). Adapt these desktop steps for mobile interfaces, including touch gestures, mobile app locations, settings menus, and mobile-specific limitations." }
    ]
  }
];

export function TroubleshootResult({ result, onRegenerateSteps }: TroubleshootResultProps) {
  const [userQuestion, setUserQuestion] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showFeedback, setShowFeedback] = useState(true);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  
  // Wizard state
  const [showWizard, setShowWizard] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>("start");
  const [wizardHistory, setWizardHistory] = useState<string[]>([]);

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
      // Show the wizard when routed
      toast.info("💡 Use the Smart Assistant below to get alternative steps");
      setShowWizard(true);
    }
  };

  // Wizard functions
  const getCurrentStepData = () => wizardFlow.find(step => step.id === currentStep);
  
  const handleWizardOption = async (option: { label: string; nextStep: string | null; generateQuery?: string }) => {
    if (option.generateQuery && onRegenerateSteps) {
      // Generate new steps based on the query with original context
      setIsRegenerating(true);
      try {
        // Create a comprehensive query that includes the original resolution steps
        const contextualQuery = `Original issue: ${result.root_cause}

Original resolution steps:
${result.resolution_steps.map((step, index) => `${index + 1}. ${step}`).join('\n')}

User's specific situation: ${option.generateQuery}

Please adapt the above resolution steps specifically for this user's scenario. Keep the same problem-solving approach but modify the steps to work in their specific situation. Provide practical, actionable steps that directly address both the original issue and their specific constraints.`;

        await onRegenerateSteps(contextualQuery);
        setShowWizard(false);
        setCurrentStep("start");
        setWizardHistory([]);
        toast.success("🎯 Steps customized for your specific scenario!");
      } catch (error) {
        toast.error("Failed to generate alternative steps");
      } finally {
        setIsRegenerating(false);
      }
    } else if (option.nextStep) {
      // Move to next step in wizard
      setWizardHistory([...wizardHistory, currentStep]);
      setCurrentStep(option.nextStep);
    }
  };

  const handleWizardBack = () => {
    if (wizardHistory.length > 0) {
      const previousStep = wizardHistory[wizardHistory.length - 1];
      setCurrentStep(previousStep);
      setWizardHistory(wizardHistory.slice(0, -1));
    }
  };

  const resetWizard = () => {
    setCurrentStep("start");
    setWizardHistory([]);
    setShowWizard(false);
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
        
        {/* Smart Assistant Section */}
        {onRegenerateSteps && (
          <div className="border-t pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-primary" />
                  <Label className="text-sm font-semibold">🧠 Smart Assistant - Get Alternative Steps</Label>
                </div>
                {!showWizard && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowWizard(true)}
                    className="gap-2"
                  >
                    <MessageSquare className="h-3 w-3" />
                    Start Assistant
                  </Button>
                )}
              </div>

              {!showWizard && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                    💡 Get personalized step alternatives based on your specific situation
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-blue-700 dark:text-blue-300">
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Permission issues</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Different OS versions</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Corporate environments</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Step clarifications</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Smart Wizard Flow */}
              {showWizard && (
                <div className="bg-white dark:bg-gray-900 border-2 border-primary/20 rounded-lg p-4">
                  {getCurrentStepData() && (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-primary">
                          {getCurrentStepData()?.question}
                        </h4>
                        <div className="flex gap-2">
                          {wizardHistory.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleWizardBack}
                              className="h-8 px-2"
                            >
                              ← Back
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={resetWizard}
                            className="h-8 px-2"
                          >
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid gap-2">
                        {getCurrentStepData()?.options.map((option, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            className="justify-between h-auto p-3 text-left"
                            onClick={() => handleWizardOption(option)}
                            disabled={isRegenerating}
                          >
                            <span className="flex-1">{option.label}</span>
                            {isRegenerating ? (
                              <Loader2 className="h-4 w-4 animate-spin ml-2" />
                            ) : (
                              <ChevronRight className="h-4 w-4 ml-2 opacity-50" />
                            )}
                          </Button>
                        ))}
                      </div>

                      {isRegenerating && (
                        <div className="mt-3 text-center text-sm text-muted-foreground">
                          🤖 Generating personalized steps for your scenario...
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Manual Question Input (Fallback) */}
              {showWizard && (
                <div className="border-t pt-4">
                  <Label className="text-xs text-muted-foreground mb-2 block">
                    Or ask a custom question:
                  </Label>
                  <div className="flex gap-3">
                    <Textarea
                      placeholder="Type your specific question or scenario here..."
                      value={userQuestion}
                      onChange={(e) => setUserQuestion(e.target.value)}
                      className="flex-1 min-h-[60px] resize-none text-sm"
                      disabled={isRegenerating}
                    />
                    <Button
                      onClick={async () => {
                        if (!userQuestion.trim() || !onRegenerateSteps) return;
                        
                        setIsRegenerating(true);
                        try {
                          const contextualQuery = `Original issue: ${result.root_cause}

Original resolution steps:
${result.resolution_steps.map((step, index) => `${index + 1}. ${step}`).join('\n')}

User's specific question: ${userQuestion}

Please adapt the above resolution steps to address the user's specific question or scenario. Keep the same problem-solving approach but modify the steps to work in their situation.`;
                          
                          await onRegenerateSteps(contextualQuery);
                          setUserQuestion("");
                          setShowWizard(false);
                          toast.success("🎯 Steps customized based on your question!");
                        } catch (error) {
                          toast.error("Failed to generate alternative steps");
                        } finally {
                          setIsRegenerating(false);
                        }
                      }}
                      disabled={!userQuestion.trim() || isRegenerating}
                      className="px-3 h-fit self-end"
                      size="sm"
                    >
                      {isRegenerating ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Send className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {feedbackSubmitted && !showWizard && (
                <div className="text-xs text-muted-foreground bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                  💡 Since the previous solution was escalated, the Smart Assistant can help you find alternative approaches for specific user scenarios.
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
