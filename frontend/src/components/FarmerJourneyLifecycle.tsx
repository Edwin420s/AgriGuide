import React from 'react';
import {
  Eye,
  Activity,
  Zap,
  Play,
  RotateCcw,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { TabType } from './Sidebar';

export type JourneyStage = 'observe' | 'understand' | 'decide' | 'act' | 'learn';

interface FarmerJourneyLifecycleProps {
  currentStage?: JourneyStage;
  onNavigateTab: (tab: TabType) => void;
  onOpenObservation?: () => void;
  compact?: boolean;
}

interface StageStep {
  key: JourneyStage;
  num: number;
  label: string;
  tagline: string;
  tab: TabType;
  icon: React.ReactNode;
}

export const FarmerJourneyLifecycle: React.FC<FarmerJourneyLifecycleProps> = ({
  currentStage = 'decide',
  onNavigateTab,
  onOpenObservation,
  compact = false
}) => {
  const steps: StageStep[] = [
    {
      key: 'observe',
      num: 1,
      label: 'Observe',
      tagline: 'Sensors & Field Signs',
      tab: 'record-obs',
      icon: <Eye size={15} />
    },
    {
      key: 'understand',
      num: 2,
      label: 'Understand',
      tagline: 'ETc, Soil & Weather',
      tab: 'weather-sensors',
      icon: <Activity size={15} />
    },
    {
      key: 'decide',
      num: 3,
      label: 'Decide',
      tagline: 'Symbolic MeTTa Rules',
      tab: 'field-intel',
      icon: <Zap size={15} />
    },
    {
      key: 'act',
      num: 4,
      label: 'Act',
      tagline: 'Irrigation & Guardrails',
      tab: 'multi-domain',
      icon: <Play size={15} />
    },
    {
      key: 'learn',
      num: 5,
      label: 'Learn',
      tagline: 'Outcome & Calibration',
      tab: 'learning',
      icon: <RotateCcw size={15} />
    }
  ];

  const handleStepClick = (step: StageStep) => {
    if (step.key === 'observe' && onOpenObservation) {
      onOpenObservation();
    } else {
      onNavigateTab(step.tab);
    }
  };

  return (
    <div className={`farmer-journey-strip ${compact ? 'compact' : ''}`}>
      <div className="journey-eyebrow">
        <span className="journey-badge">
          <CheckCircle2 size={12} />
          <span>FARM INTELLIGENCE LIFECYCLE</span>
        </span>
        <span className="journey-desc">
          Continuous loop: Observe field telemetry → Reason symbolically → Act safely → Calibrate from outcomes
        </span>
      </div>

      <div className="journey-steps-container">
        {steps.map((step, idx) => {
          const isActive = step.key === currentStage;
          const isPast = steps.findIndex(s => s.key === currentStage) > idx;

          return (
            <React.Fragment key={step.key}>
              <button
                type="button"
                className={`journey-step-btn ${isActive ? 'active' : ''} ${isPast ? 'past' : ''}`}
                onClick={() => handleStepClick(step)}
                title={`Go to Step ${step.num}: ${step.label} (${step.tagline})`}
              >
                <div className="step-num-bubble">
                  {step.icon}
                  <span className="num-text">{step.num}</span>
                </div>
                <div className="step-text-wrap">
                  <span className="step-title">{step.label}</span>
                  {!compact && <span className="step-tagline">{step.tagline}</span>}
                </div>
              </button>
              {idx < steps.length - 1 && (
                <div className={`journey-step-divider ${isPast ? 'active' : ''}`}>
                  <ArrowRight size={13} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
