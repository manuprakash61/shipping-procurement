import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Award, Send, Eye } from 'lucide-react';
import { tendersApi } from '@/api/tenders.api';
import { Tender } from '@/types';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { staggerContainer, fadeInUp } from '@/utils/animations';
import { formatDate, formatCurrency, getStatusColor } from '@/utils/formatters';

export default function TendersPage() {
  const queryClient = useQueryClient();
  const [previewTender, setPreviewTender] = useState<Tender | null>(null);
  const [previewHtml, setPreviewHtml] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['tenders'],
    queryFn: () => tendersApi.list({ limit: 50 }),
  });

  const issueMutation = useMutation({
    mutationFn: (id: string) => tendersApi.issue(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['tenders'] }),
  });

  const handlePreview = async (tender: Tender) => {
    const html = await tendersApi.preview(tender.id);
    setPreviewHtml(html);
    setPreviewTender(tender);
  };

  const tenders: Tender[] = data?.tenders ?? [];

  return (
    <div className="p-8">
      <motion.div variants={fadeInUp} initial="initial" animate="animate" className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Award className="w-5 h-5 text-gray-400" />
          Tenders
        </h1>
        <p className="text-gray-500 text-sm mt-1">Issue and track formal tender awards</p>
      </motion.div>

      {isLoading && <div className="text-center text-gray-400 py-16">Loading tenders...</div>}

      {!isLoading && tenders.length === 0 && (
        <div className="text-center py-24 text-gray-400">
          <Award className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No tenders yet. Approve a quote in the Quotes section to issue your first tender.</p>
        </div>
      )}

      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-3">
        {tenders.map((tender) => (
          <motion.div
            key={tender.id}
            variants={fadeInUp}
            className="bg-white rounded-2xl border border-gray-100 p-5"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold text-gray-900 text-sm">{tender.vendorName}</h3>
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${getStatusColor(tender.status)}`}>
                    {tender.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  {tender.agreedPrice && (
                    <span className="text-green-700 font-semibold">
                      {formatCurrency(tender.agreedPrice, tender.currency ?? 'USD')}
                    </span>
                  )}
                  {tender.issuedAt && <span>Issued {formatDate(tender.issuedAt)}</span>}
                  {tender.deliveryDate && <span>Delivery {formatDate(tender.deliveryDate)}</span>}
                  <span className="truncate">{tender.vendorEmail}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Eye className="w-4 h-4" />}
                  onClick={() => handlePreview(tender)}
                >
                  Preview
                </Button>
                {tender.status === 'DRAFT' && (
                  <Button
                    size="sm"
                    icon={<Send className="w-4 h-4" />}
                    loading={issueMutation.isPending}
                    onClick={() => issueMutation.mutate(tender.id)}
                  >
                    Issue Tender
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Tender preview modal */}
      <Modal
        isOpen={!!previewTender}
        onClose={() => { setPreviewTender(null); setPreviewHtml(''); }}
        title={`Tender — ${previewTender?.vendorName}`}
        size="xl"
      >
        <div className="p-4">
          <iframe
            srcDoc={previewHtml}
            className="w-full h-[600px] rounded-xl border border-gray-100"
            title="Tender Preview"
          />
          {previewTender?.status === 'DRAFT' && (
            <div className="mt-4 flex justify-end">
              <Button
                size="md"
                icon={<Send className="w-4 h-4" />}
                loading={issueMutation.isPending}
                onClick={() => {
                  issueMutation.mutate(previewTender.id);
                  setPreviewTender(null);
                }}
              >
                Issue Tender
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
