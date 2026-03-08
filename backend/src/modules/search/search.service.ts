import { Queue, Worker, Job } from 'bullmq';
import { redis, getBullMQConnection } from '../../config/redis';
import { prisma } from '../../config/database';
import { QUEUE_NAMES, SEARCH_STATUS_EVENTS } from '../../config/constants';
import * as claudeService from '../../services/ai/claude.service';
import * as serpApiService from '../../services/search/serpapi.service';
import * as placesService from '../../services/places/google.places.service';
import { verifyEmails } from '../../services/verification/email.verifier';
import { findEmailsByDomain } from '../../services/verification/hunter.service';
import { AppError } from '../../middleware/errorHandler';
import { parsePagination, paginationMeta } from '../../utils/pagination';

// BullMQ queue
const searchQueue = new Queue(QUEUE_NAMES.SEARCH, { connection: getBullMQConnection() });

export function getSearchQueue() {
  return searchQueue;
}

// SSE event emitter via Redis pub/sub
async function emitSSE(sessionId: string, event: string, data: Record<string, unknown>) {
  await redis.publish(`search:${sessionId}`, JSON.stringify({ event, data }));
}

export async function createSearchSession(companyId: string, query: string, region?: string, countryCode?: string) {
  const session = await prisma.searchSession.create({
    data: { companyId, query, region, status: 'PENDING' },
  });

  await searchQueue.add('process-search', { sessionId: session.id, query, region, countryCode, companyId });

  return session;
}

export async function getSearchSession(sessionId: string, companyId: string) {
  const session = await prisma.searchSession.findFirst({
    where: { id: sessionId, companyId },
    include: {
      vendors: {
        include: { emails: true },
        orderBy: { aiScore: 'desc' },
      },
    },
  });
  if (!session) throw new AppError(404, 'Search session not found');
  return session;
}

export async function getSearchHistory(
  companyId: string,
  query: Record<string, unknown>,
) {
  const { page, limit, skip } = parsePagination(query);
  const [sessions, total] = await Promise.all([
    prisma.searchSession.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: { _count: { select: { vendors: true } } },
    }),
    prisma.searchSession.count({ where: { companyId } }),
  ]);
  return { sessions, meta: paginationMeta(total, page, limit) };
}

export async function deleteSearchSession(sessionId: string, companyId: string) {
  const session = await prisma.searchSession.findFirst({ where: { id: sessionId, companyId } });
  if (!session) throw new AppError(404, 'Search session not found');
  await prisma.searchSession.delete({ where: { id: sessionId } });
}

