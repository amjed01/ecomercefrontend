"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { FiShoppingCart, FiDollarSign, FiClock, FiRefreshCw, FiBox, FiCheckCircle, FiTruck, FiXCircle, FiEye } from 'react-icons/fi';
import Link from 'next/link';

interface Product {
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

interface OrderProduct {
  productId: Product;
  quantity: number;
  price: number;
}

interface User {
  username: string;
  email?: string;
}

interface Order {
  _id: string;
  userId: User;
  products: OrderProduct[];
  status: string;
  createdAt: string;
  updatedAt?: string;
}

interface Stats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
}

const API_BASE_URL = "https://ecomercebackend-654m.onrender.com/api";
// Use base64 placeholder to avoid 404 errors (same as other components)
const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,' + btoa(`
  <svg width="150" height="150" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#f3f4f6"/>
    <text x="50%" y="50%" font-family="Arial" font-size="14" text-anchor="middle" dy=".3em" fill="#9ca3af">No Image</text>
  </svg>
`);

export default function SellerOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0
  });

const formatImageUrl = (product: Product): string => {
  if (!product) return PLACEHOLDER_IMAGE;
  
  // Check images array first (Cloudinary format)
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
  
  // Fallback to imageUrl field
  if (product.imageUrl) {
    const url = product.imageUrl.trim();
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
  }
  
  // No valid image found
  return PLACEHOLDER_IMAGE;
};

  // Handle image error (same as other components)
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, productId: string) => {
    console.log("Image failed to load for product:", productId);
    const target = e.target as HTMLImageElement;
    target.src = PLACEHOLDER_IMAGE;
    target.onerror = null; // Prevent infinite loop
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
  try {
    setLoading(true);
    setError(null);
    
    const token = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');

    if (!token || !userId) {
      throw new Error('Authentication required. Please login again.');
    }

    const response = await axios.get(`${API_BASE_URL}/orders/seller/${userId}`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      // DEBUG: Check image URLs in response
      console.log('Orders API Response:', response.data);
      
      if (response.data.orders && response.data.orders.length > 0) {
        response.data.orders.forEach((order: Order, orderIndex: number) => {
          console.log(`Order ${orderIndex}:`, {
            orderId: order._id,
            productCount: order.products.length
          });
          
          order.products.forEach((product: OrderProduct, productIndex: number) => {
            console.log(`  Product ${productIndex}:`, {
              title: product.productId.title,
              hasImages: !!product.productId.images?.length,
              imageUrl: product.productId.imageUrl,
              images: product.productId.images?.map(img => ({
                url: img.url,
                isPrimary: img.isPrimary
              }))
            });
          });
        });
      }
      
      const formattedOrders: Order[] = response.data.orders.map((order: Order) => ({
        ...order,
        products: order.products.map(product => ({
          ...product,
          productId: {
            ...product.productId,
            // Don't format imageUrl here, we'll use formatImageUrl function
          }
        }))
      }));
      
      setOrders(formattedOrders);
      
      // Calculate stats
      const totalRevenue = formattedOrders.reduce((sum, order) => {
        return sum + calculateOrderTotal(order.products);
      }, 0);
      
      const pendingOrders = formattedOrders.filter(
        order => order.status === 'Processing'
      ).length;
      
      setStats({
        totalOrders: formattedOrders.length,
        totalRevenue,
        pendingOrders
      });
    } else {
      throw new Error(response.data.message || 'Failed to fetch orders');
    }
  } catch (err: any) {
    console.error("Fetch orders error:", err);
    setError(err.message);
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await axios.put(
        `${API_BASE_URL}/orders/${orderId}/status`,
        { status: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order._id === orderId ? { ...order, status: newStatus } : order
          )
        );
        
        setStats(prevStats => ({
          ...prevStats,
          pendingOrders: newStatus === 'Delivered' 
            ? prevStats.pendingOrders - 1 
            : prevStats.pendingOrders
        }));
      }
    } catch (err: any) {
      console.error("Update status error:", err);
    }
  };

  const calculateOrderTotal = (orderProducts: OrderProduct[]) => {
    return orderProducts.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      Processing: 'bg-orange-100 text-orange-800',
      Shipped: 'bg-blue-100 text-blue-800',
      Delivered: 'bg-green-100 text-green-800',
      Cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      Processing: <FiClock className="w-4 h-4" />,
      Shipped: <FiTruck className="w-4 h-4" />,
      Delivered: <FiCheckCircle className="w-4 h-4" />,
      Cancelled: <FiXCircle className="w-4 h-4" />
    };
    return icons[status] || <FiBox className="w-4 h-4" />;
  };

  const StatsCard = ({ title, value, icon, color }: { title: string; value: number | string; icon: React.ReactNode; color: string }) => (
    <div className={`${color} rounded-lg p-6 shadow-sm`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          <p className="text-sm text-gray-600">{title}</p>
        </div>
        <div className="text-2xl text-gray-600">
          {icon}
        </div>
      </div>
    </div>
  );

   const OrderCard = ({ order }: { order: Order }) => (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-4 hover:shadow-md transition-shadow cursor-pointer"
         onClick={() => router.push(`/seller/OrderDetails/${order._id}`)}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm font-medium text-gray-600">ORDER #{order._id?.substring(18, 24).toUpperCase()}</p>
          <p className="text-xs text-gray-500">
            {new Date(order.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              updateOrderStatus(order._id, 'Delivered');
            }}
            disabled={order.status !== 'Processing'}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              order.status === 'Processing' 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-200 text-gray-600 cursor-not-allowed'
            }`}
          >
            {order.status === 'Processing' ? 'Mark Delivered' : order.status}
          </button>
          <Link 
            href={`/seller/OrderDetails/${order._id}`}
            onClick={(e) => e.stopPropagation()}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
            title="View Order Details"
          >
            <FiEye className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        {order.products.map((product, index) => (
          <div key={index} className="flex items-center space-x-3">
<img
  src={formatImageUrl(product.productId)}
  alt={product.productId.title}
  className="w-12 h-12 rounded object-cover bg-gray-100"
  onError={(e) => handleImageError(e, product.productId._id)}
  crossOrigin="anonymous"
  loading="lazy" // Add lazy loading
/>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {product.productId.title}
              </p>
              <p className="text-sm text-gray-600">
                {product.quantity} × ${product.price.toFixed(2)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center pt-4 border-t">
        <p className="text-sm text-gray-600">
          Customer: {order.userId?.username || 'Guest'}
        </p>
        <p className="text-sm font-semibold text-gray-900">
          Total: ${calculateOrderTotal(order.products).toFixed(2)}
        </p>
      </div>
    </div>
  );
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Seller Orders</h1>
          <p className="text-gray-600">Manage your customer orders</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard
            title="Total Orders"
            value={stats.totalOrders}
            icon={<FiShoppingCart className="w-6 h-6" />}
            color="bg-white"
          />
          <StatsCard
            title="Total Revenue"
            value={`$${stats.totalRevenue.toFixed(2)}`}
            icon={<FiDollarSign className="w-6 h-6" />}
            color="bg-white"
          />
          <StatsCard
            title="Pending Orders"
            value={stats.pendingOrders}
            icon={<FiClock className="w-6 h-6" />}
            color="bg-white"
          />
        </div>

        {/* Orders List */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium text-gray-900">Recent Orders</h2>
            <button
              onClick={fetchOrders}
              className="flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              <FiRefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </button>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-12">
              <FiShoppingCart className="mx-auto w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
              <p className="text-gray-600">When you receive orders, they'll appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.slice(0, 5).map((order) => (
                <OrderCard key={order._id} order={order} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}