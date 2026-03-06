import { format, formatDistanceToNow } from 'date-fns';

export function formatDate(date: string | Date, pattern = 'MMM d, yyyy'): string {
  return format(new Date(date), pattern);
}

export function formatRelative(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatCurrency(amount: string | number | null | undefined, currency = 'USD'): string {
  if (!amount) return 'N/A';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return String(amount);
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(num);
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

export function getVerificationColor(status: string): string {
  switch (status) {
    case 'VERIFIED': return 'text-green-600';
    case 'RISKY': return 'text-amber-500';
    case 'INVALID': return 'text-red-500';
    default: return 'text-gray-400';
  }
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-600',
    SENT: 'bg-blue-100 text-blue-700',
    PARTIALLY_REPLIED: 'bg-amber-100 text-amber-700',
    FULLY_REPLIED: 'bg-green-100 text-green-700',
    CLOSED: 'bg-gray-200 text-gray-500',
    PENDING: 'bg-gray-100 text-gray-500',
    DELIVERED: 'bg-blue-100 text-blue-600',
    OPENED: 'bg-purple-100 text-purple-700',
    REPLIED: 'bg-green-100 text-green-700',
    BOUNCED: 'bg-red-100 text-red-600',
    FAILED: 'bg-red-100 text-red-600',
    RECEIVED: 'bg-blue-100 text-blue-700',
    UNDER_REVIEW: 'bg-purple-100 text-purple-700',
    SHORTLISTED: 'bg-amber-100 text-amber-700',
    REJECTED: 'bg-red-100 text-red-600',
    ACCEPTED: 'bg-green-100 text-green-700',
    ISSUED: 'bg-blue-100 text-blue-700',
    ACKNOWLEDGED: 'bg-green-100 text-green-700',
    COMPLETED: 'bg-green-200 text-green-800',
    CANCELLED: 'bg-gray-200 text-gray-500',
  };
  return map[status] ?? 'bg-gray-100 text-gray-600';
}
