import axios from 'axios';
import { useState, useEffect } from 'react';
import { getAuthToken } from '../../services/api';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5003';
const API_URL = `${API_BASE}/api/packages`;
const UPLOAD_URL = `${API_BASE}/api/upload`;

// API Service Functions
// Normalize a package from backend to UI shape
const normalizeFromBackend = (pkg) => {
  if (!pkg || typeof pkg !== 'object') return pkg;
  if (!pkg.imageUrl && Array.isArray(pkg.images) && pkg.images.length > 0) {
    const primary = pkg.images.find(i => i && i.isPrimary) || pkg.images[0];
    if (primary && primary.url) {
      return { ...pkg, imageUrl: primary.url };
    }
  }
  return pkg;
};

const fetchAllPackages = async () => {
  try {
    const response = await axios.get(API_URL);
    const payload = response.data?.data ?? response.data;
    // Ensure we always return an array, even if the response is empty or malformed
    const list = Array.isArray(payload) ? payload : [];
    return list.map(normalizeFromBackend);
  } catch (error) {
    console.error('Error fetching packages:', error);
    // Return empty array on error to prevent crashes
    return [];
  }
};

const createNewPackage = async (packageData, token) => {
  try {
    console.log('Sending request to:', API_URL);
    // Map to backend expectations: basePrice and lowercase category
    const payload = {
      name: packageData.name,
      description: packageData.description || '',
      category: (packageData.category || 'other').toLowerCase(),
      basePrice: typeof packageData.price !== 'undefined' ? Number(packageData.price) : undefined,
      features: Array.isArray(packageData.features) ? packageData.features : [],
      includedServices: packageData.includedServices,
      includedEquipment: packageData.includedEquipment,
      specifications: packageData.specifications,
      isPopular: !!packageData.isPopular,
      isFeatured: !!packageData.isFeatured,
      images: packageData.images
    };
    if (packageData.imageUrl) {
      payload.images = [{ url: packageData.imageUrl, isPrimary: true }];
    }
    console.log('Request data:', JSON.stringify(payload, null, 2));
    
    const response = await axios.post(API_URL, payload, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      validateStatus: (status) => status < 500 // Don't throw for 4xx errors
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    
    if (response.status >= 400) {
      // Surface validation error messages if available
      const details = Array.isArray(response.data?.errors) ? `: ${response.data.errors.join(', ')}` : '';
      const error = new Error((response.data?.message || 'Failed to create package') + details);
      error.response = response;
      throw error;
    }
    
    // Controller returns { message, data }
    const created = response.data?.data || response.data;
    return normalizeFromBackend(created);
  } catch (error) {
    console.error('Error in createNewPackage:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data
      }
    });
    
    // Enhance the error with more context
    if (!error.response) {
      error.message = 'Network error: Could not connect to the server. Please check your connection.';
    }
    
    throw error;
  }
};

const updatePackage = async (id, packageData, token) => {
  try {
    // Map to backend: ensure lowercase category and basePrice when price is provided
    const payload = {
      ...packageData,
      ...(packageData.category !== undefined && { category: String(packageData.category).toLowerCase() }),
      ...(packageData.price !== undefined && { basePrice: Number(packageData.price) })
    };
    if (payload.imageUrl !== undefined) {
      payload.images = payload.imageUrl ? [{ url: payload.imageUrl, isPrimary: true }] : [];
    }
    const response = await axios.put(`${API_URL}/${id}`, payload, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    // Controller returns { message, data }
    const updated = response.data?.data || response.data;
    return normalizeFromBackend(updated);
  } catch (error) {
    console.error('Error updating package:', error);
    throw error;
  }
};

const deletePackage = async (id, token) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting package:', error);
    throw error;
  }
};

const getPackageById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data?.data || response.data;
  } catch (error) {
    console.error('Error fetching package:', error);
    throw error;
  }
};

