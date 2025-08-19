import { useState, useEffect, useCallback } from 'react';
import { X, Calendar, Users, MapPin, Package, Loader2, AlertCircle, CheckCircle, RefreshCw, Send } from 'lucide-react';
import { Button } from './ui/button';
import { PaymentModal } from './PaymentModal';
import { publicAPI } from '../services/api';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export function QuoteModal({ isOpen, onClose, preSelectedItem = null }) {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    eventType: '',
    eventDate: '',
    location: '',
    guestCount: '',
    services: [],
    selectedItems: [],
    message: '',
    eventTypeOther: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [equipment, setEquipment] = useState([]);
  const [loadingEquipment, setLoadingEquipment] = useState(true);
  const [packages, setPackages] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const services = [
    'VIP Mobile Toilets',
    'Mobile Freezers',
    'Tents & Marquees',
    'Slaughtering Services'
  ];

  const categories = [
    { value: 'all', label: 'All Equipment' },
    { value: 'VIP Mobile Toilets', label: 'VIP Mobile Toilets' },
    { value: 'Mobile Freezers', label: 'Mobile Freezers' },
    { value: 'Tents & Marquees', label: 'Tents & Marquees' },
    { value: 'Slaughtering Services', label: 'Slaughtering Services' }
  ];

  // Format price with ZAR currency
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-ZA', { 
      style: 'currency', 
      currency: 'ZAR',
      minimumFractionDigits: 2
    }).format(price || 0);
  };

  // Fetch equipment & packages when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchEquipment();
      fetchPackages();
    }
  }, [isOpen]);

  // Handle pre-selected item (equipment or package)
  useEffect(() => {
    if (isOpen && preSelectedItem) {
      const maybeAddPreselected = async () => {
        try {
          // If coming from PackageCard, it passes { type: 'package', packageId, ... }
          if (preSelectedItem.type === 'package' && preSelectedItem.packageId) {
            const pkgResponse = await publicAPI.getPackage(preSelectedItem.packageId);
            const pkg = pkgResponse?.data || pkgResponse;
            if (!pkg) return;
            setFormData(prev => {
              const exists = prev.selectedItems.some(item => item.id === preSelectedItem.packageId);
              if (exists) return prev;
              const pkgItem = {
                id: preSelectedItem.packageId,
                name: pkg.name,
                category: pkg.category || 'Package',
                price: (pkg.price ?? pkg.basePrice ?? preSelectedItem.estimatedCost ?? 0),
                quantity: 1,
                maxQuantity: 1,
                description: pkg.shortDescription || pkg.description,
                features: pkg.features || []
              };
              const newSelectedItems = [...prev.selectedItems, pkgItem];
              const newServices = [...new Set(newSelectedItems.map(item => item.category))];
              return { ...prev, selectedItems: newSelectedItems, services: newServices };
            });
          } else if (preSelectedItem.type === 'service' && preSelectedItem.name) {
            // Preselect a service (from HireNowBanner)
            setFormData(prev => {
              const svc = preSelectedItem.name;
              const hasService = prev.services.includes(svc);
              return hasService ? prev : { ...prev, services: [...prev.services, svc] };
            });
          } else if (preSelectedItem.id || preSelectedItem._id) {
            // Support equipment preSelectedItem from HirePage using _id and nested pricing/inventory
            setFormData(prev => {
              const rawId = preSelectedItem.id || preSelectedItem._id;
              const exists = prev.selectedItems.some(item => item.id === rawId);
              if (exists) return prev;
              const eqItem = {
                id: rawId,
                name: preSelectedItem.name,
                category: preSelectedItem.category,
                price: preSelectedItem.price ?? preSelectedItem.pricing?.dailyRate ?? 0,
                quantity: 1,
                maxQuantity: preSelectedItem.maxQuantity ?? preSelectedItem.inventory?.availableUnits ?? 1,
                description: preSelectedItem.description,
                features: preSelectedItem.features || []
              };
              const newSelectedItems = [...prev.selectedItems, eqItem];
              const newServices = [...new Set(newSelectedItems.map(item => item.category))];
              return { ...prev, selectedItems: newSelectedItems, services: newServices };
            });
          }
        } catch (e) {
          console.error('Failed to load preselected package:', e);
        }
      };
      maybeAddPreselected();
    }
  }, [isOpen, preSelectedItem]);

  const fetchEquipment = useCallback(async () => {
    try {
      setLoadingEquipment(true);
      setError(null);
      const response = await publicAPI.getEquipment();
      setEquipment(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Failed to fetch equipment:', error);
      setError('Failed to load equipment. Please try again later.');
      toast.error('Failed to load equipment. Please try again.');
    } finally {
      setLoadingEquipment(false);
    }
  }, []);

  const fetchPackages = useCallback(async () => {
    try {
      setLoadingPackages(true);
      setError(null);
      const response = await publicAPI.getPackages();
      // publicAPI.getPackages returns raw API response; normalize to array
      const list = Array.isArray(response) ? response : (response?.data || []);
      setPackages(list);
    } catch (err) {
      console.error('Failed to fetch packages:', err);
      toast.error('Failed to load packages. Please try again.');
    } finally {
      setLoadingPackages(false);
    }
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleServiceChange = (service) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };

  const handlePackageSelect = (pkg) => {
    try {
      if (!pkg || !pkg._id) throw new Error('Invalid package');
      setFormData(prev => {
        const exists = prev.selectedItems.some(item => item.id === pkg._id);
        let newSelectedItems;
        if (exists) {
          newSelectedItems = prev.selectedItems.filter(item => item.id !== pkg._id);
          toast.info(`${pkg.name} removed from selection`);
        } else {
          const newItem = {
            id: pkg._id,
            name: pkg.name,
            category: pkg.category || 'Package',
            price: pkg.price || pkg.basePrice || 0,
            quantity: 1,
            maxQuantity: 1,
            description: pkg.shortDescription || pkg.description,
            features: pkg.features || []
          };
          newSelectedItems = [...prev.selectedItems, newItem];
          toast.success(`${pkg.name} added to selection`);
        }
        const newServices = [...new Set(newSelectedItems.map(item => item.category))];
        return { ...prev, selectedItems: newSelectedItems, services: newServices };
      });
    } catch (e) {
      console.error('Error selecting package:', e);
      toast.error('Failed to update package selection.');
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Full name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    if (!formData.phone.trim()) errors.phone = 'Phone number is required';
    if (!formData.eventDate) errors.eventDate = 'Event date is required';
    if (formData.selectedItems.length === 0) errors.items = 'Please select at least one item';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEquipmentChange = (equipmentItem) => {
    try {
      if (!equipmentItem || !equipmentItem._id) {
        throw new Error('Invalid equipment item');
      }

      setFormData(prev => {
        const existingItemIndex = prev.selectedItems.findIndex(item => item.id === equipmentItem._id);
        let newSelectedItems;
        
        if (existingItemIndex >= 0) {
          // Item already selected, remove it
          newSelectedItems = prev.selectedItems.filter(item => item.id !== equipmentItem._id);
          toast.info(`${equipmentItem.name} removed from selection`);
        } else {
          // Add new item with default quantity of 1
          const newItem = {
            id: equipmentItem._id,
            name: equipmentItem.name,
            category: equipmentItem.category,
            price: equipmentItem.pricePerDay || 0,
            quantity: 1,
            maxQuantity: equipmentItem.quantity || 1,
            description: equipmentItem.description,
            features: equipmentItem.features || []
          };
          newSelectedItems = [...prev.selectedItems, newItem];
          toast.success(`${equipmentItem.name} added to selection`);
        }
        
        // Update services array based on selected items
        const newServices = [...new Set(newSelectedItems.map(item => item.category))];
        
        return {
          ...prev,
          selectedItems: newSelectedItems,
          services: newServices
        };
      });
    } catch (error) {
      console.error('Error updating equipment selection:', error);
      toast.error('Failed to update selection. Please try again.');
    }
  };

  const updateItemQuantity = (itemId, newQuantity) => {
    setFormData(prev => ({
      ...prev,
      selectedItems: prev.selectedItems.map(item => 
        item.id === itemId 
          ? { ...item, quantity: Math.max(1, Math.min(newQuantity, item.maxQuantity)) }
          : item
      )
    }));
  };

  const removeSelectedItem = (itemId) => {
    setFormData(prev => {
      const newSelectedItems = prev.selectedItems.filter(item => item.id !== itemId);
      const newServices = [...new Set(newSelectedItems.map(item => item.category))];
      
      return {
        ...prev,
        selectedItems: newSelectedItems,
        services: newServices
      };
    });
  };

  const calculateTotalCost = () => {
    return formData.selectedItems.reduce((total, item) => {
      return total + ((item.price || 0) * (item.quantity || 1));
    }, 0);
  };

  const filteredEquipment = selectedCategory === 'all' 
    ? (equipment || []) 
    : (equipment || []).filter(item => item.category === selectedCategory);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the form errors before submitting.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Show loading state
      const loadingToast = toast.loading('Preparing your quotation...');
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show payment modal
      setShowPayment(true);
      
      // Update toast
      toast.update(loadingToast, {
        render: 'Quotation ready!',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
        closeButton: true
      });
      
    } catch (error) {
      console.error('Quote preparation error:', error);
      toast.error(error.message || 'Error preparing quote. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading skeleton when loading
  const renderLoadingSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse bg-gray-100 rounded-lg p-4 h-24" />
      ))}
    </div>
  );

  // Render error state
  const renderErrorState = () => (
    <div className="text-center p-8 bg-red-50 rounded-lg border border-red-200">
      <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
      <h3 className="text-lg font-medium text-red-800 mb-2">Failed to load equipment</h3>
      <p className="text-red-600 mb-4">{error || 'Please try again later.'}</p>
      <Button 
        onClick={fetchEquipment}
        variant="outline" 
        className="text-red-600 border-red-300 hover:bg-red-50"
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        Retry
      </Button>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Request an Instant Quotation</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company (optional)
              </label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Company or Organization"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your.email@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+27 123 456 789"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Type
              </label>
              <select
                name="eventType"
                value={formData.eventType}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select event type</option>
                <option value="wedding">Wedding</option>
                <option value="corporate">Corporate Event</option>
                <option value="festival">Festival</option>
                <option value="private">Private Party</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {formData.eventType === 'other' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Please specify other event type
              </label>
              <input
                type="text"
                name="eventTypeOther"
                value={formData.eventTypeOther}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Product Launch, Community Fair"
              />
            </div>
          )}

          {/* Event Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Event Date *
              </label>
              <input
                type="date"
                name="eventDate"
                value={formData.eventDate}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="w-4 h-4 inline mr-1" />
                Expected Guests
              </label>
              <input
                type="number"
                name="guestCount"
                value={formData.guestCount}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Number of guests"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Event Location *
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Event venue or location"
            />
          </div>

          {/* Package Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Package className="w-4 h-4 inline mr-1" />
              Select Package
            </label>
            {loadingPackages ? (
              renderLoadingSkeleton()
            ) : packages && packages.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                {packages.map((pkg) => {
                  const isSelected = formData.selectedItems.some(it => it.id === pkg._id);
                  return (
                    <div key={pkg._id} className={`border rounded-lg p-3 ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">{pkg.name}</h4>
                          <p className="text-xs text-gray-600">{pkg.category || 'Package'}</p>
                          <p className="text-sm font-semibold text-blue-600 mt-1">{formatPrice(pkg.price || pkg.basePrice || 0)}</p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant={isSelected ? 'outline' : 'default'}
                          onClick={() => handlePackageSelect(pkg)}
                        >
                          {isSelected ? 'Remove' : 'Add'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mb-6 text-sm text-gray-500">No packages available at the moment.</div>
            )}
          </div>

          {/* Equipment Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Package className="w-4 h-4 inline mr-1" />
              Select Equipment & Services *
            </label>
            
            {/* Category Filter */}
            <div className="mb-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Items Summary */}
            {formData.selectedItems.length > 0 && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-sm font-medium text-blue-800">
                    Selected Items ({formData.selectedItems.length})
                  </p>
                  <p className="text-lg font-bold text-blue-900">
                    Total: {formatPrice(calculateTotalCost())}/day
                  </p>
                </div>
                <div className="space-y-3">
                  {formData.selectedItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white p-3 rounded-lg border border-blue-200"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.name}</h4>
                          <p className="text-sm text-gray-600">{item.category}</p>
                          <p className="text-sm font-medium text-green-600">
                            {formatPrice(item.price)}/day each
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <label className="text-xs text-gray-600">Qty:</label>
                            <input
                              type="number"
                              min="1"
                              max={item.maxQuantity}
                              value={item.quantity}
                              onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 1)}
                              className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeSelectedItem(item.id)}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="Remove item"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 flex justify-between items-center text-sm">
                        <span className="text-gray-500">
                          Available: {item.maxQuantity} units
                        </span>
                        <span className="font-medium text-blue-700">
                          Subtotal: {formatPrice((item.price || 0) * (item.quantity || 1))}/day
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Equipment Grid */}
            {error ? (
              renderErrorState()
            ) : loadingEquipment ? (
              renderLoadingSkeleton()
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto p-1">
                {filteredEquipment && filteredEquipment.length > 0 ? (
                  filteredEquipment.map((item) => {
                    const isSelected = formData.selectedItems.some(selected => selected.id === item._id);
                    const isAvailable = (item.quantity || 0) > 0;
                    
                    return (
                      <div
                        key={item._id}
                        className={`border rounded-lg p-4 transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                            : isAvailable
                            ? 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                            : 'border-gray-100 bg-gray-50 cursor-not-allowed'
                        }`}
                        onClick={() => isAvailable && handleEquipmentChange(item)}
                      >
                        <div className="flex items-start">
                          <div className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded-full border ${
                            isSelected 
                              ? 'bg-blue-500 border-blue-500 flex items-center justify-center'
                              : 'border-gray-300 bg-white'
                          }`}>
                            {isSelected && (
                              <CheckCircle className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <div className="ml-3 flex-1">
                            <div className="flex justify-between items-start">
                              <h4 className={`font-medium ${
                                isAvailable ? 'text-gray-900' : 'text-gray-400'
                              }`}>
                                {item.name}
                              </h4>
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                isAvailable
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {isAvailable ? 'In Stock' : 'Out of Stock'}
                              </span>
                            </div>
                            
                            {item.description && (
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {item.description}
                              </p>
                            )}
                            
                            <div className="mt-2 flex justify-between items-center">
                              <span className="text-sm font-semibold text-blue-600">
                                {formatPrice(item.pricePerDay || 0)}<span className="text-xs font-normal text-gray-500">/day</span>
                              </span>
                              {isAvailable && (
                                <span className="text-xs text-gray-500">
                                  {item.quantity} available
                                </span>
                              )}
                            </div>
                            
                            {isAvailable && (
                              <Button
                                type="button"
                                size="sm"
                                variant={isSelected ? 'outline' : 'default'}
                                className="mt-2 w-full text-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEquipmentChange(item);
                                }}
                              >
                                {isSelected ? 'Remove from Selection' : 'Add to Selection'}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-2 text-center py-12">
                    <Package className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                    <h4 className="text-gray-500 font-medium">No equipment found</h4>
                    <p className="text-sm text-gray-400 mt-1">
                      Try selecting a different category or check back later.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Additional Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Requirements
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Any specific requirements or questions..."
            />
          </div>

          {/* Form Validation Errors */}
          {Object.keys(formErrors).length > 0 && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Please fix the following errors:
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <ul className="list-disc pl-5 space-y-1">
                      {Object.values(formErrors).map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="w-full sm:w-auto flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || formData.selectedItems.length === 0}
              className="w-full sm:w-auto flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-md"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Request Instant Quotation
                </>
              )}
            </Button>
          </div>
          
          {/* Summary */}
          {formData.selectedItems.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-800">
                  {formData.selectedItems.length} item{formData.selectedItems.length !== 1 ? 's' : ''} selected
                </span>
                <div className="text-right">
                  <p className="text-xs text-blue-600">Estimated Total (per day)</p>
                  <p className="text-xl font-bold text-blue-900">
                    {formatPrice(calculateTotalCost())}
                  </p>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
      
      <PaymentModal
        isOpen={showPayment}
        onClose={() => {
          setShowPayment(false);
          setFormData({
            name: '',
            company: '',
            email: '',
            phone: '',
            eventType: '',
            eventDate: '',
            location: '',
            guestCount: '',
            services: [],
            selectedItems: [],
            message: '',
            eventTypeOther: ''
          });
          onClose();
        }}
        quoteData={formData}
      />
    </div>
  );
}
