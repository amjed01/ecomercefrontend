"use client";
export const dynamic = "force-dynamic";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { FiTruck, FiCreditCard, FiCheckCircle, FiPackage, FiArrowLeft, FiUser } from 'react-icons/fi';

interface Product {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  images?: Array<{
    url: string;
    isPrimary: boolean;
    order: number;
  }>;
}

interface ShippingInfo {
  name: string; // Added name field
  address: string;
  city: string;
  country: string;
  phone: string;
}

interface ProductWithImage extends Product {
  imageUrl: string;
}

export default function CheckoutScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [products, setProducts] = useState<ProductWithImage[]>([]);
  const [total, setTotal] = useState(0);
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    name: '', // Added name field
    address: '',
    city: '',
    country: 'Algeria',
    phone: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<ShippingInfo>>({});
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = "https://ecomercebackend-654m.onrender.com/api";
  // Use base64 placeholder to avoid 404 errors
  const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,' + btoa(`
    <svg width="150" height="150" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text x="50%" y="50%" font-family="Arial" font-size="14" text-anchor="middle" dy=".3em" fill="#9ca3af">No Image</text>
    </svg>
  `);

  // Function to format image URL properly
  const formatImageUrl = (product: Product): string => {
    // First try to get from images array (for multiple images)
    if (product.images && product.images.length > 0) {
      // Find primary image or use first image
      const primaryImage = product.images.find(img => img.isPrimary) || product.images[0];
      if (primaryImage?.url) {
        const url = primaryImage.url;
        // Ensure URL is properly formatted
        if (url.startsWith('http')) {
          return url;
        }
        if (url.startsWith('/uploads')) {
          return `https://ecomercebackend-654m.onrender.com${url}`;
        }
        return `https://ecomercebackend-654m.onrender.com/uploads/${url}`;
      }
    }
    
    // Fallback to imageUrl field (backward compatibility)
    if (product.imageUrl) {
      const url = product.imageUrl;
      if (url.startsWith('http')) {
        return url;
      }
      if (url.startsWith('/uploads')) {
        return `https://ecomercebackend-654m.onrender.com${url}`;
      }
      return `https://ecomercebackend-654m.onrender.com/uploads/${url}`;
    }
    
    // If no image found, return placeholder
    return PLACEHOLDER_IMAGE;
  };

  // Function to fetch product details to get image URLs
  const fetchProductDetails = async (productId: string): Promise<ProductWithImage | null> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/products/${productId}`);
      
      if (response.data.success && response.data.product) {
        const product = response.data.product;
        const imageUrl = formatImageUrl(product);
        
        return {
          productId: product._id,
          title: product.title,
          price: product.price,
          quantity: 1, // Default quantity, adjust based on your cart logic
          imageUrl: imageUrl,
          images: product.images
        };
      }
    } catch (error) {
      console.error('Error fetching product details:', productId, error);
    }
    return null;
  };

  useEffect(() => {
    loadCheckoutData();
  }, [searchParams]);

  const loadCheckoutData = async () => {
    try {
      setLoading(true);
      
      // Get data from URL parameters (from Buy Now button)
      const itemsParam = searchParams.get('items');
      const totalParam = searchParams.get('total');

      let productsData: ProductWithImage[] = [];
      let totalAmount = 0;

      if (itemsParam && totalParam) {
        try {
          const parsedItems = JSON.parse(itemsParam);
          const parsedTotal = parseFloat(totalParam);
          
          // Process each item to get full product details with images
          const itemsToProcess = Array.isArray(parsedItems) ? parsedItems : [parsedItems];
          
          const productsWithDetails = await Promise.all(
            itemsToProcess.map(async (item: any) => {
              // Try to get full product details if we have productId
              if (item.productId) {
                const productDetails = await fetchProductDetails(item.productId);
                if (productDetails) {
                  return {
                    ...productDetails,
                    quantity: item.quantity || 1,
                    price: productDetails.price
                  };
                }
              }
              
              // Fallback: Use the item data we have
              return {
                productId: item.productId || item._id || '',
                title: item.title || 'Product',
                price: item.price || 0,
                quantity: item.quantity || 1,
                imageUrl: item.imageUrl ? formatImageUrl(item) : PLACEHOLDER_IMAGE
              };
            })
          );
          
          productsData = productsWithDetails.filter(p => p.productId);
          totalAmount = parsedTotal;
        } catch (error) {
          console.error('Error parsing URL parameters:', error);
        }
      } else {
        // Fallback: Check localStorage for cart data
        const cartData = localStorage.getItem('cart');
        const storedTotal = localStorage.getItem('cartTotal');

        if (cartData) {
          try {
            const cartItems = JSON.parse(cartData);
            const productsWithDetails = await Promise.all(
              cartItems.map(async (item: any) => {
                if (item.productId) {
                  const productDetails = await fetchProductDetails(item.productId);
                  if (productDetails) {
                    return {
                      ...productDetails,
                      quantity: item.quantity || 1,
                      price: productDetails.price
                    };
                  }
                }
                
                return {
                  productId: item.productId || item._id || '',
                  title: item.title || 'Product',
                  price: item.price || 0,
                  quantity: item.quantity || 1,
                  imageUrl: item.imageUrl ? formatImageUrl(item) : PLACEHOLDER_IMAGE
                };
              })
            );
            
            productsData = productsWithDetails.filter(p => p.productId);
          } catch (error) {
            console.error('Error parsing cart data:', error);
          }
        }

        if (storedTotal) {
          totalAmount = parseFloat(storedTotal);
        } else {
          // Calculate total from products
          totalAmount = productsData.reduce((sum, product) => 
            sum + (product.price * product.quantity), 0
          );
        }
      }

      if (productsData.length > 0) {
        setProducts(productsData);
        setTotal(totalAmount);
      }

    } catch (error) {
      console.error('Error loading checkout data:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateShippingInfo = (): boolean => {
    const newErrors: Partial<ShippingInfo> = {};
    
    if (!shippingInfo.name.trim()) newErrors.name = 'Full name is required';
    if (!shippingInfo.address.trim()) newErrors.address = 'Address is required';
    if (!shippingInfo.city.trim()) newErrors.city = 'City is required';
    if (!shippingInfo.country.trim()) newErrors.country = 'Country is required';
    if (!shippingInfo.phone.trim()) newErrors.phone = 'Phone number is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateProducts = (): boolean => {
    return products.length > 0 && products.every(item => item.productId && item.quantity > 0);
  };

  const handleInputChange = (field: keyof ShippingInfo, value: string) => {
    setShippingInfo(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handlePlaceOrder = async () => {
    if (!validateShippingInfo() || !validateProducts()) {
      alert("Please fill all shipping information and ensure your order is valid");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('authToken');
      const userId = localStorage.getItem('userId');
      
      if (!token || !userId) {
        alert("Please login to place an order");
        router.push('/login');
        return;
      }

      const orderData = {
        userId,
        products: products.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        })),
        shippingInfo,
        paymentMethod,
        totalPrice: total
      };

      // Place the order
      const orderResponse = await axios.post(`${API_BASE_URL}/orders`, orderData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      if (orderResponse.status === 201) {
        try {
          // Reduce quantities for all products
          await Promise.all(products.map(async (item) => {
            await axios.put(
              `${API_BASE_URL}/products/${item.productId}/reduce-quantity`,
              { quantity: item.quantity },
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }
            );
          }));

          // Clear cart data if this was a cart checkout
          localStorage.removeItem('cart');
          localStorage.removeItem('cartTotal');

          alert("Order placed successfully!");
          router.push('/orders');
        } catch (updateError) {
          console.error("Quantity reduction failed:", updateError);
          alert("Your order was placed but we encountered an issue updating product quantities. Please contact support.");
          router.push('/orders');
        }
      }
    } catch (error: any) {
      console.error("Order error:", error);
      
      let errorMessage = "Failed to place order";
      if (error.response) {
        if (error.response.status === 400 && error.response.data.message === 'Insufficient stock') {
          errorMessage = "Insufficient stock for one or more products";
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.message?.includes("timeout")) {
        errorMessage = "Request timed out. Please try again.";
      } else if (error.message?.includes("network")) {
        errorMessage = "Network error. Please check your connection.";
      }

      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle image error
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, productId: string) => {
    console.log("Image failed to load for product:", productId);
    const target = e.target as HTMLImageElement;
    target.src = PLACEHOLDER_IMAGE;
    target.onerror = null; // Prevent infinite loop
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-gray-800"></div>
        <p className="ml-4">Loading checkout...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl shadow-black/5 border border-gray-100 p-8 text-center">
          <div className="relative inline-block mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl flex items-center justify-center shadow-lg shadow-gray-300 mx-auto">
              <FiPackage className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -inset-1 bg-gradient-to-r from-gray-800 to-gray-600 rounded-2xl opacity-20 blur-sm"></div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Products to Checkout</h2>
          <p className="text-gray-600 mb-6">Please select products to purchase first</p>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/products')}
              className="w-full bg-gradient-to-br from-gray-800 to-gray-700 text-white py-3 px-4 rounded-xl hover:from-gray-700 hover:to-gray-600 transition-all duration-300 font-semibold shadow-lg shadow-gray-300 hover:shadow-xl hover:shadow-gray-400"
            >
              Browse Products
            </button>
            <button
              onClick={() => router.push('/cart')}
              className="w-full border-2 border-gray-300 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 font-semibold"
            >
              View Cart
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-all duration-300 hover:scale-105 p-3 rounded-2xl hover:bg-white/80 backdrop-blur-sm"
          >
            <FiArrowLeft className="mr-2" />
            Back
          </button>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Checkout
            </h1>
            <p className="text-gray-600 mt-2">Complete your purchase</p>
          </div>
          <div className="w-20"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Order Summary & Shipping */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl shadow-black/5 border border-gray-100 p-6 transition-all duration-300 hover:shadow-3xl hover:shadow-black/10">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl flex items-center justify-center shadow-lg shadow-gray-300 mr-4">
                  <FiPackage className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Order Summary {products.length > 1 && `(${products.length} items)`}
                </h2>
              </div>
              
              <div className="space-y-4">
                {products.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4 py-4 border-b border-gray-100 last:border-0 group hover:bg-gray-50/50 rounded-xl px-2 transition-all duration-300">
                    <div className="relative">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-16 h-16 rounded-xl object-cover border-2 border-gray-200 group-hover:border-gray-300 shadow-lg shadow-gray-200/50 transition-all duration-300"
                        onError={(e) => handleImageError(e, item.productId)}
                        crossOrigin="anonymous"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 group-hover:text-gray-800 transition-colors duration-300">
                        {item.title}
                      </h3>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                        <span>Qty: {item.quantity}</span>
                        <span>•</span>
                        <span>${item.price.toFixed(2)} each</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 text-lg">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span className="text-gray-900">Total Amount:</span>
                  <span className="bg-gradient-to-r from-gray-800 to-gray-700 bg-clip-text text-transparent text-xl">
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Shipping Information */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl shadow-black/5 border border-gray-100 p-6 transition-all duration-300 hover:shadow-3xl hover:shadow-black/10">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl flex items-center justify-center shadow-lg shadow-gray-300 mr-4">
                  <FiTruck className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Shipping Information</h2>
              </div>
              
              <div className="space-y-4">
                {/* Name Field - ADDED */}
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <div className="relative">
                    <input
                      id="name"
                      type="text"
                      value={shippingInfo.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`w-full px-4 py-3 pl-12 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all duration-300 ${
                        errors.name ? 'border-red-500 shadow-lg shadow-red-200/50' : 'border-gray-200 shadow-lg shadow-gray-200/50'
                      }`}
                      placeholder="Enter your full name"
                    />
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                      <FiUser className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-2 font-medium">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-2">
                    Street Address *
                  </label>
                  <input
                    id="address"
                    type="text"
                    value={shippingInfo.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all duration-300 ${
                      errors.address ? 'border-red-500 shadow-lg shadow-red-200/50' : 'border-gray-200 shadow-lg shadow-gray-200/50'
                    }`}
                    placeholder="Enter your full street address"
                  />
                  {errors.address && (
                    <p className="text-red-500 text-sm mt-2 font-medium">{errors.address}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-semibold text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      id="city"
                      type="text"
                      value={shippingInfo.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all duration-300 ${
                        errors.city ? 'border-red-500 shadow-lg shadow-red-200/50' : 'border-gray-200 shadow-lg shadow-gray-200/50'
                      }`}
                      placeholder="City"
                    />
                    {errors.city && (
                      <p className="text-red-500 text-sm mt-2 font-medium">{errors.city}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="country" className="block text-sm font-semibold text-gray-700 mb-2">
                      Country *
                    </label>
                    <input
                      id="country"
                      type="text"
                      value={shippingInfo.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all duration-300 ${
                        errors.country ? 'border-red-500 shadow-lg shadow-red-200/50' : 'border-gray-200 shadow-lg shadow-gray-200/50'
                      }`}
                      placeholder="Country"
                    />
                    {errors.country && (
                      <p className="text-red-500 text-sm mt-2 font-medium">{errors.country}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={shippingInfo.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all duration-300 ${
                      errors.phone ? 'border-red-500 shadow-lg shadow-red-200/50' : 'border-gray-200 shadow-lg shadow-gray-200/50'
                    }`}
                    placeholder="Phone Number"
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-2 font-medium">{errors.phone}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Payment & Order Button */}
          <div className="space-y-6">
            {/* Payment Method */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl shadow-black/5 border border-gray-100 p-6 transition-all duration-300 hover:shadow-3xl hover:shadow-black/10">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl flex items-center justify-center shadow-lg shadow-gray-300 mr-4">
                  <FiCreditCard className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Payment Method</h2>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => setPaymentMethod('Cash on Delivery')}
                  className={`w-full text-left p-4 border-2 rounded-xl transition-all duration-300 group ${
                    paymentMethod === 'Cash on Delivery'
                      ? 'border-gray-800 bg-gray-800/5 shadow-lg shadow-gray-300/50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50 shadow-lg shadow-gray-200/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center transition-all duration-300 ${
                        paymentMethod === 'Cash on Delivery' ? 'border-gray-800 bg-gray-800' : 'border-gray-400 group-hover:border-gray-600'
                      }`}>
                        {paymentMethod === 'Cash on Delivery' && (
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        )}
                      </div>
                      <span className="font-semibold text-gray-900">Cash on Delivery</span>
                    </div>
                    {paymentMethod === 'Cash on Delivery' && (
                      <FiCheckCircle className="w-5 h-5 text-gray-800" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-2 ml-8">Pay when you receive your order</p>
                </button>
              </div>
            </div>

            {/* Order Summary Card */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl shadow-black/5 border border-gray-100 p-6 sticky top-6 transition-all duration-300">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Order Details</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Items ({products.reduce((sum, item) => sum + item.quantity, 0)})</span>
                  <span className="text-gray-900 font-semibold">${total.toFixed(2)}</span>
                </div>
            
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-gray-900">Total</span>
                    <span className="bg-gradient-to-r from-gray-800 to-gray-700 bg-clip-text text-transparent">
                      ${total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Place Order Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={isSubmitting || !validateProducts()}
                className={`w-full py-4 px-6 rounded-xl font-bold text-white mt-6 transition-all duration-300 shadow-2xl shadow-gray-300 hover:shadow-3xl hover:shadow-gray-400 ${
                  isSubmitting || !validateProducts()
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-br from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 hover:scale-[1.02]'
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                    Processing Order...
                  </div>
                ) : (
                  `Place Order - $${total.toFixed(2)}`
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}