// React Component for Packages Management
export const PackagesManagement = () => {
  const [packages, setPackages] = useState([]);
  // Separate loading states for clearer UX
  const [loadingPage, setLoadingPage] = useState(true);
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editPackage, setEditPackage] = useState(null);
  // Toast state for lightweight notifications
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' }
  // Helper: show toast for 3 seconds
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  
  // Predefined templates for quick package creation
  const packageTemplates = {
    starter: {
      name: 'Starter Package (Small Events – up to 100 people)',
      category: 'private',
      price: '8500',
      priceUnit: 'ZAR',
      description: 'Perfect for small events up to 100 guests. Includes tent, toilet, freezer, chairs & tables, delivery and setup.',
      imageUrl: '',
      features: [
        '1 Medium Tent (10m x 20m)',
        '1 VIP Mobile Toilet',
        '1 Mobile Freezer',
        'Chairs & Tables (up to 100 guests)',
        'Delivery & Setup included'
      ],
      isPopular: true,
      isFeatured: false
    },
    classic: {
      name: 'Classic Package (Weddings & Family Functions – up to 300 people)',
      category: 'wedding',
      price: '18500',
      priceUnit: 'ZAR',
      description: 'Ideal for weddings and family functions up to 300 guests. Includes large tent, toilets, freezers, chairs & tables, basic décor, delivery and setup.',
      imageUrl: '',
      features: [
        '1 Large Tent (15m x 30m)',
        '2 VIP Mobile Toilets',
        '2 Mobile Freezers',
        'Chairs & Tables (up to 300 guests)',
        'Basic Décor Setup',
        'Delivery & Setup included'
      ],
      isPopular: true,
      isFeatured: false
    },
    premium: {
      name: 'Premium Package (Corporate / Big Weddings – up to 600 people)',
      category: 'corporate',
      price: '38000',
      priceUnit: 'ZAR',
      description: 'For large corporate events or big weddings up to 600 guests. Includes multiple large tents, toilets, freezers, chairs & tables, full décor setup, delivery and setup.',
      imageUrl: '',
      features: [
        '2 Large Tents (15m x 30m or bigger)',
        '4 VIP Mobile Toilets',
        '3 Mobile Freezers',
        'Chairs & Tables (up to 600 guests)',
        'Full Décor Setup (draping, lighting, stage)',
        'Delivery & Setup included'
      ],
      isPopular: true,
      isFeatured: true
    },
    traditional: {
      name: 'Traditional Package (Funerals / Traditional Ceremonies)',
      category: 'other',
      price: '25000',
      priceUnit: 'ZAR',
      description: 'Tailored for funerals and traditional ceremonies. Includes tent, toilets, freezer, chairs & tables, slaughtering service, delivery and setup.',
      imageUrl: '',
      features: [
        '1 Large Tent (size depending on people)',
        '2 VIP Mobile Toilets',
        '1 Mobile Freezer',
        'Chairs & Tables (up to 200 guests)',
        'Slaughtering Service (2 healthy cows)',
        'Delivery & Setup included'
      ],
      isPopular: false,
      isFeatured: false
    }
  };

  const [selectedTemplate, setSelectedTemplate] = useState('starter');

  // New package form state
  const [newPackage, setNewPackage] = useState(packageTemplates.starter);
  const [newFeature, setNewFeature] = useState('');
  const [uploadingAddImage, setUploadingAddImage] = useState(false);
  const [uploadingEditImage, setUploadingEditImage] = useState(false);
  // View controls (must be declared before any early returns)
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [onlyPopular, setOnlyPopular] = useState(false);
  const [onlyFeatured, setOnlyFeatured] = useState(false);

  // Helper: upload image file to backend and return URL
  const uploadImageFile = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const resp = await axios.post(UPLOAD_URL, formData, {
      // Let the browser set the correct multipart boundary
      withCredentials: true,
    });
    // Backend returns { success, url, filename, ... }
    if (resp?.data?.url) return resp.data.url;
    // Fallback: path relative
    if (resp?.data?.path) {
      const backendOrigin = new URL(UPLOAD_URL).origin; // e.g., http://localhost:5003
      return new URL(resp.data.path, backendOrigin).href;
    }
    throw new Error('Upload failed: no URL returned');
  };

  useEffect(() => {
    const loadPackages = async () => {
      try {
        const data = await fetchAllPackages();
        
        if (!data) {
          throw new Error('No data received from server');
        }
        
        if (!Array.isArray(data)) {
          console.warn('Expected array but received:', typeof data, data);
          setPackages([]);
          setError('Invalid data format received from server');
        } else {
          setPackages(data);
        }
      } catch (err) {
        console.error('Error in loadPackages:', err);
        setError(`Failed to load packages: ${err.message}`);
        setPackages([]); // Ensure packages is always an array
      } finally {
        setLoadingPage(false);
      }
    };

    loadPackages();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this package?')) {
      try {
        const token = getAuthToken();
        if (!token) {
          setError('Authentication required. Please log in again.');
          window.location.href = '/admin/login?session=expired';
          return;
        }
        await deletePackage(id, token);
        setPackages(packages.filter(pkg => pkg._id !== id));
      } catch (err) {
        setError('Failed to delete package');
      }
    }
  };
  
  const handleAddPackage = async (e) => {
    e.preventDefault();
    try {
      setLoadingAdd(true);
      
      // Ensure price is a number
      const packageData = {
        ...newPackage,
        price: parseFloat(newPackage.price) || 0
      };
      if (!packageData.name?.trim()) {
        throw new Error('Package name is required');
      }
      if (packageData.price <= 0) {
        throw new Error('Price must be greater than 0');
      }
      
      const token = getAuthToken();
      if (!token) {
        setError('Authentication required. Please log in again.');
        setLoadingAdd(false);
        window.location.href = '/admin/login?session=expired';
        return;
      }
      
      const created = await createNewPackage(packageData, token);
      
      if (!created) {
        throw new Error('No response data from server');
      }
      
      // Add the new package to the list
      setPackages([...packages, created]);
      
      // Reset form to the currently selected template and close modal
      setNewPackage(packageTemplates[selectedTemplate]);
      setShowAddModal(false);
      setError(null); // Clear any previous errors
      showToast('Package created successfully', 'success');
    } catch (err) {
      console.error('Error creating package:', err);
      
      let errorMessage = 'Failed to create package';
      
      // More specific error messages
      if (err.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (err.response?.status === 400) {
        errorMessage = 'Invalid package data. Please check all fields.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoadingAdd(false);
    }
  };
  
  const handleAddFeature = (e) => {
    e.preventDefault();
    if (newFeature.trim() && !newPackage.features.includes(newFeature.trim())) {
      setNewPackage({
        ...newPackage,
        features: [...newPackage.features, newFeature.trim()]
      });
      setNewFeature('');
    }
  };
  
  const removeFeature = (featureToRemove) => {
    setNewPackage({
      ...newPackage,
      features: newPackage.features.filter(feature => feature !== featureToRemove)
    });
  };

  if (loadingPage && packages.length === 0) return <div className="p-4">Loading packages...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  
  // Ensure packages is an array before mapping
  const packagesList = Array.isArray(packages) ? packages : [];
  
  // Available categories (values MUST match backend enum, lowercase)
  const categories = [
    'wedding',
    'corporate',
    'birthday',
    'conference',
    'exhibition',
    'private',
    'charity',
    'concert',
    'festival',
    'other'
  ];
  const labelFor = (val) => val.charAt(0).toUpperCase() + val.slice(1);

  // Local derived list based on filters

  const viewList = packagesList.filter((p) => {
    if (!p) return false;
    const matchesSearch = search
      ? (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.description || '').toLowerCase().includes(search.toLowerCase())
      : true;
    const matchesCategory = categoryFilter === 'all' ? true : (p.category === categoryFilter);
    const matchesPopular = onlyPopular ? !!p.isPopular : true;
    const matchesFeatured = onlyFeatured ? !!p.isFeatured : true;
    return matchesSearch && matchesCategory && matchesPopular && matchesFeatured;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent mb-2">
            Package Management
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Create and manage your event packages and services
          </p>
        </div>
        <button 
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg mt-4 md:mt-0"
          onClick={() => setShowAddModal(true)}
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add New Package
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200/60 dark:border-slate-700/60 bg-gradient-to-r from-slate-50/80 to-white/80 dark:from-slate-700/50 dark:to-slate-800/50">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Filter & Search</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <input
                type="text"
                className="w-full pl-4 pr-4 py-3 border-0 rounded-xl bg-slate-100/60 dark:bg-slate-700/60 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-slate-700 transition-all duration-200"
                placeholder="Search packages..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="w-full px-4 py-3 border-0 rounded-xl bg-slate-100/60 dark:bg-slate-700/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-slate-700 transition-all duration-200"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{labelFor(cat)}</option>
              ))}
            </select>
            <label className="inline-flex items-center space-x-3 px-4 py-3 bg-slate-100/60 dark:bg-slate-700/60 rounded-xl cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-600/60 transition-all duration-200">
              <input type="checkbox" className="h-4 w-4 text-blue-600 rounded" checked={onlyPopular} onChange={(e) => setOnlyPopular(e.target.checked)} />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Popular only</span>
            </label>
            <label className="inline-flex items-center space-x-3 px-4 py-3 bg-slate-100/60 dark:bg-slate-700/60 rounded-xl cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-600/60 transition-all duration-200">
              <input type="checkbox" className="h-4 w-4 text-blue-600 rounded" checked={onlyFeatured} onChange={(e) => setOnlyFeatured(e.target.checked)} />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Featured only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Package Grid */}
      {viewList.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No packages found</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">Get started by creating your first package</p>
          <button
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
            onClick={() => setShowAddModal(true)}
          >
            Add your first package
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {viewList.map((pkg) => (
            <div key={pkg._id} className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-200 transform hover:scale-105">
              {pkg.imageUrl && (
                <div className="w-full h-48 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 overflow-hidden relative">
                  <img src={pkg.imageUrl} alt={pkg.name} className="w-full h-full object-cover" />
                  <div className="absolute top-3 right-3">
                    <div className="px-3 py-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full text-sm font-bold text-slate-900 dark:text-white">
                      R{(pkg.basePrice ?? pkg.price ?? 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
              <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{pkg.name}</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-block text-xs px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium">{pkg.category ? labelFor(pkg.category) : 'Uncategorized'}</span>
                    {pkg.isPopular && <span className="inline-block text-xs px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 font-semibold">Popular</span>}
                    {pkg.isFeatured && <span className="inline-block text-xs px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 font-semibold">Featured</span>}
                  </div>
                </div>
              </div>
              {pkg.description && (
                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4">{pkg.description}</p>
              )}
              {Array.isArray(pkg.features) && pkg.features.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Features</div>
                  <div className="flex flex-wrap gap-1">
                    {pkg.features.slice(0, 3).map((f, i) => (
                      <span key={i} className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium">{f}</span>
                    ))}
                    {pkg.features.length > 3 && (
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">+{pkg.features.length - 3} more</span>
                    )}
                  </div>
                </div>
              )}
              <div className="flex justify-between items-center pt-4 border-t border-slate-200/60 dark:border-slate-700/60">
                <div className="text-right">
                  {!pkg.imageUrl && (
                    <div className="text-xl font-bold text-slate-900 dark:text-white">R{(pkg.basePrice ?? pkg.price ?? 0).toLocaleString()}</div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button 
                    className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded-lg text-sm font-medium transition-all duration-200"
                    onClick={() => {
                      setEditPackage({
                        _id: pkg._id,
                        name: pkg.name || '',
                        category: (pkg.category || 'other'),
                        price: String(pkg.basePrice ?? pkg.price ?? ''),
                        priceUnit: pkg.priceUnit || 'ZAR',
                        description: pkg.description || '',
                        imageUrl: pkg.imageUrl || '',
                        features: Array.isArray(pkg.features) ? pkg.features : [],
                        isPopular: Boolean(pkg.isPopular),
                        isFeatured: Boolean(pkg.isFeatured)
                      });
                      setShowEditModal(true);
                    }}
                  >
                    Edit
                  </button>
                  <button 
                    className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg text-sm font-medium transition-all duration-200"
                    onClick={() => handleDelete(pkg._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Add Package Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Add New Package</h2>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {/* Template Selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Quick Template</label>
                <select
                  className="w-full p-2 border rounded"
                  value={selectedTemplate}
                  onChange={(e) => {
                    const key = e.target.value;
                    setSelectedTemplate(key);
                    setNewPackage(packageTemplates[key]);
                  }}
                >
                  <option value="starter">Starter (up to 100 people)</option>
                  <option value="classic">Classic (up to 300 people)</option>
                  <option value="premium">Premium (up to 600 people)</option>
                  <option value="traditional">Traditional (ceremonies)</option>
                </select>
              </div>
              <form onSubmit={handleAddPackage}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Package Name *</label>
                    <input
                      type="text"
                      required
                      className="w-full p-2 border rounded"
                      value={newPackage.name}
                      onChange={(e) => setNewPackage({...newPackage, name: e.target.value})}
                      placeholder="Eagles Events – Full Event Service Package"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                    <select
                      required
                      className="w-full p-2 border rounded"
                      value={newPackage.category}
                      onChange={(e) => setNewPackage({...newPackage, category: e.target.value})}
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{labelFor(cat)}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                        {newPackage.priceUnit}
                      </span>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        className="flex-1 p-2 border rounded-r"
                        value={newPackage.price}
                        onChange={(e) => setNewPackage({...newPackage, price: e.target.value})}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                    <input
                      type="url"
                      className="w-full p-2 border rounded"
                      value={newPackage.imageUrl}
                      onChange={(e) => setNewPackage({...newPackage, imageUrl: e.target.value})}
                      placeholder="https://.../image.jpg"
                    />
                    <div className="mt-2 flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            setUploadingAddImage(true);
                            const url = await uploadImageFile(file);
                            setNewPackage(prev => ({ ...prev, imageUrl: url }));
                          } catch (err) {
                            console.error('Image upload failed:', err);
                            setError(err.message || 'Image upload failed');
                          } finally {
                            setUploadingAddImage(false);
                          }
                        }}
                        className="text-sm"
                      />
                      {uploadingAddImage && <span className="text-xs text-gray-500">Uploading...</span>}
                    </div>
                    {newPackage.imageUrl && (
                      <div className="mt-2">
                        <img src={newPackage.imageUrl} alt="Package preview" className="w-full h-32 object-cover rounded border" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-end space-x-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isPopular"
                        className="h-4 w-4 text-blue-600 rounded"
                        checked={newPackage.isPopular}
                        onChange={(e) => setNewPackage({...newPackage, isPopular: e.target.checked})}
                      />
                      <label htmlFor="isPopular" className="ml-2 text-sm text-gray-700">Popular</label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isFeatured"
                        className="h-4 w-4 text-blue-600 rounded"
                        checked={newPackage.isFeatured}
                        onChange={(e) => setNewPackage({...newPackage, isFeatured: e.target.checked})}
                      />
                      <label htmlFor="isFeatured" className="ml-2 text-sm text-gray-700">Featured</label>
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    rows="3"
                    className="w-full p-2 border rounded"
                    value={newPackage.description}
                    onChange={(e) => setNewPackage({...newPackage, description: e.target.value})}
                    placeholder={
                      `Make your special occasion stress-free with our complete mobile hire solution:\n\n` +
                      `🚻 VIP Mobile Toilets – clean, modern, and guest-friendly.\n` +
                      `❄️ Mobile Freezer – keep food and drinks perfectly chilled.\n` +
                      `⛺ Tents – elegant and weather-ready for any gathering.\n` +
                      `🐄 Slaughtering Services – fresh, professional, and convenient.\n\n` +
                      `Perfect for weddings, funerals, birthdays, family events, and corporate functions.\n` +
                      `We provide seamless hospitality and hygiene so you can focus on enjoying your event.`
                    }
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Features</label>
                  <div className="flex mb-2">
                    <input
                      type="text"
                      className="flex-1 p-2 border rounded-l"
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      placeholder="Add a feature (e.g., 5 hours of service)"
                    />
                    <button
                      type="button"
                      onClick={handleAddFeature}
                      className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600"
                    >
                      Add
                    </button>
                  </div>
                  
                  {newPackage.features.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {newPackage.features.map((feature, index) => (
                        <div key={index} className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded flex items-center">
                          {feature}
                          <button
                            type="button"
                            onClick={() => removeFeature(feature)}
                            className="ml-1.5 text-blue-400 hover:text-blue-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loadingAdd}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {loadingAdd ? 'Saving...' : 'Save Package'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Edit Package Modal (moved here to avoid nesting inside Add Package modal) */}
      {showEditModal && editPackage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Edit Package</h2>
                <button 
                  onClick={() => { setShowEditModal(false); setEditPackage(null); }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  setLoadingEdit(true);
                  // Basic validation
                  const priceNum = parseFloat(editPackage.price) || 0;
                  if (!editPackage.name?.trim()) {
                    throw new Error('Package name is required');
                  }
                  if (priceNum <= 0) {
                    throw new Error('Price must be greater than 0');
                  }
                  const token = getAuthToken();
                  if (!token) {
                    setError('Authentication required. Please log in again.');
                    window.location.href = '/admin/login?session=expired';
                    return;
                  }
                  const payload = {
                    name: editPackage.name,
                    category: editPackage.category,
                    price: priceNum,
                    priceUnit: editPackage.priceUnit,
                    description: editPackage.description,
                    imageUrl: editPackage.imageUrl,
                    features: Array.isArray(editPackage.features) ? editPackage.features : [],
                    isPopular: !!editPackage.isPopular,
                    isFeatured: !!editPackage.isFeatured
                  };
                  const updated = await updatePackage(editPackage._id, payload, token);
                  setPackages(prev => prev.map(p => p._id === updated._id ? updated : p));
                  setShowEditModal(false);
                  setEditPackage(null);
                  setError(null);
                  showToast('Package updated successfully', 'success');
                } catch (err) {
                  console.error('Error updating package:', err);
                  let msg = 'Failed to update package';
                  if (err.response?.status === 400) msg = 'Invalid data. Please check the fields.';
                  if (err.response?.status === 409) msg = 'A package with this name already exists.';
                  if (err.response?.data?.message) msg = err.response.data.message;
                  setError(msg);
                  if (err.message && !err.response) {
                    // Local validation error
                    setError(err.message);
                    msg = err.message;
                  }
                  showToast(msg, 'error');
                } finally {
                  setLoadingEdit(false);
                }
              }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Package Name *</label>
                    <input
                      type="text"
                      required
                      className="w-full p-2 border rounded"
                      value={editPackage.name}
                      onChange={(e) => setEditPackage({ ...editPackage, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                    <select
                      required
                      className="w-full p-2 border rounded"
                      value={editPackage.category}
                      onChange={(e) => setEditPackage({ ...editPackage, category: e.target.value })}
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{labelFor(cat)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                        {editPackage.priceUnit}
                      </span>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        className="flex-1 p-2 border rounded-r"
                        value={editPackage.price}
                        onChange={(e) => setEditPackage({ ...editPackage, price: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                    <input
                      type="url"
                      className="w-full p-2 border rounded"
                      value={editPackage.imageUrl || ''}
                      onChange={(e) => setEditPackage({ ...editPackage, imageUrl: e.target.value })}
                      placeholder="https://.../image.jpg"
                    />
                    <div className="mt-2 flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            setUploadingEditImage(true);
                            const url = await uploadImageFile(file);
                            setEditPackage(prev => ({ ...prev, imageUrl: url }));
                          } catch (err) {
                            console.error('Image upload failed:', err);
                            setError(err.message || 'Image upload failed');
                          } finally {
                            setUploadingEditImage(false);
                          }
                        }}
                        className="text-sm"
                      />
                      {uploadingEditImage && <span className="text-xs text-gray-500">Uploading...</span>}
                    </div>
                    {editPackage.imageUrl && (
                      <div className="mt-2">
                        <img src={editPackage.imageUrl} alt="Package preview" className="w-full h-32 object-cover rounded border" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-end space-x-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="editIsPopular"
                        className="h-4 w-4 text-blue-600 rounded"
                        checked={!!editPackage.isPopular}
                        onChange={(e) => setEditPackage({ ...editPackage, isPopular: e.target.checked })}
                      />
                      <label htmlFor="editIsPopular" className="ml-2 text-sm text-gray-700">Popular</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="editIsFeatured"
                        className="h-4 w-4 text-blue-600 rounded"
                        checked={!!editPackage.isFeatured}
                        onChange={(e) => setEditPackage({ ...editPackage, isFeatured: e.target.checked })}
                      />
                      <label htmlFor="editIsFeatured" className="ml-2 text-sm text-gray-700">Featured</label>
                    </div>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    className="w-full p-2 border rounded"
                    rows="3"
                    value={editPackage.description}
                    onChange={(e) => setEditPackage({ ...editPackage, description: e.target.value })}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Features</label>
                  <div className="flex mb-2">
                    <input
                      type="text"
                      className="flex-1 p-2 border rounded-l"
                      placeholder="Add a feature"
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                    />
                    <button
                      className="bg-green-500 text-white px-4 rounded-r hover:bg-green-600"
                      onClick={(e) => {
                        e.preventDefault();
                        if (newFeature.trim() && !editPackage.features.includes(newFeature.trim())) {
                          setEditPackage({
                            ...editPackage,
                            features: [...editPackage.features, newFeature.trim()]
                          });
                          setNewFeature('');
                        }
                      }}
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(editPackage.features) && editPackage.features.map((feature, idx) => (
                      <span key={idx} className="bg-gray-100 text-gray-800 px-2 py-1 rounded flex items-center">
                        {feature}
                        <button
                          className="ml-2 text-red-500 hover:text-red-700"
                          onClick={(e) => {
                            e.preventDefault();
                            setEditPackage({
                              ...editPackage,
                              features: editPackage.features.filter(f => f !== feature)
                            });
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <button 
                    type="button"
                    className="px-4 py-2 rounded border"
                    onClick={() => { setShowEditModal(false); setEditPackage(null); }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    disabled={loadingEdit}
                  >
                    {loadingEdit ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[60] px-4 py-2 rounded shadow text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

// Export all the API functions for use elsewhere
export { 
  fetchAllPackages, 
  createNewPackage, 
  updatePackage, 
  deletePackage, 
  getPackageById 
};
