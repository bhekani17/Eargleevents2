// API Base URL (using environment variable)
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://eagle-events-backend.onrender.com';

console.log('API Base URL:', API_BASE_URL); // Debug log

// Token management
const TOKEN_KEY = 'adminToken';
const getAuthToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

const setAuthToken = (token) => {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      clearAuthToken();
    }
  } catch (error) {
    console.error('Error setting auth token:', error);
  }
};

const clearAuthToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error clearing auth token:', error);
  }
};

// Check if token is expired
const isTokenExpired = (token) => {
  try {
    if (!token) return true;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
};

// Check if user is authenticated
const isAuthenticated = () => {
  const token = getAuthToken();
  return !!token && !isTokenExpired(token);
};

// Generic API call function
const apiCall = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Skip auth for these endpoints (treat as public)
  // Note: we include both with and without the '/api' prefix to be robust to route variants
  const publicEndpoints = [
    '/admin/auth/login',
    '/admin/auth/signup',
    '/contact',
    '/quote',
    '/packages',
    // Public site data
    '/api/equipment',
    '/equipment',
    '/api/testimonials',
    '/testimonials'
  ];
  // Treat POST /api/quotes as public (submit quote), but keep GET /api/quotes protected (admin list)
  const isQuotesPublicPost = endpoint.startsWith('/api/quotes') && (options.method || 'GET').toUpperCase() === 'POST';
  const isPublic = isQuotesPublicPost || publicEndpoints.some(path => endpoint.includes(path));
  
  // Check token expiration for authenticated requests
  if (!isPublic && !endpoint.includes('/admin/auth/')) {
    if (!token) {
      // Only redirect to admin login if user is currently on an admin route
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
        window.location.href = '/admin/login?session=expired';
      }
      throw new Error('No authentication token found. Please log in.');
    }
    
    if (isTokenExpired(token)) {
      clearAuthToken();
      // Only redirect to admin login if user is currently on an admin route
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
        window.location.href = '/admin/login?session=expired';
      }
      throw new Error('Session expired. Please log in again.');
    }
  }
  
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...(options.headers || {})
  };

  console.log(`API Request: ${options.method || 'GET'} ${url}`, {
    headers: {
      ...headers,
      'Authorization': headers.Authorization ? 'Bearer [TOKEN]' : undefined
    },
    body: isFormData ? '[FormData]' : options.body
  });

  try {
    const requestOptions = {
      ...options,
      headers,
      credentials: 'include',
      body: isFormData
        ? options.body
        : (options.body && typeof options.body !== 'string'
            ? JSON.stringify(options.body)
            : options.body)
    };

    const response = await fetch(url, requestOptions);
    
    // Try to parse JSON, but handle non-JSON responses gracefully
    let data;
    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : {};
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      throw new Error('Invalid JSON response from server');
    }
    
    console.log('API Response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      data
    });

    if (!response.ok) {
      // Create error object with detailed information
      const error = new Error(data?.message || data?.error || `HTTP error! status: ${response.status}`);
      error.status = response.status;
      error.data = data;
      error.response = response;
      
      // Handle specific error cases
      if (response.status === 401) {
        clearAuthToken();
        // Only redirect if currently in admin area and not already on login page
        if (typeof window !== 'undefined') {
          const path = window.location.pathname || '';
          if (path.startsWith('/admin') && !path.includes('/admin/login')) {
            window.location.href = '/admin/login?session=expired';
          }
        }
        error.message = 'Your session has expired. Please log in again.';
      } else if (response.status === 403) {
        error.message = 'You do not have permission to perform this action.';
      } else if (response.status === 404) {
        error.message = 'The requested resource was not found.';
      } else if (response.status === 400) {
        // Handle validation errors
        if (data?.errors) {
          error.message = 'Validation failed';
          error.errors = data.errors;
        } else {
          error.message = data?.message || 'Bad request. Please check your input.';
        }
      } else if (response.status >= 500) {
        error.message = 'A server error occurred. Please try again later.';
      }
      
      // Log detailed error info for debugging
      console.error('API Error:', {
        url,
        method: requestOptions.method || 'GET',
        status: response.status,
        statusText: response.statusText,
        requestBody: requestOptions.body,
        responseData: data,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      throw error;
    }

    return data;
  } catch (error) {
    console.error('API call failed:', {
      endpoint,
      method: options.method || 'GET',
      error: error.message,
      status: error.status,
      response: error.response,
      stack: error.stack
    });
    
    // Re-throw the error for the caller to handle
    throw error;
  }
};

