import { useMemo, useState } from 'react';
import { Star, Users, Clock, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { formatCurrency } from '../utils/helpers';

export function PackageCard({ package: pkg, onQuoteClick, featured = false }) {
  // Build images list from package data
  const images = useMemo(() => {
    const list = [];
    if (Array.isArray(pkg?.images) && pkg.images.length > 0) {
      for (const img of pkg.images) {
        if (img?.url) list.push(img.url);
      }
    }
    if (pkg?.imageUrl) list.unshift(pkg.imageUrl);
    // Fallback placeholder if empty
    const unique = Array.from(new Set(list));
    return unique.length ? unique : ['/uploads/'];
  }, [pkg]);

  const [current, setCurrent] = useState(0);
  const total = images.length;
  const prev = (e) => { e?.stopPropagation?.(); setCurrent((c) => (c - 1 + total) % total); };
  const next = (e) => { e?.stopPropagation?.(); setCurrent((c) => (c + 1) % total); };

  const handleGetQuote = () => {
    onQuoteClick({
      preSelectedItem: {
        type: 'package',
        packageId: pkg._id,
        packageName: pkg.name,
        estimatedCost: pkg.basePrice ?? pkg.price ?? 0
      }
    });
  };

  return (
    <div className={`relative bg-white/80 backdrop-blur-sm border border-gray-100 rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${
      featured ? 'ring-2 ring-gold-500' : ''
    }`}>
      {featured && (
        <div className="absolute top-4 right-4 z-10">
          <span className="bg-gold-500 text-black px-3 py-1 rounded-full text-sm font-semibold flex items-center">
            <Star className="w-4 h-4 mr-1" />
            Popular
          </span>
        </div>
      )}
      
      {/* Image */}
      <div className="relative h-32 sm:h-52 md:h-60 overflow-hidden group">
        <img
          src={images[current]}
          alt={pkg.name}
          className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent"></div>
        {total > 1 && (
          <>
            {/* Prev/Next Controls */}
            <button
              type="button"
              aria-label="Previous image"
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === current ? 'w-5 bg-white' : 'w-2 bg-white/60 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>
          </>
        )}
        {/* Price badge */}
        <div className="absolute top-4 left-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-white/90 text-gray-900 shadow">
            {formatCurrency(pkg.basePrice ?? pkg.price ?? 0)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-2 sm:p-5 md:p-6 bg-white sm:bg-none">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gold-100 text-gold-800">
              {pkg.category}
            </span>
          </div>
          <h3 className="text-xs sm:text-lg md:text-xl font-bold text-gray-900 mb-1 sm:mb-2">{pkg.name}</h3>
          {(pkg.description || pkg.shortDescription) && (
            <p className="text-gray-600 text-xs sm:text-sm line-clamp-2 sm:line-clamp-3">{pkg.description || pkg.shortDescription}</p>
          )}
        </div>

        {/* Package Details */}
        <div className="flex flex-wrap items-center gap-1 sm:gap-4 mb-2 sm:mb-4 text-[10px] sm:text-xs md:text-sm text-gray-500">
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-1" />
            <span>{pkg.minGuests}-{pkg.maxGuests} guests</span>
          </div>
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            <span>{pkg.duration}</span>
          </div>
        </div>

        {/* Features */}
        <div className="mb-3 sm:mb-6">
          <h4 className="text-xs sm:text-sm font-semibold text-gray-900 mb-1 sm:mb-2">Included:</h4>
          <div className="flex flex-wrap gap-1 sm:gap-2">
            {pkg.features.slice(0, 4).map((feature, index) => (
              <span key={index} className="inline-flex items-center px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-xs bg-gray-100 text-gray-700">
                <CheckCircle className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-green-500 mr-1 sm:mr-1.5" />
                {feature}
              </span>
            ))}
            {pkg.features.length > 4 && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-gray-50 text-gray-500">
                +{pkg.features.length - 4} more
              </span>
            )}
          </div>
        </div>

        {/* Action Button */}
        <Button
          onClick={handleGetQuote}
          className="w-full bg-gold-600 hover:bg-gold-700 text-black font-medium sm:font-semibold rounded-md sm:rounded-full text-[10px] sm:text-xs md:text-sm py-1.5 sm:py-2 md:py-3"
        >
          Add to Quotation
        </Button>
      </div>
    </div>
  );
}
