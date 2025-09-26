import React, { useState, useEffect } from 'react';
import { Plus, Package, Users, ShoppingBag, Edit, Trash2, User, Download } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddPromotion, setShowAddPromotion] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newCategory, setNewCategory] = useState('');
  const [showPartialModal, setShowPartialModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newPromotion, setNewPromotion] = useState({
    name: '',
    discount_percentage: '',
    discount_amount: '',
    applicable_products: [],
    start_date: '',
    end_date: '',
    min_order_amount: '',
    code: ''
  });
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [settings, setSettings] = useState({
    store_name: 'Manira Jewellery',
    store_email: 'contact@manira.com',
    store_phone: '+91 9876543210',
    store_address: 'Manira Headquarters, Mumbai, Maharashtra, India',
    currency: 'INR',
    free_shipping_threshold: 2000,
    standard_shipping_cost: 100,
    razorpay_key_id: '',
    razorpay_secret_key: '',
    email_notifications: true,
    sms_notifications: true,
    inventory_alerts: false
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [partialNotes, setPartialNotes] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderDateFilter, setOrderDateFilter] = useState('all');
  
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    category: 'necklaces',
    material: 'American Diamond',
    size: '',
    weight: '',
    image_url: '',
    inventory_count: '',
    sku: ''
  });

  useEffect(() => {
    if (activeTab === 'products') {
      fetchProducts();
      fetchCategories();
    } else if (activeTab === 'orders') {
      fetchOrders();
    } else if (activeTab === 'categories') {
      fetchCategories();
    } else if (activeTab === 'customers') {
      fetchCustomers();
    } else if (activeTab === 'promotions') {
      fetchPromotions();
    }
  }, [activeTab]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/admin/categories`);
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    
    try {
      await axios.post(`${API}/admin/categories`, { name: newCategory.toLowerCase() });
      toast.success('Category added successfully!');
      setNewCategory('');
      setShowAddCategory(false);
      fetchCategories();
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('Failed to add category');
    }
  };

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

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/admin/customers`);
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/admin/promotions`);
      setPromotions(response.data);
    } catch (error) {
      console.error('Error fetching promotions:', error);
      toast.error('Failed to load promotions');
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
      
      if (editingProduct) {
        // Update existing product
        await axios.put(`${API}/admin/products/${editingProduct.id}`, productData);
        toast.success('Product updated successfully!');
        setEditingProduct(null);
      } else {
        // Add new product
        await axios.post(`${API}/admin/products`, productData);
        toast.success('Product added successfully!');
      }
      
      setShowAddProduct(false);
      setNewProduct({
        name: '', description: '', price: '', category: 'necklaces',
        material: 'American Diamond', size: '', weight: '', image_url: '', inventory_count: '', sku: ''
      });
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product');
    }
  };

  const startEditProduct = (product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      material: product.material,
      size: product.size || '',
      weight: product.weight || '',
      image_url: product.image_url,
      inventory_count: product.inventory_count.toString(),
      sku: product.sku || ''
    });
    setShowAddProduct(true);
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await axios.delete(`${API}/admin/products/${productId}`);
        toast.success('Product deleted successfully!');
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
        toast.error('Failed to delete product');
      }
    }
  };

  const getOrderStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'partially_accepted': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleOrderAction = async (orderId, action) => {
    const confirmMessage = action === 'accept' ? 'Accept this order?' : 
                          action === 'reject' ? 'Reject this order?' : 'Process this order?';
    
    if (window.confirm(confirmMessage)) {
      try {
        await axios.put(`${API}/admin/orders/${orderId}/review`, {
          action: action,
          admin_notes: action === 'reject' ? 'Order rejected by admin' : 'Order accepted'
        });
        toast.success(`Order ${action}ed successfully!`);
        fetchOrders();
      } catch (error) {
        console.error('Error processing order:', error);
        toast.error('Failed to process order');
      }
    }
  };

  const openPartialOrderModal = (order) => {
    setSelectedOrder(order);
    setShowPartialModal(true);
  };

  const handlePartialAccept = async (itemsStatus, notes) => {
    try {
      await axios.put(`${API}/admin/orders/${selectedOrder.id}/review`, {
        action: 'partial',
        items_status: itemsStatus,
        admin_notes: notes
      });
      toast.success('Order partially accepted!');
      setShowPartialModal(false);
      setSelectedOrder(null);
      fetchOrders();
    } catch (error) {
      console.error('Error processing partial order:', error);
      toast.error('Failed to process partial order');
    }
  };

  const handleAddPromotion = async (e) => {
    e.preventDefault();
    
    try {
      const promotionData = {
        ...newPromotion,
        discount_percentage: newPromotion.discount_percentage ? parseFloat(newPromotion.discount_percentage) : null,
        discount_amount: newPromotion.discount_amount ? parseFloat(newPromotion.discount_amount) : null,
        min_order_amount: newPromotion.min_order_amount ? parseFloat(newPromotion.min_order_amount) : null
      };
      
      if (editingPromotion) {
        // Update existing promotion
        await axios.put(`${API}/admin/promotions/${editingPromotion.id}`, promotionData);
        toast.success('Promotion updated successfully!');
        setEditingPromotion(null);
      } else {
        // Create new promotion
        await axios.post(`${API}/admin/promotions`, promotionData);
        toast.success('Promotion created successfully!');
      }
      
      setShowAddPromotion(false);
      setNewPromotion({
        name: '', discount_percentage: '', discount_amount: '', applicable_products: [],
        start_date: '', end_date: '', min_order_amount: '', code: ''
      });
      fetchPromotions();
    } catch (error) {
      console.error('Error saving promotion:', error);
      toast.error('Failed to save promotion');
    }
  };

  const deletePromotion = async (promotionId) => {
    if (window.confirm('Are you sure you want to delete this promotion?')) {
      try {
        await axios.delete(`${API}/admin/promotions/${promotionId}`);
        toast.success('Promotion deleted successfully!');
        fetchPromotions();
      } catch (error) {
        console.error('Error deleting promotion:', error);
        toast.error('Failed to delete promotion');
      }
    }
  };

  const editPromotion = (promotion) => {
    setEditingPromotion(promotion);
    setNewPromotion({
      name: promotion.name,
      discount_percentage: promotion.discount_percentage || '',
      discount_amount: promotion.discount_amount || '',
      applicable_products: promotion.applicable_products || [],
      start_date: new Date(promotion.start_date).toISOString().split('T')[0],
      end_date: new Date(promotion.end_date).toISOString().split('T')[0],
      min_order_amount: promotion.min_order_amount || '',
      code: promotion.code
    });
    setShowAddPromotion(true);
  };

  const handleSettingsChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveSettings = async () => {
    setSettingsLoading(true);
    try {
      await axios.put(`${API}/admin/settings`, settings);
      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSettingsLoading(false);
    }
  };

  // Excel Export Functions
  const exportCustomersToExcel = () => {
    try {
      const customersData = customers.map(customer => ({
        'Customer Name': customer.full_name,
        'Email': customer.email,
        'Phone': customer.phone,
        'Address': customer.address || 'Not provided',
        'Registration Date': new Date(customer.created_at).toLocaleDateString(),
        'Total Orders': customer.order_count || 0,
        'Account Type': customer.is_admin ? 'Admin' : 'Customer'
      }));

      const worksheet = XLSX.utils.json_to_sheet(customersData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');
      
      // Auto-size columns
      const colWidths = [
        { wch: 20 }, // Customer Name
        { wch: 25 }, // Email
        { wch: 15 }, // Phone
        { wch: 30 }, // Address
        { wch: 15 }, // Registration Date
        { wch: 12 }, // Total Orders
        { wch: 12 }  // Account Type
      ];
      worksheet['!cols'] = colWidths;

      XLSX.writeFile(workbook, `Manira_Customers_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Customer data exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export customer data');
    }
  };

  const exportOrdersToExcel = () => {
    try {
      const ordersData = orders.map(order => ({
        'Order ID': `#${order.id.slice(-8).toUpperCase()}`,
        'Order Date': new Date(order.created_at).toLocaleDateString(),
        'Total Items': order.items.length,
        'Order Amount': `₹${order.total_amount.toLocaleString()}`,
        'Original Amount': order.original_amount ? `₹${order.original_amount.toLocaleString()}` : '-',
        'Status': order.status.replace('_', ' ').toUpperCase(),
        'Payment Status': order.payment_status.toUpperCase(),
        'Payment Method': order.payment_method,
        'Customer Phone': order.phone,
        'Shipping Address': order.shipping_address,
        'Admin Notes': order.admin_notes || 'None'
      }));

      const worksheet = XLSX.utils.json_to_sheet(ordersData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');
      
      // Auto-size columns
      const colWidths = [
        { wch: 12 }, // Order ID
        { wch: 12 }, // Order Date
        { wch: 10 }, // Total Items
        { wch: 15 }, // Order Amount
        { wch: 15 }, // Original Amount
        { wch: 18 }, // Status
        { wch: 15 }, // Payment Status
        { wch: 15 }, // Payment Method
        { wch: 15 }, // Customer Phone
        { wch: 35 }, // Shipping Address
        { wch: 25 }  // Admin Notes
      ];
      worksheet['!cols'] = colWidths;

      XLSX.writeFile(workbook, `Manira_Orders_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Orders data exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export orders data');
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
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{products.length}</p>
                <p className="text-gray-600">Products</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <ShoppingBag className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
                <p className="text-gray-600">Orders</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-full">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
                <p className="text-gray-600">Customers</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Package className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{promotions.length}</p>
                <p className="text-gray-600">Promotions</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div></div>
          
          {activeTab === 'products' && (
            <button
              onClick={() => setShowAddProduct(true)}
              className="manira-btn-primary flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Product
            </button>
          )}
          
          {activeTab === 'categories' && (
            <button
              onClick={() => setShowAddCategory(true)}
              className="manira-btn-primary flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Category
            </button>
          )}

          {activeTab === 'promotions' && (
            <button
              onClick={() => setShowAddPromotion(true)}
              className="manira-btn-primary flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Promotion
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
              onClick={() => setActiveTab('categories')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'categories'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Categories
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
            <button
              onClick={() => setActiveTab('customers')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'customers'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Customers
            </button>
            <button
              onClick={() => setActiveTab('promotions')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'promotions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Promotions
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'settings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Settings
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
                        <button 
                          onClick={() => startEditProduct(product)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                          title="Edit Product"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Product"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'categories' ? (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Product Categories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900 capitalize">
                      {category}
                    </h3>
                    <button
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete the "${category}" category?`)) {
                          // Add delete category functionality here
                          console.log('Delete category:', category);
                        }
                      }}
                      className="text-red-600 hover:text-red-900"
                      title="Delete Category"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {products.filter(p => p.category === category).length} products
                  </p>
                </div>
              ))}
            </div>
            
            {categories.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No categories found. Add your first category!</p>
              </div>
            )}
          </div>
        ) : activeTab === 'customers' ? (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Registered Customers</h2>
              <button
                onClick={exportCustomersToExcel}
                className="manira-btn-secondary flex items-center text-sm px-4 py-2"
              >
                <Download className="h-4 w-4 mr-2" />
                Export to Excel
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registration Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Orders
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customers.map((customer) => (
                    <tr key={customer.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {customer.full_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {customer.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{customer.phone}</div>
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {customer.address || 'No address provided'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(customer.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {customer.order_count || 0} orders
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          customer.is_admin ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {customer.is_admin ? 'Admin' : 'Customer'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'promotions' ? (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Active Promotions</h2>
            
            {promotions.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No promotions found. Create your first promotion!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {promotions.map((promotion) => (
                  <div key={promotion.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">{promotion.name}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        promotion.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {promotion.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex justify-between">
                        <span>Discount:</span>
                        <span className="font-medium text-blue-600">
                          {promotion.discount_percentage ? `${promotion.discount_percentage}%` : `₹${promotion.discount_amount}`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Code:</span>
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded">{promotion.code}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Valid Until:</span>
                        <span>{new Date(promotion.end_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => editPromotion(promotion)}
                        className="flex-1 text-blue-600 border border-blue-600 py-2 px-3 rounded-lg hover:bg-blue-50 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deletePromotion(promotion.id)}
                        className="flex-1 text-red-600 border border-red-600 py-2 px-3 rounded-lg hover:bg-red-50 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'settings' ? (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Store Settings</h2>
            
            <div className="space-y-8">
              {/* Store Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Store Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Store Name</label>
                    <input
                      type="text"
                      value={settings.store_name}
                      onChange={(e) => handleSettingsChange('store_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Store Email</label>
                    <input
                      type="email"
                      value={settings.store_email}
                      onChange={(e) => handleSettingsChange('store_email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Store Phone</label>
                    <input
                      type="tel"
                      defaultValue="+91 9876543210"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="INR">Indian Rupee (₹)</option>
                      <option value="USD">US Dollar ($)</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Store Address</label>
                  <textarea
                    rows={3}
                    defaultValue="Manira Headquarters, Mumbai, Maharashtra, India"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Shipping Settings */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Shipping Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Free Shipping Threshold</label>
                    <input
                      type="number"
                      defaultValue="2000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Standard Shipping Cost</label>
                    <input
                      type="number"
                      defaultValue="100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Settings */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Razorpay Key ID</label>
                    <input
                      type="text"
                      placeholder="Enter your Razorpay Key ID"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Razorpay Secret Key</label>
                    <input
                      type="password"
                      placeholder="Enter your Razorpay Secret Key"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Settings</h3>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 mr-3" />
                    <span className="text-sm text-gray-700">Email notifications for new orders</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 mr-3" />
                    <span className="text-sm text-gray-700">SMS notifications for order updates</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 mr-3" />
                    <span className="text-sm text-gray-700">Low inventory alerts</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={saveSettings}
                disabled={settingsLoading}
                className="manira-btn-primary px-6 py-3 disabled:opacity-50"
              >
                {settingsLoading ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        ) : activeTab === 'orders' ? (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Order Management</h2>
              <button
                onClick={exportOrdersToExcel}
                className="manira-btn-secondary flex items-center text-sm px-4 py-2"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Orders to Excel
              </button>
            </div>
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
                      {order.original_amount && (
                        <span className="text-sm text-gray-500 line-through ml-2">
                          ₹{order.original_amount.toLocaleString()}
                        </span>
                      )}
                    </p>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getOrderStatusColor(order.status)}`}>
                      {order.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <strong>Items:</strong> {order.items.length} products
                  </div>
                  <div>
                    <strong>Payment:</strong> {order.payment_method} ({order.payment_status})
                  </div>
                  <div className="md:col-span-2">
                    <strong>Address:</strong> {order.shipping_address}
                  </div>
                  <div className="md:col-span-2">
                    <strong>Phone:</strong> {order.phone}
                  </div>
                </div>

                {/* Order Items Details */}
                <div className="border-t border-gray-200 pt-4 mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Order Items:</h4>
                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span>Product ID: {item.product_id.slice(-8).toUpperCase()}</span>
                        <span>Qty: {item.quantity} × ₹{item.price.toLocaleString()}</span>
                        {item.status && (
                          <span className={`px-2 py-1 rounded text-xs ${
                            item.status === 'accepted' ? 'bg-green-100 text-green-800' :
                            item.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {item.status}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Admin Notes */}
                {order.admin_notes && (
                  <div className="border-t border-gray-200 pt-4 mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Admin Notes:</h4>
                    <p className="text-sm text-gray-600">{order.admin_notes}</p>
                  </div>
                )}

                {/* Action Buttons */}
                {order.status === 'pending' && (
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleOrderAction(order.id, 'accept')}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
                      >
                        Accept Order
                      </button>
                      <button
                        onClick={() => openPartialOrderModal(order)}
                        className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 text-sm"
                      >
                        Partial Accept
                      </button>
                      <button
                        onClick={() => handleOrderAction(order.id, 'reject')}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
                      >
                        Reject Order
                      </button>
                    </div>
                  </div>
                )}

                {order.status === 'accepted' && order.payment_status === 'pending' && (
                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-sm text-green-600 font-medium">
                      ✅ Order accepted - Waiting for customer payment
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : null}

        {/* Add Category Modal */}
        {showAddCategory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Add New Category</h3>
              
              <form onSubmit={handleAddCategory} className="space-y-4">
                <input
                  type="text"
                  placeholder="Category Name"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                <div className="flex space-x-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 manira-btn-primary py-3"
                  >
                    Add Category
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddCategory(false)}
                    className="flex-1 manira-btn-secondary py-3"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Promotion Modal */}
        {showAddPromotion && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 max-h-screen overflow-y-auto">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                {editingPromotion ? 'Edit Promotion' : 'Create New Promotion'}
              </h3>
              
              <form onSubmit={handleAddPromotion} className="space-y-4">
                <input
                  type="text"
                  placeholder="Promotion Name"
                  value={newPromotion.name}
                  onChange={(e) => setNewPromotion({...newPromotion, name: e.target.value})}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                <input
                  type="text"
                  placeholder="Promotion Code (e.g., SAVE10)"
                  value={newPromotion.code}
                  onChange={(e) => setNewPromotion({...newPromotion, code: e.target.value.toUpperCase()})}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    placeholder="Discount % (Optional)"
                    value={newPromotion.discount_percentage}
                    onChange={(e) => setNewPromotion({...newPromotion, discount_percentage: e.target.value, discount_amount: ''})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  
                  <input
                    type="number"
                    placeholder="Discount ₹ (Optional)"
                    value={newPromotion.discount_amount}
                    onChange={(e) => setNewPromotion({...newPromotion, discount_amount: e.target.value, discount_percentage: ''})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <input
                  type="number"
                  placeholder="Minimum Order Amount (Optional)"
                  value={newPromotion.min_order_amount}
                  onChange={(e) => setNewPromotion({...newPromotion, min_order_amount: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={newPromotion.start_date}
                      onChange={(e) => setNewPromotion({...newPromotion, start_date: e.target.value})}
                      required
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    <input
                      type="date"
                      value={newPromotion.end_date}
                      onChange={(e) => setNewPromotion({...newPromotion, end_date: e.target.value})}
                      required
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="flex space-x-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 manira-btn-primary py-3"
                  >
                    {editingPromotion ? 'Update Promotion' : 'Create Promotion'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddPromotion(false)}
                    className="flex-1 manira-btn-secondary py-3"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Partial Order Modal */}
        {showPartialModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Partial Order Acceptance - #{selectedOrder.id.slice(-8).toUpperCase()}
              </h3>
              
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Order Details</h4>
                  <p className="text-sm text-gray-600">Original Amount: ₹{selectedOrder.total_amount.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Items: {selectedOrder.items.length} products</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Select Items to Accept/Reject:</h4>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-medium">Product #{item.product_id.slice(-8).toUpperCase()}</p>
                            <p className="text-sm text-gray-600">Price: ₹{item.price.toLocaleString()} × {item.quantity}</p>
                            <p className="text-sm text-gray-600">Subtotal: ₹{(item.price * item.quantity).toLocaleString()}</p>
                          </div>
                          
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                const newItems = [...selectedOrder.items];
                                newItems[index].status = 'accepted';
                                setSelectedOrder({...selectedOrder, items: newItems});
                              }}
                              className={`px-3 py-1 rounded text-sm ${
                                item.status === 'accepted' 
                                  ? 'bg-green-600 text-white' 
                                  : 'bg-gray-200 text-gray-700 hover:bg-green-100'
                              }`}
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => {
                                const newItems = [...selectedOrder.items];
                                newItems[index].status = 'rejected';
                                setSelectedOrder({...selectedOrder, items: newItems});
                              }}
                              className={`px-3 py-1 rounded text-sm ${
                                item.status === 'rejected' 
                                  ? 'bg-red-600 text-white' 
                                  : 'bg-gray-200 text-gray-700 hover:bg-red-100'
                              }`}
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                        
                        {item.status === 'accepted' && (
                          <div className="mt-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Accepted Quantity (max: {item.quantity})
                            </label>
                            <input
                              type="number"
                              min="1"
                              max={item.quantity}
                              defaultValue={item.quantity}
                              onChange={(e) => {
                                const newItems = [...selectedOrder.items];
                                newItems[index].accepted_quantity = parseInt(e.target.value);
                                setSelectedOrder({...selectedOrder, items: newItems});
                              }}
                              className="w-32 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Admin Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Add notes for the customer about this partial acceptance..."
                    onChange={(e) => setPartialNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">New Order Summary</h4>
                  <p className="text-sm text-gray-600">
                    Accepted Items: {selectedOrder.items.filter(item => item.status === 'accepted').length}
                  </p>
                  <p className="text-sm text-gray-600">
                    New Total: ₹{selectedOrder.items.reduce((total, item) => {
                      if (item.status === 'accepted') {
                        const qty = item.accepted_quantity || item.quantity;
                        return total + (item.price * qty);
                      }
                      return total;
                    }, 0).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex space-x-4 mt-8">
                <button
                  onClick={() => {
                    const itemsStatus = selectedOrder.items.map(item => ({
                      product_id: item.product_id,
                      status: item.status || 'accepted',
                      quantity: item.accepted_quantity || item.quantity
                    }));
                    handlePartialAccept(itemsStatus, partialNotes || 'Partial order acceptance');
                  }}
                  className="flex-1 manira-btn-primary py-3"
                >
                  Confirm Partial Acceptance
                </button>
                <button
                  onClick={() => {
                    setShowPartialModal(false);
                    setSelectedOrder(null);
                  }}
                  className="flex-1 manira-btn-secondary py-3"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Product Modal */}
        {showAddProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 max-h-screen overflow-y-auto">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h3>
              
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Product Name"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  
                  <input
                    type="text"
                    placeholder="SKU (e.g., MNR-001)"
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
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
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
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
                  
                  {/* File Upload Option */}
                  <div className="mb-3 p-4 border-2 border-dashed border-gray-300 rounded-lg">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          // Create object URL for preview
                          const imageUrl = URL.createObjectURL(file);
                          setNewProduct({...newProduct, image_url: imageUrl, image_file: file});
                        }
                      }}
                      className="w-full p-2 text-sm text-gray-600"
                    />
                    <p className="text-xs text-gray-500 mt-1">Upload your own product image (JPG, PNG, WEBP)</p>
                  </div>
                  
                  {/* URL Input Option */}
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
                    {editingProduct ? 'Update Product' : 'Add Product'}
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

        {/* Add Category Modal */}
        {showAddCategory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Add New Category</h3>
              
              <form onSubmit={handleAddCategory} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter category name (e.g., Anklets, Chains)"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Category names will be automatically converted to lowercase
                  </p>
                </div>
                
                <div className="flex space-x-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 manira-btn-primary py-3"
                  >
                    Add Category
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddCategory(false);
                      setNewCategory('');
                    }}
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