import { useState } from "react";
import { Check, RefreshCw, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ReviewStepProps {
  title: string;
  subtitle: string;
  content?: string;
  imageUrl?: string | null;
  onApprove: () => void;
  onRevise: (feedback: string) => void;
  isLoading: boolean;
}

export function ReviewStep({ title, subtitle, content, imageUrl, onApprove, onRevise, isLoading }: ReviewStepProps) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState("");

  const handleRevise = () => {
    if (!feedback.trim()) return;
    onRevise(feedback);
    setFeedback("");
    setShowFeedback(false);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-display font-bold tracking-tight">{title}</h2>
        <p className="text-muted-foreground">{subtitle}</p>
      </div>

      <div className="glass-card rounded-lg overflow-hidden">
        {imageUrl && (
          <div className="p-4 flex justify-center bg-muted/30">
            <img
              src={imageUrl}
              alt="Generated poster"
              className="max-h-[400px] rounded-md object-contain"
            />
          </div>
        )}
        {content && (
          <div className="p-6">
            <div className="bg-background/50 rounded-md p-4 border border-border/30">
              <pre className="whitespace-pre-wrap font-body text-sm leading-relaxed">{content}</pre>
            </div>
          </div>
        )}

        <div className="p-6 pt-0 space-y-4">
          {showFeedback && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MessageSquare className="h-4 w-4" />
                <span>What needs to be improved?</span>
              </div>
              <Textarea
                placeholder="Describe the changes you'd like..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="min-h-[80px] resize-none bg-background/50 border-border/50"
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleRevise}
                  disabled={isLoading || !feedback.trim()}
                  size="sm"
                  className="gap-2"
                >
                  {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                  Regenerate
                </Button>
                <Button
                  onClick={() => setShowFeedback(false)}
                  variant="ghost"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {!showFeedback && (
            <div className="flex gap-3">
              <Button
                onClick={onApprove}
                disabled={isLoading}
                className="gap-2 flex-1 font-display font-semibold"
                size="lg"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Approve
              </Button>
              <Button
                onClick={() => setShowFeedback(true)}
                variant="outline"
                className="gap-2 flex-1 font-display"
                size="lg"
              >
                <RefreshCw className="h-4 w-4" />
                Revise
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
