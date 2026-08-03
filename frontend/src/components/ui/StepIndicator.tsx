import React from "react";
import { Check } from "lucide-react";

export interface StepConfig {
  label: string;
  description?: string;
}

interface StepIndicatorProps {
  steps: StepConfig[];
  currentStep: number; // 0-indexed
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between relative">
        {/* Connector line */}
        <div
          className="absolute top-5 left-0 right-0 h-0.5 bg-border/60"
          style={{ zIndex: 0 }}
        />
        {/* Progress fill */}
        <div
          className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-500 ease-out"
          style={{
            width: steps.length > 1
              ? `${(currentStep / (steps.length - 1)) * 100}%`
              : "0%",
            zIndex: 1,
          }}
        />

        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;

          return (
            <div
              key={index}
              className="flex flex-col items-center gap-2 relative z-10"
              style={{ flex: "1 1 0", minWidth: 0 }}
            >
              {/* Circle */}
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                  border-2 transition-all duration-300 shadow-sm
                  ${isCompleted
                    ? "bg-primary border-primary text-white scale-100"
                    : isActive
                      ? "bg-white border-primary text-primary scale-110 shadow-md ring-4 ring-primary/10"
                      : "bg-surface border-border text-muted"
                  }
                `}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" strokeWidth={3} />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>

              {/* Label */}
              <div className="text-center px-1 hidden sm:block">
                <p
                  className={`text-xs font-semibold leading-tight transition-colors duration-200 ${
                    isActive
                      ? "text-primary"
                      : isCompleted
                        ? "text-primary/70"
                        : "text-muted"
                  }`}
                >
                  {step.label}
                </p>
                {step.description && (
                  <p className="text-[10px] text-muted mt-0.5 leading-tight">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile: current step label */}
      <div className="sm:hidden mt-3 text-center">
        <p className="text-sm font-semibold text-primary">
          Langkah {currentStep + 1} dari {steps.length}: {steps[currentStep]?.label}
        </p>
        {steps[currentStep]?.description && (
          <p className="text-xs text-muted mt-0.5">{steps[currentStep].description}</p>
        )}
      </div>
    </div>
  );
}
