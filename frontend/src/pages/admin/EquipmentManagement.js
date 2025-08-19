import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, X } from 'lucide-react';
import axios from 'axios';
import { getAuthToken } from '../../services/api';

const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5003'}/api/equipment`;

const EquipmentManagement = () => {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'Mobile Toilets',
    pricePerDay: '',
    description: '',
    quantity: 1,
    condition: 'Good',
    isPopular: false,
    availability: true,
    features: [],
    specifications: {
      size: '',
      capacity: '',
      power: '',
      setup: ''
    },
    images: [{ url: '', alt: '' }]
  });

  const categories = [
    'All Equipment',
    'Mobile Toilets',
    'Mobile Freezers',
    'Tents & Marquees',
    'Slaughtering Services'
  ];

  // Predefined equipment templates for quick hire entry
  const equipmentTemplates = {
    toilet: {
      name: 'VIP Mobile Toilet',
      category: 'Mobile Toilets',
      pricePerDay: 1500,
      description: 'Modern, stylish, and fully serviced mobile toilet for comfort and hygiene at any event. Perfect for weddings, corporate events, or VIP areas.',
      quantity: 1,
      condition: 'Good',
      isPopular: true,
      availability: true,
      features: [
        'Flushable toilet & handwashing basin',
        'Interior lighting & mirror',
        'Ventilation for fresh air',
        'Fully sanitized before delivery'
      ],
      specifications: {
        size: '',
        capacity: '',
        power: '',
        setup: 'Delivered and setup included'
      },
      images: [{ url: '', alt: '' }]
    },
    tents: {
      name: 'Event Tents',
      category: 'Tents & Marquees',
      pricePerDay: 3500,
      description: 'High-quality tents to protect your guests from sun and rain. Available in different sizes for small or large events.',
      quantity: 1,
      condition: 'Good',
      isPopular: true,
      availability: true,
      features: [
        'Medium Tent (10m x 20m) – up to 100 guests (R3,500/day)',
        'Large Tent (15m x 30m) – up to 300 guests (R6,500/day)',
        'Waterproof & fire-resistant material',
        'Easy setup & takedown'
      ],
      specifications: {
        size: '',
        capacity: '',
        power: '',
        setup: 'Professional setup included'
      },
      images: [{ url: '', alt: '' }]
    },
    freezer: {
      name: 'Mobile Freezer',
      category: 'Mobile Freezers',
      pricePerDay: 1800,
      description: 'Keep your food and drinks perfectly chilled with our portable freezer units. Ideal for weddings, family gatherings, or corporate events.',
      quantity: 1,
      condition: 'Good',
      isPopular: true,
      availability: true,
      features: [
        'Spacious interior for beverages & meat',
        'Energy-efficient and portable',
        'Delivered and set up at your venue'
      ],
      specifications: {
        size: '',
        capacity: '',
        power: '',
        setup: 'Delivered and setup included'
      },
      images: [{ url: '', alt: '' }]
    },
    slaughter: {
      name: 'Slaughtering Services',
      category: 'Slaughtering Services',
      pricePerDay: 2500,
      description: 'Professional slaughtering services with two healthy cows available. Perfect for traditional ceremonies or large gatherings.',
      quantity: 1,
      condition: 'Good',
      isPopular: false,
      availability: true,
      features: [
        'Experienced and hygienic staff',
        'Slaughtering at your location or ours',
        'Includes basic preparation'
      ],
      specifications: {
        size: '',
        capacity: '',
        power: '',
        setup: 'On-site or at our facility'
      },
      images: [{ url: '', alt: '' }]
    }
  };

  const [selectedTemplate, setSelectedTemplate] = useState('toilet');

  // Build axios config with Authorization header if token exists
  const buildAuthConfig = (extra = {}) => {
    const token = getAuthToken();
    const headers = {
      ...(extra.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
    return { ...extra, headers };
  };

  // Fetch equipment with better error handling
  const fetchEquipment = async () => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      const response = await axios.get(API_URL, buildAuthConfig());

      if (response.data && Array.isArray(response.data)) {
        setEquipment(response.data);
      } else {
        setEquipment([]);
        console.warn('No equipment data found or invalid format:', response.data);
      }
    } catch (err) {
      console.error('Error fetching equipment:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load equipment.';
      setError(`Error: ${errorMessage}. Please check your connection and try again.`);
      setEquipment([]); // Ensure equipment is an empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Initialize with empty state if no equipment
  useEffect(() => {
    if (!loading && equipment.length === 0) {
      console.log('No equipment found. Ready to add new equipment.');
    }
  }, [equipment, loading]);

  // Reset form to initial state
  const resetForm = () => {
    setFormData(equipmentTemplates[selectedTemplate]);
    setEditingEquipment(null);
  };

  // Filter equipment based on search term and category
  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.features && item.features.some(f => 
        f?.toLowerCase().includes(searchTerm.toLowerCase())
      ));
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    fetchEquipment();
  }, []);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle specification changes
  const handleSpecChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        [name]: value
      }
    }));
  };

  // Handle image file selection
  const handleImageFileChange = async (index, event) => {
    const file = event.target.files[0];
    if (!file) {
      console.log('No file selected');
      return;
    }

    console.log('Selected file:', {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: new Date(file.lastModified).toISOString()
    });

    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      const errorMsg = `Invalid file type: ${file.type}. Please upload a JPEG, PNG, or WebP image.`;
      console.error(errorMsg);
      setError(errorMsg);
      return;
    }

    // Check file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      const errorMsg = `Image is too large (${(file.size / (1024 * 1024)).toFixed(2)}MB). Maximum size is 5MB.`;
      console.error(errorMsg);
      setError(errorMsg);
      return;
    }

    try {
      setError(null);
      const formDataToSend = new FormData();
      formDataToSend.append('image', file);
      formDataToSend.append('filename', file.name);
      formDataToSend.append('timestamp', Date.now());

      const apiUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5003'}/api/upload`;
      console.log('Starting file upload to:', apiUrl);
      console.log('Uploading file:', file.name, `(${(file.size / 1024).toFixed(2)} KB)`);

      const config = buildAuthConfig({
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-Requested-With': 'XMLHttpRequest'
        },
        withCredentials: true,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload progress: ${percentCompleted}%`);
        }
      });

      console.log('Sending upload request with config:', config);
      const response = await axios.post(apiUrl, formDataToSend, config);
      
      console.log('Upload successful. Response:', response.data);
      
      if (response.data && response.data.success && response.data.url) {
        const newImages = [...formData.images];
        newImages[index] = { 
          ...newImages[index], 
          url: response.data.url, 
          alt: file.name || `Image ${index + 1}`,
          filename: response.data.filename || file.name
        };
        setFormData(prev => ({ ...prev, images: newImages }));
        setError(null);
      } else {
        const errorMsg = response.data?.message || 'Invalid response from server';
        console.error('Upload failed:', errorMsg, response.data);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      const errorMessage = error.response?.data?.message || 
                         error.message || 
                         'Failed to upload image. Please try again.';
      setError(`Upload error: ${errorMessage}`);
    }
  };

  // Handle image URL changes
  const handleImageChange = (index, field, value) => {
    const newImages = [...formData.images];
    newImages[index] = { ...newImages[index], [field]: value };
    setFormData(prev => ({ ...prev, images: newImages }));
  };

  // Add new image field
  const addImageField = () => {
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, { url: '', alt: '' }]
    }));
  };

  // Remove image field
  const removeImageField = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, images: newImages }));
  };

  // Add/remove feature
  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const updateFeature = (index, value) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData(prev => ({
      ...prev,
      features: newFeatures
    }));
  };

  const removeFeature = (index) => {
    const newFeatures = formData.features.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      features: newFeatures
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Clean up empty features
      const cleanData = {
        ...formData,
        features: formData.features.filter(feature => feature.trim() !== ''),
        pricePerDay: parseFloat(formData.pricePerDay),
        quantity: parseInt(formData.quantity, 10)
      };

      console.log('Submitting data:', cleanData); // Log the data being sent
      
      let response;
      if (editingEquipment) {
        response = await axios.put(`${API_URL}/${editingEquipment._id}`, cleanData, buildAuthConfig());
      } else {
        response = await axios.post(API_URL, cleanData, buildAuthConfig());
      }
      
      console.log('Server response:', response.data); // Log the server response
      
      setShowModal(false);
      setEditingEquipment(null);
      fetchEquipment();
    } catch (err) {
      console.error('Error saving equipment:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        config: {
          url: err.config?.url,
          method: err.config?.method,
          data: err.config?.data
        }
      });
      
      // More detailed error message
      const errorMessage = err.response?.data?.message || 
                         err.message || 
                         'Failed to save equipment. Please check the console for details.';
      
      setError(`Error: ${errorMessage}`);
    }
  };

  // Edit equipment
  const handleEdit = (item) => {
    setEditingEquipment(item);
    setFormData({
      name: item.name,
      category: item.category,
      pricePerDay: item.pricePerDay,
      description: item.description || '',
      quantity: item.quantity,
      condition: item.condition,
      isPopular: item.isPopular || false,
      availability: item.availability !== false,
      features: [...(item.features || [])],
      specifications: {
        size: item.specifications?.size || '',
        capacity: item.specifications?.capacity || '',
        power: item.specifications?.power || item.specifications?.powerRequirements || '',
        setup: item.specifications?.setup || ''
      },
      images: item.images?.length > 0 ? item.images : [{ url: '', alt: '' }]
    });
    setShowModal(true);
  };

  // Delete equipment
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this equipment?')) {
      try {
        // Copying packages delete pattern: enforce auth and update local state
        const token = getAuthToken();
        if (!token) {
          setError('Authentication required. Please log in again.');
          if (typeof window !== 'undefined') {
            window.location.href = '/admin/login?session=expired';
          }
          return;
        }
        await axios.delete(`${API_URL}/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Update local list like packages delete
        setEquipment(prev => prev.filter(e => e._id !== id));
        setError(null);
      } catch (err) {
        console.error('Error deleting equipment:', {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
          url: err.config?.url,
          method: err.config?.method,
        });
        // If it's already gone, clean it up locally for a smoother UX
        if (err.response?.status === 404) {
          setEquipment(prev => prev.filter(e => e._id !== id));
          setError('This equipment was already removed. The list has been updated.');
          return;
        }
        const serverMsg = err.response?.data?.message || err.response?.data?.error;
        const msg = serverMsg || `Failed to delete equipment${err.response?.status ? ` (HTTP ${err.response.status})` : ''}. Please try again.`;
        setError(msg);
      }
    }
  };
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Equipment Management</h1>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Equipment Management</h1>
        </div>
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p className="font-bold">Error Loading Equipment</p>
          <p>{error}</p>
          <button
            onClick={fetchEquipment}
            className="mt-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Equipment Management</h1>
        <button
          onClick={() => {
            setFormData(equipmentTemplates[selectedTemplate]);
            setEditingEquipment(null);
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={18} />
          Add Equipment
        </button>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Equipment Management</h1>
        <p className="text-gray-600">Manage your rental equipment inventory</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search equipment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('all');
              }}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Equipment List */}
      {filteredEquipment.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          <div className="text-center p-12">
            <div className="mx-auto w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
              <svg className="h-12 w-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No equipment found</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              {searchTerm || categoryFilter !== 'all' 
                ? 'No equipment matches your search criteria. Try adjusting your search or filters.'
                : 'You haven\'t added any equipment yet. Get started by adding your first item.'}
            </p>
            <div className="flex justify-center gap-4">
              {(searchTerm || categoryFilter !== 'all') ? (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setCategoryFilter('all');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Clear Filters
                </button>
              ) : (
                <button
                  onClick={() => {
                    resetForm();
                    setShowModal(true);
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus size={18} />
                  Add Your First Equipment
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEquipment.map((item) => (
            <div key={item._id} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
              <div className="h-48 bg-gray-100 overflow-hidden">
                {item.images?.[0]?.url ? (
                  <img 
                    src={item.images[0].url} 
                    alt={item.images[0].alt || item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {item.category}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {item.features?.slice(0, 2).join(' • ')}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">R{item.pricePerDay}/day</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingEquipment ? 'Edit Equipment' : 'Add New Equipment'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingEquipment(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            {/* Template Selector */}
            {!editingEquipment && (
              <div className="px-6 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Quick Template</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={selectedTemplate}
                  onChange={(e) => {
                    const key = e.target.value;
                    setSelectedTemplate(key);
                    setFormData(equipmentTemplates[key]);
                  }}
                >
                  <option value="toilet">VIP Mobile Toilet</option>
                  <option value="tents">Tents</option>
                  <option value="freezer">Mobile Freezer</option>
                  <option value="slaughter">Slaughtering Services</option>
                </select>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Equipment Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    {categories.filter(cat => cat !== 'All Equipment').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price per Day (R) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="pricePerDay"
                    value={formData.pricePerDay}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    maxLength={1000}
                    placeholder="Add a short description of the equipment..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">Max 1000 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    min="1"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Condition
                  </label>
                  <select
                    name="condition"
                    value={formData.condition}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="New">New</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isPopular"
                    name="isPopular"
                    checked={formData.isPopular}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isPopular" className="text-sm font-medium text-gray-700">
                    Mark as Popular
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="availability"
                    name="availability"
                    checked={formData.availability}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="availability" className="text-sm font-medium text-gray-700">
                    Available for Rent
                  </label>
                </div>
              </div>

              {/* Specifications */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Specifications</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                    <input
                      type="text"
                      name="size"
                      value={formData.specifications.size}
                      onChange={handleSpecChange}
                      placeholder="e.g., 10x10m"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                    <input
                      type="text"
                      name="capacity"
                      value={formData.specifications.capacity}
                      onChange={handleSpecChange}
                      placeholder="e.g., 20 people"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Power Requirements</label>
                    <input
                      type="text"
                      name="power"
                      value={formData.specifications.power}
                      onChange={handleSpecChange}
                      placeholder="e.g., 220V, 15A"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Setup</label>
                    <input
                      type="text"
                      name="setup"
                      value={formData.specifications.setup}
                      onChange={handleSpecChange}
                      placeholder="e.g., Professional setup included"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Features */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium text-gray-900">Features</h3>
                  <button
                    type="button"
                    onClick={addFeature}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    + Add Feature
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.features.map((feature, index) => (
                    <div key={index} className="flex space-x-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => updateFeature(index, e.target.value)}
                        placeholder="Enter feature"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => removeFeature(index)}
                        className="px-3 py-2 text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {formData.features.length === 0 && (
                    <p className="text-sm text-gray-500">No features added yet.</p>
                  )}
                </div>
              </div>

              {/* Images */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Images</h3>
                <div className="space-y-4">
                  {formData.images.map((img, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-700 w-16">Image {index + 1}</span>
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => removeImageField(index)}
                            className="text-sm text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageFileChange(index, e)}
                            className="hidden"
                            id={`image-upload-${index}`}
                          />
                          <label
                            htmlFor={`image-upload-${index}`}
                            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 cursor-pointer text-sm"
                          >
                            {img.url ? 'Change Image' : 'Upload Image'}
                          </label>
                          {img.url && (
                            <a
                              href={img.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline"
                            >
                              View
                            </a>
                          )}
                        </div>
                        <input
                          type="url"
                          placeholder="Image URL"
                          value={img.url || ''}
                          onChange={(e) => handleImageChange(index, 'url', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Alt text (description)"
                          value={img.alt || ''}
                          onChange={(e) => handleImageChange(index, 'alt', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addImageField}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Another Image
                  </button>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingEquipment(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {editingEquipment ? 'Update Equipment' : 'Add Equipment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentManagement;