"use client";
import React, { useEffect, useState, useImperativeHandle, forwardRef, useCallback } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiHeart } from "react-icons/fi";
import { FaShoppingCart } from "react-icons/fa"; // Added FaShoppingCart icon
import { useSearchParams } from "next/navigation";
const API_BASE_URL = "https://ecomercebackend-654m.onrender.com/api";
//onclick
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

interface Favorite {
  productId: string;
  userId: string;
  _id: string;
}

interface ApiResponse {
  success: boolean;
  products?: Product[];
  favorites?: Favorite[];
}

const Products = forwardRef((_, ref) => {
  const router = useRouter();
  const [data, setData] = useState<Product[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
const searchParams = useSearchParams();
const category = searchParams.get("category");
const [imageUrls, setImageUrls] = useState<{ [key: string]: string }>({});
const fetchImage = async (productId: string) => {
  try {
    const response = await axios.get(`https://ecomercebackend-654m.onrender.com/api/products/${productId}/image`, {
      responseType: 'blob',  // Fetch as binary blob
    });
    const blobUrl = URL.createObjectURL(response.data);  // Create blob URL
    setImageUrls(prev => ({ ...prev, [productId]: blobUrl }));
  } catch (error) {
    console.error('Error fetching image:', error);
  }
};
// In useEffect or on component mount, fetch images for all products
useEffect(() => {
  data.forEach(product => {
    if (product._id && !imageUrls[product._id]) {
      fetchImage(product._id);
    }
  });
}, [data]);
  // Create a stable reference for the fetchFavorites function
  const fetchFavorites = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken");
      const userId = localStorage.getItem("userId");
      
      if (token && userId) {
        const response = await axios.get<ApiResponse>(`${API_BASE_URL}/favorites`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { userId }
        });
        
        if (response.data.success && response.data.favorites) {
          const favoriteIds = new Set(response.data.favorites.map((fav: Favorite) => fav.productId));
          setFavorites(favoriteIds);
          
          // Also store in localStorage for quick access
          localStorage.setItem('favorites', JSON.stringify(Array.from(favoriteIds)));
        }
      } else {
        // If no user is logged in, clear favorites
        setFavorites(new Set());
        localStorage.removeItem('favorites');
      }
    } catch (err: unknown) {
      console.error("Error fetching favorites:", err);
      // Fallback to localStorage if API fails
      const storedFavorites = localStorage.getItem('favorites');
      if (storedFavorites) {
        setFavorites(new Set(JSON.parse(storedFavorites)));
      }
    }
  }, []);

 const fetchProducts = async () => {
  setLoading(true);
  setError("");
  try {
    const url = category
      ? `${API_BASE_URL}/products?category=${category}`
      : `${API_BASE_URL}/products`;
    const response = await axios.get<ApiResponse>(url);
    setData(response.data.products || []);
  } catch (err: unknown) {
    // existing error handling
  } finally {
    setLoading(false);
  }
};

  useImperativeHandle(ref, () => ({
    refetch: fetchProducts,
    refetchFavorites: fetchFavorites
  }));

  useEffect(() => {
    fetchProducts();
    
    // Load favorites from localStorage immediately for faster UI
    const storedFavorites = localStorage.getItem('favorites');
    if (storedFavorites) {
      setFavorites(new Set(JSON.parse(storedFavorites)));
    }
    
    // Then fetch from API to ensure we have the latest data
    fetchFavorites();
    
    // Set up event listener for storage changes (e.g., from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'favorites' && e.newValue) {
        setFavorites(new Set(JSON.parse(e.newValue)));
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Set up visibility change listener to refresh favorites when page becomes visible again
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchFavorites();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchFavorites]);

  const toggleFavorite = async (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    try {
      const token = localStorage.getItem("authToken");
      const userId = localStorage.getItem("userId");

      if (!token || !userId) {
        alert("Please login to manage favorites.");
        router.push("/login");
        return;
      }

      const isCurrentlyFavorite = favorites.has(productId);

      // Optimistic UI update
      setFavorites(prev => {
        const newFavorites = new Set(prev);
        if (isCurrentlyFavorite) {
          newFavorites.delete(productId);
        } else {
          newFavorites.add(productId);
        }
        
        // Update localStorage immediately
        localStorage.setItem('favorites', JSON.stringify(Array.from(newFavorites)));
        return newFavorites;
      });

      if (isCurrentlyFavorite) {
        // Remove from favorites
        await axios.delete(`${API_BASE_URL}/favorites`, {
          headers: { Authorization: `Bearer ${token}` },
          data: { userId, productId }
        });
      } else {
        // Add to favorites
        await axios.post(`${API_BASE_URL}/favorites`, {
          userId,
          productId
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      // Refresh favorites from API to ensure consistency
      fetchFavorites();
    } catch (err: unknown) {
      console.error("Favorite toggle error:", err);
      alert("Failed to update favorites.");
      
      // Revert optimistic update on error
      fetchFavorites();
    }
  };

  const addToCart = async (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    try {
      const token = localStorage.getItem("authToken");
      const userId = localStorage.getItem("userId");

      if (!token || !userId) {
        alert("Please login to add items to cart.");
        router.push("/login");
        return;
      }

      await axios.post(`${API_BASE_URL}/cart`, {
        userId,
        cartItem: productId,
        quantity: 1,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("Product added to cart.");
    } catch (err: unknown) {
      console.error("Add to cart error:", err);
      alert("Failed to add product to cart.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-gray-800"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 font-semibold p-4">
        {error.includes("empty url") ? "API URL not configured" : `Error: ${error}`}
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-8 border-l-4 border-gray-800 pl-3">
          🔥 Flash Deals
        </h2>

        {data.length === 0 ? (
          <div className="text-center text-gray-600 py-10 border border-dashed rounded-xl">
            No products available for flash deals.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-6">
            {data.map((product) => {
              const isFavorite = favorites.has(product._id);
              
              return (
                <div 
                  key={product._id} 
                  className="bg-white rounded-2xl p-4 shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:shadow-gray-300/60 transition-all duration-300 relative group overflow-hidden border border-gray-100"
                >
                  {/* Favorite Button */}
                  <button 
                    className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-all duration-300 ring-1 ring-gray-100"
                    onClick={(e) => toggleFavorite(product._id, e)}
                  >
                    <FiHeart 
                      className={`h-5 w-5 transition-colors ${
                        isFavorite 
                          ? "text-red-500 fill-red-500" 
                          : "text-gray-400 hover:text-red-500 hover:fill-red-100"
                      }`}
                    />
                  </button>

                  {/* Product Image with Link */}
               <Link href={`/productdetail/${product._id}`} className="block">
<div className="h-40 mb-4 flex items-center justify-center overflow-hidden rounded-xl " style={{ minHeight: 160 }}>
<img
  src={imageUrls[product._id] || "https://via.placeholder.com/150"}
  alt={product.title}
  style={{ width: '100%', height: '160px', objectFit: 'contain' }}  // Use {{ }} for inline styles, no $
  onLoad={() => console.log('Image loaded for:', product._id)}
  onError={(e) => console.log('Image error for:', product._id, e)}
/>
</div>
</Link>

                  {/* Product Details */}
                  <div className="px-1 pt-1">
                    <Link href={`/productdetail/${product._id}`} className="block">
                      <h3 className="text-sm font-semibold mb-1 text-gray-800 hover:text-gray-900 line-clamp-2 transition-colors duration-200">
                        {product.title}
                      </h3>
                    </Link>
                    
                    <div className="flex justify-between items-baseline my-2">
                      <span className="text-xl font-extrabold text-gray-900">
                        ${product.price.toFixed(2)}
                      </span>
                     
                    </div>

                    {/* Add to Cart Button */}
                    <button
                      onClick={(e) => addToCart(product._id, e)}
                      className="w-full mt-3 flex items-center justify-center space-x-2 bg-gray-800 text-white text-sm py-2 rounded-xl hover:bg-gray-700 transition-all duration-300 transform active:scale-95 shadow-md hover:shadow-lg"
                    >
                      <FaShoppingCart className="h-4 w-4" />
                      <span>Add to Cart</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});

Products.displayName = "Products";

export default Products;