import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Clock, 
  XCircle, 
  User, 
  Calendar, 
  DollarSign,
  Phone,
  Mail,
  MapPin,
  Plus,
  AlertCircle
} from 'lucide-react';
import { adminAPI, publicAPI } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/helpers';

export function QuoteManagement() {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingQuote, setEditingQuote] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching quotes...');
      const response = await adminAPI.getQuotes();
      console.log('Quotes API response:', response);
      
      // Handle different response formats
      let quotesData = [];
      if (response && response.success !== false) {
        // Case 1: Response has data array directly
        if (Array.isArray(response)) {
          quotesData = response;
        } 
        // Case 2: Response has data property with array
        else if (response.data && Array.isArray(response.data)) {
          quotesData = response.data;
        }
        // Case 3: Response has docs property (Mongoose pagination)
        else if (response.docs && Array.isArray(response.docs)) {
          quotesData = response.docs;
        }
      } else if (response && response.error) {
        throw new Error(response.error);
      }
      
      console.log('Processed quotes data:', quotesData);
      setQuotes(quotesData);
    } catch (err) {
      console.error('Failed to fetch quotes:', {
        error: err,
        message: err.message,
        response: err.response?.data
      });
      
      const errorMessage = err.response?.data?.message || 
                         err.message || 
                         'Failed to load quotes. Please check your connection and try again.';
      
      setError(`Error: ${errorMessage}`);
      setQuotes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuote = async (payload) => {
    try {
      setError(null);
      const res = await publicAPI.submitQuote(payload);
      if (res?.success === false) {
        throw new Error(res?.message || 'Failed to create quote');
      }
      await fetchQuotes();
      setShowCreateModal(false);
      setError({ type: 'success', message: 'Quote created successfully!' });
      setTimeout(() => setError(null), 3000);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create quote.';
      setError({ type: 'error', message: errorMessage });
    }
  };

  const handleRejectQuote = async (quoteId) => {
    try {
      setError(null);
      const ok = window.confirm('Reject this quote? The customer may be notified depending on your backend configuration.');
      if (!ok) return;
      await adminAPI.updateQuoteStatus(quoteId, { status: 'rejected' });
      await fetchQuotes();
      setError({ type: 'success', message: 'Quote rejected.' });
      setTimeout(() => setError(null), 3000);
    } catch (err) {
      console.error('Failed to reject quote:', {
        error: err,
        message: err.message,
        response: err.response?.data
      });
      const errorMessage = err.response?.data?.message || err.message || 'Failed to reject quote.';
      setError({ type: 'error', message: errorMessage });
    }
  };

  const handleUpdateQuote = async (quoteId, updatedData) => {
    try {
      setError(null);
      console.log('Updating quote:', { quoteId, updatedData });
      
      const response = await adminAPI.updateQuote(quoteId, updatedData);
      console.log('Update quote response:', response);
      // apiCall throws on non-OK; reaching here means success regardless of success flag
      await fetchQuotes();
      setShowEditModal(false);
      setEditingQuote(null);
      
      // Show success message
      setError({ type: 'success', message: 'Quote updated successfully!' });
      setTimeout(() => setError(null), 3000); // Clear success message after 3 seconds
    } catch (err) {
      console.error('Failed to update quote:', {
        error: err,
        message: err.message,
        response: err.response?.data
      });
      
      const errorMessage = err.response?.data?.message || 
                         err.message || 
                         'Failed to update quote. Please check your connection and try again.';
      
      setError({ type: 'error', message: errorMessage });
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDeleteQuote = async (quoteId) => {
    if (!window.confirm('Are you sure you want to delete this quote? This action cannot be undone.')) {
      return;
    }

    try {
      setError(null);
      await adminAPI.deleteQuote(quoteId);
      
      // Refresh the quotes list
      await fetchQuotes();
      
      // Show success message
      setError({ type: 'success', message: 'Quote deleted successfully!' });
      setTimeout(() => setError(null), 3000);
    } catch (err) {
      console.error('Failed to delete quote:', err);
      
      const errorMessage = err.response?.data?.message || 
                          err.message || 
                          'Failed to delete quote. Please try again.';
      
      setError({ type: 'error', message: errorMessage });
    }
  };

  const handleConfirmQuote = async (quoteId) => {
    try {
      setError(null);
      // Confirm the action with the admin
      const ok = window.confirm('Approve this quote? The customer will receive a confirmation email and be added to customer management.');
      if (!ok) return;
      
      await adminAPI.updateQuoteStatus(quoteId, { status: 'approved' });
      await fetchQuotes();
      
      // Show success message and redirect to customer management
      setError({ type: 'success', message: 'Quote approved! Customer notified by email and added to customer management. Redirecting...' });
      
      // Redirect to customer management after 2 seconds
      setTimeout(() => {
        navigate('/admin/customers');
      }, 2000);
      
    } catch (err) {
      console.error('Failed to confirm quote:', {
        error: err,
        message: err.message,
        response: err.response?.data
      });
      const errorMessage = err.response?.data?.message || err.message || 'Failed to approve quote.';
      setError({ type: 'error', message: errorMessage });
    }
  };

  // Ensure quotes is always an array before filtering
  const filteredQuotes = Array.isArray(quotes) ? quotes.filter(quote => {
    const matchesSearch = 
      quote.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.eventType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading quotes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Instant Quotation Management</h1>
          <p className="text-gray-600 mt-1">Manage customer quote requests and responses</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-600">
            {filteredQuotes.length} of {quotes.length} quotes
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Quote
          </button>
        </div>
      </div>

      {/* Status Message */}
      {error && (
        <div className={`rounded-lg p-4 ${
          error.type === 'error' 
            ? 'bg-red-50 border border-red-200 text-red-700' 
            : 'bg-green-50 border border-green-200 text-green-700'
        }`}>
          <div className="flex items-center">
            {error.type === 'error' ? (
              <XCircle className="w-5 h-5 mr-2" />
            ) : (
              <CheckCircle className="w-5 h-5 mr-2" />
            )}
            <span>{error.message}</span>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search quotes by customer, event type, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quotes Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reference
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Event Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estimated Cost
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredQuotes.length > 0 ? (
              filteredQuotes.map((quote) => (
                <tr key={quote._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {quote.reference || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{quote.customerName}</div>
                        <div className="text-sm text-gray-500">{quote.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{quote.eventType}</div>
                    <div className="text-sm text-gray-500">{quote.eventDate}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(quote.totalAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(quote.status)}`}>
                      {getStatusIcon(quote.status)}
                      <span className="ml-1 capitalize">{quote.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(quote.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {quote.status !== 'approved' && (
                        <button
                          onClick={() => handleConfirmQuote(quote._id)}
                          className="text-green-700 hover:text-green-900"
                          title="Confirm Quote"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {quote.status !== 'rejected' && (
                        <button
                          onClick={() => handleRejectQuote(quote._id)}
                          className="text-red-700 hover:text-red-900"
                          title="Reject Quote"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedQuote(quote);
                          setShowModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingQuote(quote);
                          setShowEditModal(true);
                        }}
                        className="text-green-600 hover:text-green-900"
                        title="Edit Quote"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteQuote(quote._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Quote"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No quotes found</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Quote Details Modal */}
      {showModal && selectedQuote && (
        <QuoteDetailsModal 
          quote={selectedQuote} 
          onClose={() => {
            setShowModal(false);
            setSelectedQuote(null);
          }} 
        />
      )}

      {/* Edit Quote Modal */}
      {showEditModal && editingQuote && (
        <EditQuoteModal
          quote={editingQuote}
          onSave={handleUpdateQuote}
          onClose={() => {
            setShowEditModal(false);
            setEditingQuote(null);
          }}
        />
      )}

      {/* Create Quote Modal */}
      {showCreateModal && (
        <CreateQuoteModal
          onSave={handleCreateQuote}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}

// Quote Details Modal Component
function QuoteDetailsModal({ quote, onClose }) {
  // Local helpers (component-level) to avoid relying on outer scope
  const modalStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  const paymentStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  const formatPaymentMethod = (method) => {
    if (!method) return '-';
    const map = {
      card: 'Card',
      bank_transfer: 'EFT / Bank Transfer',
      cash: 'Cash',
      mobile: 'Mobile',
    };
    return map[method] || method;
  };
  const modalStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Quote Details</h2>
            {quote.reference && (
              <div className="mt-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Ref: {quote.reference}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <span className="sr-only">Close</span>
            ×
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <User className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Name:</span>
                  <span className="text-sm text-gray-900 ml-2">{quote.customerName}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Email:</span>
                  <span className="text-sm text-gray-900 ml-2">{quote.email}</span>
                </div>
                {quote.phone && (
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Phone:</span>
                    <span className="text-sm text-gray-900 ml-2">{quote.phone}</span>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Details</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <FileText className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Event Type:</span>
                  <span className="text-sm text-gray-900 ml-2">{quote.eventType || '-'}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Event Date:</span>
                  <span className="text-sm text-gray-900 ml-2">{quote.eventDate || '-'}</span>
                </div>
                {quote.guestCount !== undefined && (
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-700">Guest Count:</span>
                    <span className="text-sm text-gray-900 ml-2">{quote.guestCount}</span>
                  </div>
                )}
                {quote.duration && (
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-700">Duration:</span>
                    <span className="text-sm text-gray-900 ml-2">{quote.duration}</span>
                  </div>
                )}
                {(quote.location || quote.address) && (
                  <div className="flex items-start">
                    <MapPin className="w-4 h-4 text-gray-400 mr-2 mt-0.5" />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Location:</span>
                      <div className="text-sm text-gray-900 ml-0">
                        {quote.location || ''}
                        {quote.address && (
                          <div className="text-gray-700">
                            {quote.address.street && <div>{quote.address.street}</div>}
                            {quote.address.city && <div>{quote.address.city}</div>}
                            {quote.address.state && <div>{quote.address.state}</div>}
                            {quote.address.postalCode && <div>{quote.address.postalCode}</div>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Request details and items */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Details</h3>
              <div className="space-y-3">
                {quote.totalAmount !== undefined && (
                  <div className="flex items-center">
                    <DollarSign className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Total Amount:</span>
                    <span className="text-sm text-gray-900 ml-2">{formatCurrency(quote.totalAmount)}</span>
                  </div>
                )}
                {quote.paymentMethod && (
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-700">Payment Method:</span>
                    <span className="text-sm text-gray-900 ml-2">{formatPaymentMethod(quote.paymentMethod)}</span>
                  </div>
                )}
                {quote.paymentStatus && (
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-700">Payment Status:</span>
                    <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${paymentStatusColor(quote.paymentStatus)}`}>
                      <span className="ml-1 capitalize">{quote.paymentStatus}</span>
                    </span>
                  </div>
                )}
                {quote.status && (
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-700">Status:</span>
                    <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${modalStatusColor(quote.status)}`}>
                      {modalStatusIcon(quote.status)}
                      <span className="ml-1 capitalize">{quote.status}</span>
                    </span>
                  </div>
                )}
                {(quote.notes || quote.message) && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Additional Requirements:</span>
                    <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{quote.notes || quote.message}</p>
                  </div>
                )}
              </div>
            </div>
            {Array.isArray(quote.items) && quote.items.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Requested Items</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-md divide-y">
                  {quote.items.map((it, idx) => (
                    <div key={idx} className="p-3 text-sm text-gray-800 flex justify-between">
                      <div>
                        <div className="font-medium">{it.name || it.title || `Item ${idx+1}`}</div>
                        {it.description && <div className="text-gray-600">{it.description}</div>}
                      </div>
                      <div className="text-right">
                        {it.quantity !== undefined && <div>Qty: {it.quantity}</div>}
                        {it.price !== undefined && <div>{formatCurrency(it.price)}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Services Requested</h3>
            <div className="space-y-2">
              {quote.services && quote.services.map((service, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-900">{service}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Additional Requirements already shown above using notes/message */}
          
          <div className="grid grid-cols-1 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-gray-700">Submitted:</span>
                  <p className="text-sm text-gray-900">{formatDate(quote.createdAt)}</p>
                </div>
                {quote.updatedAt && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Last Updated:</span>
                    <p className="text-sm text-gray-900">{formatDate(quote.updatedAt)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Edit Quote Modal Component
function EditQuoteModal({ quote, onSave, onClose }) {
  const [formData, setFormData] = useState({
    status: quote.status || 'pending',
    paymentStatus: quote.paymentStatus || 'pending',
    totalAmount: quote.totalAmount || 0,
    notes: quote.notes || '',
    items: quote.items ? [...quote.items] : [],
    services: quote.services ? [...quote.services] : [],
    customerName: quote.customerName || '',
    email: quote.email || '',
    phone: quote.phone || '',
    eventType: quote.eventType || '',
    eventDate: quote.eventDate || '',
    guestCount: quote.guestCount || 0,
    duration: quote.duration || ''
  });

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: field === 'price' || field === 'quantity' ? Number(value) : value
    };
    
    // Recalculate total if price or quantity changes
    if (field === 'price' || field === 'quantity') {
      updatedItems[index].total = (updatedItems[index].price || 0) * (updatedItems[index].quantity || 1);
    }
    
    setFormData(prev => ({
      ...prev,
      items: updatedItems,
      totalAmount: updatedItems.reduce((sum, item) => sum + (item.total || 0), 0)
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { name: '', quantity: 1, price: 0, total: 0 }]
    }));
  };

  const removeItem = (index) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      items: updatedItems,
      totalAmount: updatedItems.reduce((sum, item) => sum + (item.total || 0), 0)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Prepare the update payload
    const updatePayload = {
      ...formData,
      // Ensure numeric fields are numbers
      totalAmount: Number(formData.totalAmount) || 0,
      guestCount: formData.guestCount ? Number(formData.guestCount) : 0,
      items: formData.items.map(item => ({
        ...item,
        quantity: Number(item.quantity) || 1,
        price: Number(item.price) || 0,
        total: (Number(item.quantity) || 1) * (Number(item.price) || 0)
      }))
    };
    
    // Remove internal fields
    delete updatePayload._id;
    delete updatePayload.__v;
    delete updatePayload.createdAt;
    delete updatePayload.updatedAt;
    
    onSave(quote._id, updatePayload);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-gray-900">Edit Quote</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            <span className="sr-only">Close</span>
            &times;
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Customer Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            {/* Event Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Event Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Type *
                </label>
                <input
                  type="text"
                  value={formData.eventType}
                  onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Date *
                  </label>
                  <input
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Guest Count
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.guestCount}
                    onChange={(e) => setFormData({ ...formData, guestCount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (hours)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
          
          {/* Items */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Items</h3>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Add Item
              </button>
            </div>
            
            {formData.items.length > 0 ? (
              <div className="space-y-4">
                {formData.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-5">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Item Name
                      </label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Qty
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity || ''}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price (R)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.price || ''}
                        onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    
                    <div className="flex items-end">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Total
                        </label>
                        <div className="h-10 flex items-center px-3 py-2 border border-gray-300 bg-gray-50 rounded-lg">
                          {formatCurrency(item.total || 0)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="h-10 w-10 flex items-center justify-center text-red-600 hover:text-red-800"
                        title="Remove item"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
                
                <div className="flex justify-end pt-2 border-t border-gray-200">
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Subtotal</div>
                    <div className="text-xl font-semibold">
                      {formatCurrency(formData.items.reduce((sum, item) => sum + (item.total || 0), 0))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No items added yet</p>
              </div>
            )}
          </div>
          
          {/* Status and Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Status</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quote Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Status
                </label>
                <select
                  value={formData.paymentStatus}
                  onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="partially_paid">Partially Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Amount (R) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Notes</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Any notes from the customer..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Internal Notes
                </label>
                <textarea
                  value={formData.internalNotes || ''}
                  onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Internal notes about this quote..."
                />
              </div>
            </div>
          </div>
          
          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 sticky bottom-0 bg-white py-4 -mx-6 px-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Update Quote
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Create Quote Modal Component
function CreateQuoteModal({ onSave, onClose }) {
  const [formData, setFormData] = useState({
    customerName: 'Jane Doe',
    email: 'jane@example.com',
    phone: '+27 71 234 5678',
    eventType: 'Wedding',
    eventDate: '2025-09-01',
    guestCount: 120,
    duration: 6,
    items: [
      { name: 'DJ Package', quantity: 1, price: 3500, total: 3500 },
      { name: 'Uplights', quantity: 8, price: 150, total: 1200 }
    ],
    services: ['DJ', 'Lighting'],
    notes: 'Setup 2 hours prior to event',
    paymentStatus: 'pending',
    status: 'pending',
    totalAmount: 4700,
  });

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: field === 'price' || field === 'quantity' ? Number(value) : value,
    };
    if (field === 'price' || field === 'quantity') {
      updatedItems[index].total = (updatedItems[index].price || 0) * (updatedItems[index].quantity || 1);
    }
    setFormData((prev) => ({
      ...prev,
      items: updatedItems,
      totalAmount: updatedItems.reduce((sum, item) => sum + (item.total || 0), 0),
    }));
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { name: '', quantity: 1, price: 0, total: 0 }],
    }));
  };

  const removeItem = (index) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      items: updatedItems,
      totalAmount: updatedItems.reduce((sum, item) => sum + (item.total || 0), 0),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      totalAmount: Number(formData.totalAmount) || 0,
      guestCount: formData.guestCount ? Number(formData.guestCount) : 0,
      items: (formData.items || []).map((item) => ({
        ...item,
        quantity: Number(item.quantity) || 1,
        price: Number(item.price) || 0,
        total: (Number(item.quantity) || 1) * (Number(item.price) || 0),
      })),
    };
    onSave(payload);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-gray-900">Create Quote</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
            <span className="sr-only">Close</span>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Customer Information</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                <input type="text" value={formData.customerName} onChange={(e) => setFormData({ ...formData, customerName: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Event Information</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Type *</label>
                <input type="text" value={formData.eventType} onChange={(e) => setFormData({ ...formData, eventType: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Date *</label>
                  <input type="date" value={formData.eventDate} onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Guest Count</label>
                  <input type="number" min="1" value={formData.guestCount} onChange={(e) => setFormData({ ...formData, guestCount: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (hours)</label>
                <input type="number" min="1" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Items</h3>
              <button type="button" onClick={addItem} className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">Add Item</button>
            </div>

            {formData.items.length > 0 ? (
              <div className="space-y-4">
                {formData.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-5">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                      <input type="text" value={item.name} onChange={(e) => handleItemChange(index, 'name', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Qty</label>
                      <input type="number" min="1" value={item.quantity || ''} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price (R)</label>
                      <input type="number" step="0.01" min="0" value={item.price || ''} onChange={(e) => handleItemChange(index, 'price', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required />
                    </div>
                    <div className="flex items-end">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Total</label>
                        <div className="h-10 flex items-center px-3 py-2 border border-gray-300 bg-gray-50 rounded-lg">{formatCurrency(item.total || 0)}</div>
                      </div>
                    </div>
                    <div className="flex items-end">
                      <button type="button" onClick={() => removeItem(index)} className="h-10 w-10 flex items-center justify-center text-red-600 hover:text-red-800" title="Remove item">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}

                <div className="flex justify-end pt-2 border-t border-gray-200">
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Subtotal</div>
                    <div className="text-xl font-semibold">{formatCurrency(formData.items.reduce((sum, item) => sum + (item.total || 0), 0))}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No items added yet</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Status</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quote Status *</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                <select value={formData.paymentStatus} onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="partially_paid">Partially Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount (R) *</label>
                <input type="number" min="0" step="0.01" value={formData.totalAmount} onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Notes</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Notes</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Any notes from the customer..." />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 sticky bottom-0 bg-white py-4 -mx-6 px-6">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Create Quote</button>
          </div>
        </form>
      </div>
    </div>
  );
}
