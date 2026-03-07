import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Send, CheckSquare, Store, Globe, ChevronDown, ChevronUp } from 'lucide-react';
import { searchApi } from '@/api/search.api';
import { rfqApi } from '@/api/rfq.api';
import { marketplaceApi, MarketplaceProduct } from '@/api/marketplace.api';
import { useSearchStore } from '@/store/search.store';
import { useAuthStore } from '@/store/auth.store';
import { SearchBar } from '@/components/search/SearchBar';
import { SearchProgress } from '@/components/search/SearchProgress';
import { VendorGrid } from '@/components/vendor/VendorGrid';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Vendor } from '@/types';
import { fadeInUp, staggerContainer } from '@/utils/animations';

function draftSubject(query: string, companyName: string) {
  return `RFQ: ${query} — ${companyName}`;
}

function MarketplaceProductCard({ product, onRFQ }: { product: MarketplaceProduct; onRFQ: () => void }) {
  return (
    <motion.div
      variants={fadeInUp}
      className="bg-white rounded-2xl border border-green-100 p-5 hover:shadow-md transition-shadow relative"
    >
      <div className="absolute top-3 right-3">
        <Badge variant="success">Listed</Badge>
      </div>
      <div className="mb-2 pr-16">
        <h3 className="text-sm font-semibold text-gray-900">{product.name}</h3>
        <span className="text-xs text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">{product.category}</span>
      </div>
      <p className="text-xs text-gray-500 mb-3 line-clamp-2">{product.description}</p>
      <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
        <span className="font-medium text-gray-700">{product.company.name}</span>
        {product.company.country && <span>📍 {product.company.country}</span>}
        {product.price && <span className="font-semibold text-green-700">{product.currency} {Number(product.price).toLocaleString()}</span>}
        {product.leadTimeDays && <span>⏱ {product.leadTimeDays}d lead</span>}
        {product.minOrderQty && <span>MOQ: {product.minOrderQty}</span>}
      </div>
      {product.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {product.tags.slice(0, 3).map((t) => (
            <span key={t} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{t}</span>
          ))}
        </div>
      )}
      <Button size="sm" icon={<Send className="w-3 h-3" />} className="w-full justify-center" onClick={onRFQ}>
        Request Quote
      </Button>
    </motion.div>
  );
}

