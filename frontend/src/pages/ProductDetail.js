import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Star, Plus, Minus, ShoppingBag, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await axios.get(`${API}/products/${id}`);
      setProduct(response.data);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Product not found');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    addToCart(product.id, quantity);
    setQuantity(1);
  };

  const incrementQuantity = () => {
    if (quantity < product.inventory_count) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Product not found</h2>
          <p className="text-gray-600 mt-2">The product you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Product Image */}
            <div className="p-8">
              <div className="aspect-square rounded-xl overflow-hidden">
                <img 
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Product Details */}
            <div className="p-8 flex flex-col justify-center">
              <div>
                <span className="inline-block bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full mb-4">
                  {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
                </span>
                
                <h1 data-testid="product-title" className="text-3xl lg:text-4xl font-playfair font-bold text-gray-900 mb-4">
                  {product.name}
                </h1>
                
                <div className="flex items-center mb-4">
                  <div className="flex items-center text-yellow-400 mr-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-current" />
                    ))}
                  </div>
                  <span className="text-gray-600">(4.9 out of 5)</span>
                </div>
                
                <p data-testid="product-price" className="text-4xl font-bold text-blue-600 mb-6">
                  ₹{product.price.toLocaleString()}
                </p>
                
                <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Material:</span>
                      <span className="ml-2 text-gray-600">{product.material}</span>
                    </div>
                    {product.size && (
                      <div>
                        <span className="font-medium text-gray-700">Size:</span>
                        <span className="ml-2 text-gray-600">{product.size}</span>
                      </div>
                    )}
                    {product.weight && (
                      <div>
                        <span className="font-medium text-gray-700">Weight:</span>
                        <span className="ml-2 text-gray-600">{product.weight}</span>
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-gray-700">Stock:</span>
                      <span className={`ml-2 ${product.inventory_count > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {product.inventory_count > 0 ? `${product.inventory_count} available` : 'Out of stock'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-600 leading-relaxed mb-8">
                  {product.description}
                </p>
                
                {product.inventory_count > 0 && (
                  <div className="flex items-center space-x-4 mb-6">
                    <span className="font-medium text-gray-700">Quantity:</span>
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <button
                        data-testid="decrease-quantity-btn"
                        onClick={decrementQuantity}
                        disabled={quantity === 1}
                        className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span data-testid="quantity-display" className="px-4 py-2 font-medium">
                        {quantity}
                      </span>
                      <button
                        data-testid="increase-quantity-btn"
                        onClick={incrementQuantity}
                        disabled={quantity >= product.inventory_count}
                        className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    data-testid="add-to-cart-btn"
                    onClick={handleAddToCart}
                    disabled={product.inventory_count === 0}
                    className="manira-btn-primary text-lg px-8 py-4 flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShoppingBag className="mr-2 h-5 w-5" />
                    {product.inventory_count === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                  
                  <button className="manira-btn-secondary text-lg px-8 py-4 sm:w-auto w-full">
                    <Heart className="mr-2 h-5 w-5" />
                    Wishlist
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Additional Information */}
        <div className="bg-white rounded-2xl shadow-lg mt-8 p-8">
          <h2 className="text-2xl font-playfair font-bold text-gray-900 mb-6">
            Product Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Premium Quality</h3>
              <p className="text-gray-600">
                Made with finest American Diamonds for lasting sparkle
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Fast Delivery</h3>
              <p className="text-gray-600">
                Free shipping on orders above ₹2,000
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Satisfaction Guarantee</h3>
              <p className="text-gray-600">
                30-day return policy for your peace of mind
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;