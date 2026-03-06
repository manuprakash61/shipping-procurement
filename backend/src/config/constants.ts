export const QUEUE_NAMES = {
  SEARCH: 'search-jobs',
  EMAIL_VERIFICATION: 'email-verification',
  QUOTE_EXTRACTION: 'quote-extraction',
} as const;

export const SEARCH_STATUS_EVENTS = {
  SEARCHING: 'searching',
  ENRICHING: 'enriching',
  VERIFYING: 'verifying',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export const MX_CACHE_TTL = 3600; // 1 hour in seconds

export const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'guerrillamail.com',
  'tempmail.com',
  'throwaway.email',
  'yopmail.com',
  'sharklasers.com',
  'guerrillamailblock.com',
  'grr.la',
  'guerrillamail.info',
  'spam4.me',
  'trashmail.com',
  'maildrop.cc',
  '10minutemail.com',
  'fakeinbox.com',
]);
