import { useState, useEffect } from 'react';
import { PackageCard } from '../components/PackageCard';
import { PackageFilter } from '../components/PackageFilter';
import packageService from '../services/packageService';
import { Loader2, Boxes, AlertCircle, Filter } from 'lucide-react';

export function PackagesPage({ onQuoteClick }) {
  const [packages, setPackages] = useState([]);
  const [filteredPackages, setFilteredPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    popular: false
  });

  // Fetch packages from MongoDB in real-time
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await packageService.getAllPackages();
        console.log('Fetched packages from MongoDB:', data);
        setPackages(data);
        setFilteredPackages(data);
      } catch (err) {
        setError(err.message || 'Failed to load packages from database');
        console.error('Error fetching packages:', err);
        setPackages([]);
        setFilteredPackages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  // Apply filters when filters change
  useEffect(() => {
    let filtered = [...packages];

    // Filter by category
    if (filters.category) {
      filtered = filtered.filter(pkg => pkg.category === filters.category);
    }

    // Filter by popular
    if (filters.popular) {
      filtered = filtered.filter(pkg => pkg.isPopular);
    }

    setFilteredPackages(filtered);
  }, [packages, filters]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-0 bg-gray-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
          <div className="flex flex-col sm:flex-row items-center justify-center text-center sm:text-left gap-3">
            <Loader2 className="w-7 h-7 sm:w-8 sm:h-8 animate-spin text-gold-600" />
            <span className="text-sm sm:text-base text-gray-600">Loading packages...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-0 bg-gray-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
          <div className="text-center px-2 sm:px-0">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Packages</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gold-600 text-black font-semibold rounded-lg hover:bg-gold-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-0">
      {/* Hero */}
      <div
        className="relative bg-gray-900 text-white"
      >
        <div
          className="absolute inset-0 bg-center bg-cover"
          style={{ backgroundImage: "url('/images/t4.jpg')" }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-black/40" aria-hidden="true" />
        <div className="relative max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16 lg:py-20">
          <div className="flex items-center justify-center mb-3 sm:mb-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-center">Event Packages</h1>
          </div>
          <p className="text-base sm:text-lg md:text-xl text-gray-200 max-w-3xl mx-auto text-center px-2 sm:px-0">
            From intimate gatherings to large celebrations — choose a package and customize it to your needs.
          </p>
        </div>
      </div>

      {/* Packages Section */}
      <div className="bg-gray-50 pt-10 sm:pt-16 md:pt-20 lg:pt-24">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pb-8 sm:pb-12">

        {/* Filter Section */}
        <div className="mb-6 sm:mb-8">
          <PackageFilter 
            activeFilters={filters} 
            onFilterChange={handleFilterChange}
          />
        </div>

        {/* Packages Grid */}
        {filteredPackages.length === 0 ? (
          <div className="text-center py-8 sm:py-10 md:py-12">
            {packages.length === 0 ? (
              <>
                <Boxes className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No Packages Available</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 px-2 sm:px-0">
                  Our event packages are currently being updated. Please check back soon or contact us for custom event solutions.
                </p>
                <button
                  onClick={() => onQuoteClick({ type: 'custom' })}
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-gold-600 text-black text-sm sm:text-base font-semibold rounded-lg hover:bg-gold-700 transition-colors"
                >
                  Request Custom Package
                </button>
              </>
            ) : (
              <>
                <Filter className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No Packages Found</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 px-2 sm:px-0">
                  No packages match your current filters. Try adjusting your selection or contact us for custom solutions.
                </p>
                <button
                  onClick={() => onQuoteClick({ type: 'custom' })}
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-gold-600 text-black text-sm sm:text-base font-semibold rounded-lg hover:bg-gold-700 transition-colors"
                >
                  Request Custom Package
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6 sm:gap-5 lg:gap-6 px-4 sm:px-2 md:px-0 border-t-4 border-gold-500 pt-6 sm:border-t-0 sm:pt-0">
            {filteredPackages.map((pkg) => (
              <PackageCard 
                key={pkg._id} 
                package={pkg} 
                onQuoteClick={onQuoteClick}
              />
            ))}
          </div>
        )}

        {/* Results Info */}
        {filteredPackages.length > 0 && (
          <div className="mt-8 text-center text-gray-600">
            Showing {filteredPackages.length} of {packages.length} packages
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
