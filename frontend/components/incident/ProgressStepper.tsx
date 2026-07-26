'use client';

import React from 'react';
import { Check } from 'lucide-react';

interface ProgressStepperProps {
  currentStep: number;
  onStepClick: (step: number) => void;
  maxCompletedStep: number;
}

const steps = [
  { id: 1, label: 'Incident Info' },
  { id: 2, label: 'Location' },
  { id: 3, label: 'Upload Evidence' },
  { id: 4, label: 'Reporter Details' },
  { id: 5, label: 'Review & Submit' },
];

export const ProgressStepper: React.FC<ProgressStepperProps> = ({
  currentStep,
  onStepClick,
  maxCompletedStep,
}) => {
  return (
    <div className="sticky top-0 z-30 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 py-3.5 px-4 shadow-lg">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {steps.map((s, idx) => {
          const isCompleted = s.id < currentStep || s.id <= maxCompletedStep;
          const isCurrent = s.id === currentStep;

          return (
            <React.Fragment key={s.id}>
              <div
                onClick={() => {
                  if (s.id <= maxCompletedStep + 1) {
                    onStepClick(s.id);
                  }
                }}
                className={`flex items-center gap-2 cursor-pointer transition-all ${
                  s.id <= maxCompletedStep + 1 ? 'opacity-100' : 'opacity-40 cursor-not-allowed'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-all ${
                    isCurrent
                      ? 'bg-red-600 text-white shadow-lg shadow-red-600/40 ring-4 ring-red-600/20 scale-105'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                  }`}
                >
                  {isCompleted && !isCurrent ? <Check className="w-4 h-4" /> : s.id}
                </div>
                <span
                  className={`hidden md:inline text-xs font-medium ${
                    isCurrent ? 'text-red-400 font-semibold' : isCompleted ? 'text-slate-200' : 'text-slate-500'
                  }`}
                >
                  {s.label}
                </span>
              </div>

              {idx < steps.length - 1 && (
                <div className="flex-1 mx-2 hidden sm:block">
                  <div
                    className={`h-0.5 rounded-full transition-all ${
                      s.id < currentStep ? 'bg-emerald-500' : 'bg-zinc-800'
                    }`}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
