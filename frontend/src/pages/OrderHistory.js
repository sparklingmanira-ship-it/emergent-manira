import React, { useState, useEffect } from 'react';
import { Package, Calendar, MapPin, CreditCard } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API}/orders`);
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'partially_accepted': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      try {
        await axios.put(`${API}/orders/${orderId}/cancel`);
        toast.success('Order cancelled successfully!');
        fetchOrders();
      } catch (error) {
        console.error('Error cancelling order:', error);
        toast.error('Failed to cancel order');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-playfair font-bold text-gray-900 mb-8">
          Order History
        </h1>
        
        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <Package className="h-24 w-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              No Orders Yet
            </h2>
            <p className="text-gray-600">
              You haven't placed any orders yet. Start shopping to see your order history here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Order #{order.id.slice(-8).toUpperCase()}
                      </h3>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(order.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="mt-4 sm:mt-0 flex items-center space-x-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                        {order.status.replace('_', ' ').charAt(0).toUpperCase() + order.status.replace('_', ' ').slice(1)}
                      </span>
                      <div className="text-right">
                        {order.original_amount && order.discount_amount > 0 ? (
                          <div className="space-y-1">
                            <div className="text-sm text-gray-500">
                              Original: <span className="line-through">₹{order.original_amount.toLocaleString()}</span>
                            </div>
                            <div className="text-sm text-green-600">
                              Saved: ₹{order.discount_amount.toLocaleString()} ({order.promotion_code})
                            </div>
                            <div className="text-lg font-bold text-blue-600">
                              Paid: ₹{order.total_amount.toLocaleString()}
                            </div>
                          </div>
                        ) : (
                          <span className="text-lg font-bold text-blue-600">
                            ₹{order.total_amount.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Order Items</h4>
                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>Product ID: {item.product_id.slice(-8).toUpperCase()}</span>
                            <span>Qty: {item.quantity} × ₹{item.price.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center text-sm font-medium text-gray-700 mb-1">
                          <MapPin className="h-4 w-4 mr-2" />
                          Shipping Address
                        </div>
                        <p className="text-gray-900 text-sm">{order.shipping_address}</p>
                      </div>
                      
                      <div>
                        <div className="flex items-center text-sm font-medium text-gray-700 mb-1">
                          <CreditCard className="h-4 w-4 mr-2" />
                          Payment Method
                        </div>
                        <p className="text-gray-900 text-sm">{order.payment_method} ({order.payment_status})</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Actions */}
                {(order.status === 'pending' || order.status === 'review') && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleCancelOrder(order.id)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
                    >
                      Cancel Order
                    </button>
                  </div>
                )}

                {(order.status === 'accepted' || order.status === 'partially_accepted') && order.payment_status === 'pending' && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-green-600 font-medium mb-2">
                      ✅ Your order has been {order.status === 'partially_accepted' ? 'partially accepted' : 'accepted'} by Manira!
                    </p>
                    {order.status === 'partially_accepted' && (
                      <p className="text-sm text-blue-600 mb-2">
                        💡 Some items were adjusted. You'll pay only for the accepted items.
                      </p>
                    )}
                    <button
                      onClick={() => window.location.href = `/payment/${order.id}`}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                    >
                      Complete Payment - ₹{order.total_amount.toLocaleString()}
                    </button>
                  </div>
                )}

                {order.admin_notes && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Note from Manira:</h4>
                    <p className="text-sm text-gray-600">{order.admin_notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;