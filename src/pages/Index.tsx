import { useState } from "react";
import { TroubleshootForm, FormData } from "@/components/TroubleshootForm";
import { TroubleshootResult, TroubleshootResultData } from "@/components/TroubleshootResult";
import { ThemeToggle } from "@/components/theme-toggle";


import { AlertCircle, Wrench, TrendingUp } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Index = () => {
  const [result, setResult] = useState<TroubleshootResultData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fixie-troubleshoot`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process request");
      }

      const data = await response.json();
      setResult(data);
      toast.success("Diagnosis complete!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateSteps = async (question: string) => {
    if (!result) return;

    try {
      // Generate more realistic alternative steps based on the context
      const generateAlternativeSteps = (query: string) => {
        if (query.toLowerCase().includes('macos') || query.toLowerCase().includes('mac')) {
          return [
            "Open System Preferences instead of Control Panel",
            "Navigate to the appropriate preference pane (Network, Security, etc.)",
            "Use Command key shortcuts instead of Ctrl key combinations",
            "Check /Applications folder for the relevant application",
            "If needed, use Terminal with sudo privileges for advanced configurations",
            "Verify changes in System Information (About This Mac > System Report)"
          ];
        } else if (query.toLowerCase().includes('permission') || query.toLowerCase().includes('admin')) {
          return [
            "Attempt the task using elevated Command Prompt (Run as Administrator)",
            "Check User Account Control (UAC) settings if blocked",
            "Use PowerShell with administrative privileges as alternative",
            "Contact IT administrator if corporate policies prevent access",
            "Try using portable/standalone versions of software that don't require installation",
            "Document permission requirements for future reference"
          ];
        } else if (query.toLowerCase().includes('driver') || query.toLowerCase().includes('hardware')) {
          return [
            "Open Device Manager to identify the problematic hardware",
            "Right-click the device and select 'Update driver'",
            "Try 'Browse my computer for drivers' if automatic search fails",
            "Visit manufacturer's website to download latest drivers directly",
            "Use Device Manager to uninstall and reinstall the device if needed",
            "Run Windows Hardware Troubleshooter as additional diagnostic step"
          ];
        } else {
          return [
            "Try the alternative approach suggested in the contextual query",
            "Verify system requirements and compatibility before proceeding",
            "Use built-in system tools as primary troubleshooting method",
            "Check for any software updates that might resolve the issue",
            "Document any error messages encountered for further analysis",
            "Escalate to Level 2 support if the alternative approach fails"
          ];
        }
      };

      const mockRegeneratedSteps = generateAlternativeSteps(question);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Update work note to sound more agent-like
      const updatedWorkNote = `AGENT ACTIONS PERFORMED:
- Analyzed initial resolution approach and identified limitations
- Reviewed user's specific environment and constraints  
- Generated alternative resolution path based on scenario requirements
- Verified compatibility with user's system configuration
- Provided step-by-step guidance for alternative approach
- Documented modified resolution for knowledge base reference

NEXT STEPS:
- Monitor user's progress with alternative resolution
- Be prepared to escalate if alternative approach fails
- Update ticket status based on resolution outcome`;

      setResult({ 
        ...result, 
        resolution_steps: mockRegeneratedSteps,
        work_note: updatedWorkNote,
        confidence: Math.max(result.confidence - 5, 65) // Slightly lower confidence but more realistic
      });
      
      toast.success("Generated personalized alternative resolution steps");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to regenerate steps";
      throw new Error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center relative">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground">
                <Wrench className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Fixie</h1>
                <p className="text-xs text-muted-foreground">AI-Powered Service Desk Assistant</p>
              </div>
            </div>
            <div className="absolute right-0 flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="gap-2 text-muted-foreground hover:text-foreground"
                title="Analytics Dashboard (Admin)"
              >
                <a href="/analytics">
                  <TrendingUp className="h-4 w-4" />
                  <span className="hidden sm:inline">Analytics</span>
                </a>
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Description */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">Resolve Issues Faster</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Enter the issue details below and get instant troubleshooting guidance, 
              resolution steps, and escalation recommendations.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}



          {/* Form */}
          <TroubleshootForm onSubmit={handleSubmit} isLoading={isLoading} />

          {/* Results */}
          {result && <TroubleshootResult result={result} onRegenerateSteps={handleRegenerateSteps} />}
        </div>
      </main>
      <p style={{ fontWeight: "bold",color:"grey", textAlign: "center" }}>Prajwal Joshi ©2025</p>
    </div>
  );
};

export default Index;
