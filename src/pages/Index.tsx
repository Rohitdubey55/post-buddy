import { useWorkflow } from "@/hooks/useWorkflow";
import { InputStep } from "@/components/InputStep";
import { ReviewStep } from "@/components/ReviewStep";
import { PublishStep } from "@/components/PublishStep";
import { StepIndicator } from "@/components/StepIndicator";
import { Bot, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const workflow = useWorkflow();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg leading-tight">TelePost</h1>
              <p className="text-xs text-muted-foreground">AI Telegram Publisher</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <StepIndicator currentStep={workflow.step} />
            {workflow.step !== 'input' && (
              <Button variant="ghost" size="sm" onClick={workflow.reset} className="gap-1.5 text-muted-foreground">
                <RotateCcw className="h-3 w-3" />
                <span className="hidden sm:inline">Reset</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        {workflow.step === 'input' && (
          <InputStep
            onSubmit={(text, imageUrl) => workflow.generatePost(text, imageUrl)}
            isLoading={workflow.isLoading}
          />
        )}

        {workflow.step === 'post-review' && (
          <ReviewStep
            title="Review Your Post"
            subtitle="AI has crafted your Telegram post. Approve it or request changes."
            content={workflow.generatedPost}
            onApprove={workflow.approvePost}
            onRevise={workflow.revisePost}
            isLoading={workflow.isLoading}
          />
        )}

        {workflow.step === 'poster-review' && (
          <ReviewStep
            title="Review Your Poster"
            subtitle="AI generated a poster for your post. Approve or request changes."
            imageUrl={workflow.posterUrl}
            onApprove={workflow.approvePoster}
            onRevise={workflow.revisePoster}
            isLoading={workflow.isLoading}
          />
        )}

        {workflow.step === 'publish' && (
          <PublishStep
            onPost={workflow.sendToTelegram}
            fetchGroups={workflow.fetchGroups}
            isLoading={workflow.isLoading}
          />
        )}
      </main>
    </div>
  );
};

export default Index;
