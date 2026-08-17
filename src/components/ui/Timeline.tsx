'use client';

import React from 'react';
import { CheckCircle2, Clock, PlayCircle, HelpCircle, ShieldAlert } from 'lucide-react';

export interface TimelineStep {
  title: string;
  description: string;
  time?: string;
  status: 'completed' | 'current' | 'upcoming' | 'skipped' | 'warning';
}

export interface TimelineProps {
  steps: TimelineStep[];
}

export const Timeline: React.FC<TimelineProps> = ({ steps }) => {
  const getIcon = (status: TimelineStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-success" />;
      case 'current':
        return <PlayCircle className="w-5 h-5 text-primary animate-pulse" />;
      case 'warning':
        return <ShieldAlert className="w-5 h-5 text-warning animate-bounce" />;
      case 'skipped':
        return <HelpCircle className="w-5 h-5 text-text-muted" />;
      default:
        return <Clock className="w-5 h-5 text-text-muted" />;
    }
  };

  const getLineColor = (status: TimelineStep['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-success';
      case 'current':
        return 'bg-primary';
      case 'warning':
        return 'bg-warning';
      default:
        return 'bg-border-subtle';
    }
  };

  return (
    <div className="flex flex-col">
      {steps.map((step, idx) => {
        const isLast = idx === steps.length - 1;
        return (
          <div key={idx} className="flex gap-4 relative">
            {/* Left line tracker */}
            <div className="flex flex-col items-center shrink-0">
              <div className="z-10 bg-bg-base p-0.5 rounded-full">{getIcon(step.status)}</div>
              {!isLast && (
                <div
                  className={`w-0.5 flex-1 my-1.5 rounded-full ${getLineColor(step.status)}`}
                />
              )}
            </div>

            {/* Content card */}
            <div className="pb-8 pt-0.5 flex-1">
              <div className="flex justify-between items-start gap-4">
                <h4
                  className={`font-bold text-xs ${
                    step.status === 'current'
                      ? 'text-primary font-black'
                      : step.status === 'completed'
                      ? 'text-text-primary'
                      : 'text-text-secondary'
                  }`}
                >
                  {step.title}
                </h4>
                {step.time && (
                  <span className="text-[10px] font-semibold text-text-muted uppercase">
                    {step.time}
                  </span>
                )}
              </div>
              <p className="text-xs text-text-secondary mt-1 max-w-md leading-relaxed">
                {step.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
export default Timeline;
