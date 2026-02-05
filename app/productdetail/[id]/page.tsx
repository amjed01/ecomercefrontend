"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import {
  FiHeart,
  FiShoppingBag,
  FiChevronLeft,
  FiPlus,
  FiMinus,
  FiChevronRight,
  FiChevronLeft as FiChevronLeftIcon,
  FiImage,
} from "react-icons/fi";
import { FaStar, FaRegStar } from "react-icons/fa";

interface ProductImage {
  url: string;
  isPrimary: boolean;
  order: number;
}

interface Product {
  _id: string;
  title: string;
  price: number;
  description: string;
  images: ProductImage[];
  product_location?: string;
  category: string;
  quantity: number;
  couleur?: string;
  livraison?: string;
  imageUrl?: string; // For backward compatibility
}

export default function ProductDetails() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [count, setCount] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [images, setImages] = useState<ProductImage[]>([]);

  const API_BASE_URL = "https://ecomercebackend-654m.onrender.com/api";
  // Use a data URL for placeholder to avoid 404
  const PLACEHOLDER_SVG = 'data:image/svg+xml;base64,' + btoa(`
    <svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text x="50%" y="50%" font-family="Arial" font-size="20" text-anchor="middle" dy=".3em" fill="#9ca3af">Product Image</text>
    </svg>
  `);

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("authToken");
        const userId = localStorage.getItem("userId");

        if (!productId) {
          router.push("/products");
          return;
        }

        console.log("Fetching product data for ID:", productId);

        // Fetch product details
        const productResponse = await axios.get(
          `${API_BASE_URL}/products/${productId}`,
          { 
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            timeout: 10000 // 10 second timeout
          }
        );

        console.log("Product response:", productResponse.data);

        if (productResponse.data?.product) {
          const productData = productResponse.data.product;
          setProduct(productData);
          
          // Process images
          let productImages: ProductImage[] = [];
          
          if (productData.images && productData.images.length > 0) {
            console.log("Found images array:", productData.images);
            productImages = productData.images;
          } else if (productData.imageUrl) {
            console.log("Found single imageUrl:", productData.imageUrl);
            // Convert single imageUrl to images array for backward compatibility
            productImages = [{
              url: productData.imageUrl,
              isPrimary: true,
              order: 0
            }];
          }
          
          // Sort images - primary first, then by order
          const sortedImages = [...productImages].sort((a, b) => {
            if (a.isPrimary && !b.isPrimary) return -1;
            if (!a.isPrimary && b.isPrimary) return 1;
            return (a.order || 0) - (b.order || 0);
          });
          
          setImages(sortedImages);
          console.log("Sorted images to display:", sortedImages);
          
        } else {
          console.log("No product found in response");
          setProduct(null);
          return;
        }

        // Favorites & ratings only if logged in
        if (token && userId) {
          try {
            const favResponse = await axios.get(`${API_BASE_URL}/favorites/check`, {
              headers: { Authorization: `Bearer ${token}` },
              params: { userId, productId },
            });
            setIsFavorite(favResponse.data.isFavorite);
          } catch (error) {
            console.log("Favorites endpoint not available");
          }

          try {
            const ratingResponse = await axios.get(`${API_BASE_URL}/ratings/user`, {
              headers: { Authorization: `Bearer ${token}` },
              params: { userId, productId },
            });
            setUserRating(ratingResponse.data.userRating || 0);
          } catch (error) {
            console.log("Ratings endpoint not available");
          }

          try {
            const avgResponse = await axios.get(
              `${API_BASE_URL}/ratings/average/${productId}`
            );
            setAverageRating(avgResponse.data.averageRating || 0);
          } catch (error) {
            console.log("Average ratings endpoint not available");
          }
        }
      } catch (error: any) {
        console.error("Error loading product data:", error);
        console.error("Error details:", error.response?.data || error.message);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [productId, router]);

  // Get current image URL
  const getCurrentImageUrl = () => {
    if (images.length > 0 && images[currentImageIndex]) {
      const image = images[currentImageIndex];
      let url = image.url;
      
      // Ensure URL is properly formatted
      if (url && !url.startsWith('http') && !url.startsWith('data:')) {
        if (url.startsWith('/uploads')) {
          url = `https://ecomercebackend-654m.onrender.com${url}`;
        } else {
          url = `https://ecomercebackend-654m.onrender.com/uploads/${url}`;
        }
      }
      
      return url || PLACEHOLDER_SVG;
    }
    
    return PLACEHOLDER_SVG;
  };

  // Handle image error
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.log("Image failed to load:", e.currentTarget.src);
    const target = e.target as HTMLImageElement;
    target.src = PLACEHOLDER_SVG;
    target.onerror = null; // Prevent infinite loop
  };

  const nextImage = () => {
    if (images.length > 1) {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      );
    }
  };

  const prevImage = () => {
    if (images.length > 1) {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === 0 ? images.length - 1 : prevIndex - 1
      );
    }
  };

  const selectImage = (index: number) => {
    if (index >= 0 && index < images.length) {
      setCurrentImageIndex(index);
    }
  };

  // Format image URL for thumbnails
  const formatThumbnailUrl = (url: string) => {
    if (!url) return PLACEHOLDER_SVG;
    
    if (url.startsWith('http') || url.startsWith('data:')) {
      return url;
    }
    
    if (url.startsWith('/uploads')) {
      return `https://ecomercebackend-654m.onrender.com${url}`;
    }
    
    return `https://ecomercebackend-654m.onrender.com/uploads/${url}`;
  };


  const toggleFavorite = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const userId = localStorage.getItem("userId");

      if (!token || !userId) {
        alert("Please login to manage favorites");
        router.push("/login");
        return;
      }

      if (isFavorite) {
        await axios.delete(`${API_BASE_URL}/favorites`, {
          headers: { Authorization: `Bearer ${token}` },
          data: { userId, productId },
        });
      } else {
        await axios.post(
          `${API_BASE_URL}/favorites`,
          { userId, productId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error("Favorite toggle error:", error);
    }
  };

  const handleRating = async (rating: number) => {
    try {
      const token = localStorage.getItem("authToken");
      const userId = localStorage.getItem("userId");

      if (!token || !userId) {
        alert("Please login to rate products");
        router.push("/login");
        return;
      }

      await axios.post(
        `${API_BASE_URL}/ratings`,
        { userId, productId, rating },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUserRating(rating);

      const avgResponse = await axios.get(
        `${API_BASE_URL}/ratings/average/${productId}`
      );
      setAverageRating(avgResponse.data.averageRating || 0);
    } catch (error) {
      console.error("Rating error:", error);
    }
  };

  const handleBuyNow = () => {
    if (!product) return;
    const token = localStorage.getItem("authToken");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
      alert("Please login to continue");
      router.push("/login");
      return;
    }

    const checkoutItems = [
      {
        productId: product._id,
        title: product.title,
        price: product.price,
        imageUrl: product.imageUrl,
        quantity: count,
      },
    ];

    const params = new URLSearchParams();
    params.set("items", JSON.stringify(checkoutItems));
    params.set("total", (product.price * count).toFixed(2));

    router.push(`/checkout?${params.toString()}`);
  };

  const addToCart = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const userId = localStorage.getItem("userId");

      if (!token || !userId) {
        alert("Please login to add items to cart");
        router.push("/login");
        return;
      }

      await axios.post(
        `${API_BASE_URL}/cart`,
        { userId, cartItem: productId, quantity: count },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Product added to cart");
    } catch (error) {
      console.error("Add to cart error:", error);
    }
  };

  const increment = () => {
    if (product && count < product.quantity) setCount(count + 1);
  };

  const decrement = () => {
    if (count > 1) setCount(count - 1);
  };

 
 if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-4">Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <FiImage className="text-gray-400 text-6xl mb-4" />
        <p className="text-xl font-medium mb-2">Product not found</p>
        <p className="text-gray-600 mb-6">The product you're looking for doesn't exist or has been removed.</p>
        <button
          onClick={() => router.push("/")}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
        >
          Back to Products
        </button>
      </div>
    );
  }

  const hasMultipleImages = images.length > 1;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Top bar */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <FiChevronLeft className="mr-1" size={24} /> Back
        </button>
        <button
          onClick={toggleFavorite}
          className={`p-2 rounded-full ${
            isFavorite
              ? "text-red-500"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <FiHeart size={24} fill={isFavorite ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product images */}
        <div className="space-y-4">
          {/* Main image */}
          <div className="relative bg-gray-50 rounded-lg overflow-hidden shadow-sm min-h-[400px] flex items-center justify-center">
            <img
              src={getCurrentImageUrl()}
              alt={product.title}
              className="w-full h-auto max-h-[500px] object-contain p-4"
              onError={handleImageError}
              crossOrigin="anonymous" // Add this for CORS
            />
            
            {/* Navigation buttons */}
            {hasMultipleImages && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-75 hover:bg-opacity-100 p-2 rounded-full shadow hover:shadow-lg transition-all"
                >
                  <FiChevronLeftIcon size={24} />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-75 hover:bg-opacity-100 p-2 rounded-full shadow hover:shadow-lg transition-all"
                >
                  <FiChevronRight size={24} />
                </button>
                
                {/* Image counter */}
                <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                  {currentImageIndex + 1} / {images.length}
                </div>
              </>
            )}
          </div>
          
          {/* Thumbnail images */}
          {hasMultipleImages && (
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => selectImage(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                    currentImageIndex === index 
                      ? 'border-blue-500 ring-2 ring-blue-200' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img
                    src={formatThumbnailUrl(image.url)}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                    crossOrigin="anonymous"
                  />
                </button>
              ))}
            </div>
          )}
          
          {/* Debug info - remove in production */}
          <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded">
            <p>Images loaded: {images.length}</p>
            <p>Current image: {getCurrentImageUrl().substring(0, 100)}...</p>
          </div>
        </div>

        {/* Product details */}
        <div className="space-y-6">
          <h1 className="text-2xl font-semibold">{product.title}</h1>
          <div className="text-2xl font-medium">
            ${(product.price * count).toFixed(2)}
            {count > 1 && (
              <span className="text-sm text-gray-500 ml-2">
                (${product.price.toFixed(2)} each)
              </span>
            )}
          </div>

          {/* Rating */}
          <div className="flex items-center space-x-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRating(star)}
                  className="text-lg focus:outline-none hover:scale-110 transition-transform"
                >
                  {star <= userRating ? (
                    <FaStar className="text-yellow-400" />
                  ) : (
                    <FaRegStar className="text-gray-300" />
                  )}
                </button>
              ))}
            </div>
            <span className="text-sm text-gray-500">
              ({averageRating.toFixed(1)})
            </span>
          </div>

          {/* Quantity selector */}
          <div className="flex items-center space-x-4">
            <span>Quantity:</span>
            <div className="flex border rounded-md overflow-hidden">
              <button
                onClick={decrement}
                disabled={count <= 1}
                className={`px-3 ${
                  count <= 1
                    ? "text-gray-400 cursor-not-allowed bg-gray-50"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <FiMinus />
              </button>
              <span className="px-4">{count}</span>
              <button
                onClick={increment}
                disabled={count >= product.quantity}
                className={`px-3 ${
                  count >= product.quantity
                    ? "text-gray-400 cursor-not-allowed bg-gray-50"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <FiPlus />
              </button>
            </div>
            {product.quantity && (
              <span className="text-sm text-gray-500">
                {product.quantity} available
              </span>
            )}
          </div>

          {/* Description */}
          <div className="pt-4 border-t">
            <h2 className="text-lg font-medium mb-2">Description</h2>
            <p className="text-gray-600 whitespace-pre-line">{product.description}</p>
          </div>

          {product.product_location && (
            <div className="flex text-gray-600">
              <span className="mr-2 font-medium">Location:</span>
              <span>{product.product_location}</span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex space-x-4 pt-6">
            <button
              onClick={handleBuyNow}
              className="flex-1 bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-md transition-colors"
            >
              Buy Now
            </button>
            <button
              onClick={addToCart}
              className="flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-6 rounded-md transition-colors"
            >
              <FiShoppingBag className="mr-2" />
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}