// ==================== ADMIN API CALLS ====================

export const adminAPI = {
  // Auth status
  signup: async (adminData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(adminData),
      });

      const data = await response.json();
      
      if (data.success && data.token) {
        setAuthToken(data.token);
      }
      
      return data;
    } catch (error) {
      console.error('Signup error:', error);
      return { 
        success: false, 
        message: error.message || 'Failed to create admin account' 
      };
    }
  },
  isAuthenticated,
  
  // Get current user info
  getCurrentUser: async () => {
    try {
      const token = getAuthToken();
      if (!token) return null;
      
      const response = await fetch(`${API_BASE_URL}/api/admin/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          clearAuthToken();
        }
        throw new Error('Failed to fetch user data');
      }
      
      const data = await response.json();
      return data.data || null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },
  // Authentication
  login: async (credentials) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      console.log('Login response:', data);
      
      if (data.token) {
        setAuthToken(data.token);
        return { 
          success: true, 
          admin: data.admin || {},
          token: data.token
        };
      } else {
        throw new Error('No token received from server');
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 
                error.message || 
                'Login failed. Please check your credentials and try again.' 
      };
    }
  },
  
  logout: async () => {
    try {
      // Optional: Call the backend to invalidate the token
      const token = getAuthToken();
      if (token) {
        await fetch(`${API_BASE_URL}/admin/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Always clear the token from local storage
      clearAuthToken();
    }
  },

  // Dashboard
  getDashboardStats: () => apiCall('/api/admin/dashboard/stats'),

  // Quotes
  getQuotes: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/api/quotes${queryString ? `?${queryString}` : ''}`);
  },
  
  updateQuote: (id, data) => 
    apiCall(`/api/quotes/${id}`, {
      method: 'PUT',
      body: data,
    }),
  
  // Update quote status (e.g., confirm)
  updateQuoteStatus: (id, data) =>
    apiCall(`/api/quotes/${id}/status`, {
      method: 'PATCH',
      body: data,
    }),
  
  deleteQuote: (id) => 
    apiCall(`/api/quotes/${id}`, {
      method: 'DELETE',
    }),

  // Bookings
  getBookings: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    try {
      return await apiCall(`/admin/bookings${queryString ? `?${queryString}` : ''}`);
    } catch (err) {
      console.warn('Bookings endpoint unavailable, deriving from quotes. Reason:', err?.message);
      // Fallback: derive a basic bookings-like list from quotes so UI remains functional
      const quotesResponse = await adminAPI.getQuotes(params).catch(() => ({ data: [] }));
      const quotes = Array.isArray(quotesResponse)
        ? quotesResponse
        : (quotesResponse?.data || []);
      const derived = quotes.map((q) => ({
        _id: q._id,
        customerName: q.customerName,
        email: q.email,
        phone: q.phone,
        eventType: q.eventType,
        eventDate: q.eventDate || q.createdAt,
        services: q.services || [],
        location: q.location,
        totalCost: Number(q.totalAmount || 0),
        status: q.status || 'pending',
        paymentStatus: q.paymentStatus || 'pending',
      }));
      return { success: true, data: derived };
    }
  },
  
  getBooking: (id) => apiCall(`/admin/bookings/${id}`),
  
  createBooking: (data) => 
    apiCall('/admin/bookings', {
      method: 'POST',
      body: data,
    }),
  
  updateBooking: (id, data) => 
    apiCall(`/admin/bookings/${id}`, {
      method: 'PUT',
      body: data,
    }),
  
  deleteBooking: (id) => 
    apiCall(`/admin/bookings/${id}`, {
      method: 'DELETE',
    }),

  // Customers with approved quotes
  getCustomersWithApprovedQuotes: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      return await apiCall(`/api/admin/customers/approved-quotes${queryString ? `?${queryString}` : ''}`);
    } catch (err) {
      console.error('Error fetching customers with approved quotes:', err);
      return { success: false, message: err.message || 'Failed to fetch customers with approved quotes' };
    }
  },

  // Get customers from quotes collection
  getCustomers: async (params = {}) => {
    try {
      // Primary: fetch from Customer collection with pagination and search
      const queryString = new URLSearchParams(params).toString();
      const primary = await apiCall(`/api/admin/customers${queryString ? `?${queryString}` : ''}`);
      if (primary && (Array.isArray(primary.data) || Array.isArray(primary))) {
        return primary;
      }

      // Fallback 1: approved quotes aggregation endpoint
      const response = await adminAPI.getCustomersWithApprovedQuotes(params);
      if (response?.success) {
        return response;
      }
      
      // Fallback 2: derive from quotes
      const quotesResponse = await adminAPI.getQuotes({ ...params, status: 'approved' }).catch(() => ({ data: [] }));
      const quotes = Array.isArray(quotesResponse) ? quotesResponse : (quotesResponse.data || []);
      const approvedQuotes = quotes.filter(q => (q.status === 'approved' || q.status === 'confirmed'));
      const byKey = new Map();
      approvedQuotes.forEach(q => {
        const key = (q.email || q.customerName || q.phone || q._id || '').toLowerCase();
        if (!key) return;
        if (!byKey.has(key)) {
          byKey.set(key, {
            _id: q._id,
            name: q.customerName || 'Unknown Customer',
            email: q.email,
            phone: q.phone,
            quoteId: q._id,
            quoteReference: q.referenceNumber || `QUOTE-${q._id?.substring(0, 8) || 'N/A'}`,
            eventDate: q.eventDate,
            eventType: q.eventType,
            totalAmount: q.totalAmount,
            status: q.status,
            createdAt: q.createdAt,
            updatedAt: q.updatedAt,
            lastEventDate: q.eventDate,
            lastQuoteId: q._id,
            quotesCount: 1,
            totalSpent: Number(q.totalAmount || 0)
          });
        } else {
          const existing = byKey.get(key);
          existing.quotesCount = (existing.quotesCount || 0) + 1;
          existing.totalSpent = (Number(existing.totalSpent) || 0) + (Number(q.totalAmount) || 0);
          if (q.eventDate && (!existing.lastEventDate || new Date(q.eventDate) > new Date(existing.lastEventDate))) {
            existing.lastEventDate = q.eventDate;
            existing.lastQuoteId = q._id;
          }
        }
      });

      return { success: true, data: Array.from(byKey.values()) };
    } catch (err) {
      console.error('Error getting customers from quotes:', err);
      return {
        success: false,
        message: err.message || 'Failed to fetch customers from quotes',
        data: []
      };
    }
  },
  
  getCustomer: (id) => apiCall(`/api/admin/customers/${id}`),
  
  addCustomer: (data) => 
    apiCall('/api/admin/customers', {
      method: 'POST',
      body: data,
    }),
    
  updateCustomer: (id, data) => 
    apiCall(`/api/admin/customers/${id}`, {
      method: 'PUT',
      body: data,
    }),
    
  deleteCustomer: (id) => 
    apiCall(`/api/admin/customers/${id}`, {
      method: 'DELETE',
    }),

  // ==================== CONTACT MESSAGES ====================
  /**
   * List contact messages with pagination/filters
   * @param {Object} params - { page, limit, status, q }
   */
  getMessages: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/api/contact${queryString ? `?${queryString}` : ''}`);
  },
  
  /** Get a single message by id */
  getMessage: async (id) => apiCall(`/api/contact/${id}`),
  
  /** Update message (e.g., status) */
  updateMessage: async (id, data) => 
    apiCall(`/api/contact/${id}`, {
      method: 'PATCH',
      body: data,
    }),
  
  /** Delete a message */
  deleteMessage: async (id) => 
    apiCall(`/api/contact/${id}`, {
      method: 'DELETE',
    }),

  // Equipment
  getEquipment: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/api/equipment${query ? `?${query}` : ''}`);
  },
  
  getEquipmentById: async (id) => {
    return apiCall(`/api/equipment/${id}`);
  },  
  addEquipment: (data) => {
    return apiCall('/api/equipment', {
      method: 'POST',
      body: data,
    });
  },
  
  updateEquipment: (id, data) => {
    return apiCall(`/api/equipment/${id}`, {
      method: 'PUT',
      body: data,
    });
  },
  
  deleteEquipment: (id) => 
    apiCall(`/api/equipment/${id}`, {
      method: 'DELETE',
    }),
    
  // Equipment categories
  getEquipmentCategories: () => 
    apiCall('/admin/equipment/categories'),
    
  // Equipment status
  updateEquipmentStatus: (id, status) => 
    apiCall(`/admin/equipment/${id}/status`, {
      method: 'PATCH',
      body: { status }
    }),

  // ==================== PACKAGE MANAGEMENT ====================
  
  /**
   * Get all packages with admin access
   * @param {Object} params - Query parameters (page, limit, search, status, category, etc.)
   * @returns {Promise<Object>} - Paginated packages response
   */
  getPackages: async (params = {}) => {
    try {
      console.log('Fetching packages with params:', params);
      
      // Set default pagination if not provided
      const page = params.page || 1;
      const limit = params.limit || 10;
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      
      // Add pagination
      queryParams.append('page', page);
      queryParams.append('limit', limit);
      
      // Add optional parameters if they exist
      if (params.status) queryParams.append('status', params.status);
      if (params.search) queryParams.append('search', params.search);
      if (params.category) queryParams.append('category', params.category);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
      
      const url = `/api/packages?${queryParams.toString()}`;
      console.log('API Request URL:', url);
      
      // Make the API call
      const response = await apiCall(url);
      
      console.log('API Response:', response);
      
      // Ensure we always return the expected format
      if (Array.isArray(response)) {
        return {
          data: response,
          total: response.length,
          page: 1,
          totalPages: 1,
          limit: response.length
        };
      }
      
      // If the response has a data array, use it
      if (response.data && Array.isArray(response.data)) {
        return {
          data: response.data,
          total: response.total || response.data.length,
          page: response.page || page,
          totalPages: response.totalPages || Math.ceil((response.total || response.data.length) / limit),
          limit: response.limit || limit
        };
      }
      
      // If we get here, the response format is unexpected
      console.warn('Unexpected API response format:', response);
      return {
        data: [],
        total: 0,
        page: 1,
        totalPages: 1,
        limit: limit
      };
      
    } catch (error) {
      console.error('Error in getPackages:', {
        message: error.message,
        status: error.status,
        response: error.response,
        config: error.config
      });
      
      // Handle 401 Unauthorized (token expired)
      if (error.status === 401) {
        console.warn('Authentication required, redirecting to login...');
        if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
          window.location.href = '/admin/login?session=expired';
        }
      }
      
      // Rethrow the error to be handled by the caller
      throw error;
    }
  },
  
  /**
   * Get a single package by ID (admin)
   * @param {string} id - Package ID
   * @returns {Promise<Object>} - Package details
   */
  getPackageById: async (id) => {
    try {
      const response = await apiCall(`/api/admin/packages/${id}`);
      return response;
    } catch (error) {
      console.error(`Error fetching package ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Create a new package
   * @param {Object} data - Package data
   * @returns {Promise<Object>} - Created package
   */
  createPackage: async (data) => {
    try {
      const response = await apiCall('/api/admin/packages', {
        method: 'POST',
        body: data
      });
      return response;
    } catch (error) {
      console.error('Error creating package:', error);
      throw error;
    }
  },
  
  /**
   * Update an existing package
   * @param {string} id - Package ID
   * @param {Object} data - Updated package data
   * @returns {Promise<Object>} - Updated package
   */
  updatePackage: async (id, data) => {
    try {
      const response = await apiCall(`/api/admin/packages/${id}`, {
        method: 'PUT',
        body: data
      });
      return response;
    } catch (error) {
      console.error(`Error updating package ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Delete a package
   * @param {string} id - Package ID
   * @returns {Promise<Object>} - Delete confirmation
   */
  deletePackage: async (id) => {
    try {
      const response = await apiCall(`/api/admin/packages/${id}`, { 
        method: 'DELETE' 
      });
      return response;
    } catch (error) {
      console.error(`Error deleting package ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Toggle package active status
   * @param {string} id - Package ID
   * @returns {Promise<Object>} - Updated package
   */
  togglePackageStatus: async (id) => {
    try {
      const response = await apiCall(`/api/admin/packages/${id}/toggle-active`, {
        method: 'PATCH'
      });
      return response;
    } catch (error) {
      console.error(`Error toggling status for package ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Toggle package popular status
   * @param {string} id - Package ID
   * @returns {Promise<Object>} - Updated package
   */
  togglePopularStatus: async (id) => {
    try {
      const response = await apiCall(`/api/admin/packages/${id}/toggle-popular`, {
        method: 'PATCH'
      });
      return response;
    } catch (error) {
      console.error(`Error toggling popular status for package ${id}:`, error);
      throw error;
    }
  },

  // Analytics
  getAnalytics: () => apiCall('/admin/analytics'),
};

// ==================== PUBLIC API CALLS ====================

export const publicAPI = {
  // Submit quote request
  submitQuote: (quoteData) => 
    apiCall('/api/quotes', {
      method: 'POST',
      body: quoteData,
    }),
  
  // Submit contact form
  submitContact: (contactData) => 
    apiCall('/api/contact', {
      method: 'POST',
      body: contactData,
    }),
    
  // Get equipment for public view
  getEquipment: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await apiCall(`/api/equipment${queryString ? `?${queryString}` : ''}`);
    // The API returns the data directly, so we don't need to access response.data
    return Array.isArray(response) ? response : [];
  },
  
  // Get single equipment item
  getEquipmentById: (id) => apiCall(`/api/equipment/${id}`),
  
  // Get equipment categories
  getEquipmentCategories: () => apiCall('/api/equipment/categories'),
  
  // Get featured equipment
  getFeaturedEquipment: () => apiCall('/api/equipment/featured'),
  
  // Search equipment
  searchEquipment: (query, filters = {}) => {
    const params = { ...filters, q: query };
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/api/equipment/search?${queryString}`);
  },
  
  // Get package details
  getPackage: (id) => apiCall(`/api/packages/${id}`),
  
  // Get all packages
  getPackages: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/api/packages${queryString ? `?${queryString}` : ''}`);
  },
  
  // Get testimonials
  getTestimonials: () => apiCall('/api/testimonials'),
  
  // Submit testimonial
  submitTestimonial: (testimonialData) => apiCall('/api/testimonials', {
    method: 'POST',
    body: testimonialData,
  })
};

// API utility functions
const createQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach(item => searchParams.append(key, item));
    } else if (value !== undefined && value !== null) {
      searchParams.append(key, value);
    }
  });
  return searchParams.toString();
};

// Export token management functions
export { 
  getAuthToken, 
  setAuthToken, 
  clearAuthToken, 
  isAuthenticated, 
  isTokenExpired,
  createQueryString
};

// Create API client with interceptors
const createApiClient = (baseURL = '') => {
  return {
    get: (endpoint, params = {}) => 
      apiCall(`${baseURL}${endpoint}${params ? `?${createQueryString(params)}` : ''}`),
      
    post: (endpoint, data, options = {}) =>
      apiCall(`${baseURL}${endpoint}`, {
        method: 'POST',
        body: data,
        ...options
      }),
      
    put: (endpoint, data, options = {}) =>
      apiCall(`${baseURL}${endpoint}`, {
        method: 'PUT',
        body: data,
        ...options
      }),
      
    patch: (endpoint, data, options = {}) =>
      apiCall(`${baseURL}${endpoint}`, {
        method: 'PATCH',
        body: data,
        ...options
      }),
      
    delete: (endpoint, options = {}) =>
      apiCall(`${baseURL}${endpoint}`, {
        method: 'DELETE',
        ...options
      })
  };
};

// Export API clients
export const apiClient = createApiClient(API_BASE_URL);

export default {
  admin: adminAPI,
  public: publicAPI,
  client: apiClient,
  // Legacy exports for backward compatibility
  ...adminAPI,
  ...publicAPI,
  // Utility functions
  createQueryString,
  isAuthenticated,
  clearAuth: clearAuthToken,
  setAuth: setAuthToken,
  getAuth: getAuthToken
};

