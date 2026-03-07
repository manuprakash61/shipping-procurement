import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, FileText, MessageSquare, Award, ArrowRight, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { searchApi } from '@/api/search.api';
import { rfqApi } from '@/api/rfq.api';
import { quotesApi } from '@/api/quotes.api';
import { tendersApi } from '@/api/tenders.api';
import { staggerContainer, fadeInUp } from '@/utils/animations';
import { formatRelative } from '@/utils/formatters';
import { Badge } from '@/components/ui/Badge';
import { ProcurementTracker, getProcurementStep } from '@/components/ui/ProcurementTracker';

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  to,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: string;
  to: string;
}) {
  return (
    <motion.div variants={fadeInUp}>
      <Link
        to={to}
        className="block bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow"
      >
        <div className="flex items-center justify-between mb-4">
          <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <ArrowRight className="w-4 h-4 text-gray-300" />
        </div>
        <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
        <div className="text-sm text-gray-500">{label}</div>
      </Link>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { user, company } = useAuthStore();

  const { data: searchHistory } = useQuery({
    queryKey: ['search', 'history'],
    queryFn: () => searchApi.history({ limit: 5 }),
  });

  const { data: rfqs } = useQuery({
    queryKey: ['rfqs'],
    queryFn: () => rfqApi.list({ limit: 5 }),
  });

  const { data: quotes } = useQuery({
    queryKey: ['quotes'],
    queryFn: () => quotesApi.list({ limit: 5 }),
  });

  const { data: tenders } = useQuery({
    queryKey: ['tenders'],
    queryFn: () => tendersApi.list({ limit: 5 }),
  });

  return (
    <div className="p-8">
      {/* Welcome */}
      <motion.div variants={fadeInUp} initial="initial" animate="animate" className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Good morning, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 mt-1">{company?.name} — Procurement Dashboard</p>
      </motion.div>

      {/* Procurement Pipeline Tracker (buyers only) */}
      {company?.companyType !== 'SUPPLIER' && (
        <motion.div variants={fadeInUp} initial="initial" animate="animate" className="mb-8">
          <ProcurementTracker
            currentStep={getProcurementStep({
              hasSearch: (searchHistory?.meta?.total ?? 0) > 0,
              hasRFQ: (rfqs?.meta?.total ?? 0) > 0,
              hasQuotes: (quotes?.meta?.total ?? 0) > 0,
              hasShortlisted: quotes?.quotes?.some((q: { status: string }) => q.status === 'SHORTLISTED'),
              hasTender: (tenders?.meta?.total ?? 0) > 0,
              tenderIssued: tenders?.tenders?.some((t: { status: string }) => t.status === 'ISSUED' || t.status === 'ACKNOWLEDGED' || t.status === 'COMPLETED'),
              tenderAcknowledged: tenders?.tenders?.some((t: { status: string }) => t.status === 'ACKNOWLEDGED' || t.status === 'COMPLETED'),
              tenderComplete: tenders?.tenders?.some((t: { status: string }) => t.status === 'COMPLETED'),
            })}
          />
        </motion.div>
      )}

      {/* Stats */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8"
      >
        <StatCard
          icon={Search}
          label="Recent searches"
          value={searchHistory?.meta?.total ?? 0}
          color="bg-brand-500"
          to="/search"
        />
        <StatCard
          icon={FileText}
          label="RFQs sent"
          value={rfqs?.meta?.total ?? 0}
          color="bg-purple-500"
          to="/rfq"
        />
        <StatCard
          icon={MessageSquare}
          label="Quotes received"
          value={quotes?.meta?.total ?? 0}
          color="bg-green-500"
          to="/quotes"
        />
        <StatCard
          icon={Award}
          label="Tenders issued"
          value={tenders?.meta?.total ?? 0}
          color="bg-amber-500"
          to="/tenders"
        />
      </motion.div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent searches */}
        <motion.div variants={fadeInUp} initial="initial" animate="animate" className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-400" />
              Recent Searches
            </h2>
            <Link to="/search" className="text-xs text-brand-600 hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {searchHistory?.sessions?.length === 0 && (
              <p className="text-sm text-gray-400">No searches yet. Start by finding vendors!</p>
            )}
            {searchHistory?.sessions?.map((session: { id: string; query: string; status: string; region?: string; createdAt: string; _count?: { vendors: number } }) => (
              <div key={session.id} className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-800">{session.query}</div>
                  <div className="text-xs text-gray-400">
                    {session.region ?? 'Worldwide'} · {formatRelative(session.createdAt)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={session.status === 'COMPLETED' ? 'success' : 'info'}>
                    {session._count?.vendors ?? 0} vendors
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent quotes */}
        <motion.div variants={fadeInUp} initial="initial" animate="animate" className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gray-400" />
              Recent Quotes
            </h2>
            <Link to="/quotes" className="text-xs text-brand-600 hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {quotes?.quotes?.length === 0 && (
              <p className="text-sm text-gray-400">No quotes yet. Send RFQs to vendors to get started.</p>
            )}
            {quotes?.quotes?.map((quote: { id: string; vendorName: string; price?: string; currency?: string; status: string; receivedAt: string }) => (
              <div key={quote.id} className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-800">{quote.vendorName}</div>
                  <div className="text-xs text-gray-400">{formatRelative(quote.receivedAt)}</div>
                </div>
                <div className="flex items-center gap-2">
                  {quote.price && (
                    <span className="text-sm font-semibold text-green-700">
                      {quote.price} {quote.currency}
                    </span>
                  )}
                  <Badge variant={quote.status === 'SHORTLISTED' ? 'warning' : quote.status === 'ACCEPTED' ? 'success' : 'info'}>
                    {quote.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
