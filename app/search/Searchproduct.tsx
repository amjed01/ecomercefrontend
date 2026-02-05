"use client";
export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { FaSearch, FaFilter, FaTimes, FaStar, FaShoppingCart, FaHeart } from "react-icons/fa";
import axios from "axios";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Product {
  _id: string;
  title: string;
  price: string;
  imageUrl: string;
  images?: Array<{
    url: string;
    isPrimary: boolean;
    order: number;
  }>;
  product_location: string;
  livraison: string;
  couleur?: string;
  rating: number;
}

interface SearchResponse {
  results: Product[];
}

interface RatingResponse {
  averageRating: number;
}

interface Favorite {
  productId: string;
  userId: string;
  _id: string;
}

const API_BASE_URL = "https://ecomercebackend-654m.onrender.com/api";
// Use base64 placeholder to avoid 404 errors
const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,' + btoa(`
  <svg width="150" height="150" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#f3f4f6"/>
    <text x="50%" y="50%" font-family="Arial" font-size="14" text-anchor="middle" dy=".3em" fill="#9ca3af">No Image</text>
  </svg>
`);

const SearchPage: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlQuery = searchParams.get("q");

  const [searchKey, setSearchKey] = useState<string>(urlQuery || "");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [originalResults, setOriginalResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Filter states
  const [priceSort, setPriceSort] = useState<"asc" | "desc" | null>(null);
  const [locationInput, setLocationInput] = useState<string>("");
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [deliveryFilter, setDeliveryFilter] = useState<"free" | "paid" | null>(null);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);

  // Function to format image URL properly (same as favorites component)
  const formatImageUrl = (product: Product): string => {
    if (!product) return PLACEHOLDER_IMAGE;
    
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

  // Handle image error (same as favorites component)
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, productId: string) => {
    console.log("Image failed to load for product:", productId);
    const target = e.target as HTMLImageElement;
    target.src = PLACEHOLDER_IMAGE;
    target.onerror = null; // Prevent infinite loop
  };

  // Fetch favorites on component mount
  useEffect(() => {
    fetchFavorites();
  }, []);

  // Auto-search when URL query changes
  useEffect(() => {
    if (urlQuery && urlQuery.trim()) {
      setSearchKey(urlQuery);
      handleSearch(urlQuery);
    }
  }, [urlQuery]);

  const fetchFavorites = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const userId = localStorage.getItem("userId");
      
      if (token && userId) {
        const response = await axios.get(`${API_BASE_URL}/favorites`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { userId }
        });
        
        if (response.data.success && response.data.favorites) {
          const favoriteIds = new Set<string>(response.data.favorites.map((fav: Favorite) => fav.productId));
          setFavorites(favoriteIds);
          localStorage.setItem('favorites', JSON.stringify(Array.from(favoriteIds)));
        }
      } else {
        setFavorites(new Set());
        localStorage.removeItem('favorites');
      }
    } catch (err) {
      console.error("Error fetching favorites:", err);
      const storedFavorites = localStorage.getItem('favorites');
      if (storedFavorites) {
        setFavorites(new Set(JSON.parse(storedFavorites)));
      }
    }
  };

  const handleSearch = async (query?: string): Promise<void> => {
    const key = query || searchKey;
    if (!key.trim()) return;

    setIsSearching(true);
    try {
      const response = await axios.get<SearchResponse>(
        `${API_BASE_URL}/products/search/${encodeURIComponent(key)}`
      );

      const productsWithRatings = await Promise.all(
        (response.data.results || []).map(async (product: Product) => {
          try {
            const ratingResponse = await axios.get<RatingResponse>(
              `${API_BASE_URL}/ratings/average/${product._id}`
            );
            return {
              ...product,
              rating: ratingResponse.data.averageRating || 0,
              formattedImageUrl: formatImageUrl(product) // Add formatted image URL
            };
          } catch (error) {
            console.error("Error fetching rating for product:", product._id, error);
            return {
              ...product,
              rating: 0,
              formattedImageUrl: formatImageUrl(product) // Add formatted image URL even if rating fails
            };
          }
        })
      );

      setOriginalResults(productsWithRatings);
      setSearchResults(productsWithRatings);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
      setOriginalResults([]);
    } finally {
      setIsSearching(false);
    }
  };

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
        localStorage.setItem('favorites', JSON.stringify(Array.from(newFavorites)));
        return newFavorites;
      });

      if (isCurrentlyFavorite) {
        await axios.delete(`${API_BASE_URL}/favorites`, {
          headers: { Authorization: `Bearer ${token}` },
          data: { userId, productId }
        });
      } else {
        await axios.post(`${API_BASE_URL}/favorites`, {
          userId,
          productId
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      fetchFavorites();
    } catch (err) {
      console.error("Favorite toggle error:", err);
      alert("Failed to update favorites.");
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
    } catch (err) {
      console.error("Add to cart error:", err);
      alert("Failed to add product to cart.");
    }
  };

  const cyclePriceSort = (): void => {
    setPriceSort((prev) => {
      if (prev === null) return "asc";
      if (prev === "asc") return "desc";
      return null;
    });
  };

  const toggleDeliveryFilter = (type: "free" | "paid"): void => {
    setDeliveryFilter((prev) => (prev === type ? null : type));
  };

  const addLocation = (): void => {
    if (locationInput.trim() && !selectedLocations.includes(locationInput.trim())) {
      setSelectedLocations((prev) => [...prev, locationInput.trim()]);
      setLocationInput("");
    }
  };

  const removeLocation = (location: string): void => {
    setSelectedLocations((prev) => prev.filter((l) => l !== location));
  };

  const applyFilters = (data: Product[] = originalResults): void => {
    let filteredResults = [...data];

    // Apply location filters
    if (selectedLocations.length > 0) {
      filteredResults = filteredResults.filter((item) =>
        selectedLocations.includes(item.product_location)
      );
    }

    // Apply delivery filter
    if (deliveryFilter === "free") {
      filteredResults = filteredResults.filter(
        (item) =>
          item.livraison.toLowerCase().includes("free") ||
          item.livraison.toLowerCase().includes("gratuit")
      );
    } else if (deliveryFilter === "paid") {
      filteredResults = filteredResults.filter(
        (item) =>
          !item.livraison.toLowerCase().includes("free") &&
          !item.livraison.toLowerCase().includes("gratuit")
      );
    }

    // Apply price sorting
    if (priceSort) {
      filteredResults.sort((a, b) => {
        const priceA = parseFloat(a.price);
        const priceB = parseFloat(b.price);
        return priceSort === "asc" ? priceA - priceB : priceB - priceA;
      });
    }

    // Apply rating filter
    if (ratingFilter !== null) {
      filteredResults = filteredResults.filter((item) => {
        const rating = parseFloat(item.rating.toString());
        return !isNaN(rating) && rating >= ratingFilter;
      });
    }

    setSearchResults(filteredResults);
  };

  const resetAllFilters = (): void => {
    setPriceSort(null);
    setSelectedLocations([]);
    setDeliveryFilter(null);
    setRatingFilter(null);
    setSearchResults(originalResults);
  };

  const hasActiveFilters: boolean =
    !!priceSort || selectedLocations.length > 0 || !!deliveryFilter || !!ratingFilter;

  // Product Card Component
  const ProductCard: React.FC<{ item: Product & { formattedImageUrl?: string } }> = ({ item }) => {
    const isFavorite = favorites.has(item._id);
    const imageUrl = item.formattedImageUrl || formatImageUrl(item);

    return (
      <div className="group bg-white rounded-2xl shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-gray-300/50 transition-all duration-300 border border-gray-100 overflow-hidden">
        {/* Product Image with Link - UPDATED to match favorites component */}
        <Link href={`/productdetail/${item._id}`} className="block relative overflow-hidden bg-gray-100">
          <div className="h-48 w-full flex items-center justify-center overflow-hidden">
            <img
              src={imageUrl}
              alt={item.title}
              className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
              onError={(e) => handleImageError(e, item._id)}
              crossOrigin="anonymous"
            />
          </div>
          <button
            onClick={(e) => toggleFavorite(item._id, e)}
            className="absolute top-3 right-3 p-2 bg-white/90 rounded-full hover:bg-white transition-colors duration-200"
          >
            <FaHeart 
              className={`w-4 h-4 transition-colors ${
                isFavorite 
                  ? "text-red-500 fill-red-500" 
                  : "text-gray-600 hover:text-red-500"
              }`}
            />
          </button>
        </Link>

        {/* Product Info */}
        <div className="p-4">
          <Link href={`/productdetail/${item._id}`}>
            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-gray-700 transition-colors">
              {item.title}
            </h3>
          </Link>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <FaStar
                  key={star}
                  className={`w-3 h-3 ${
                    star <= Math.floor(item.rating) ? "text-yellow-400" : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500 ml-1">
              ({item.rating?.toFixed(1) || 0})
            </span>
          </div>

          {/* Price and Location */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-lg font-bold text-gray-900">
              ${parseFloat(item.price).toFixed(2)}
            </span>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {item.product_location}
            </span>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={(e) => addToCart(item._id, e)}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition-colors duration-200 group/btn"
          >
            <FaShoppingCart className="w-4 h-4" />
            <span>Add to Cart</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Filter Button */}
        <div className="flex justify-end mb-8">
          <button
            onClick={() => setShowFilterModal(true)}
            disabled={searchResults.length === 0 && originalResults.length === 0}
            className={`p-3 rounded-2xl transition-all duration-300 ${
              searchResults.length === 0 && originalResults.length === 0
                ? "text-gray-400 cursor-not-allowed"
                : hasActiveFilters
                ? "text-gray-900 bg-gray-100 hover:bg-gray-200"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <FaFilter className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Modal */}
        {showFilterModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">Filter Products</h2>
                <button
                  onClick={() => {
                    applyFilters();
                    setShowFilterModal(false);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200"
                >
                  <FaTimes className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Price Sort */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Sort by Price
                  </label>
                  <button
                    onClick={cyclePriceSort}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                      priceSort
                        ? "border-gray-800 bg-gray-800 text-white"
                        : "border-gray-200 hover:border-gray-300 text-gray-700"
                    }`}
                  >
                    <span>Price</span>
                  </button>
                </div>

                {/* Delivery Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Delivery Type
                  </label>
                  <div className="flex gap-3">
                    {(["free", "paid"] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => toggleDeliveryFilter(type)}
                        className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                          deliveryFilter === type
                            ? "border-gray-800 bg-gray-800 text-white"
                            : "border-gray-200 hover:border-gray-300 text-gray-700"
                        }`}
                      >
                        {type === "free" ? "Free Delivery" : "Paid Delivery"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rating Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Minimum Rating
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() =>
                          setRatingFilter((prev) => (prev === rating ? null : rating))
                        }
                        className={`flex items-center gap-1 px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                          ratingFilter === rating
                            ? "border-gray-800 bg-gray-800 text-white"
                            : "border-gray-200 hover:border-gray-300 text-gray-700"
                        }`}
                      >
                        <FaStar className="w-4 h-4" />
                        <span>{rating}+</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Location Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Locations
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={locationInput}
                      onChange={(e) => setLocationInput(e.target.value)}
                      placeholder="Enter location"
                      className="flex-1 rounded-xl py-3 px-4 border-2 border-gray-200 focus:outline-none focus:border-gray-600/50 text-gray-800 placeholder-gray-400"
                    />
                    <button
                      onClick={addLocation}
                      disabled={!locationInput.trim()}
                      className="px-4 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedLocations.map((location) => (
                      <span
                        key={location}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg"
                      >
                        {location}
                        <button
                          onClick={() => removeLocation(location)}
                          className="hover:text-gray-900 transition-colors duration-200"
                        >
                          <FaTimes className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 p-6 border-t border-gray-100">
                <button
                  onClick={resetAllFilters}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:border-gray-400 transition-colors duration-200"
                >
                  Reset All
                </button>
                <button
                  onClick={() => {
                    applyFilters();
                    setShowFilterModal(false);
                  }}
                  className="flex-1 px-6 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition-colors duration-200"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {isSearching ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-4 border-gray-800 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : searchResults.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-48 h-48 mx-auto mb-6 bg-gray-100 rounded-2xl flex items-center justify-center">
              <FaSearch className="w-16 h-16 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {originalResults.length === 0
                ? "No products found"
                : "No products match your filters"}
            </h3>
            {hasActiveFilters && originalResults.length > 0 && (
              <button
                onClick={() => setShowFilterModal(true)}
                className="px-6 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition-colors duration-200"
              >
                Adjust Filters
              </button>
            )}
          </div>
        ) : (
          <div>
            {/* Active Filters Header */}
            {hasActiveFilters && (
              <div className="mb-6 p-4 bg-white rounded-2xl shadow-lg border border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-4">
                    {priceSort && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm">
                        {priceSort === "asc"
                          ? "↑ Price (Low to High)"
                          : "↓ Price (High to Low)"}
                      </span>
                    )}
                    {deliveryFilter && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm">
                        Delivery: {deliveryFilter === "free" ? "Free" : "Paid"}
                      </span>
                    )}
                    {selectedLocations.length > 0 && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm">
                        Locations: {selectedLocations.join(", ")}
                      </span>
                    )}
                    {ratingFilter && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm">
                        Minimum Rating: {ratingFilter}+
                      </span>
                    )}
                  </div>
                  <button
                    onClick={resetAllFilters}
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            )}

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {searchResults.map((item) => (
                <ProductCard key={item._id} item={item} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;