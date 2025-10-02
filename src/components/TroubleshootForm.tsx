import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface TroubleshootFormProps {
  onSubmit: (data: FormData) => void;
  isLoading: boolean;
}

export interface FormData {
  issue: string;
  symptoms: string;
  device_info: string;
  steps_taken: string;
}

export function TroubleshootForm({ onSubmit, isLoading }: TroubleshootFormProps) {
  const [formData, setFormData] = useState<FormData>({
    issue: "",
    symptoms: "",
    device_info: "",
    steps_taken: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="issue" className="text-base font-semibold">
            Issue Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="issue"
            placeholder="e.g., Headphones not working"
            value={formData.issue}
            onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="symptoms" className="text-base font-semibold">
            Symptoms <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="symptoms"
            placeholder="e.g., No audio in Teams, Windows sound shows device connected"
            value={formData.symptoms}
            onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
            required
            disabled={isLoading}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="device_info" className="text-base font-semibold">
            Device Info
          </Label>
          <Input
            id="device_info"
            placeholder="e.g., Windows 11, Teams v1.6, USB Headset Model X"
            value={formData.device_info}
            onChange={(e) => setFormData({ ...formData, device_info: e.target.value })}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="steps_taken" className="text-base font-semibold">
            Steps Already Taken
          </Label>
          <Textarea
            id="steps_taken"
            placeholder="e.g., Checked Windows sound settings, restarted Teams"
            value={formData.steps_taken}
            onChange={(e) => setFormData({ ...formData, steps_taken: e.target.value })}
            disabled={isLoading}
            rows={2}
          />
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing Issue...
            </>
          ) : (
            "Diagnose & Troubleshoot"
          )}
        </Button>
      </form>
    </Card>
  );
}
