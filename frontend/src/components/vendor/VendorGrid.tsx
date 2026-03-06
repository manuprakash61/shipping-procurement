import { motion, AnimatePresence } from 'framer-motion';
import { Vendor } from '@/types';
import { VendorCard } from './VendorCard';
import { staggerContainer } from '@/utils/animations';

interface VendorGridProps {
  vendors: Vendor[];
  selectedVendors: Set<string>;
  onToggleSelect: (id: string) => void;
  onViewDetails: (vendor: Vendor) => void;
  onRequestQuote: (vendor: Vendor) => void;
}

export function VendorGrid({
  vendors,
  selectedVendors,
  onToggleSelect,
  onViewDetails,
  onRequestQuote,
}: VendorGridProps) {
  if (vendors.length === 0) return null;

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
    >
      <AnimatePresence>
        {vendors.map((vendor) => (
          <VendorCard
            key={vendor.id}
            vendor={vendor}
            selected={selectedVendors.has(vendor.id)}
            onToggleSelect={() => onToggleSelect(vendor.id)}
            onViewDetails={() => onViewDetails(vendor)}
            onRequestQuote={() => onRequestQuote(vendor)}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
