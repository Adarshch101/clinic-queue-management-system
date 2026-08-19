'use client';

import * as React from 'react';
import { CheckCircle2, Clock, PlayCircle, HelpCircle, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

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
        return <HelpCircle className="w-5 h-5 text-muted-foreground" />;
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />;
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
                  className={cn('w-0.5 flex-1 my-1.5 rounded-full', getLineColor(step.status))}
                />
              )}
            </div>

            {/* Content card */}
            <div className="pb-8 pt-0.5 flex-1">
              <div className="flex justify-between items-start gap-4">
                <h4
                  className={cn(
                    'font-bold text-xs',
                    step.status === 'current'
                      ? 'text-primary font-black'
                      : step.status === 'completed'
                      ? 'text-foreground'
                      : 'text-secondary-foreground'
                  )}
                >
                  {step.title}
                </h4>
                {step.time && (
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                    {step.time}
                  </span>
                )}
              </div>
              <p className="text-xs text-secondary-foreground mt-1 max-w-md leading-relaxed">
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