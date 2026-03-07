import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { MessageSquare, ArrowUpDown, CheckCircle, XCircle, Award } from 'lucide-react';
import { quotesApi } from '@/api/quotes.api';
import { tendersApi } from '@/api/tenders.api';
import { Quote } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { staggerContainer, tableRowVariants, fadeInUp } from '@/utils/animations';
import { formatDate, formatCurrency, getStatusColor } from '@/utils/formatters';

export default function QuotesPage() {
  const queryClient = useQueryClient();
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [rfqFilter] = useState<string | undefined>(undefined);

  const { data, isLoading } = useQuery({
    queryKey: ['quotes', rfqFilter],
    queryFn: () => quotesApi.list({ rfqId: rfqFilter }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'SHORTLISTED' | 'REJECTED' | 'ACCEPTED' }) =>
      quotesApi.updateStatus(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });

  const tenderMutation = useMutation({
    mutationFn: (quoteId: string) =>
      tendersApi.create({ quoteId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['quotes'] });
      void queryClient.invalidateQueries({ queryKey: ['tenders'] });
      setSelectedQuote(null);
      alert('Tender created and ready to issue!');
    },
  });

  const quotes: Quote[] = data?.quotes ?? [];

  // Find min price and min lead time for highlighting
  const prices = quotes.map((q) => parseFloat(q.price ?? '')).filter((p) => !isNaN(p));
  const minPrice = prices.length ? Math.min(...prices) : null;
  const leadTimes = quotes.map((q) => q.leadTimeDays).filter((l): l is number => l != null);
  const minLead = leadTimes.length ? Math.min(...leadTimes) : null;

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-gray-400">Loading quotes...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <motion.div variants={fadeInUp} initial="initial" animate="animate" className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-gray-400" />
          Quote Comparison
        </h1>
        <p className="text-gray-500 text-sm mt-1">Compare vendor quotes and approve the best offer</p>
      </motion.div>

      {quotes.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No quotes received yet. Send RFQs to vendors to start getting quotes.</p>
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="initial" animate="animate">
          {/* Comparison table */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Vendor</th>
                    <th className="text-left px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      <span className="flex items-center gap-1"><ArrowUpDown className="w-3 h-3" />Price</span>
                    </th>
                    <th className="text-left px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Lead Time</th>
                    <th className="text-left px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Valid Until</th>
                    <th className="text-left px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Terms</th>
                    <th className="text-left px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {quotes.map((quote) => {
                    const price = parseFloat(quote.price ?? '');
                    const isLowest = !isNaN(price) && minPrice !== null && price === minPrice;
                    const isFastest = quote.leadTimeDays != null && minLead !== null && quote.leadTimeDays === minLead;

                    return (
                      <motion.tr
                        key={quote.id}
                        variants={tableRowVariants}
                        className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer"
                        onClick={() => setSelectedQuote(quote)}
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900 text-sm">{quote.vendorName}</div>
                          <div className="text-xs text-gray-400">{quote.vendorEmail}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className={`font-semibold text-sm ${isLowest ? 'text-green-700' : 'text-gray-700'}`}>
                            {formatCurrency(quote.price, quote.currency ?? 'USD')}
                            {isLowest && (
                              <span className="ml-1.5 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Lowest</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className={`text-sm ${isFastest ? 'text-blue-700 font-semibold' : 'text-gray-600'}`}>
                            {quote.leadTimeDays != null ? `${quote.leadTimeDays} days` : '—'}
                            {isFastest && (
                              <span className="ml-1.5 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">Fastest</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          {quote.validUntil ? formatDate(quote.validUntil) : '—'}
                        </td>
                        <td className="px-4 py-4 text-xs text-gray-500 max-w-[150px] truncate">
                          {quote.terms ?? '—'}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getStatusColor(quote.status)}`}>
                            {quote.status}
                          </span>
                        </td>
                        <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            {quote.status !== 'ACCEPTED' && quote.status !== 'REJECTED' && (
                              <>
                                <button
                                  onClick={() => statusMutation.mutate({ id: quote.id, status: 'SHORTLISTED' })}
                                  className="p-1.5 hover:bg-amber-50 rounded-lg text-amber-500 transition-colors"
                                  title="Shortlist"
                                >
                                  ★
                                </button>
                                <button
                                  onClick={() => statusMutation.mutate({ id: quote.id, status: 'REJECTED' })}
                                  className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Reject"
                                >
                                  <XCircle className="w-4 h-4 text-red-400" />
                                </button>
                                <button
                                  onClick={() => tenderMutation.mutate(quote.id)}
                                  className="p-1.5 hover:bg-green-50 rounded-lg transition-colors"
                                  title="Approve & Issue Tender"
                                >
                                  <Award className="w-4 h-4 text-green-500" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* Quote detail modal */}
      <Modal isOpen={!!selectedQuote} onClose={() => setSelectedQuote(null)} title={`Quote from ${selectedQuote?.vendorName}`} size="lg">
        {selectedQuote && (
          <div className="p-6 space-y-4">
            {selectedQuote.aiSummary && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <div className="text-xs font-semibold text-blue-500 uppercase mb-1">AI Summary</div>
                <p className="text-sm text-blue-800">{selectedQuote.aiSummary}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-400 text-xs mb-1">Price</div>
                <div className="font-bold text-green-700 text-lg">{formatCurrency(selectedQuote.price, selectedQuote.currency)}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs mb-1">Lead Time</div>
                <div className="font-semibold text-gray-800">{selectedQuote.leadTimeDays ? `${selectedQuote.leadTimeDays} days` : 'N/A'}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs mb-1">Valid Until</div>
                <div className="text-gray-700">{selectedQuote.validUntil ? formatDate(selectedQuote.validUntil) : 'N/A'}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs mb-1">Status</div>
                <Badge>{selectedQuote.status}</Badge>
              </div>
            </div>
            {selectedQuote.terms && (
              <div>
                <div className="text-gray-400 text-xs mb-1">Terms</div>
                <p className="text-sm text-gray-700">{selectedQuote.terms}</p>
              </div>
            )}
            <div className="pt-4 border-t flex gap-3">
              <Button
                variant="danger"
                size="md"
                className="flex-1"
                icon={<XCircle className="w-4 h-4" />}
                onClick={() => {
                  statusMutation.mutate({ id: selectedQuote.id, status: 'REJECTED' });
                  setSelectedQuote(null);
                }}
              >
                Reject
              </Button>
              <Button
                size="md"
                className="flex-1"
                icon={<CheckCircle className="w-4 h-4" />}
                onClick={() => tenderMutation.mutate(selectedQuote.id)}
                loading={tenderMutation.isPending}
              >
                Approve & Issue Tender
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
