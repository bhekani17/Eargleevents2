import { useState } from 'react';
import { Filter, X } from 'lucide-react';

export function PackageFilter({ onFilterChange, activeFilters }) {
  const [isOpen, setIsOpen] = useState(false);

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'wedding', label: 'Wedding' },
    { value: 'corporate', label: 'Corporate' },
    { value: 'birthday', label: 'Birthday' },
    { value: 'festival', label: 'Festival' },
    { value: 'funeral', label: 'Funeral' },
    { value: 'custom', label: 'Custom' }
  ];

  const handleCategoryChange = (category) => {
    onFilterChange({ ...activeFilters, category });
  };

  const handlePopularToggle = () => {
    onFilterChange({ 
      ...activeFilters, 
      popular: !activeFilters.popular 
    });
  };

  const clearFilters = () => {
    onFilterChange({ category: '', popular: false });
  };

  const hasActiveFilters = activeFilters.category || activeFilters.popular;

  return (
    <div className="relative">
      {/* Mobile Filter Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium gap-2"
      >
        <Filter className="w-4 h-4 mr-2" />
        Filters
        {hasActiveFilters && (
          <span className="ml-2 w-2 h-2 bg-gold-500 rounded-full"></span>
        )}
      </button>

      {/* Filter Panel */}
      <div className={`${
        isOpen ? 'block' : 'hidden'
      } md:block absolute md:relative top-full left-0 right-0 md:top-auto bg-white md:bg-transparent border md:border-0 border-gray-200 rounded-md md:rounded-none shadow-md md:shadow-none z-10 p-3 md:p-0 mt-2 md:mt-0`}>
        
        {/* Mobile Close Button */}
        <div className="md:hidden flex justify-between items-center mb-3 pb-2 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Filters</h3>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4">
          {/* Category Filter */}
          <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2 w-full md:w-auto">
            <label className="text-sm font-medium text-gray-700 mb-1 md:mb-0 md:mr-2">
              Category:
            </label>
            <select
              value={activeFilters.category || ''}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent w-full md:w-auto"
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {/* Popular Filter */}
          <div className="flex items-center mt-1 md:mt-0">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={activeFilters.popular || false}
                onChange={handlePopularToggle}
                className="w-4 h-4 text-gold-600 border-gray-300 rounded focus:ring-gold-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                Popular packages only
              </span>
            </label>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-gold-600 hover:text-gold-700 font-medium md:ml-4 mt-2 md:mt-0"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-25 z-0"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </div>
  );
}
