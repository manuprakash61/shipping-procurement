import dns from 'node:dns/promises';
import { redis } from '../../config/redis';
import { DISPOSABLE_DOMAINS, MX_CACHE_TTL } from '../../config/constants';
import { EmailVerificationResult } from '../../types';
import { verifyWithHunter } from './hunter.service';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function extractDomain(email: string): string {
  return email.split('@')[1]?.toLowerCase() ?? '';
}

function extractWebsiteDomain(website: string): string {
  try {
    const url = new URL(website.startsWith('http') ? website : `https://${website}`);
    return url.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return website.replace(/^www\./, '').toLowerCase();
  }
}

function isFormatValid(email: string): boolean {
  if (!EMAIL_REGEX.test(email)) return false;
  const domain = extractDomain(email);
  return !DISPOSABLE_DOMAINS.has(domain);
}

async function checkMX(domain: string): Promise<boolean> {
  const cacheKey = `mx:${domain}`;
  const cached = await redis.get(cacheKey);
  if (cached !== null) return cached === '1';

  try {
    const records = await dns.resolveMx(domain);
    const valid = records.length > 0;
    await redis.setex(cacheKey, MX_CACHE_TTL, valid ? '1' : '0');
    return valid;
  } catch {
    await redis.setex(cacheKey, MX_CACHE_TTL, '0');
    return false;
  }
}

export async function verifyEmail(
  email: string,
  vendorWebsite?: string,
): Promise<EmailVerificationResult> {
  const address = email.toLowerCase().trim();

  // Check 1: Format + disposable
  const formatValid = isFormatValid(address);
  if (!formatValid) {
    return {
      address,
      formatValid: false,
      mxValid: null,
      domainMatch: null,
      hunterScore: null,
      disposable: DISPOSABLE_DOMAINS.has(extractDomain(address)),
      status: 'INVALID',
    };
  }

  const domain = extractDomain(address);
  const disposable = DISPOSABLE_DOMAINS.has(domain);

  // Check 2: Domain match
  let domainMatch: boolean | null = null;
  if (vendorWebsite) {
    const vendorDomain = extractWebsiteDomain(vendorWebsite);
    domainMatch = domain === vendorDomain;
  }

  // Check 3: MX record
  const mxValid = await checkMX(domain);
  if (!mxValid) {
    return {
      address,
      formatValid: true,
      mxValid: false,
      domainMatch,
      hunterScore: null,
      disposable,
      status: 'INVALID',
    };
  }

  // Check 4: Hunter.io (optional)
  let hunterScore: number | null = null;
  if (process.env.HUNTER_API_KEY) {
    hunterScore = await verifyWithHunter(address);
  }

  // Determine final status
  let status: EmailVerificationResult['status'];
  if (!domainMatch && domainMatch !== null) {
    status = 'RISKY';
  } else if (hunterScore !== null && hunterScore < 50) {
    status = 'RISKY';
  } else {
    status = 'VERIFIED';
  }

  return {
    address,
    formatValid: true,
    mxValid: true,
    domainMatch,
    hunterScore,
    disposable,
    status,
  };
}

export async function verifyEmails(
  emails: string[],
  vendorWebsite?: string,
): Promise<EmailVerificationResult[]> {
  return Promise.all(emails.map((e) => verifyEmail(e, vendorWebsite)));
}
