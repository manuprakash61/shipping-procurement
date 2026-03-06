import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react';
import { VendorEmail } from '@/types';
import { pulseVariants } from '@/utils/animations';

interface EmailBadgeProps {
  email: VendorEmail;
  showAddress?: boolean;
}

const statusConfig = {
  VERIFIED: {
    icon: CheckCircle,
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    label: 'Verified',
    pulse: true,
  },
  RISKY: {
    icon: AlertTriangle,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    label: 'Risky',
    pulse: false,
  },
  INVALID: {
    icon: XCircle,
    color: 'text-red-500',
    bg: 'bg-red-50',
    border: 'border-red-200',
    label: 'Invalid',
    pulse: false,
  },
  PENDING: {
    icon: Clock,
    color: 'text-gray-400',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    label: 'Unverified',
    pulse: false,
  },
};

export function EmailBadge({ email, showAddress = true }: EmailBadgeProps) {
  const config = statusConfig[email.verificationStatus];
  const Icon = config.icon;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.border}`}
    >
      {config.pulse ? (
        <motion.div variants={pulseVariants} animate="animate">
          <Icon className={`w-3.5 h-3.5 ${config.color}`} />
        </motion.div>
      ) : (
        <Icon className={`w-3.5 h-3.5 ${config.color}`} />
      )}
      {showAddress && <span className={`${config.color} max-w-[140px] truncate`}>{email.address}</span>}
      <span className={config.color}>{config.label}</span>
    </div>
  );
}
