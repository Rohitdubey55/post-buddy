import { WorkflowStep } from "@/hooks/useWorkflow";
import { FileText, Image, Send, PenLine } from "lucide-react";

const steps = [
  { id: 'input' as const, label: 'Create', icon: PenLine },
  { id: 'post-review' as const, label: 'Post', icon: FileText },
  { id: 'poster-review' as const, label: 'Poster', icon: Image },
  { id: 'publish' as const, label: 'Publish', icon: Send },
];

const stepOrder: WorkflowStep[] = ['input', 'post-review', 'poster-review', 'publish'];

interface StepIndicatorProps {
  currentStep: WorkflowStep;
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const currentIndex = stepOrder.indexOf(currentStep);

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      {steps.map((step, index) => {
        const isActive = index === currentIndex;
        const isComplete = index < currentIndex;
        const Icon = step.icon;

        return (
          <div key={step.id} className="flex items-center gap-1 sm:gap-2">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-display font-semibold transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground glow-primary'
                  : isComplete
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              <Icon className="h-3 w-3" />
              <span className="hidden sm:inline">{step.label}</span>
            </div>
            {index < steps.length - 1 && (
              <div className={`w-4 sm:w-8 h-px ${index < currentIndex ? 'bg-primary' : 'bg-border'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
