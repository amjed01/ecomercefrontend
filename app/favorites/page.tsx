"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { FiTrash2, FiChevronLeft, FiHeart, FiShoppingBag, FiShoppingCart, FiLoader, FiTag } from 'react-icons/fi';

// --- INTERFACE DEFINITIONS ---
interface ProductDetails {
  _id: string;
  title: string;
  price: number;
  imageUrl: string;
  images?: Array<{
    url: string;
    isPrimary: boolean;
    order: number;
  }>;
}

interface Product {
 _id: string;
  title: string;
  price: number;
  imageUrl: string;
  product_location: string;
  livraison: string;
  couleur?: string;
  rating: number;
}

interface FavoriteItem {
  _id: string;
  productId: ProductDetails;
}

interface CartItem {
  _id: string;
  cartItem: {
    _id: string;
  };
  quantity: number;
}

const API_BASE_URL = "https://ecomercebackend-654m.onrender.com/api";
// Use base64 placeholder to avoid 404 errors
const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,' + btoa(`
  <svg width="150" height="150" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#f3f4f6"/>
    <text x="50%" y="50%" font-family="Arial" font-size="14" text-anchor="middle" dy=".3em" fill="#9ca3af">No Image</text>
  </svg>
`);

export default function Favorites() {
  const [data, setData] = useState<Product[]>([]);
  const router = useRouter();
  const [favoriteItems, setFavoriteItems] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [isAddingAll, setIsAddingAll] = useState(false);

  // Function to format image URL properly (same as other components)
const formatImageUrl = (product: ProductDetails): string => {
  if (!product) return PLACEHOLDER_IMAGE;
  
  // Priority: Check images array (Cloudinary format)
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
  
  // Fallback: Check single imageUrl field
  if (product.imageUrl) {
    const url = product.imageUrl.trim();
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
  }
  
  // If no valid image found
  return PLACEHOLDER_IMAGE;
};
  // Handle image error (same as other components)
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, productId: string) => {
    console.log("Image failed to load for product:", productId);
    const target = e.target as HTMLImageElement;
    target.src = PLACEHOLDER_IMAGE;
    target.onerror = null; // Prevent infinite loop
  };

  // --- API LOGIC ---

  const fetchFavoriteItems = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const userId = localStorage.getItem('userId');
    
      if (!token || !userId) {
        // Redirect to login if not authenticated
        router.push("/login");
        return;
      }
      const response = await axios.get(`https://ecomercebackend-654m.onrender.com/api/favorites/find/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const products = response.data && response.data[0] ? response.data[0].products : [];
      const formattedItems = products.map((item: FavoriteItem) => ({
        ...item,
        productId: {
          ...item.productId,
          imageUrl: formatImageUrl(item.productId) // Use the new formatImageUrl function
        }
      }));
      setFavoriteItems(formattedItems);
      
    } catch (error) {
      console.error("Error fetching favorite items:", error);
      // Optional: Show error message to user
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (productId: string) => {
    if (!window.confirm("Are you sure you want to remove this item from your favorites?")) return;
    try {
      const token = localStorage.getItem('authToken');
      const userId = localStorage.getItem('userId');
      
      await axios.delete(`https://ecomercebackend-654m.onrender.com/api/favorites`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { userId, productId }
      });
      
      // Optimistically update the UI
      setFavoriteItems(currentItems => currentItems.filter(item => item.productId._id !== productId));
    } catch (error) {
      console.error("Error removing item:", error);
      alert("Failed to remove item from favorites");
    }
  };

  const addToCart = async (productId: string) => {
    try {
      setAddingToCart(productId);
      const token = localStorage.getItem('authToken');
      const userId = localStorage.getItem('userId');

      if (!token || !userId) {
        alert("Please login to add items to cart.");
        router.push("/login");
        return;
      }

      // Simplification: directly call the add-to-cart API. 
      // Assuming your backend handles quantity incrementation if the item already exists.
      await axios.post(`https://ecomercebackend-654m.onrender.com/api/cart`, {
        userId,
        cartItem: productId,
        quantity: 1
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("Product added to cart successfully!");
      
    } catch (error) {
      console.error("Add to cart error:", error);
      alert("Failed to add product to cart");
    } finally {
      setAddingToCart(null);
    }
  };

  const addAllToCart = async () => {
    setIsAddingAll(true);
    try {
      const token = localStorage.getItem('authToken');
      const userId = localStorage.getItem('userId');

      if (!token || !userId) {
        alert("Please login to add items to cart.");
        router.push("/login");
        return;
      }

      // Use Promise.all to send all requests concurrently (faster)
      const cartPromises = favoriteItems.map(item => 
        axios.post(`https://ecomercebackend-654m.onrender.com/api/cart`, {
          userId,
          cartItem: item.productId._id,
          quantity: 1
        }, {
          headers: { Authorization: `Bearer ${token}` }
        })
      );
      
      await Promise.all(cartPromises);

      alert("All favorites added to cart successfully!");
      
    } catch (error) {
      console.error("Add all to cart error:", error);
      alert("Failed to add all items to cart. Please check console for details.");
    } finally {
      setIsAddingAll(false);
    }
  };

  // Initialize on component mount
  useEffect(() => {
    fetchFavoriteItems();
  }, []);

  // --- RENDER STATES ---

  if (loading) {
    return (
      <div className="min-h-screen pt-40 flex flex-col items-center justify-center bg-gray-50">
        <FiLoader className="text-5xl text-gray-800 animate-spin mb-4" />
        <p className="text-xl font-medium text-gray-700">Fetching your cherished items...</p>
      </div>
    );
  }

  if (favoriteItems.length === 0) {
    return (
      <div className="min-h-screen pt-40 flex flex-col items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md w-full border border-gray-100">
          <FiHeart className="mx-auto text-6xl text-gray-400 mb-6" />
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Your Wishlist is Empty</h2>
          <p className="text-gray-600 mb-8">
            Start browsing our products and tap the heart icon to save your favorites!
          </p>
          <button
            onClick={() => router.push('/products')}
            className="w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-md hover:shadow-lg"
          >
            Start Shopping
          </button>
        </div>
      </div>
    );
  }

  const totalValue = favoriteItems.reduce((sum, item) => sum + (item.productId?.price || 0), 0);

  // --- MAIN RENDER ---
  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header & Back Button */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-8">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mr-4 p-2 rounded-full hover:bg-gray-200"
            >
              <FiChevronLeft size={24} />
            </button>
            <h1 className="text-3xl font-extrabold text-gray-900">Your Favorites ({favoriteItems.length})</h1>
          </div>
          <Link
            href="/cart"
            className="flex items-center text-sm font-semibold text-gray-700 hover:text-gray-900 border border-gray-300 px-4 py-2 rounded-xl transition-all hover:bg-white shadow-sm"
          >
            <FiShoppingCart className="mr-2" /> Go to Cart
          </Link>
        </div>

        {/* --- */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Favorites List Column (2/3 width on large screens) */}
          <div className="lg:col-span-2 space-y-4">
            {favoriteItems.map((item) => (
              <div
                key={item._id}
                className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6 flex items-start space-x-4 transition-all duration-300 hover:shadow-xl"
              >
                {/* Product Image - Fixed */}
                <Link href={`/productdetail/${item.productId._id}`} className="block">
                  <div className="h-40 w-40 flex items-center justify-center overflow-hidden rounded-xl bg-gray-50">
  <img
    src={item.productId.imageUrl || PLACEHOLDER_IMAGE}
    alt={item.productId.title}
    className="w-full h-full object-contain p-2"
    onError={(e) => handleImageError(e, item.productId._id)}
    crossOrigin="anonymous"
    loading="lazy" // Add lazy loading
  />
</div>
                </Link>

                {/* Product Details & Actions */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div className="pr-4">
                        <Link href={`/productdetail/${item.productId._id}`}>
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 hover:text-gray-800 transition-colors line-clamp-2">
                            {item.productId?.title}
                            </h3>
                        </Link>
                        <p className="text-2xl font-extrabold text-gray-800 mt-1">
                          ${item.productId?.price?.toFixed(2)}
                        </p>
                    </div>

                    {/* Remove Button (Top Right) */}
                    <button
                      onClick={() => removeItem(item.productId._id)}
                      className="text-red-500 hover:text-red-700 transition-colors p-2 rounded-full hover:bg-red-50"
                      title="Remove from favorites"
                    >
                      <FiTrash2 size={20} />
                    </button>
                  </div>

                  {/* Action Buttons (Bottom) */}
                  <div className="mt-4 flex flex-col sm:flex-row gap-3">
                    <Link
                      href={`/productdetail/${item.productId._id}`}
                      className="flex-1 text-center bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-4 rounded-xl font-medium text-sm transition-colors shadow-sm"
                    >
                      View Product
                    </Link>
                    <button
                      onClick={() => addToCart(item.productId._id)}
                      disabled={addingToCart === item.productId._id}
                      className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 px-4 rounded-xl font-medium text-sm transition-colors shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {addingToCart === item.productId._id ? (
                        <>
                          <FiLoader className="animate-spin mr-2" size={16} />
                          Adding...
                        </>
                      ) : (
                        <>
                          <FiShoppingCart className="mr-2" size={16} />
                          Add to Cart
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* --- */}

          {/* Summary Column (1/3 width on large screens) */}
          <div className="lg:col-span-1 sticky top-32 h-fit">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 border-b pb-3">Order Summary</h2>

              {/* Quick Stats Grid */}
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center text-gray-700">
                  <span className="flex items-center font-medium">
                    <FiHeart className="mr-2 text-blue-600" /> Total Items
                  </span>
                  <span className="text-lg font-semibold text-gray-900">{favoriteItems.length}</span>
                </div>
                <div className="flex justify-between items-center text-gray-700">
                  
                
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                  <span className="flex items-center text-xl font-bold">
                    <FiShoppingBag className="mr-2 text-green-600" /> Total Value
                  </span>
                  <span className="text-2xl font-extrabold text-green-600">
                    ${totalValue.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Add All to Cart Button */}
              <button
                onClick={addAllToCart}
                disabled={isAddingAll}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white py-4 px-4 rounded-xl font-bold transition-colors mt-4 shadow-xl shadow-gray-300/50 disabled:bg-gray-500 flex items-center justify-center"
              >
                {isAddingAll ? (
                  <>
                    <FiLoader className="animate-spin mr-2" />
                    Adding All...
                  </>
                ) : (
                  <>
                    <FiShoppingCart className="mr-2" />
                    Move All {favoriteItems.length} Items to Cart
                  </>
                )}
              </button>
              
              {/* Checkout link (optional, depends on if you want users to buy all items immediately) */}
            
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}