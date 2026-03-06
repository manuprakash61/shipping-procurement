const HUNTER_KEY = process.env.HUNTER_API_KEY ?? '';
const HUNTER_BASE = 'https://api.hunter.io/v2';

interface HunterVerifyResponse {
  data: {
    status: 'valid' | 'invalid' | 'risky' | 'unknown';
    score: number;
    disposable: boolean;
    smtp_check: boolean;
  };
}

interface HunterDomainResponse {
  data: {
    emails: Array<{ value: string; confidence: number; type: string }>;
  };
}

/**
 * Verify a single email address with Hunter.io
 * Returns confidence score 0-100, or null on error
 */
export async function verifyWithHunter(email: string): Promise<number | null> {
  if (!HUNTER_KEY) return null;

  try {
    const url = `${HUNTER_BASE}/email-verifier?email=${encodeURIComponent(email)}&api_key=${HUNTER_KEY}`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = (await response.json()) as HunterVerifyResponse;
    if (data.data.status === 'invalid') return 0;
    return data.data.score;
  } catch {
    return null;
  }
}

/**
 * Find emails for a domain via Hunter.io domain search
 */
export async function findEmailsByDomain(domain: string): Promise<string[]> {
  if (!HUNTER_KEY) return [];

  try {
    const url = `${HUNTER_BASE}/domain-search?domain=${encodeURIComponent(domain)}&api_key=${HUNTER_KEY}`;
    const response = await fetch(url);
    if (!response.ok) return [];

    const data = (await response.json()) as HunterDomainResponse;
    return data.data.emails
      .filter((e) => e.confidence >= 50)
      .map((e) => e.value.toLowerCase());
  } catch {
    return [];
  }
}