export default function SearchPage() {
  const { company } = useAuthStore();
  const {
    currentSession,
    selectedVendors,
    searchProgress,
    setCurrentSession,
    setSearchProgress,
    toggleVendorSelection,
    selectAllVendors,
    clearSelection,
  } = useSearchStore();

  const [loading, setLoading] = useState(false);
  const [detailVendor, setDetailVendor] = useState<Vendor | null>(null);
  const [rfqVendors, setRfqVendors] = useState<Vendor[]>([]);
  const [showRFQModal, setShowRFQModal] = useState(false);
  const [rfqSending, setRfqSending] = useState(false);
  const [pollInterval, setPollInterval] = useState<number | null>(null);
  const [marketplaceResults, setMarketplaceResults] = useState<MarketplaceProduct[]>([]);
  const [openMarketExpanded, setOpenMarketExpanded] = useState(false);
  const [lastQuery, setLastQuery] = useState('');

  // For marketplace product RFQ (email-less, just captures intent)
  const [marketplaceRFQProduct, setMarketplaceRFQProduct] = useState<MarketplaceProduct | null>(null);
  const [marketplaceRFQSending, setMarketplaceRFQSending] = useState(false);

  const eventSourceRef = useRef<EventSource | null>(null);

  const handleSearch = async (query: string, region?: string, countryCode?: string) => {
    setLastQuery(query);
    setMarketplaceResults([]);
    setOpenMarketExpanded(false);
    clearSelection();
    setSearchProgress(null);
    setCurrentSession(null);

    // Step 1: Search marketplace (instant)
    try {
      const result = await marketplaceApi.search({ q: query, country: region });
      setMarketplaceResults(result.products);
    } catch {
      // marketplace search failure is non-blocking
    }

    // If marketplace had results, don't auto-trigger open market; let user click "Search Open Market"
    // If no marketplace results, auto-trigger open market
    setOpenMarketExpanded(false);
  };

  const handleOpenMarketSearch = async (query: string, region?: string, countryCode?: string) => {
    setLoading(true);
    setOpenMarketExpanded(true);
    clearSelection();

    try {
      const session = await searchApi.create({ query: query || lastQuery, region, countryCode });
      setCurrentSession({ ...session, vendors: [] });

      const token = useAuthStore.getState().accessToken;
      const apiBase = import.meta.env.VITE_API_BASE_URL ?? 'https://shipping-procurement-production.up.railway.app/api';
      const es = new EventSource(`${apiBase}/search/${session.id}/stream?token=${token}`);
      eventSourceRef.current = es;

      const interval = window.setInterval(async () => {
        try {
          const updated = await searchApi.get(session.id);
          setCurrentSession(updated);
          if (updated.status === 'COMPLETED' || updated.status === 'FAILED') {
            clearInterval(interval);
            setPollInterval(null);
          }
        } catch { /* ignore */ }
      }, 3000);
      setPollInterval(interval);

      es.addEventListener('searching', (e) => {
        const data = JSON.parse((e as MessageEvent).data) as { message: string };
        setSearchProgress({ stage: 'SEARCHING', message: data.message });
      });
      es.addEventListener('enriching', (e) => {
        const data = JSON.parse((e as MessageEvent).data) as { message: string };
        setSearchProgress({ stage: 'ENRICHING', message: data.message });
      });
      es.addEventListener('verifying', (e) => {
        const data = JSON.parse((e as MessageEvent).data) as { message: string };
        setSearchProgress({ stage: 'VERIFYING', message: data.message });
      });
      es.addEventListener('completed', async () => {
        es.close();
        if (interval) clearInterval(interval);
        const final = await searchApi.get(session.id);
        setCurrentSession(final);
        setSearchProgress(null);
      });
      es.addEventListener('failed', () => {
        es.close();
        if (interval) clearInterval(interval);
        setSearchProgress({ stage: 'FAILED', message: 'Search failed — please try again.' });
      });
    } catch {
      setSearchProgress({ stage: 'FAILED', message: 'Failed to start search.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [pollInterval]);

  const handleRequestQuoteForVendor = (vendor: Vendor) => {
    setRfqVendors([vendor]);
    setShowRFQModal(true);
  };

  const handleRequestQuoteForSelected = () => {
    if (!currentSession) return;
    const vendors = currentSession.vendors.filter((v) => selectedVendors.has(v.id));
    setRfqVendors(vendors);
    setShowRFQModal(true);
  };

  const handleSendRFQ = async () => {
    if (!currentSession || rfqVendors.length === 0) return;
    setRfqSending(true);
    try {
      const subject = draftSubject(currentSession.query, company?.name ?? 'Our Company');
      const bodyText = `Dear [Vendor Name],\n\nWe are looking to procure "${currentSession.query}"${currentSession.region ? ` from ${currentSession.region}` : ''}.\n\nPlease provide your best quotation including:\n- Unit price and currency\n- Lead time\n- Minimum order quantity\n- Payment terms\n- Delivery terms (Incoterms)\n\nWe look forward to your response.\n\nBest regards,\n${company?.name ?? 'Our Procurement Team'}`;

      const rfq = await rfqApi.create({
        subject,
        bodyHtml: `<p>${bodyText.replace(/\n/g, '<br />')}</p>`,
        bodyText,
        searchSessionId: currentSession.id,
      });

      await rfqApi.send(rfq.id, rfqVendors.map((v) => v.id));
      setShowRFQModal(false);
      clearSelection();
      alert(`RFQ sent to ${rfqVendors.length} vendor(s) successfully!`);
    } catch {
      alert('Failed to send RFQ. Please try again.');
    } finally {
      setRfqSending(false);
    }
  };

  const handleMarketplaceRFQ = async () => {
    if (!marketplaceRFQProduct) return;
    setMarketplaceRFQSending(true);
    try {
      const subject = `RFQ: ${marketplaceRFQProduct.name} — ${company?.name ?? 'Our Company'}`;
      const bodyText = `Dear ${marketplaceRFQProduct.company.name},\n\nWe are interested in procuring your product: "${marketplaceRFQProduct.name}".\n\nPlease provide your best quotation including:\n- Unit price and currency\n- Lead time\n- Minimum order quantity\n- Payment terms\n- Delivery terms (Incoterms)\n\nWe look forward to your response.\n\nBest regards,\n${company?.name ?? 'Our Procurement Team'}`;

      await rfqApi.create({
        subject,
        bodyHtml: `<p>${bodyText.replace(/\n/g, '<br />')}</p>`,
        bodyText,
      });

      setMarketplaceRFQProduct(null);
      alert('RFQ created successfully! Go to RFQ Manager to send it.');
    } catch {
      alert('Failed to create RFQ. Please try again.');
    } finally {
      setMarketplaceRFQSending(false);
    }
  };

  const vendors = currentSession?.vendors ?? [];
  const status = currentSession?.status;
  const hasSearched = marketplaceResults.length > 0 || !!currentSession || !!lastQuery;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-8 py-6">
        <div className="max-w-4xl">
          <h1 className="text-xl font-bold text-gray-900 mb-4">Find Vendors</h1>
          <SearchBar onSearch={handleSearch} loading={loading} />
        </div>
      </div>

      <div className="px-8 py-6 space-y-8">
        {/* Empty state */}
        {!hasSearched && (
          <motion.div variants={fadeInUp} initial="initial" animate="animate" className="text-center py-24">
            <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-brand-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Find your next vendor</h3>
            <p className="text-gray-500 text-sm max-w-sm mx-auto">
              Search for any product or service. We'll check registered suppliers first, then search the open web.
            </p>
          </motion.div>
        )}

        {/* ── Section 1: Registered Suppliers (Marketplace) ── */}
        {hasSearched && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-green-600" />
                <h2 className="text-base font-semibold text-gray-900">Registered Suppliers</h2>
                <Badge variant={marketplaceResults.length > 0 ? 'success' : 'default'}>
                  {marketplaceResults.length} found
                </Badge>
              </div>
              <div className="flex-1 border-t border-gray-200" />
            </div>

            {marketplaceResults.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center text-gray-400 text-sm">
                No registered suppliers match your search. Try the open market below.
              </div>
            ) : (
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
              >
                {marketplaceResults.map((p) => (
                  <MarketplaceProductCard
                    key={p.id}
                    product={p}
                    onRFQ={() => setMarketplaceRFQProduct(p)}
                  />
                ))}
              </motion.div>
            )}
          </div>
        )}

        {/* ── Section 2: Open Market Search ── */}
        {hasSearched && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-brand-600" />
                <h2 className="text-base font-semibold text-gray-900">Open Market Search</h2>
                <span className="text-xs text-gray-400">AI-powered web discovery</span>
              </div>
              <div className="flex-1 border-t border-gray-200" />
              <button
                className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-800"
                onClick={() => {
                  if (!openMarketExpanded) handleOpenMarketSearch(lastQuery);
                  else setOpenMarketExpanded(false);
                }}
              >
                {openMarketExpanded ? (
                  <><ChevronUp className="w-4 h-4" /> Hide</>
                ) : (
                  <><ChevronDown className="w-4 h-4" /> Search Open Web</>
                )}
              </button>
            </div>

            <AnimatePresence>
              {openMarketExpanded && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4 overflow-hidden">
                  {/* Progress indicator */}
                  {status && !['COMPLETED', 'FAILED', undefined].includes(status) && (
                    <SearchProgress
                      sessionId={currentSession!.id}
                      status={status}
                      currentMessage={searchProgress?.message ?? ''}
                    />
                  )}

                  {/* Results header */}
                  {vendors.length > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700">
                          <strong>{vendors.length}</strong> vendors found for <em>"{currentSession?.query}"</em>
                          {currentSession?.region && ` in ${currentSession.region}`}
                        </span>
                        {selectedVendors.size > 0 && (
                          <span className="bg-brand-100 text-brand-700 text-xs font-medium px-2.5 py-1 rounded-full">
                            {selectedVendors.size} selected
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<CheckSquare className="w-4 h-4" />}
                          onClick={() => selectedVendors.size === vendors.length ? clearSelection() : selectAllVendors(vendors)}
                        >
                          {selectedVendors.size === vendors.length ? 'Deselect all' : 'Select all'}
                        </Button>
                        {selectedVendors.size > 0 && (
                          <Button size="sm" icon={<Send className="w-4 h-4" />} onClick={handleRequestQuoteForSelected}>
                            Send RFQ ({selectedVendors.size})
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  <VendorGrid
                    vendors={vendors}
                    selectedVendors={selectedVendors}
                    onToggleSelect={toggleVendorSelection}
                    onViewDetails={setDetailVendor}
                    onRequestQuote={handleRequestQuoteForVendor}
                  />

                  {!loading && !searchProgress && vendors.length === 0 && currentSession?.status === 'COMPLETED' && (
                    <div className="text-center py-8 text-gray-400 text-sm">No vendors found from open web search.</div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Vendor detail modal */}
      <Modal isOpen={!!detailVendor} onClose={() => setDetailVendor(null)} title={detailVendor?.name} size="lg">
        {detailVendor && (
          <div className="p-6 space-y-4">
            <p className="text-sm text-gray-600">{detailVendor.description}</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {detailVendor.website && (
                <div>
                  <div className="text-gray-400 text-xs mb-1">Website</div>
                  <a href={`https://${detailVendor.website}`} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">{detailVendor.website}</a>
                </div>
              )}
              {detailVendor.country && <div><div className="text-gray-400 text-xs mb-1">Country</div><div className="text-gray-700">{detailVendor.country}</div></div>}
              {detailVendor.googleRating && <div><div className="text-gray-400 text-xs mb-1">Google Rating</div><div className="text-gray-700">⭐ {detailVendor.googleRating} ({detailVendor.googleReviews} reviews)</div></div>}
              {detailVendor.estimatedPrice && <div><div className="text-gray-400 text-xs mb-1">Est. Price</div><div className="text-green-700 font-medium">{detailVendor.estimatedPrice}</div></div>}
            </div>
            {detailVendor.emails.length > 0 && (
              <div>
                <div className="text-gray-400 text-xs mb-2">Email Addresses</div>
                <div className="space-y-2">
                  {detailVendor.emails.map((e) => (
                    <div key={e.id} className="flex items-center justify-between">
                      <span className="text-sm font-mono text-gray-700">{e.address}</span>
                      <span className={`text-xs ${e.verificationStatus === 'VERIFIED' ? 'text-green-600' : e.verificationStatus === 'RISKY' ? 'text-amber-500' : 'text-red-500'}`}>{e.verificationStatus}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="pt-4 border-t">
              <Button size="md" icon={<Send className="w-4 h-4" />} className="w-full justify-center" onClick={() => { setDetailVendor(null); handleRequestQuoteForVendor(detailVendor); }}>
                Request Quote from {detailVendor.name}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Open market RFQ modal */}
      <Modal isOpen={showRFQModal} onClose={() => setShowRFQModal(false)} title="Send RFQ" size="md">
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            An RFQ email will be sent to <strong>{rfqVendors.length} vendor{rfqVendors.length > 1 ? 's' : ''}</strong>:
          </p>
          <ul className="space-y-2 mb-6">
            {rfqVendors.map((v) => {
              const email = v.emails.find((e) => e.isPrimary) ?? v.emails[0];
              return (
                <li key={v.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-800">{v.name}</span>
                  <span className="text-gray-500 text-xs">{email?.address ?? 'No email'}</span>
                </li>
              );
            })}
          </ul>
          <div className="flex gap-3">
            <Button variant="secondary" size="md" className="flex-1" onClick={() => setShowRFQModal(false)}>Cancel</Button>
            <Button size="md" loading={rfqSending} className="flex-1" icon={<Send className="w-4 h-4" />} onClick={handleSendRFQ}>Send RFQ</Button>
          </div>
        </div>
      </Modal>

      {/* Marketplace RFQ modal */}
      <Modal isOpen={!!marketplaceRFQProduct} onClose={() => setMarketplaceRFQProduct(null)} title="Request Quote" size="md">
        {marketplaceRFQProduct && (
          <div className="p-6">
            <p className="text-sm text-gray-600 mb-2">
              You're requesting a quote for <strong>{marketplaceRFQProduct.name}</strong> from{' '}
              <strong>{marketplaceRFQProduct.company.name}</strong>.
            </p>
            <p className="text-xs text-gray-400 mb-6">
              An RFQ will be created in your RFQ Manager. You can customise and send it from there.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" size="md" className="flex-1" onClick={() => setMarketplaceRFQProduct(null)}>Cancel</Button>
              <Button size="md" loading={marketplaceRFQSending} className="flex-1" icon={<Send className="w-4 h-4" />} onClick={handleMarketplaceRFQ}>Create RFQ</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
