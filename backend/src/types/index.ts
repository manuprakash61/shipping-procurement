export interface JwtPayload {
  userId: string;
  companyId: string;
  role: string;
}

export interface ExtractedVendor {
  name: string;
  website?: string;
  description?: string;
  country?: string;
  region?: string;
  estimatedPrice?: string;
  aiScore?: number;
  aiTags?: string[];
  emails?: string[];
  phone?: string;
}

export interface SearchQueryInterpretation {
  category: string;
  searchTerms: string[];
  attributes: string[];
}

export interface EmailVerificationResult {
  address: string;
  formatValid: boolean;
  mxValid: boolean | null;
  domainMatch: boolean | null;
  hunterScore: number | null;
  disposable: boolean;
  status: 'PENDING' | 'VERIFIED' | 'RISKY' | 'INVALID';
}

export interface QuoteExtractionResult {
  price?: number;
  currency?: string;
  leadTimeDays?: number;
  validUntil?: string;
  terms?: string;
  summary?: string;
}

export interface SSEEvent {
  type: string;
  data: Record<string, unknown>;
}
