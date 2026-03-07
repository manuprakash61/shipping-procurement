import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FileText, ChevronRight, Clock, Send, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { rfqApi } from '@/api/rfq.api';
import { staggerContainer, fadeInUp } from '@/utils/animations';
import { formatDate, formatRelative, getStatusColor } from '@/utils/formatters';

export default function RFQPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['rfqs'],
    queryFn: () => rfqApi.list({ limit: 50 }),
  });

  const rfqs = data?.rfqs ?? [];

  return (
    <div className="p-8">
      <motion.div variants={fadeInUp} initial="initial" animate="animate" className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-400" />
          RFQ Manager
        </h1>
        <p className="text-gray-500 text-sm mt-1">Track all your Request for Quotation emails</p>
      </motion.div>

      {isLoading && (
        <div className="text-center text-gray-400 py-16">Loading RFQs...</div>
      )}

      {!isLoading && rfqs.length === 0 && (
        <div className="text-center py-24 text-gray-400">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No RFQs sent yet. Go to <Link to="/search" className="text-brand-600 hover:underline">Find Vendors</Link> to send your first RFQ.</p>
        </div>
      )}

      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-3">
        {rfqs.map((rfq: { id: string; subject: string; status: string; deadline?: string; sentAt?: string; createdAt: string; _count?: { rfqVendors: number; quotes: number } }) => (
          <motion.div
            key={rfq.id}
            variants={fadeInUp}
            className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">{rfq.subject}</h3>
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${getStatusColor(rfq.status)}`}>
                    {rfq.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  {rfq.sentAt && (
                    <span className="flex items-center gap-1">
                      <Send className="w-3 h-3" />
                      Sent {formatRelative(rfq.sentAt)}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {rfq._count?.rfqVendors ?? 0} vendors
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {rfq._count?.quotes ?? 0} replies
                  </span>
                  {rfq.deadline && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Due {formatDate(rfq.deadline)}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 ml-4" />
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
