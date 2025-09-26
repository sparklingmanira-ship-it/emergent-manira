import React, { useState, useEffect } from 'react';
import { Plus, Package, Users, ShoppingBag, Edit, Trash2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    category: 'necklaces',
    material: 'American Diamond',
    size: '',
    weight: '',
    image_url: '',
    inventory_count: ''
  });

  useEffect(() => {
    if (activeTab === 'products') {
      fetchProducts();
    } else if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [activeTab]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/products`);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/admin/orders`);
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    
    try {
      const productData = {
        ...newProduct,
        price: parseFloat(newProduct.price),
        inventory_count: parseInt(newProduct.inventory_count)
      };
      
      await axios.post(`${API}/admin/products`, productData);
      toast.success('Product added successfully!');
      setShowAddProduct(false);
      setNewProduct({
        name: '', description: '', price: '', category: 'necklaces',
        material: 'American Diamond', size: '', weight: '', image_url: '', inventory_count: ''
      });
      fetchProducts();
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Failed to add product');
    }
  };

  const availableImages = [
    // Your Manira Product Images
    'https://customer-assets.emergentagent.com/job_jewel-basket/artifacts/tp5jz4ds_IMG_6633.jpeg',
    'https://customer-assets.emergentagent.com/job_jewel-basket/artifacts/b167u5fl_IMG_6638.jpeg',
    'https://customer-assets.emergentagent.com/job_jewel-basket/artifacts/cjc9nvd2_IMG_6639.jpeg',
    'https://customer-assets.emergentagent.com/job_jewel-basket/artifacts/5pkyhqan_IMG_6640.jpeg',
    'https://customer-assets.emergentagent.com/job_jewel-basket/artifacts/k59u3pec_IMG_6641.jpeg',
    // Additional Sample Images
    'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzd8MHwxfHNlYXJjaHwxfHxkaWFtb25kJTIwamV3ZWxsZXJ5fGVufDB8fHx8MTc1ODg1NDIyMnww&ixlib=rb-4.1.0&q=85',
    'https://images.unsplash.com/photo-1607703829739-c05b7beddf60?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzd8MHwxfHNlYXJjaHwyfHxkaWFtb25kJTIwamV3ZWxsZXJ5fGVufDB8fHx8MTc1ODg1NDIyMnww&ixlib=rb-4.1.0&q=85',
    'https://images.unsplash.com/photo-1693213085235-ea6deadf8cee?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzd8MHwxfHNlYXJjaHw0fHxkaWFtb25kJTIwamV3ZWxsZXJ5fGVufDB8fHx8MTc1ODg1NDIyMnww&ixlib=rb-4.1.0&q=85',
    'https://images.unsplash.com/photo-1684439673104-f5d22791c71a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1NzZ8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwamV3ZWxsZXJ5fGVufDB8fHx8MTc1ODg1NDIyOHww&ixlib=rb-4.1.0&q=85'
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-playfair font-bold text-gray-900">
            Admin Dashboard
          </h1>
          
          {activeTab === 'products' && (
            <button
              onClick={() => setShowAddProduct(true)}
              className="manira-btn-primary flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Product
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('products')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'products'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Products
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'orders'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Orders
            </button>
          </nav>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="loading-spinner"></div>
          </div>
        ) : activeTab === 'products' ? (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img 
                            className="h-12 w-12 rounded-lg object-cover" 
                            src={product.image_url} 
                            alt={product.name} 
                          />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {product.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{product.price.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          product.inventory_count > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {product.inventory_count} units
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-indigo-600 hover:text-indigo-900 mr-4">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Order #{order.id.slice(-8).toUpperCase()}
                    </h3>
                    <p className="text-gray-600">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">
                      ₹{order.total_amount.toLocaleString()}
                    </p>
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {order.status}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Items:</strong> {order.items.length} products
                  </div>
                  <div>
                    <strong>Payment:</strong> {order.payment_method}
                  </div>
                  <div className="md:col-span-2">
                    <strong>Address:</strong> {order.shipping_address}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Product Modal */}
        {showAddProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 max-h-screen overflow-y-auto">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Add New Product</h3>
              
              <form onSubmit={handleAddProduct} className="space-y-4">
                <input
                  type="text"
                  placeholder="Product Name"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                <textarea
                  placeholder="Description"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    placeholder="Price (₹)"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="necklaces">Necklaces</option>
                    <option value="rings">Rings</option>
                    <option value="earrings">Earrings</option>
                    <option value="bracelets">Bracelets</option>
                    <option value="pendants">Pendants</option>
                    <option value="bangles">Bangles</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Size (optional)"
                    value={newProduct.size}
                    onChange={(e) => setNewProduct({...newProduct, size: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  
                  <input
                    type="text"
                    placeholder="Weight (optional)"
                    value={newProduct.weight}
                    onChange={(e) => setNewProduct({...newProduct, weight: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <input
                  type="number"
                  placeholder="Stock Quantity"
                  value={newProduct.inventory_count}
                  onChange={(e) => setNewProduct({...newProduct, inventory_count: e.target.value})}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Choose Product Image
                  </label>
                  <div className="mb-3">
                    <input
                      type="url"
                      placeholder="Or paste image URL here..."
                      value={newProduct.image_url}
                      onChange={(e) => setNewProduct({...newProduct, image_url: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="border rounded-lg p-3">
                    <p className="text-sm text-gray-600 mb-2">Select from Manira Images:</p>
                    <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                      {availableImages.map((img, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setNewProduct({...newProduct, image_url: img})}
                          className={`border-2 rounded-lg p-1 hover:border-blue-300 transition-colors ${
                            newProduct.image_url === img ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                          }`}
                        >
                          <img 
                            src={img} 
                            alt={`Product ${index + 1}`} 
                            className="w-full h-16 object-cover rounded"
                          />
                          <div className="text-xs text-center mt-1 text-gray-600">
                            {index < 5 ? 'Manira' : 'Sample'} {index + 1}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {newProduct.image_url && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 mb-2">Preview:</p>
                      <img 
                        src={newProduct.image_url} 
                        alt="Product Preview" 
                        className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                      />
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 manira-btn-primary py-3"
                  >
                    Add Product
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddProduct(false)}
                    className="flex-1 manira-btn-secondary py-3"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;