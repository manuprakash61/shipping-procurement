import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Send, CheckSquare } from 'lucide-react';
import { searchApi } from '@/api/search.api';
import { rfqApi } from '@/api/rfq.api';
import { useSearchStore } from '@/store/search.store';
import { useAuthStore } from '@/store/auth.store';
import { SearchBar } from '@/components/search/SearchBar';
import { SearchProgress } from '@/components/search/SearchProgress';
import { VendorGrid } from '@/components/vendor/VendorGrid';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Vendor } from '@/types';
import { fadeInUp } from '@/utils/animations';

// helper
function draftSubject(query: string, companyName: string) {
  return `RFQ: ${query} — ${companyName}`;
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

  const eventSourceRef = useRef<EventSource | null>(null);

  const handleSearch = async (query: string, region?: string) => {
    setLoading(true);
    clearSelection();
    setSearchProgress(null);

    try {
      const session = await searchApi.create({ query, region });
      setCurrentSession({ ...session, vendors: [] });

      // Open SSE stream
      const token = useAuthStore.getState().accessToken;
      const es = new EventSource(
        `/api/search/${session.id}/stream`,
        // Note: EventSource doesn't support custom headers natively
        // Token is passed via cookie in production or use polling fallback
      );
      eventSourceRef.current = es;

      // Fallback: also poll every 3s
      const interval = window.setInterval(async () => {
        try {
          const updated = await searchApi.get(session.id);
          setCurrentSession(updated);
          if (updated.status === 'COMPLETED' || updated.status === 'FAILED') {
            clearInterval(interval);
            setPollInterval(null);
          }
        } catch {
          // ignore
        }
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

  // Cleanup on unmount
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

  const vendors = currentSession?.vendors ?? [];
  const status = currentSession?.status;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-8 py-6">
        <div className="max-w-4xl">
          <h1 className="text-xl font-bold text-gray-900 mb-4">Find Vendors</h1>
          <SearchBar onSearch={handleSearch} loading={loading} />
        </div>
      </div>

      <div className="px-8 py-6 space-y-6">
        {/* Progress indicator */}
        <AnimatePresence>
          {status && !['COMPLETED', 'FAILED', undefined].includes(status) && (
            <SearchProgress
              sessionId={currentSession!.id}
              status={status}
              currentMessage={searchProgress?.message ?? ''}
            />
          )}
        </AnimatePresence>

        {/* Results header */}
        {vendors.length > 0 && (
          <motion.div
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">
                <strong>{vendors.length}</strong> vendors found for{' '}
                <em>"{currentSession?.query}"</em>
                {currentSession?.region && ` in ${currentSession.region}`}
              </span>
              {selectedVendors.size > 0 && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-brand-100 text-brand-700 text-xs font-medium px-2.5 py-1 rounded-full"
                >
                  {selectedVendors.size} selected
                </motion.span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                icon={<CheckSquare className="w-4 h-4" />}
                onClick={() =>
                  selectedVendors.size === vendors.length
                    ? clearSelection()
                    : selectAllVendors(vendors)
                }
              >
                {selectedVendors.size === vendors.length ? 'Deselect all' : 'Select all'}
              </Button>
              {selectedVendors.size > 0 && (
                <Button
                  size="sm"
                  icon={<Send className="w-4 h-4" />}
                  onClick={handleRequestQuoteForSelected}
                >
                  Send RFQ ({selectedVendors.size})
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {/* Vendor grid */}
        <VendorGrid
          vendors={vendors}
          selectedVendors={selectedVendors}
          onToggleSelect={toggleVendorSelection}
          onViewDetails={setDetailVendor}
          onRequestQuote={handleRequestQuoteForVendor}
        />

        {/* Empty state */}
        {!loading && !searchProgress && vendors.length === 0 && !currentSession && (
          <motion.div
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            className="text-center py-24"
          >
            <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-brand-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Find your next vendor</h3>
            <p className="text-gray-500 text-sm max-w-sm mx-auto">
              Search for any product or service and our AI will find verified vendors from around the world.
            </p>
          </motion.div>
        )}
      </div>

      {/* Vendor detail modal */}
      <Modal
        isOpen={!!detailVendor}
        onClose={() => setDetailVendor(null)}
        title={detailVendor?.name}
        size="lg"
      >
        {detailVendor && (
          <div className="p-6 space-y-4">
            <p className="text-sm text-gray-600">{detailVendor.description}</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {detailVendor.website && (
                <div>
                  <div className="text-gray-400 text-xs mb-1">Website</div>
                  <a href={`https://${detailVendor.website}`} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">
                    {detailVendor.website}
                  </a>
                </div>
              )}
              {detailVendor.country && (
                <div>
                  <div className="text-gray-400 text-xs mb-1">Country</div>
                  <div className="text-gray-700">{detailVendor.country}</div>
                </div>
              )}
              {detailVendor.googleRating && (
                <div>
                  <div className="text-gray-400 text-xs mb-1">Google Rating</div>
                  <div className="text-gray-700">⭐ {detailVendor.googleRating} ({detailVendor.googleReviews} reviews)</div>
                </div>
              )}
              {detailVendor.estimatedPrice && (
                <div>
                  <div className="text-gray-400 text-xs mb-1">Est. Price</div>
                  <div className="text-green-700 font-medium">{detailVendor.estimatedPrice}</div>
                </div>
              )}
            </div>
            {detailVendor.emails.length > 0 && (
              <div>
                <div className="text-gray-400 text-xs mb-2">Email Addresses</div>
                <div className="space-y-2">
                  {detailVendor.emails.map((e) => (
                    <div key={e.id} className="flex items-center justify-between">
                      <span className="text-sm font-mono text-gray-700">{e.address}</span>
                      <span className={`text-xs ${e.verificationStatus === 'VERIFIED' ? 'text-green-600' : e.verificationStatus === 'RISKY' ? 'text-amber-500' : 'text-red-500'}`}>
                        {e.verificationStatus}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="pt-4 border-t">
              <Button
                size="md"
                icon={<Send className="w-4 h-4" />}
                className="w-full justify-center"
                onClick={() => {
                  setDetailVendor(null);
                  handleRequestQuoteForVendor(detailVendor);
                }}
              >
                Request Quote from {detailVendor.name}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* RFQ confirmation modal */}
      <Modal isOpen={showRFQModal} onClose={() => setShowRFQModal(false)} title="Send RFQ" size="md">
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            An RFQ email will be sent to{' '}
            <strong>{rfqVendors.length} vendor{rfqVendors.length > 1 ? 's' : ''}</strong>:
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
            <Button variant="secondary" size="md" className="flex-1" onClick={() => setShowRFQModal(false)}>
              Cancel
            </Button>
            <Button
              size="md"
              loading={rfqSending}
              className="flex-1"
              icon={<Send className="w-4 h-4" />}
              onClick={handleSendRFQ}
            >
              Send RFQ
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

