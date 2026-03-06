import { motion } from 'framer-motion';
import { Globe, Star, MapPin, Tag, Phone, Send, ChevronRight } from 'lucide-react';
import { Vendor } from '@/types';
import { vendorCardVariants } from '@/utils/animations';
import { EmailBadge } from './EmailBadge';
import { Button } from '@/components/ui/Button';
import { truncate } from '@/utils/formatters';

interface VendorCardProps {
  vendor: Vendor;
  selected?: boolean;
  onToggleSelect?: () => void;
  onViewDetails?: () => void;
  onRequestQuote?: () => void;
}

export function VendorCard({
  vendor,
  selected,
  onToggleSelect,
  onViewDetails,
  onRequestQuote,
}: VendorCardProps) {
  const primaryEmail = vendor.emails.find((e) => e.isPrimary) ?? vendor.emails[0];

  return (
    <motion.div
      variants={vendorCardVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}
      onClick={onToggleSelect}
      className={`
        relative bg-white rounded-2xl border-2 transition-all duration-200 cursor-pointer overflow-hidden
        ${selected ? 'border-brand-400 shadow-md' : 'border-gray-100 hover:border-gray-200'}
      `}
    >
      {/* Selection indicator */}
      {selected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-3 right-3 w-6 h-6 bg-brand-600 rounded-full flex items-center justify-center z-10"
        >
          <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </motion.div>
      )}

      {/* AI Score stripe */}
      {vendor.aiScore != null && (
        <div
          className="h-1 w-full"
          style={{
            background: `linear-gradient(to right, #3d6aff ${vendor.aiScore}%, #e5e7eb ${vendor.aiScore}%)`,
          }}
        />
      )}

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center shrink-0">
            <span className="text-brand-700 font-bold text-sm">
              {vendor.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm leading-snug truncate">
              {vendor.name}
            </h3>
            {vendor.website && (
              <a
                href={`https://${vendor.website.replace(/^https?:\/\//, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-xs text-brand-600 hover:underline truncate mt-0.5"
              >
                <Globe className="w-3 h-3 shrink-0" />
                {vendor.website.replace(/^https?:\/\//, '').replace(/^www\./, '')}
              </a>
            )}
          </div>

          {/* Google Rating */}
          {vendor.googleRating && (
            <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg shrink-0">
              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span className="text-xs font-semibold text-amber-700">
                {vendor.googleRating.toFixed(1)}
              </span>
              {vendor.googleReviews && (
                <span className="text-xs text-amber-500">({vendor.googleReviews})</span>
              )}
            </div>
          )}
        </div>

        {/* Location + Price */}
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
          {vendor.country && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {vendor.country}
              {vendor.region && ` · ${vendor.region}`}
            </span>
          )}
          {vendor.estimatedPrice && (
            <span className="text-green-700 font-medium">{vendor.estimatedPrice}</span>
          )}
        </div>

        {/* Description */}
        {vendor.description && (
          <p className="text-xs text-gray-500 leading-relaxed mb-3">
            {truncate(vendor.description, 120)}
          </p>
        )}

        {/* Email */}
        {primaryEmail && (
          <div className="mb-3" onClick={(e) => e.stopPropagation()}>
            <EmailBadge email={primaryEmail} />
          </div>
        )}

        {/* Phone */}
        {vendor.phone && (
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
            <Phone className="w-3 h-3" />
            {vendor.phone}
          </div>
        )}

        {/* Tags */}
        {vendor.aiTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {vendor.aiTags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full"
              >
                <Tag className="w-2.5 h-2.5" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div
          className="flex gap-2 pt-3 border-t border-gray-100"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="sm"
            icon={<ChevronRight className="w-4 h-4" />}
            onClick={onViewDetails}
            className="flex-1 justify-center text-gray-600"
          >
            Details
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Send className="w-4 h-4" />}
            onClick={onRequestQuote}
            className="flex-1 justify-center"
          >
            Request Quote
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
