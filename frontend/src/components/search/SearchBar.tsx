import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Globe, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const REGIONS = [
  'Worldwide',
  'Southeast Asia',
  'East Asia',
  'South Asia',
  'Middle East',
  'Europe',
  'North America',
  'South America',
  'Africa',
  'Oceania',
];

interface SearchBarProps {
  onSearch: (query: string, region?: string) => void;
  loading?: boolean;
}

export function SearchBar({ onSearch, loading }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('Worldwide');
  const [showRegions, setShowRegions] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSearch(query.trim(), region === 'Worldwide' ? undefined : region);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-stretch gap-2 bg-white rounded-2xl shadow-lg border border-gray-200 p-2"
      >
        {/* Search input */}
        <div className="flex-1 flex items-center gap-3 px-3">
          <Search className="w-5 h-5 text-gray-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Search for a product or service, e.g. "bulk cement supplier" or "freight forwarder"'
            className="flex-1 text-sm text-gray-900 placeholder:text-gray-400 bg-transparent outline-none"
          />
        </div>

        {/* Region selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowRegions(!showRegions)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
          >
            <Globe className="w-4 h-4" />
            {region}
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {showRegions && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-10 min-w-[160px]"
            >
              {REGIONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setRegion(r);
                    setShowRegions(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                    region === r ? 'text-brand-600 font-medium' : 'text-gray-700'
                  }`}
                >
                  {r}
                </button>
              ))}
            </motion.div>
          )}
        </div>

        <Button
          type="submit"
          loading={loading}
          size="md"
          className="rounded-xl px-6 shrink-0"
        >
          Search
        </Button>
      </motion.div>
    </form>
  );
}
