export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MEMBER';
}

export interface Company {
  id: string;
  name: string;
  domain: string;
  logoUrl?: string;
  industry?: string;
  country?: string;
  companyType: 'BUYER' | 'SUPPLIER';
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  company: Company;
}

export interface VendorEmail {
  id: string;
  address: string;
  source: 'WEB_SCRAPED' | 'HUNTER' | 'AI_EXTRACTED' | 'MANUAL';
  isPrimary: boolean;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'RISKY' | 'INVALID';
  mxValid?: boolean;
  domainMatch?: boolean;
  hunterScore?: number;
  disposable?: boolean;
}

export interface Vendor {
  id: string;
  searchSessionId: string;
  name: string;
  website?: string;
  description?: string;
  country?: string;
  region?: string;
  logoUrl?: string;
  phone?: string;
  googleRating?: number;
  googleReviews?: number;
  googleMapsUrl?: string;
  estimatedPrice?: string;
  currency?: string;
  aiSummary?: string;
  aiScore?: number;
  aiTags: string[];
  emails: VendorEmail[];
  createdAt: string;
}

export interface SearchSession {
  id: string;
  companyId: string;
  query: string;
  region?: string;
  category?: string;
  status: 'PENDING' | 'SEARCHING' | 'ENRICHING' | 'VERIFYING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  completedAt?: string;
  vendors: Vendor[];
}

export interface RFQ {
  id: string;
  companyId: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  deadline?: string;
  status: 'DRAFT' | 'SENT' | 'PARTIALLY_REPLIED' | 'FULLY_REPLIED' | 'CLOSED';
  createdAt: string;
  sentAt?: string;
  rfqVendors: RFQVendor[];
  quotes: Quote[];
}

export interface RFQVendor {
  id: string;
  rfqId: string;
  vendorId: string;
  emailSentTo: string;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'OPENED' | 'REPLIED' | 'BOUNCED' | 'FAILED';
  sentAt?: string;
  openedAt?: string;
  repliedAt?: string;
  vendor?: Vendor;
}

export interface Quote {
  id: string;
  rfqId: string;
  vendorName: string;
  vendorEmail: string;
  price?: string;
  currency?: string;
  leadTimeDays?: number;
  validUntil?: string;
  terms?: string;
  aiSummary?: string;
  status: 'RECEIVED' | 'UNDER_REVIEW' | 'SHORTLISTED' | 'REJECTED' | 'ACCEPTED';
  receivedAt: string;
  rfqVendor?: RFQVendor;
}

export interface Tender {
  id: string;
  companyId: string;
  quoteId: string;
  vendorName: string;
  vendorEmail: string;
  subject: string;
  documentHtml: string;
  documentPdfUrl?: string;
  agreedPrice?: string;
  currency?: string;
  deliveryDate?: string;
  status: 'DRAFT' | 'ISSUED' | 'ACKNOWLEDGED' | 'COMPLETED' | 'CANCELLED';
  issuedAt?: string;
  quote?: Quote;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
