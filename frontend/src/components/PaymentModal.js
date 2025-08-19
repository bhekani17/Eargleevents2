import { useState } from 'react';
import { X, Banknote, CheckCircle, Mail, Building } from 'lucide-react';
import { publicAPI } from '../services/api';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export function PaymentModal({ isOpen, onClose, quoteData }) {
  const [selectedPayment, setSelectedPayment] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState('');
  const [reference, setReference] = useState('');

  const handleClose = () => {
    setSelectedPayment('');
    setError('');
    setIsProcessing(false);
    setIsComplete(false);
    onClose();
  };

  const calculateTotal = () => {
    if (quoteData?.selectedItems && quoteData.selectedItems.length > 0) {
      // Sum price x quantity for each item
      return quoteData.selectedItems.reduce(
        (total, item) => total + ((parseFloat(item.price) || 0) * (parseInt(item.quantity, 10) || 1)),
        0
      );
    }
    return 0;
  };

  const paymentOptions = [
    {
      id: 'eft',
      name: 'Electronic Funds Transfer (EFT)',
      description: 'Direct bank transfer',
      icon: Building,
      popular: true
    },
    {
      id: 'cash',
      name: 'Cash Payment',
      description: 'Pay with cash on delivery',
      icon: Banknote,
      popular: false
    }
  ];

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    
    // Client-side validations to prevent avoidable 400s
    const errs = [];
    if (!selectedPayment) errs.push('Please select a payment method.');
    if (!quoteData?.name) errs.push('Full name is required.');
    if (!quoteData?.email) errs.push('Email is required.');
    if (!quoteData?.eventDate) errs.push('Event date is required.');
    if (!Array.isArray(quoteData?.selectedItems) || quoteData.selectedItems.length === 0) {
      errs.push('Please select at least one item for your quote.');
    }
    if (!quoteData?.phone) errs.push('Phone number is required.');
    if (!quoteData?.location) errs.push('Location is required.');
    if (errs.length) {
      const msg = errs.join(' ');
      setError(msg);
      return;
    }
    
    setIsProcessing(true);
    setError('');

    try {
      // Prepare quote data in the format expected by the backend
      const normalizePaymentMethod = (method) => {
        // Map UI selection to backend enum values
        if (method === 'eft') return 'eft';
        if (method === 'cash') return 'cash';
        return method;
      };

      const quoteDataToSubmit = {
        customerName: quoteData.name,
        company: quoteData.company || '',
        email: quoteData.email,
        phone: quoteData.phone,
        // Ensure backend can parse the date reliably
        eventDate: new Date(quoteData.eventDate).toISOString(),
        eventType: quoteData.eventType || 'other',
        eventTypeOther: quoteData.eventType === 'other' ? (quoteData.eventTypeOther || '') : undefined,
        services: Array.isArray(quoteData.services) && quoteData.services.length > 0
          ? quoteData.services
          : (quoteData.selectedItems || []).map(it => it.category).filter(Boolean),
        guestCount: parseInt(quoteData.guestCount, 10) || 1,
        location: quoteData.location,
        items: (quoteData.selectedItems || []).map(item => ({
          id: item.id || item._id,
          name: item.name,
          category: item.category,
          quantity: parseInt(item.quantity, 10) || 1,
          price: parseFloat(item.price) || 0
        })),
        totalAmount: calculateTotal(),
        paymentMethod: normalizePaymentMethod(selectedPayment),
        notes: quoteData.message
      };

      // Submit quote using the publicAPI.submitQuote method
      const response = await publicAPI.submitQuote(quoteDataToSubmit);
      
      // If we get here, the submission was successful
      console.log('Quote submitted successfully:', response);
      // Try to extract the generated reference from various possible response shapes
      const ref = response?.data?.reference || response?.reference || response?.data?.data?.reference;
      if (ref) setReference(ref);
      
      // Show success message
      toast.success('Your quote has been submitted successfully!', {
        position: 'top-center',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
      
      // Show completion state
      setIsComplete(true);
    } catch (error) {
      console.error('Quote submission error:', error);
      // Extract server-side validation errors if present
      const respData = error?.data || error?.response?.data;
      const messages = [];
      if (respData?.errors && Array.isArray(respData.errors)) {
        messages.push(...respData.errors.map(e => e.msg || e.message).filter(Boolean));
      }
      if (respData?.message) messages.push(respData.message);
      const friendly = messages.filter(Boolean).join(' ') || 'Failed to submit quote. Please try again.';

      // Show error toast
      toast.error(friendly, {
        position: 'top-center',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
      
      setError(friendly);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  if (isComplete) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Quote Submitted!</h2>
          <p className="text-gray-600 mb-4">Your request has been received.</p>
          {reference && (
            <div className="mb-6">
              <div className="text-sm text-gray-700 mb-1">Your Reference Number</div>
              <div className="flex items-center justify-center gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-semibold bg-gray-100 text-gray-800">
                  {reference}
                </span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard && navigator.clipboard.writeText(reference)}
                  className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                >
                  Copy
                </button>
              </div>
              {selectedPayment === 'eft' && (
                <p className="text-xs text-gray-600 mt-2">Use this reference when making your EFT so we can match your payment.</p>
              )}
            </div>
          )}
          <div className="bg-gold-50 border border-gold-200 rounded-lg p-4 mb-6">
            <div className="flex items-center mb-2">
              <Mail className="w-5 h-5 text-gold-600 mr-2" />
              <span className="font-medium text-gold-800">Confirmation Sent</span>
            </div>
            <p className="text-sm text-gold-700">
              Email sent to {quoteData?.email} and admin team.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-full px-4 py-2 bg-gold-600 hover:bg-gold-700 text-black font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Payment Options</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quote Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Customer:</span>
              <span className="font-medium">{quoteData?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Event Date:</span>
              <span className="font-medium">{quoteData?.eventDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Location:</span>
              <span className="font-medium">{quoteData?.location}</span>
            </div>
            
            {/* Selected Items */}
            {quoteData?.selectedItems && quoteData.selectedItems.length > 0 && (
              <div>
                <span className="text-gray-600 block mb-2">Selected Equipment:</span>
                <div className="space-y-1">
                  {quoteData.selectedItems.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-700">{item.name}</span>
                      <span className="font-medium">R{item.price}/day</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-between text-lg font-bold border-t pt-2 mt-4">
              <span>Total Estimate:</span>
              <span className="text-gold-600">R{calculateTotal().toLocaleString()}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmitPayment} className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Payment Method</h3>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {paymentOptions.map((option) => {
              const IconComponent = option.icon;
              return (
                <div
                  key={option.id}
                  className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedPayment === option.id
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPayment(option.id)}
                >
                  {option.popular && (
                    <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                      Popular
                    </div>
                  )}
                  <div className="flex items-center mb-2">
                    <IconComponent className={`w-6 h-6 mr-3 ${
                      selectedPayment === option.id ? 'text-blue-600' : 'text-gray-600'
                    }`} />
                    <span className="font-medium text-gray-900">{option.name}</span>
                  </div>
                  <p className="text-sm text-gray-600">{option.description}</p>
                  <div className="mt-2">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={option.id}
                      checked={selectedPayment === option.id}
                      onChange={() => setSelectedPayment(option.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {selectedPayment === 'eft' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-blue-900 mb-2">EFT Banking Details</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>Bank:</strong> First National Bank</p>
                <p><strong>Account:</strong> Eagles Events (Pty) Ltd</p>
                <p><strong>Number:</strong> 1234567890</p>
                <p><strong>Branch:</strong> 250655</p>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedPayment || isProcessing}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
            >
              {isProcessing ? 'Processing...' : 'Submit Quote & Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
