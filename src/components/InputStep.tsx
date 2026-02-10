import { useState } from "react";
import { Send, ImageIcon, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface InputStepProps {
  onSubmit: (text: string, imageUrl?: string) => void;
  isLoading: boolean;
}

export function InputStep({ onSubmit, isLoading }: InputStepProps) {
  const [text, setText] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const handleSubmit = () => {
    if (!text.trim() && !imageUrl.trim()) return;
    onSubmit(text, imageUrl || undefined);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-display font-bold tracking-tight">
          Create a New Post
        </h2>
        <p className="text-muted-foreground">
          Describe your post idea or paste an image URL. AI will craft the perfect Telegram post.
        </p>
      </div>

      <div className="glass-card rounded-lg p-6 space-y-4">
        <Textarea
          placeholder="What do you want to post about? Describe your idea, share news, or paste content..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[140px] resize-none bg-background/50 border-border/50 focus:border-primary/50 transition-colors text-base"
        />

        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
            <input
              type="url"
              placeholder="Image URL (optional)"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={isLoading || (!text.trim() && !imageUrl.trim())}
            className="gap-2 font-display font-semibold"
            size="lg"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Generate Post
          </Button>
        </div>
      </div>
    </div>
  );
}
