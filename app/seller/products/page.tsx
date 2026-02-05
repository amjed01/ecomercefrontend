"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { FiArrowLeft, FiPlus, FiEye, FiEyeOff, FiEdit, FiTrash2, FiBox, FiFilter } from 'react-icons/fi';

interface Product {
  _id: string;
  title: string;
  price: number;
  description: string;
  category: string;
  quantity: number;
  isActive: boolean;
  imageUrl: string | null;
  images?: Array<{
    url: string;
    isPrimary: boolean;
    order: number;
  }>;
  couleur: string;
  livraison: string;
}

interface Category {
  value: string;
  label: string;
}

const API_BASE_URL = "https://ecomercebackend-654m.onrender.com/api";
// Use base64 placeholder to avoid 404 errors (same as other components)
const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,' + btoa(`
  <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#f3f4f6"/>
    <text x="50%" y="50%" font-family="Arial" font-size="14" text-anchor="middle" dy=".3em" fill="#9ca3af">No Image</text>
  </svg>
`);

const categories: Category[] = [
  { value: 'all', label: 'All Categories' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'smartphones', label: 'smartphones' },
  { value: 'home', label: 'Home & Kitchen' },
  { value: 'beauty', label: 'Beauty' },
  { value: 'sports', label: 'Sports' },
  { value: 'other', label: 'Other' }
];

export default function ProductManagement() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showInactive, setShowInactive] = useState(false);
  const [showFilter, setShowFilter] = useState(false);

// Replace the entire formatImageUrl function with:
const getProductImage = (product: Product): string => {
  if (!product) return PLACEHOLDER_IMAGE;
  
  // Debug: Log what we're receiving
  console.log('Product image data:', {
    images: product.images,
    imageUrl: product.imageUrl
  });
  
  // Check images array first (new format with Cloudinary)
  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    const primaryImage = product.images.find(img => img.isPrimary) || product.images[0];
    if (primaryImage?.url) {
      // Cloudinary URLs should already be full URLs
      const url = primaryImage.url.trim();
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }
    }
  }
  
  // Fallback to imageUrl (old format)
  if (product.imageUrl && typeof product.imageUrl === 'string') {
    const url = product.imageUrl.trim();
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
  }
  
  // If no valid URL found
  console.warn('No valid image URL for product:', product._id);
  return PLACEHOLDER_IMAGE;
};

// Update handleImageError for better debugging
const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, productId: string, imageUrl: string) => {
  console.warn(`Image failed to load for product ${productId}:`, imageUrl);
  const target = e.target as HTMLImageElement;
  target.src = PLACEHOLDER_IMAGE;
  target.onerror = null; // Prevent infinite loop
};



  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [token, userId] = await Promise.all([
        localStorage.getItem('authToken'),
        localStorage.getItem('userId')
      ]);

      if (!token || !userId) {
        throw new Error('Authentication required. Please login again.');
      }

      let url = `${API_BASE_URL}/products/user/${userId}`;
      const params = [];
      
      if (selectedCategory !== 'all') {
        params.push(`category=${selectedCategory}`);
      }
      
      if (showInactive) {
        params.push(`showInactive=true`);
      }
      
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }

      const response = await axios.get(url, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        const updatedProducts = response.data.products.map((product: Product) => {
          if (product.quantity === 0 && product.isActive) {
            return { ...product, isActive: false };
          }
          return product;
        });
        setProducts(updatedProducts || []);
      } else {
        throw new Error(response.data.message || 'Failed to fetch products');
      }
    } catch (error) {
      console.error("Fetch products error:", error);
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.message || error.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, showInactive]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        alert("Please login again");
        return;
      }

      const product = products.find(p => p._id === productId);
      
      if (!currentStatus && product && product.quantity === 0) {
        alert("Cannot Activate: Product cannot be activated because quantity is 0");
        return;
      }

      const response = await axios.patch(
        `${API_BASE_URL}/products/${productId}/status`,
        { isActive: !currentStatus },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        alert(`Product is now ${!currentStatus ? 'active' : 'inactive'}`);
        fetchProducts();
      }
    } catch (error) {
      console.error("Toggle status error:", error);
      if (axios.isAxiosError(error)) {
        alert(error.response?.data?.message || "Failed to update product status");
      } else {
        alert("Failed to update product status");
      }
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        alert("Please login again");
        return;
      }

      const response = await axios.delete(
        `${API_BASE_URL}/products/${productId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        alert("Product deleted successfully");
        fetchProducts();
      }
    } catch (error) {
      console.error("Delete error:", error);
      if (axios.isAxiosError(error)) {
        alert(error.response?.data?.message || "Failed to delete product");
      } else {
        alert("Failed to delete product");
      }
    }
  };

  const confirmDelete = (productId: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      handleDeleteProduct(productId);
    }
  };

  const handleEditProduct = (productId: string) => {
    router.push(`/seller/editproduct/${productId}`);
  };

  const handleAddProduct = () => {
    router.push('/seller/products/new');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 p-6">
        <p className="text-red-600 text-lg mb-4">{error}</p>
        <button 
          onClick={fetchProducts}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 p-6">
        <FiBox className="text-gray-400 text-5xl mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No products found</h2>
        <p className="text-gray-600 mb-6 text-center">You haven't added any products yet</p>
        <button 
          onClick={handleAddProduct}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <FiPlus className="mr-2" />
          Add Your First Product
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div className="flex items-center mb-4 sm:mb-0">
          <button 
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
          >
            <FiArrowLeft className="mr-2" /> Back
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">Your Products</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            <FiFilter className="mr-2" />
            Filter
          </button>
          
          <button
            onClick={() => router.push('/seller/products/new')}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <FiPlus className="mr-2" />
            Add Product
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilter && (
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Filter Products</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showInactive"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="showInactive" className="ml-2 block text-sm text-gray-900">
                Show inactive products
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product._id} className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
            <div className="relative">
           
<img
  src={getProductImage(product)}
  alt={product.title}
  className="w-full h-48 object-cover bg-gray-100"
  onError={(e) => handleImageError(e, product._id, getProductImage(product))}
  crossOrigin="anonymous"
  loading="lazy"
/>
              <div className="absolute top-2 right-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  product.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {product.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 truncate">{product.title}</h3>
              
              <div className="flex items-center justify-between mt-2">
                <p className="text-xl font-bold text-blue-600">${product.price?.toFixed(2) || '0.00'}</p>
                <p className={`text-sm ${
                  product.quantity > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  Stock: {product.quantity || 0}
                </p>
              </div>
              
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">{product.description}</p>
              
              <div className="flex items-center justify-between mt-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {categories.find(c => c.value === product.category)?.label || 'Other'}
                </span>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => toggleProductStatus(product._id, product.isActive)}
                    className={`p-2 rounded-md ${
                      product.isActive 
                        ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' 
                        : 'bg-green-100 text-green-600 hover:bg-green-200'
                    }`}
                    title={product.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {product.isActive ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                  
                  <button
                    onClick={() => handleEditProduct(product._id)}
                    className="p-2 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200"
                    title="Edit"
                  >
                    <FiEdit size={16} />
                  </button>
                  
                  <button
                    onClick={() => confirmDelete(product._id)}
                    className="p-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200"
                    title="Delete"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}