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
      // For now, let's create mock regenerated steps based on the user's question
      // This simulates the API call while the backend function is being fixed
      const mockRegeneratedSteps = [
        `Based on your question: "${question}"`,
        "Alternative approach: Check if this specific scenario applies",
        "If the previous steps didn't work, try this modified approach",
        "Consider escalating to L2 if this alternative doesn't resolve the issue",
        "Document the specific scenario for future reference"
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      setResult({ 
        ...result, 
        resolution_steps: mockRegeneratedSteps,
        confidence: Math.max(result.confidence - 10, 60) // Slightly lower confidence for alternative steps
      });
      
      toast.success("Generated alternative resolution steps based on your question");
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
