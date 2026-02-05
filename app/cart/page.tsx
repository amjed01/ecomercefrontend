"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { FiShoppingBag, FiTrash2, FiArrowLeft, FiShoppingCart, FiPlus, FiMinus, FiLoader, FiLock, FiAlertTriangle, FiMapPin } from 'react-icons/fi';

// --- INTERFACE DEFINITIONS ---
interface ProductDetails {
  _id: string;
  title: string;
  price: number;
  description: string;
  product_location?: string;
  imageUrl?: string;
  images?: Array<{
    url: string;
    isPrimary: boolean;
    order: number;
  }>;
  livraison?: string;
}

interface CartItem {
  _id: string;
  quantity: number;
  cartItem: ProductDetails;
}

const API_BASE_URL = "https://ecomercebackend-654m.onrender.com/api";
// Use base64 placeholder to avoid 404 errors (same as other components)
const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,' + btoa(`
  <svg width="150" height="150" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#f3f4f6"/>
    <text x="50%" y="50%" font-family="Arial" font-size="14" text-anchor="middle" dy=".3em" fill="#9ca3af">No Image</text>
  </svg>
`);

export default function Cart() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

const formatImageUrl = (product: ProductDetails): string => {
  if (!product) return PLACEHOLDER_IMAGE;
  
  // Priority 1: Check images array (Cloudinary format)
  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    const primaryImage = product.images.find(img => img.isPrimary) || product.images[0];
    if (primaryImage?.url) {
      const url = primaryImage.url.trim();
      // Cloudinary URLs are already complete
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }
    }
  }
  
  // Priority 2: Check single imageUrl field
  if (product.imageUrl) {
    const url = product.imageUrl.trim();
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
  }
  
  // No valid image found
  return PLACEHOLDER_IMAGE;
};

const getImageUrl = (cartItem: CartItem): string => {
  if (!cartItem || !cartItem.cartItem) return PLACEHOLDER_IMAGE;
  
  // Debug: Log what we're getting
  console.log('Cart item image data:', {
    title: cartItem.cartItem.title,
    hasImages: !!cartItem.cartItem.images?.length,
    imageUrl: cartItem.cartItem.imageUrl
  });
  
  return formatImageUrl(cartItem.cartItem);
};

  // Handle image error (same as other components)
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, productId: string) => {
    console.log("Image failed to load for product:", productId);
    const target = e.target as HTMLImageElement;
    target.src = PLACEHOLDER_IMAGE;
    target.onerror = null; // Prevent infinite loop
  };

  // --- API LOGIC ---
  useEffect(() => {
    fetchCartItems();
  }, []);

  const fetchCartItems = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const userId = localStorage.getItem('userId');
      
      if (!token || !userId) {
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/cart/find/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data && response.data[0] && response.data[0].products) {
        const formattedItems: CartItem[] = response.data[0].products.map((item: CartItem) => ({
          ...item,
          cartItem: {
            ...item.cartItem,
            // Don't format imageUrl here anymore, we'll use getImageUrl function
          }
        }));
        setCartItems(formattedItems);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching cart items:", error);
      setLoading(false);
    }
  };

  const removeItem = async (cartItemId: string) => {
    if (!window.confirm("Are you sure you want to remove this item from your cart?")) return;
    try {
      const token = localStorage.getItem('authToken');
      
      await axios.delete(`${API_BASE_URL}/cart/${cartItemId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setCartItems(prev => prev.filter(item => item._id !== cartItemId));
    } catch (error) {
      console.error("Error removing item:", error);
      alert("Failed to remove item from cart");
    }
  };

  const updateQuantity = async (cartItemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      const item = cartItems.find(i => i._id === cartItemId);
      if (item && window.confirm(`Remove all ${item.cartItem?.title} from cart?`)) {
        await removeItem(cartItemId);
      }
      return;
    }
    
    try {
      setUpdatingItems(prev => new Set(prev).add(cartItemId));
      const token = localStorage.getItem('authToken');
      
      await axios.put(`${API_BASE_URL}/cart/${cartItemId}`,
        { quantity: newQuantity },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      setCartItems(prev =>
        prev.map(item =>
          item._id === cartItemId
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    } catch (error) {
      console.error("Error updating quantity:", error);
      alert("Failed to update quantity");
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(cartItemId);
        return newSet;
      });
    }
  };

  // --- CALCULATION LOGIC ---
  const calculateSubtotal = (): number => {
    return cartItems.reduce((sum, item) => {
      const price = item.cartItem?.price || 0;
      return sum + (price * item.quantity);
    }, 0);
  };

  const validateCartItems = (): boolean => {
    return cartItems.length > 0 && cartItems.every(item => item.cartItem?._id && item.quantity > 0);
  };

  // --- FIXED CHECKOUT LOGIC ---
  const handleProceedToCheckout = () => {
    if (!validateCartItems()) {
      alert("Please ensure all items in your cart are valid before proceeding.");
      return;
    }

    // Prepare cart data in the format expected by checkout page
    const cartData = cartItems.map(item => ({
      productId: item.cartItem?._id,
      title: item.cartItem?.title,
      price: item.cartItem?.price,
      imageUrl: getImageUrl(item), // Use the same image function for consistency
      quantity: item.quantity,
      livraison: item.cartItem?.livraison
    }));

    const totalAmount = calculateSubtotal();

    // Store data in localStorage with the keys that checkout page expects
    localStorage.setItem('cart', JSON.stringify(cartData));
    localStorage.setItem('cartTotal', totalAmount.toFixed(2));

    // Also store in checkoutData for backward compatibility
    const checkoutData = {
      items: cartData,
      subtotal: totalAmount.toFixed(2),
    };
    localStorage.setItem('checkoutData', JSON.stringify(checkoutData));

    router.push('/checkout');
  };

  // --- RENDER STATES ---
  if (loading) {
    return (
      <div className="min-h-screen pt-40 flex flex-col items-center justify-center bg-gray-50">
        <FiLoader className="text-5xl text-gray-800 animate-spin mb-4" />
        <p className="text-xl font-medium text-gray-700">Retrieving your items...</p>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen pt-40 flex flex-col items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-10 text-center border border-gray-100">
          <FiShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Your Cart is Empty</h2>
          <p className="text-gray-600 mb-8">It looks like you haven't added anything to your cart yet. Let's find some amazing products!</p>
          <button
            onClick={() => router.push('/products')}
            className="w-full bg-gray-800 text-white py-3 px-4 rounded-xl hover:bg-gray-700 transition-colors font-semibold shadow-lg"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  // --- MAIN RENDER ---
  const subtotal = calculateSubtotal();

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex items-center border-b border-gray-200 pb-4 mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mr-6 p-2 rounded-full hover:bg-gray-200"
          >
            <FiArrowLeft size={24} />
          </button>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 flex items-center">
            <FiShoppingCart className="mr-3 text-gray-800" size={32} /> Shopping Cart
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            <p className="text-lg font-medium text-gray-700 mb-4">
              {cartItems.length} {cartItems.length === 1 ? 'Item' : 'Items'} Ready for Checkout
            </p>
            
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 divide-y divide-gray-100">
              {cartItems.map((item) => (
                <div key={item._id} className="p-6 flex flex-col sm:flex-row items-center space-x-0 sm:space-x-6 transition-all duration-300">
                  
                  {/* Image - UPDATED */}
                  <Link href={`/productdetail/${item.cartItem?._id}`} className="flex-shrink-0 mb-4 sm:mb-0">
<img
  src={getImageUrl(item)}
  alt={item.cartItem?.title}
  className="w-28 h-28 object-contain rounded-xl border border-gray-200 hover:shadow-md transition-shadow bg-gray-50 p-1"
  onError={(e) => handleImageError(e, item.cartItem?._id || '')}
  crossOrigin="anonymous"
  loading="lazy" // Add lazy loading
/>
                  </Link>

                  {/* Details */}
                  <div className="flex-1 min-w-0 pr-4">
                    <Link href={`/productdetail/${item.cartItem?._id}`}>
                        <h3 className="text-xl font-bold text-gray-900 hover:text-gray-700 transition-colors line-clamp-2 mb-1">
                          {item.cartItem?.title || 'Product Unavailable'}
                        </h3>
                    </Link>
                    <p className="text-sm text-gray-600 mb-2 flex items-center">
                      <FiMapPin size={14} className="mr-1 text-gray-500" />
                      Ships from: {item.cartItem?.product_location || 'Global'}
                    </p>
                    
                    {/* Price and Remove Button (Mobile/Small Screen) */}
                    <div className="flex sm:hidden justify-between items-center w-full mt-2">
                        <p className="text-xl font-extrabold text-gray-800">
                          ${item.cartItem?.price?.toFixed(2) || '0.00'}
                        </p>
                        <button
                          onClick={() => removeItem(item._id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove item"
                        >
                          <FiTrash2 size={20} />
                        </button>
                    </div>

                    {/* Invalid Product Alert */}
                    {!item.cartItem?._id && (
                      <p className="text-red-500 text-sm mt-2 flex items-center font-medium">
                        <FiAlertTriangle size={16} className="mr-1" />
                        This product is invalid or no longer available.
                      </p>
                    )}
                  </div>

                  {/* Quantity and Subtotal Controls */}
                  <div className="flex flex-col items-center sm:items-end w-full sm:w-auto mt-4 sm:mt-0 space-y-3">
                    
                    {/* Desktop Price & Remove */}
                    <div className="hidden sm:flex justify-between items-center w-full sm:w-auto">
                        <p className="text-xl font-extrabold text-gray-800 hidden sm:block">
                          ${(item.cartItem?.price || 0).toFixed(2)}
                        </p>
                        <button
                          onClick={() => removeItem(item._id)}
                          className="ml-4 p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors hidden sm:block"
                          title="Remove item"
                        >
                          <FiTrash2 size={20} />
                        </button>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center border border-gray-300 rounded-xl bg-gray-50">
                      <button
                        onClick={() => updateQuantity(item._id, item.quantity - 1)}
                        disabled={item.quantity <= 1 || updatingItems.has(item._id)}
                        className={`p-3 rounded-l-xl transition-colors ${
                          item.quantity <= 1 || updatingItems.has(item._id)
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        <FiMinus size={18} />
                      </button>
                      <span className="px-4 py-2 min-w-[50px] text-center font-bold text-gray-900">
                        {updatingItems.has(item._id) ? (
                          <FiLoader className="animate-spin h-5 w-5 text-gray-600 mx-auto" />
                        ) : (
                          item.quantity
                        )}
                      </span>
                      <button
                        onClick={() => updateQuantity(item._id, item.quantity + 1)}
                        disabled={updatingItems.has(item._id)}
                        className={`p-3 rounded-r-xl transition-colors ${
                            updatingItems.has(item._id)
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-gray-800 hover:bg-gray-200'
                          }`}
                      >
                        <FiPlus size={18} />
                      </button>
                    </div>
                    
                    {/* Line Total */}
                    <p className="text-lg font-extrabold text-green-600 pt-1">
                      Total: ${((item.cartItem?.price || 0) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <Link
              href="/products"
              className="mt-6 inline-flex items-center text-gray-700 hover:text-gray-900 font-medium transition-colors p-2"
            >
              <FiArrowLeft className="mr-2" />
              Continue Shopping
            </Link>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 sticky top-32">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-4">Order Summary</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between text-base">
                  <span className="text-gray-700 font-medium">Subtotal</span>
                  <span className="text-gray-900 font-semibold">${subtotal.toFixed(2)}</span>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-xl font-bold">
                    <span className="text-gray-900">Order Total</span>
                    <span className="text-green-600">${subtotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleProceedToCheckout}
                disabled={!validateCartItems()}
                className={`w-full py-4 px-6 rounded-xl font-extrabold text-lg mt-8 transition-all shadow-lg ${
                  !validateCartItems()
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gray-800 hover:bg-gray-700 text-white shadow-gray-400/50'
                }`}
              >
                <div className="flex items-center justify-center">
                  <FiLock className="mr-2" size={20} />
                  Secure Checkout
                </div>
              </button>
              
              {/* Security Message */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-xs text-gray-600 flex items-center justify-center font-medium">
                  <FiLock className="mr-1 text-green-600" size={14} />
                  Your payment is secured with 256-bit SSL encryption.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}