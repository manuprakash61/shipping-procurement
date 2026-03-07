const SERPAPI_KEY = process.env.SERPAPI_KEY ?? '';
const SERPAPI_BASE = 'https://serpapi.com/search.json';

export interface SerpResult {
  title: string;
  link: string;
  snippet: string;
  displayed_link?: string;
}

export async function searchWeb(
  query: string,
  numResults = 20,
  options?: { countryCode?: string; location?: string },
): Promise<SerpResult[]> {
  if (!SERPAPI_KEY) {
    console.warn('[SerpAPI] No API key configured — returning empty results');
    return [];
  }

  const params = new URLSearchParams({
    q: query,
    api_key: SERPAPI_KEY,
    num: String(numResults),
    engine: 'google',
    ...(options?.countryCode ? { gl: options.countryCode } : {}),
    ...(options?.location ? { location: options.location } : {}),
  });

  const response = await fetch(`${SERPAPI_BASE}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`SerpAPI request failed: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as { organic_results?: SerpResult[] };
  return data.organic_results ?? [];
}

export function formatResultsForClaude(results: SerpResult[]): string {
  return results
    .map(
      (r, i) =>
        `[${i + 1}] Title: ${r.title}\nURL: ${r.link}\nSnippet: ${r.snippet}`,
    )
    .join('\n\n');
}

export async function findEmailsForDomain(domain: string): Promise<string[]> {
  if (!SERPAPI_KEY) return [];

  const query = `site:${domain} email contact`;
  const results = await searchWeb(query, 5);

  // Extract email patterns from snippets
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = new Set<string>();

  for (const result of results) {
    const matches = result.snippet.match(emailRegex);
    if (matches) matches.forEach((e) => emails.add(e.toLowerCase()));
  }

  return Array.from(emails);
}
