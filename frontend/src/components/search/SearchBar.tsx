import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface LocationOption {
  label: string;
  value: string;
  countryCode?: string;
  isHeader?: boolean;
}

const LOCATIONS: LocationOption[] = [
  { label: 'Worldwide', value: 'Worldwide' },

  { label: 'Africa', value: '', isHeader: true },
  { label: 'Nigeria', value: 'Nigeria', countryCode: 'ng' },
  { label: 'Kenya', value: 'Kenya', countryCode: 'ke' },
  { label: 'Ghana', value: 'Ghana', countryCode: 'gh' },
  { label: 'South Africa', value: 'South Africa', countryCode: 'za' },
  { label: 'Egypt', value: 'Egypt', countryCode: 'eg' },
  { label: 'Ethiopia', value: 'Ethiopia', countryCode: 'et' },
  { label: 'Tanzania', value: 'Tanzania', countryCode: 'tz' },

  { label: 'Middle East', value: '', isHeader: true },
  { label: 'United Arab Emirates', value: 'United Arab Emirates', countryCode: 'ae' },
  { label: 'Saudi Arabia', value: 'Saudi Arabia', countryCode: 'sa' },
  { label: 'Qatar', value: 'Qatar', countryCode: 'qa' },
  { label: 'Kuwait', value: 'Kuwait', countryCode: 'kw' },
  { label: 'Oman', value: 'Oman', countryCode: 'om' },
  { label: 'Turkey', value: 'Turkey', countryCode: 'tr' },

  { label: 'South Asia', value: '', isHeader: true },
  { label: 'India', value: 'India', countryCode: 'in' },
  { label: 'Kerala, India', value: 'Kerala, India', countryCode: 'in' },
  { label: 'Ernakulam, India', value: 'Ernakulam, Kerala, India', countryCode: 'in' },
  { label: 'Kochi (Edakochi), India', value: 'Kochi, Kerala, India', countryCode: 'in' },
  { label: 'Mumbai, India', value: 'Mumbai, Maharashtra, India', countryCode: 'in' },
  { label: 'Delhi, India', value: 'Delhi, India', countryCode: 'in' },
  { label: 'Chennai, India', value: 'Chennai, Tamil Nadu, India', countryCode: 'in' },
  { label: 'Bangalore, India', value: 'Bangalore, Karnataka, India', countryCode: 'in' },
  { label: 'Pakistan', value: 'Pakistan', countryCode: 'pk' },
  { label: 'Bangladesh', value: 'Bangladesh', countryCode: 'bd' },
  { label: 'Sri Lanka', value: 'Sri Lanka', countryCode: 'lk' },

  { label: 'Southeast Asia', value: '', isHeader: true },
  { label: 'Singapore', value: 'Singapore', countryCode: 'sg' },
  { label: 'Malaysia', value: 'Malaysia', countryCode: 'my' },
  { label: 'Indonesia', value: 'Indonesia', countryCode: 'id' },
  { label: 'Thailand', value: 'Thailand', countryCode: 'th' },
  { label: 'Vietnam', value: 'Vietnam', countryCode: 'vn' },
  { label: 'Philippines', value: 'Philippines', countryCode: 'ph' },

  { label: 'East Asia', value: '', isHeader: true },
  { label: 'China', value: 'China', countryCode: 'cn' },
  { label: 'Japan', value: 'Japan', countryCode: 'jp' },
  { label: 'South Korea', value: 'South Korea', countryCode: 'kr' },
  { label: 'Hong Kong', value: 'Hong Kong', countryCode: 'hk' },
  { label: 'Taiwan', value: 'Taiwan', countryCode: 'tw' },

  { label: 'Europe', value: '', isHeader: true },
  { label: 'United Kingdom', value: 'United Kingdom', countryCode: 'gb' },
  { label: 'Germany', value: 'Germany', countryCode: 'de' },
  { label: 'Netherlands', value: 'Netherlands', countryCode: 'nl' },
  { label: 'France', value: 'France', countryCode: 'fr' },
  { label: 'Spain', value: 'Spain', countryCode: 'es' },
  { label: 'Italy', value: 'Italy', countryCode: 'it' },
  { label: 'Poland', value: 'Poland', countryCode: 'pl' },

  { label: 'North America', value: '', isHeader: true },
  { label: 'United States', value: 'United States', countryCode: 'us' },
  { label: 'Canada', value: 'Canada', countryCode: 'ca' },
  { label: 'Mexico', value: 'Mexico', countryCode: 'mx' },

  { label: 'South America', value: '', isHeader: true },
  { label: 'Brazil', value: 'Brazil', countryCode: 'br' },
  { label: 'Argentina', value: 'Argentina', countryCode: 'ar' },
  { label: 'Colombia', value: 'Colombia', countryCode: 'co' },

  { label: 'Oceania', value: '', isHeader: true },
  { label: 'Australia', value: 'Australia', countryCode: 'au' },
  { label: 'New Zealand', value: 'New Zealand', countryCode: 'nz' },
];

interface SearchBarProps {
  onSearch: (query: string, region?: string, countryCode?: string) => void;
  loading?: boolean;
}

export function SearchBar({ onSearch, loading }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<LocationOption>(LOCATIONS[0]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [locationFilter, setLocationFilter] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        setLocationFilter('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSearch(
      query.trim(),
      selected.value === 'Worldwide' ? undefined : selected.value,
      selected.countryCode,
    );
  };

  const filteredLocations = locationFilter
    ? LOCATIONS.filter(
        (l) =>
          !l.isHeader &&
          l.label.toLowerCase().includes(locationFilter.toLowerCase()),
      )
    : LOCATIONS;

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

        {/* Location selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => {
              setShowDropdown(!showDropdown);
              setLocationFilter('');
            }}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
          >
            <MapPin className="w-4 h-4" />
            <span className="max-w-[130px] truncate">{selected.label}</span>
            <ChevronDown className="w-3.5 h-3.5 shrink-0" />
          </button>

          {showDropdown && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 z-10 w-56"
            >
              {/* Filter input */}
              <div className="p-2 border-b border-gray-100">
                <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 rounded-lg">
                  <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <input
                    type="text"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    placeholder="Search country..."
                    className="flex-1 text-xs bg-transparent outline-none text-gray-700 placeholder:text-gray-400"
                    autoFocus
                  />
                  {locationFilter && (
                    <button type="button" onClick={() => setLocationFilter('')}>
                      <X className="w-3 h-3 text-gray-400" />
                    </button>
                  )}
                </div>
              </div>

              {/* Options list */}
              <div className="max-h-64 overflow-y-auto py-1">
                {filteredLocations.map((opt, i) =>
                  opt.isHeader ? (
                    <div
                      key={`header-${i}`}
                      className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400"
                    >
                      {opt.label}
                    </div>
                  ) : (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setSelected(opt);
                        setShowDropdown(false);
                        setLocationFilter('');
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                        selected.value === opt.value
                          ? 'text-brand-600 font-medium'
                          : 'text-gray-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ),
                )}
              </div>
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
