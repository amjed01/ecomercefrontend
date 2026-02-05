"use client";
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";

// --- START: Dependency Mocking and Replacement ---
const mockRouter = {
  push: (path: string) => {
    console.log(`[MOCK NAVIGATION] Attempted to navigate to: ${path}`);
    // In real implementation, this would be: router.push(path)
  },
  back: () => {
    console.log(`[MOCK NAVIGATION] Going back`);
  }
};
const useRouter = () => mockRouter;

// Enhanced icons with more variants
const IconLoader = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

const IconShoppingBag = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <path d="M16 10a4 4 0 0 1-8 0"></path>
  </svg>
);

const IconTag = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
    <line x1="7" y1="7" x2="7.01" y2="7"></line>
  </svg>
);

const IconCalendar = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const IconCheckCircle = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

const IconClock = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

const IconDollarSign = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"></line>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
  </svg>
);

const IconTruck = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13"></rect>
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
    <circle cx="5.5" cy="18.5" r="2.5"></circle>
    <circle cx="18.5" cy="18.5" r="2.5"></circle>
  </svg>
);

const IconXCircle = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="15" y1="9" x2="9" y2="15"></line>
    <line x1="9" y1="9" x2="15" y2="15"></line>
  </svg>
);

const IconFilter = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
  </svg>
);

const IconSearch = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const IconDownload = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
);

const IconEye = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const IconRefreshCw = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"></polyline>
    <polyline points="1 20 1 14 7 14"></polyline>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
  </svg>
);

const IconX = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const IconAlertTriangle = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
    <line x1="12" y1="9" x2="12" y2="13"></line>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);

// --- END: Dependency Mocking and Replacement ---

interface Product {
  productId: {
    _id: string;
    title: string;
    imageUrl: string;
    price: number;
    images?: Array<{
      url: string;
      isPrimary: boolean;
      order: number;
    }>;
  };
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  createdAt: string;
  isDelivered: boolean;
  isPaid: boolean;
  totalPrice: number;
  products: Product[];
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  shippingInfo?: {
    address: string;
    city: string;
    country: string;
    phone: string;
  };
}

interface SimpleProduct {
  _id: string;
  title: string;
  price: number;
  imageUrl: string;
  product_location: string;
  livraison: string;
  couleur?: string;
  rating: number;
}

type OrderStatus = 'all' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

// Use base64 placeholder to avoid 404 errors (same as other components)
const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,' + btoa(`
  <svg width="150" height="150" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#f3f4f6"/>
    <text x="50%" y="50%" font-family="Arial" font-size="14" text-anchor="middle" dy=".3em" fill="#9ca3af">No Image</text>
  </svg>