// BullMQ worker — runs the full search pipeline
export function startSearchWorker() {
  const worker = new Worker(
    QUEUE_NAMES.SEARCH,
    async (job: Job<{ sessionId: string; query: string; region?: string; countryCode?: string; companyId: string }>) => {
      const { sessionId, query, region, countryCode } = job.data;

      try {
        // Stage 1: Interpret query
        await prisma.searchSession.update({
          where: { id: sessionId },
          data: { status: 'SEARCHING' },
        });
        await emitSSE(sessionId, SEARCH_STATUS_EVENTS.SEARCHING, {
          message: 'Interpreting your query and searching the web...',
        });

        const interpretation = await claudeService.interpretSearchQuery(query, region);

        // Stage 2: SerpAPI searches
        const isWorldwide = !region && !countryCode;

        let flatResults: Awaited<ReturnType<typeof serpApiService.searchWeb>>;

        if (isWorldwide) {
          // Worldwide: India-first queries, gl=in to avoid US-bias
          const wwQueries = [
            `${query} supplier vendor company India`,
            `${query} manufacturer exporter India`,
            `${query} manufacturer exporter Asia`,
            `${query} supplier Europe Middle East`,
            `${query} vendor Africa South America`,
            ...interpretation.searchTerms.slice(0, 3).map((term) => `${term} B2B supplier`),
          ];
          const wwResults = await Promise.all(
            wwQueries.map((q) => serpApiService.searchWeb(q, 20, { countryCode: 'in' })),
          );
          flatResults = wwResults.flat();
        } else {
          // Specific location: search that location first
          const locationQueries = [
            `${query}${region ? ` ${region}` : ''} supplier vendor company`,
            ...interpretation.searchTerms.slice(0, 4).map(
              (term) => `${term}${region ? ` ${region}` : ''} B2B supplier`,
            ),
          ];
          const serpOptions = countryCode ? { countryCode, location: region } : undefined;
          const locationResults = await Promise.all(
            locationQueries.map((q) => serpApiService.searchWeb(q, 20, serpOptions)),
          );
          flatResults = locationResults.flat();

          // Fallback to broader search only if no results found for the specific location
          if (flatResults.length === 0) {
            await emitSSE(sessionId, SEARCH_STATUS_EVENTS.SEARCHING, {
              message: `No results found for ${region ?? countryCode}. Expanding search globally...`,
            });
            const fallbackQueries = [
              `${query} supplier vendor company`,
              ...interpretation.searchTerms.slice(0, 3).map((term) => `${term} B2B supplier`),
            ];
            const fallbackResults = await Promise.all(
              fallbackQueries.map((q) => serpApiService.searchWeb(q, 20)),
            );
            flatResults = fallbackResults.flat();
          }
        }

        // Stage 3: Extract vendors with Claude
        await emitSSE(sessionId, SEARCH_STATUS_EVENTS.ENRICHING, {
          message: 'Analyzing search results and extracting vendors...',
        });

        const formatted = serpApiService.formatResultsForClaude(flatResults);
        const vendors = await claudeService.extractVendorsFromSearchResults(
          formatted,
          query,
          region,
        );

        // Stage 4: Enrich with Google Places + emails
        await prisma.searchSession.update({
          where: { id: sessionId },
          data: { status: 'ENRICHING', rawResults: flatResults as any },
        });
        await emitSSE(sessionId, SEARCH_STATUS_EVENTS.ENRICHING, {
          message: `Found ${vendors.length} vendors. Fetching ratings and contact details...`,
        });

        const vendorRecords = await Promise.all(
          vendors.map(async (v) => {
            const [placeData, serpEmails, hunterEmails] = await Promise.all([
              v.name ? placesService.findVendorRating(v.name, v.country) : null,
              v.website ? serpApiService.findEmailsForDomain(v.website) : ([] as string[]),
              v.website ? findEmailsByDomain(v.website.replace(/^www\./, '')) : ([] as string[]),
            ]);

            // Merge and deduplicate emails
            const allEmails = [...new Set<string>([...(v.emails ?? []), ...serpEmails, ...hunterEmails])];

            return prisma.vendor.create({
              data: {
                searchSessionId: sessionId,
                name: v.name,
                website: v.website,
                description: v.description,
                country: v.country,
                region: v.region,
                phone: v.phone,
                estimatedPrice: v.estimatedPrice,
                aiScore: v.aiScore,
                aiTags: v.aiTags ?? [],
                aiSummary: v.description,
                googlePlaceId: placeData?.placeId,
                googleRating: placeData?.rating,
                googleReviews: placeData?.reviewCount,
                googleMapsUrl: placeData?.mapsUrl,
                emails: {
                  create: allEmails.slice(0, 5).map((email, idx) => ({
                    address: email.toLowerCase(),
                    source: hunterEmails.includes(email)
                      ? ('HUNTER' as const)
                      : v.emails?.includes(email)
                        ? ('AI_EXTRACTED' as const)
                        : ('WEB_SCRAPED' as const),
                    isPrimary: idx === 0,
                  })),
                },
              },
            });
          }),
        );

        // Stage 5: Verify emails
        await prisma.searchSession.update({
          where: { id: sessionId },
          data: { status: 'VERIFYING' },
        });
        await emitSSE(sessionId, SEARCH_STATUS_EVENTS.VERIFYING, {
          message: 'Verifying email addresses...',
        });

        for (const vendor of vendorRecords) {
          const vendorWithEmails = await prisma.vendor.findUnique({
            where: { id: vendor.id },
            include: { emails: true },
          });

          if (!vendorWithEmails?.emails.length) continue;

          const results = await verifyEmails(
            vendorWithEmails.emails.map((e) => e.address),
            vendorWithEmails.website ?? undefined,
          );

          for (const result of results) {
            await prisma.vendorEmail.updateMany({
              where: { vendorId: vendor.id, address: result.address },
              data: {
                formatValid: result.formatValid,
                mxValid: result.mxValid,
                domainMatch: result.domainMatch,
                hunterScore: result.hunterScore,
                disposable: result.disposable,
                verificationStatus: result.status,
                verifiedAt: new Date(),
              },
            });
          }

          // Set primary email to first verified one
          const verified = results.find((r) => r.status === 'VERIFIED');
          if (verified) {
            await prisma.vendorEmail.updateMany({
              where: { vendorId: vendor.id },
              data: { isPrimary: false },
            });
            await prisma.vendorEmail.updateMany({
              where: { vendorId: vendor.id, address: verified.address },
              data: { isPrimary: true },
            });
          }
        }

        // Complete
        await prisma.searchSession.update({
          where: { id: sessionId },
          data: { status: 'COMPLETED', completedAt: new Date() },
        });
        await emitSSE(sessionId, SEARCH_STATUS_EVENTS.COMPLETED, {
          message: `Search complete. Found ${vendorRecords.length} vendors.`,
          vendorCount: vendorRecords.length,
        });
      } catch (err) {
        console.error(`[SearchWorker] Job ${job.id} failed:`, err);
        await prisma.searchSession.update({
          where: { id: sessionId },
          data: { status: 'FAILED' },
        });
        await emitSSE(sessionId, SEARCH_STATUS_EVENTS.FAILED, {
          message: 'Search failed. Please try again.',
        });
        throw err;
      }
    },
    { connection: getBullMQConnection(), concurrency: 3 },
  );

  worker.on('failed', (job, err) => {
    console.error(`[SearchWorker] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
