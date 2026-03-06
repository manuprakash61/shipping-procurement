import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Loader2 } from 'lucide-react';

interface SearchProgressProps {
  sessionId: string;
  status: string;
  currentMessage: string;
}

const STAGES = [
  { key: 'searching', label: 'Searching the web' },
  { key: 'enriching', label: 'Analyzing vendors' },
  { key: 'verifying', label: 'Verifying emails' },
  { key: 'completed', label: 'Results ready' },
];

function getStageIndex(status: string): number {
  const map: Record<string, number> = {
    PENDING: -1,
    SEARCHING: 0,
    ENRICHING: 1,
    VERIFYING: 2,
    COMPLETED: 3,
    FAILED: 3,
  };
  return map[status] ?? -1;
}

export function SearchProgress({ status, currentMessage }: SearchProgressProps) {
  if (status === 'COMPLETED' || status === 'FAILED') return null;

  const currentStage = getStageIndex(status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
    >
      {/* Progress steps */}
      <div className="flex items-center gap-0 mb-6">
        {STAGES.map((stage, idx) => {
          const isCompleted = idx < currentStage;
          const isActive = idx === currentStage;
          const isPending = idx > currentStage;

          return (
            <div key={stage.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <motion.div
                  animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                    isCompleted
                      ? 'bg-brand-600 border-brand-600'
                      : isActive
                        ? 'bg-white border-brand-400'
                        : 'bg-white border-gray-200'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-4 h-4 text-white" />
                  ) : isActive ? (
                    <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />
                  ) : (
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
                  )}
                </motion.div>
                <span
                  className={`text-xs mt-2 text-center font-medium ${
                    isPending ? 'text-gray-300' : isActive ? 'text-brand-600' : 'text-gray-500'
                  }`}
                >
                  {stage.label}
                </span>
              </div>

              {idx < STAGES.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 mb-5 rounded-full transition-colors ${
                    idx < currentStage ? 'bg-brand-400' : 'bg-gray-100'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Current message */}
      <AnimatePresence mode="wait">
        <motion.p
          key={currentMessage}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="text-sm text-center text-gray-500"
        >
          {currentMessage || 'Starting search...'}
        </motion.p>
      </AnimatePresence>
    </motion.div>
  );
}