`);

const OrdersPage: React.FC = () => {
  const router = useRouter(); 
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price-high' | 'price-low'>('newest');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState<string | null>(null);
  const [cancelConfirmOrder, setCancelConfirmOrder] = useState<Order | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [data, setData] = useState<SimpleProduct[]>([]);

  // Function to format image URL properly (same as other components)
  const formatImageUrl = (product: Product['productId']): string => {
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

  // Function to get image URL for a product (same approach as other components)
  const getImageUrl = (product: Product) => {
    return formatImageUrl(product.productId);
  };

  // Handle image error (same as other components)
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, productId: string) => {
    console.log("Image failed to load for product:", productId);
    const target = e.target as HTMLImageElement;
    target.src = PLACEHOLDER_IMAGE;
    target.onerror = null; // Prevent infinite loop
  };

  const getStatusDetails = (status: string, isDelivered: boolean) => {
    // ... [This function remains exactly the same] ...
    switch (status) {
      case 'Processing':
        return { text: 'Processing', color: 'text-yellow-700 bg-yellow-100', icon: IconClock, canCancel: true };
      case 'Shipped':
        return { text: 'Shipped', color: 'text-blue-700 bg-blue-100', icon: IconTruck, canCancel: false };
      case 'Delivered':
        return { text: 'Delivered', color: 'text-green-700 bg-green-100', icon: IconCheckCircle, canCancel: false };
      case 'Cancelled':
        return { text: 'Cancelled', color: 'text-red-700 bg-red-100', icon: IconXCircle, canCancel: false };
      default:
        return isDelivered 
          ? { text: 'Delivered', color: 'text-green-700 bg-green-100', icon: IconCheckCircle, canCancel: false }
          : { text: 'Processing', color: 'text-yellow-700 bg-yellow-100', icon: IconClock, canCancel: true };
    }
  };

  const fetchOrders = async (showRefresh = false) => {
    
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    setError(null);
    
    try {
      if (typeof window === "undefined") return;
      const token = localStorage.getItem("authToken");
      const userId = localStorage.getItem("userId");

      if (!token || !userId) {
        
        console.warn("User is not authenticated. Cannot fetch orders.");
        setOrders([]);
        setError("Please log in to view your orders");
        return;
      }

      const response = await axios.get(`https://ecomercebackend-654m.onrender.com/api/orders/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });

      const formattedOrders = response.data.map((order: Order) => ({
        ...order,
        products: order.products.map((p: Product) => ({
          ...p,
          productId: {
            ...p.productId,
            // No need to format imageUrl here since we'll use formatImageUrl when displaying
            imageUrl: p.productId.imageUrl || ""
          }
        })),
      }));

      setOrders(formattedOrders);
      setFilteredOrders(formattedOrders);

      // Removed the fetchAllProductImages call since we're not using blob URLs anymore

    } catch (error: any) {
      
      console.error("Error fetching orders:", error);
      setError(
        error.response?.data?.message || 
        error.message || 
        "Failed to load orders. Please try again."
      );
      setOrders([]);
    } finally {
      
      setLoading(false);
      setRefreshing(false);
    }
  };

  const cancelOrder = async (orderId: string) => {
   
    setCancellingOrder(orderId);
    setError(null);
    
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await axios.put(
        `https://ecomercebackend-654m.onrender.com/api/orders/${orderId}/status`,
        { status: 'Cancelled' },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        }
      );

      if (response.data.success) {
        // Update the order in local state
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order._id === orderId 
              ? { ...order, status: 'Cancelled' }
              : order
          )
        );
        
        setSuccessMessage('Order cancelled successfully!');
        setCancelConfirmOrder(null);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (error: any) {
      console.error("Error cancelling order:", error);
      setError(
        error.response?.data?.message || 
        error.message || 
        "Failed to cancel order. Please try again."
      );
    } finally {
      setCancellingOrder(null);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Filter and sort orders
  useEffect(() => {
    // ... [This useEffect remains exactly the same] ...
    let result = [...orders];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(order => 
        order.products.some(product => 
          product.productId.title.toLowerCase().includes(term)
        ) ||
        order._id.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(order => {
        if (statusFilter === 'processing') return order.status === 'Processing';
        if (statusFilter === 'shipped') return order.status === 'Shipped';
        if (statusFilter === 'delivered') return order.status === 'Delivered' || order.isDelivered;
        if (statusFilter === 'cancelled') return order.status === 'Cancelled';
        return true;
      });
    }

    // Sort orders
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'price-high':
          return b.totalPrice - a.totalPrice;
        case 'price-low':
          return a.totalPrice - b.totalPrice;
        default:
          return 0;
      }
    });

    setFilteredOrders(result);
  }, [orders, searchTerm, statusFilter, sortBy]);

  const handleRefresh = () => {
    fetchOrders(true);
  };

  const handleViewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleCancelOrder = (order: Order) => {
    setCancelConfirmOrder(order);
  };

  const confirmCancelOrder = () => {
    if (cancelConfirmOrder) {
      cancelOrder(cancelConfirmOrder._id);
    }
  };

  const handleExportOrders = () => {
    // ... [This function remains exactly the same] ...
    const csvContent = [
      ['Order ID', 'Date', 'Status', 'Total Price', 'Products Count'],
      ...filteredOrders.map(order => [
        order._id,
        new Date(order.createdAt).toLocaleDateString(),
        order.status,
        `$${order.totalPrice.toFixed(2)}`,
        order.products.length.toString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getTotalSpent = () => {
    return orders
      .filter(order => order.status !== 'Cancelled')
      .reduce((total, order) => total + order.totalPrice, 0);
  };

  const getOrderCountByStatus = (status: OrderStatus) => {
    if (status === 'all') return orders.length;
    return orders.filter(order => {
      if (status === 'processing') return order.status === 'Processing';
      if (status === 'shipped') return order.status === 'Shipped';
      if (status === 'delivered') return order.status === 'Delivered' || order.isDelivered;
      if (status === 'cancelled') return order.status === 'Cancelled';
      return false;
    }).length;
  };

  // --- RENDER STATES ---

  if (loading && !refreshing) {
    // ... [This remains exactly the same] ...
    return (
      <div className="min-h-screen pt-40 flex flex-col items-center justify-center bg-gray-50">
        <IconLoader className="w-10 h-10 text-gray-800 animate-spin mb-4" />
        <p className="text-xl font-medium text-gray-700">Loading your purchase history...</p>
      </div>
    );
  }

  if (error && orders.length === 0) {
    // ... [This remains exactly the same] ...
    return (
      <div className="min-h-screen pt-40 flex flex-col items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-10 text-center border border-gray-100">
          <IconXCircle className="w-16 h-16 text-red-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Unable to Load Orders</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-4">
            <button
              onClick={handleRefresh}
              className="flex-1 bg-gray-800 text-white py-3 px-4 rounded-xl hover:bg-gray-700 transition-colors font-semibold shadow-lg flex items-center justify-center"
            >
              <IconRefreshCw className="w-5 h-5 mr-2" />
              Try Again
            </button>
            <button
              onClick={() => router.push("/products")}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-500 transition-colors font-semibold shadow-lg"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Success Message */}
        {successMessage && (
          // ... [This remains exactly the same] ...
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-xl flex items-center justify-between">
            <div className="flex items-center">
              <IconCheckCircle className="w-5 h-5 mr-2" />
              {successMessage}
            </div>
            <button onClick={() => setSuccessMessage(null)}>
              <IconX className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          // ... [This remains exactly the same] ...
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl flex items-center justify-between">
            <div className="flex items-center">
              <IconXCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
            <button onClick={() => setError(null)}>
              <IconX className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Header with Stats */}
        <div className="mb-10">
          
          <h1 className="text-4xl font-extrabold mb-4 text-center text-gray-900">
            <IconTag className="inline mr-3 text-gray-800 w-8 h-8" /> Your Purchase History
          </h1>
          
          {orders.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-200 text-center">
                <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
                <p className="text-sm text-gray-600">Total Orders</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-200 text-center">
                <p className="text-2xl font-bold text-green-600">${getTotalSpent().toFixed(2)}</p>
                <p className="text-sm text-gray-600">Total Spent</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-200 text-center">
                <p className="text-2xl font-bold text-blue-600">{getOrderCountByStatus('delivered')}</p>
                <p className="text-sm text-gray-600">Delivered</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-200 text-center">
                <p className="text-2xl font-bold text-yellow-600">{getOrderCountByStatus('processing')}</p>
                <p className="text-sm text-gray-600">Processing</p>
              </div>
            </div>
          )}
        </div>

        {/* Filters and Controls */}
        {orders.length > 0 && (
          // ... [This entire section remains exactly the same] ...
          <div className="mb-8 bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
              <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                  <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search orders or products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Status Filter */}
                <div className="flex gap-2 flex-wrap">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as OrderStatus)}
                    className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>

                  {/* Sort */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="price-low">Price: Low to High</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 w-full lg:w-auto">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  <IconRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <button
                  onClick={handleExportOrders}
                  className="flex items-center gap-2 px-4 py-2 text-green-700 bg-green-100 rounded-xl hover:bg-green-200 transition-colors"
                >
                  <IconDownload className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>

            {/* Results Count */}
            <div className="mt-4 text-sm text-gray-600">
              Showing {filteredOrders.length} of {orders.length} orders
            </div>
          </div>
        )}

        {/* Orders List */}
        <div className="space-y-6">
          {filteredOrders.length === 0 && orders.length > 0 ? (
            // ... [This remains exactly the same] ...
            <div className="text-center py-12 bg-white rounded-2xl shadow-lg border border-gray-200">
              <IconSearch className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No orders found</h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const statusDetails = getStatusDetails(order.status, order.isDelivered);
              const StatusIconComponent = statusDetails.icon;
              
              const orderDate = new Date(order.createdAt).toLocaleDateString("en-US", {
                year: 'numeric', month: 'short', day: 'numeric',
              });
              
              return (
                <div
                  key={order._id}
                  className="rounded-2xl shadow-xl border border-gray-200 bg-white overflow-hidden transition duration-300 hover:shadow-2xl"
                >
                  {/* Order Summary Header */}
                  <div className="px-6 py-5 flex flex-wrap justify-between items-center bg-gray-50 border-b border-gray-200">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600 font-medium flex items-center">
                        <IconCalendar className="w-4 h-4 mr-2 text-gray-400" />
                        Order Date: <span className="text-gray-800 ml-1 font-semibold">{orderDate}</span>
                      </p>
                      <p className="text-sm text-gray-600 font-medium">
                        Order ID: <span className="text-xs font-mono text-gray-500">{order._id.substring(0, 10)}...</span>
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-4 mt-4 sm:mt-0">
                      <span 
                        className={`text-sm font-bold px-3 py-1 rounded-full flex items-center ${statusDetails.color}`}
                      >
                        <StatusIconComponent className="w-4 h-4 mr-1" />
                        {statusDetails.text}
                      </span>
                      <p className="text-2xl font-extrabold text-gray-900 flex items-center">
                        <IconDollarSign className="w-5 h-5 text-green-600 mr-1" />
                        ${order.totalPrice.toFixed(2)}
                      </p>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewOrderDetails(order)}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          <IconEye className="w-4 h-4" />
                          Details
                        </button>
                        {statusDetails.canCancel && (
                          <button
                            onClick={() => handleCancelOrder(order)}
                            disabled={cancellingOrder === order._id}
                            className="flex items-center gap-1 text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                          >
                            <IconX className="w-4 h-4" />
                            {cancellingOrder === order._id ? 'Cancelling...' : 'Cancel'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Products List - IMAGE FIXED HERE */}
                  <div className="divide-y divide-gray-100">
                    {order.products.map((product, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-4 px-6 py-5 transition hover:bg-gray-50 cursor-pointer"
                        onClick={() => router.push(`/productdetail/${product.productId._id}`)} 
                      >
                        {/* Image display fixed */}
                        <img
                          src={getImageUrl(product)}
                          alt={product.productId.title}
                          className="w-16 h-16 object-contain rounded-xl bg-gray-50 p-1"
                          onError={(e) => handleImageError(e, product.productId._id)}
                          crossOrigin="anonymous"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg text-gray-800 line-clamp-1">
                            {product.productId.title}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Unit Price: ${product.price.toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-md font-medium text-gray-600">Qty: {product.quantity}</p>
                          <p className="text-xl font-bold text-gray-900 mt-1">
                            ${(product.price * product.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Empty State */}
        {orders.length === 0 && !loading && !error && (
          // ... [This remains exactly the same] ...
          <div className="min-h-96 flex flex-col items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-10 text-center border border-gray-100">
              <IconShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-gray-800 mb-2">No Orders Found</h2>
              <p className="text-gray-600 mb-8">Ready to make your first purchase? Explore our selection now!</p>
              <button
                onClick={() => router.push("/products")} 
                className="w-full bg-gray-800 text-white py-3 px-4 rounded-xl hover:bg-gray-700 transition-colors font-semibold shadow-lg"
              >
                Start Shopping
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Details Modal - IMAGES FIXED HERE TOO */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">Order Details</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <IconX className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Order Information</h4>
                  <p className="text-sm text-gray-600">ID: {selectedOrder._id}</p>
                  <p className="text-sm text-gray-600">Date: {new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-600">Status: {selectedOrder.status}</p>
                  <p className="text-sm text-gray-600">Payment: {selectedOrder.isPaid ? 'Paid' : 'Pending'}</p>
                </div>
                
                {selectedOrder.shippingInfo && (
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Shipping Information</h4>
                    <p className="text-sm text-gray-600">{selectedOrder.shippingInfo.address}</p>
                    <p className="text-sm text-gray-600">{selectedOrder.shippingInfo.city}</p>
                    <p className="text-sm text-gray-600">{selectedOrder.shippingInfo.country}</p>
                    <p className="text-sm text-gray-600">Phone: {selectedOrder.shippingInfo.phone}</p>
                  </div>
                )}
              </div>

              {/* Products - IMAGES FIXED HERE */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-4">Products ({selectedOrder.products.length})</h4>
                <div className="space-y-3">
                  {selectedOrder.products.map((product, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      {/* Image display fixed */}
                      <img
                        src={getImageUrl(product)}
                        alt={product.productId.title}
                        className="w-16 h-16 object-contain rounded-xl bg-white p-1"
                        onError={(e) => handleImageError(e, product.productId._id)}
                        crossOrigin="anonymous"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{product.productId.title}</p>
                        <p className="text-sm text-gray-600">Qty: {product.quantity} × ${product.price.toFixed(2)}</p>
                      </div>
                      <p className="font-semibold text-gray-900">
                        ${(product.quantity * product.price).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total Amount:</span>
                  <span>${selectedOrder.totalPrice.toFixed(2)}</span>
                </div>
              </div>

              {/* Cancel Button for Processing Orders */}
              {selectedOrder.status === 'Processing' && (
                <div className="border-t pt-4">
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      handleCancelOrder(selectedOrder);
                    }}
                    className="w-full bg-red-600 text-white py-3 px-4 rounded-xl hover:bg-red-700 transition-colors font-semibold flex items-center justify-center"
                  >
                    <IconX className="w-5 h-5 mr-2" />
                    Cancel This Order
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelConfirmOrder && (
        // ... [This entire modal remains exactly the same] ...
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <IconAlertTriangle className="w-6 h-6 text-yellow-600" />
                <h3 className="text-xl font-bold text-gray-900">Cancel Order</h3>
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Are you sure you want to cancel this order? This action cannot be undone.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800">
                  <strong>Order ID:</strong> {cancelConfirmOrder._id}<br />
                  <strong>Total:</strong> ${cancelConfirmOrder.totalPrice.toFixed(2)}<br />
                  <strong>Items:</strong> {cancelConfirmOrder.products.length} product(s)
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setCancelConfirmOrder(null)}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-400 transition-colors font-semibold"
                  disabled={cancellingOrder !== null}
                >
                  Go Back
                </button>
                <button
                  onClick={confirmCancelOrder}
                  disabled={cancellingOrder !== null}
                  className="flex-1 bg-red-600 text-white py-3 px-4 rounded-xl hover:bg-red-700 transition-colors font-semibold flex items-center justify-center disabled:opacity-50"
                >
                  {cancellingOrder ? (
                    <>
                      <IconLoader className="w-5 h-5 mr-2 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <IconX className="w-5 h-5 mr-2" />
                      Yes, Cancel Order
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;