import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CreditCard, CheckCircle, Clock, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Payment = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [showUpiModal, setShowUpiModal] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await axios.get(`${API}/orders`);
      const userOrder = response.data.find(o => o.id === orderId);
      
      if (!userOrder) {
        toast.error('Order not found');
        navigate('/orders');
        return;
      }

      if (userOrder.status !== 'accepted' && userOrder.status !== 'partially_accepted') {
        toast.error('Order is not ready for payment');
        navigate('/orders');
        return;
      }

      if (userOrder.payment_status === 'completed') {
        toast.info('Payment already completed');
        navigate('/orders');
        return;
      }

      setOrder(userOrder);
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Failed to load order');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = () => {
    setShowUpiModal(true);
  };

  const processPayment = async () => {
    setPaymentProcessing(true);
    
    try {
      // Create Razorpay order
      const orderResponse = await axios.post(`${API}/payment/create-order/${orderId}`);
      const { razorpay_order_id, amount, currency, key_id } = orderResponse.data;
      
      // Initialize Razorpay
      const options = {
        key: key_id,
        amount: amount,
        currency: currency,
        name: 'Manira Jewellery',
        description: `Payment for Order #${orderId.slice(-8).toUpperCase()}`,
        order_id: razorpay_order_id,
        handler: async function (response) {
          try {
            // Verify payment
            await axios.post(`${API}/payment/verify/${orderId}`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            
            toast.success('Payment completed successfully!');
            setShowUpiModal(false);
            navigate('/orders');
            
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: user.full_name,
          email: user.email,
          contact: user.phone
        },
        theme: {
          color: '#1e40af'
        },
        modal: {
          ondismiss: function() {
            setPaymentProcessing(false);
            setShowUpiModal(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment initiation failed. Please try again.');
      setPaymentProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Order not found</h2>
          <p className="text-gray-600 mt-2">The order you're looking for doesn't exist or isn't ready for payment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center mb-8">
          <button 
            onClick={() => navigate('/orders')}
            className="mr-4 p-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-3xl font-playfair font-bold text-gray-900">
            Complete Payment
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order ID</span>
                  <span className="font-medium">#{order.id.slice(-8).toUpperCase()}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    order.status === 'accepted' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {order.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Items</span>
                  <span className="font-medium">{order.items.length} products</span>
                </div>
                
                {order.original_amount && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Original Amount</span>
                    <span className="text-gray-500 line-through">₹{order.original_amount.toLocaleString()}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-lg font-bold border-t pt-3">
                  <span>Total Amount</span>
                  <span className="text-blue-600">₹{order.total_amount.toLocaleString()}</span>
                </div>
              </div>
              
              {order.admin_notes && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-1">Note from Manira:</h4>
                  <p className="text-sm text-blue-800">{order.admin_notes}</p>
                </div>
              )}
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div>
                      <span className="text-gray-900">Product #{item.product_id.slice(-8).toUpperCase()}</span>
                      {item.status && (
                        <span className={`ml-2 px-2 py-1 rounded text-xs ${
                          item.status === 'accepted' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {item.status}
                        </span>
                      )}
                    </div>
                    <span className="font-medium">
                      {item.quantity} × ₹{item.price.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Details</h2>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-4 border border-blue-200 bg-blue-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Order Approved</h4>
                    <p className="text-sm text-gray-600">Your order has been reviewed and approved by Manira</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Payment Pending</h4>
                    <p className="text-sm text-gray-600">Complete payment to confirm your order</p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={handlePayNow}
                  className="w-full manira-btn-primary text-lg py-4 flex items-center justify-center"
                >
                  <CreditCard className="h-6 w-6 mr-2" />
                  Pay ₹{order.total_amount.toLocaleString()} via UPI
                </button>
              </div>

              <div className="mt-4 text-center text-sm text-gray-500">
                <p>Secure payment powered by UPI</p>
                <p className="mt-1">Your order will be confirmed after successful payment</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* UPI Payment Modal */}
      {showUpiModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-8 w-8 text-blue-600" />
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                UPI Payment
              </h3>
              
              <div className="bg-gray-100 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 mb-2">Pay to: Manira Jewellery</p>
                <p className="text-2xl font-bold text-blue-600">₹{order.total_amount.toLocaleString()}</p>
                <p className="text-sm text-gray-500 mt-1">Order #{order.id.slice(-8).toUpperCase()}</p>
              </div>
              
              <p className="text-gray-600 mb-6">
                This is a demo UPI payment. In real implementation, you would be redirected to your UPI app.
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={processPayment}
                  disabled={paymentProcessing}
                  className="w-full manira-btn-primary py-3 disabled:opacity-50"
                >
                  {paymentProcessing ? 'Processing Payment...' : 'Complete Payment'}
                </button>
                <button
                  onClick={() => setShowUpiModal(false)}
                  disabled={paymentProcessing}
                  className="w-full manira-btn-secondary py-3"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payment;