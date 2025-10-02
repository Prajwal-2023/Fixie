import { useState } from "react";
import { TroubleshootForm, FormData } from "@/components/TroubleshootForm";
import { TroubleshootResult, TroubleshootResultData } from "@/components/TroubleshootResult";
import { AlertCircle, Wrench } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground">
              <Wrench className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Fixie</h1>
              <p className="text-sm text-muted-foreground">AI-Powered Service Desk Assistant</p>
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
          {result && <TroubleshootResult result={result} />}
        </div>
      </main>
    </div>
  );
};

export default Index;
