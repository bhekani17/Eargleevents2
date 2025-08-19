// Helper functions for the Eagles Events application

/**
 * Safely render a location object as a string
 * @param {Object|string} location - Location object or string
 * @returns {string} - Formatted location string
 */
export const formatLocation = (location) => {
  if (!location) return 'Location not specified';
  
  if (typeof location === 'string') {
    return location;
  }
  
  if (typeof location === 'object') {
    const parts = [];
    if (location.address) parts.push(location.address);
    if (location.city) parts.push(location.city);
    if (location.province) parts.push(location.province);
    
    return parts.length > 0 ? parts.join(', ') : 'Location not specified';
  }
  
  return 'Location not specified';
};

/**
 * Format a date string to a readable format
 * @param {string|Date} dateString - Date to format
 * @returns {string} - Formatted date string
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return 'Invalid Date';
  }
};

/**
 * Format a currency amount
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: 'ZAR')
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (amount, currency = 'ZAR') => {
  if (!amount && amount !== 0) return 'R0';
  
  try {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency === 'ZAR' ? 'ZAR' : currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    return `R${amount.toLocaleString()}`;
  }
};

/**
 * Safely render any object as a string for React components
 * @param {any} value - Value to render
 * @returns {string} - Safe string representation
 */
export const safeRender = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return value.map(item => safeRender(item)).join(', ');
    }
    return JSON.stringify(value);
  }
  return String(value);
};

/**
 * Get status color classes for different statuses
 * @param {string} status - Status value
 * @returns {string} - CSS classes for status styling
 */
export const getStatusClasses = (status) => {
  const statusLower = status?.toLowerCase() || '';
  
  switch (statusLower) {
    case 'completed':
    case 'approved':
    case 'confirmed':
      return 'bg-green-100 text-green-800';
    case 'pending':
    case 'in-progress':
      return 'bg-yellow-100 text-yellow-800';
    case 'cancelled':
    case 'rejected':
      return 'bg-red-100 text-red-800';
    case 'draft':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-blue-100 text-blue-800';
  }
};

export default {
  formatLocation,
  formatDate,
  formatCurrency,
  safeRender,
  getStatusClasses
};
