import { Link } from 'react-router-dom';
import { Check, Search, Send, Inbox, GitCompare, ThumbsUp, FileText, CheckCircle, Star } from 'lucide-react';

const STEPS = [
  { label: 'Search Vendors', icon: Search, path: '/search', description: 'Find suppliers' },
  { label: 'Send RFQ', icon: Send, path: '/rfq', description: 'Request quotes' },
  { label: 'Await Quotes', icon: Inbox, path: '/quotes', description: 'Vendors respond' },
  { label: 'Compare', icon: GitCompare, path: '/quotes', description: 'Evaluate offers' },
  { label: 'Shortlist', icon: Star, path: '/quotes', description: 'Select best quote' },
  { label: 'Issue Tender', icon: FileText, path: '/tenders', description: 'Award the contract' },
  { label: 'Acknowledged', icon: ThumbsUp, path: '/tenders', description: 'Vendor confirms' },
  { label: 'Complete', icon: CheckCircle, path: '/tenders', description: 'Order fulfilled' },
];

interface ProcurementTrackerProps {
  currentStep: number; // 0-indexed
}

export function ProcurementTracker({ currentStep }: ProcurementTrackerProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-900">Procurement Pipeline</h2>
        <span className="text-xs text-gray-400">Step {currentStep + 1} of {STEPS.length}</span>
      </div>
      <div className="flex items-start gap-0 overflow-x-auto pb-1">
        {STEPS.map((step, i) => {
          const isCompleted = i < currentStep;
          const isActive = i === currentStep;
          const Icon = step.icon;

          return (
            <div key={step.label} className="flex items-start min-w-0">
              <Link to={step.path} className="flex flex-col items-center gap-1.5 px-2 group">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                    isCompleted
                      ? 'bg-brand-500 text-white'
                      : isActive
                      ? 'bg-brand-600 text-white ring-4 ring-brand-100'
                      : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <div className="text-center">
                  <div className={`text-[10px] font-medium whitespace-nowrap ${isActive ? 'text-brand-700' : isCompleted ? 'text-gray-600' : 'text-gray-400'}`}>
                    {step.label}
                  </div>
                  {isActive && <div className="text-[9px] text-brand-500 whitespace-nowrap">{step.description}</div>}
                </div>
              </Link>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 w-6 mt-4 flex-shrink-0 ${i < currentStep ? 'bg-brand-400' : 'bg-gray-200'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Determine the current procurement step from available data
export function getProcurementStep(data: {
  hasSearch?: boolean;
  hasRFQ?: boolean;
  hasQuotes?: boolean;
  hasShortlisted?: boolean;
  hasTender?: boolean;
  tenderIssued?: boolean;
  tenderAcknowledged?: boolean;
  tenderComplete?: boolean;
}): number {
  if (data.tenderComplete) return 7;
  if (data.tenderAcknowledged) return 6;
  if (data.tenderIssued) return 5;
  if (data.hasTender) return 5;
  if (data.hasShortlisted) return 4;
  if (data.hasQuotes) return 3;
  if (data.hasRFQ) return 2;
  if (data.hasSearch) return 1;
  return 0;
}
