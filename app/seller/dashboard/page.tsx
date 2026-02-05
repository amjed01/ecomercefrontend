// app/seller/dashboard/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { 
  FiPlus, 
  FiBox, 
  FiDollarSign, 
  FiUsers, 
  FiBarChart, 
  FiShoppingCart,
  FiTrendingUp,
  FiAlertCircle,
  FiRefreshCw,
  FiPackage,
  FiStar
} from 'react-icons/fi';

interface SellerStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  activeProducts: number;
  pendingOrders: number;
  lowStockProducts: number;
  averageRating: number;
}

interface RecentOrder {
  _id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  customerName: string;
}

interface LowStockProduct {
  _id: string;
  title: string;
  quantity: number;
}

interface Product {
  _id: string;
  title: string;
  price: number;
  imageUrl: string;
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

export default function SellerDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<SellerStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeProducts: 0,
    pendingOrders: 0,
    lowStockProducts: 0,
    averageRating: 0
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const calculateOrderTotal = (orderProducts: OrderProduct[]) => {
    return orderProducts.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  };

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('authToken');
      const userId = localStorage.getItem('userId');
      
      if (token && userId) {
        // Fetch products first to get total product count
        const productsResponse = await axios.get(`https://ecomercebackend-654m.onrender.com/api/products/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        let totalProducts = 0;
        let activeProducts = 0;
        let lowStockProductsCount = 0;
        const lowStockProductsList: LowStockProduct[] = [];

        if (productsResponse.data.success) {
          const products = productsResponse.data.products || [];
          totalProducts = products.length;
          activeProducts = products.filter((product: any) => product.isActive).length;
          lowStockProductsCount = products.filter((product: any) => product.quantity <= 5).length;
          
          // Get low stock products for display
          products
            .filter((product: any) => product.quantity <= 5)
            .slice(0, 5)
            .forEach((product: any) => {
              lowStockProductsList.push({
                _id: product._id,
                title: product.title,
                quantity: product.quantity
              });
            });
        }

        // Fetch orders to calculate total revenue and orders (like in orders page)
        const ordersResponse = await axios.get(`https://ecomercebackend-654m.onrender.com/api/orders/seller/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        let totalOrders = 0;
        let totalRevenue = 0;
        let pendingOrders = 0;
        const recentOrdersList: RecentOrder[] = [];

        if (ordersResponse.data.success) {
          const orders = ordersResponse.data.orders || [];
          totalOrders = orders.length;
          
          // Calculate total revenue and pending orders exactly like in orders page
          totalRevenue = orders.reduce((sum: number, order: Order) => {
            return sum + calculateOrderTotal(order.products);
          }, 0);
          
          pendingOrders = orders.filter(
            (order: Order) => order.status === 'Processing'
          ).length;

          // Get recent orders for display
          orders
            .slice(0, 5)
            .forEach((order: Order) => {
              recentOrdersList.push({
                _id: order._id,
                status: order.status,
                totalAmount: calculateOrderTotal(order.products),
                createdAt: order.createdAt,
                customerName: order.userId?.username || 'Guest'
              });
            });
        }

        // Update stats with calculated values
        setStats({
          totalProducts,
          totalOrders,
          totalRevenue,
          activeProducts,
          pendingOrders,
          lowStockProducts: lowStockProductsCount,
          averageRating: 4.5 // You can calculate this from product reviews if available
        });

        setRecentOrders(recentOrdersList);
        setLowStockProducts(lowStockProductsList);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      Processing: 'bg-yellow-100 text-yellow-800',
      Shipped: 'bg-blue-100 text-blue-800',
      Delivered: 'bg-green-100 text-green-800',
      Cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Refresh Button */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening with your store today.</p>
        </div>
        <button
          onClick={fetchDashboardData}
          disabled={refreshing}
          className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <FiRefreshCw className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Grid - Enhanced */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <FiTrendingUp className="mr-1" />
                All time earnings
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <FiDollarSign className="text-green-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalOrders}</p>
              <p className="text-xs text-blue-600 flex items-center mt-1">
                <FiShoppingCart className="mr-1" />
                {stats.pendingOrders} pending
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FiShoppingCart className="text-blue-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Products</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalProducts}</p>
              <p className="text-xs text-orange-600 flex items-center mt-1">
                <FiPackage className="mr-1" />
                {stats.activeProducts} active
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <FiBox className="text-orange-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Rating</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.averageRating.toFixed(1)}</p>
              <p className="text-xs text-purple-600 flex items-center mt-1">
                <FiStar className="mr-1" />
                Product ratings
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <FiStar className="text-purple-600 text-xl" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1 space-y-6">
          {/* Quick Actions Card */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <div 
                onClick={() => router.push('/seller/products/new')}
                className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FiPlus className="text-blue-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">Add New Product</h3>
                  <p className="text-xs text-gray-600">Create a new product listing</p>
                </div>
              </div>

              <div 
                onClick={() => router.push('/seller/products')}
                className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="p-2 bg-green-100 rounded-lg">
                  <FiBox className="text-green-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">Manage Products</h3>
                  <p className="text-xs text-gray-600">View and edit your products</p>
                </div>
              </div>

              <div 
                onClick={() => router.push('/seller/orders')}
                className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FiShoppingCart className="text-purple-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">View Orders</h3>
                  <p className="text-xs text-gray-600">Manage customer orders</p>
                </div>
              </div>
            </div>
          </div>

          {/* Low Stock Alerts */}
          {lowStockProducts.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <FiAlertCircle className="text-orange-500 mr-2" />
                Low Stock Alert
              </h2>
              <div className="space-y-3">
                {lowStockProducts.map((product) => (
                  <div key={product._id} className="flex justify-between items-center p-2 bg-orange-50 rounded">
                    <span className="text-sm font-medium text-gray-900 truncate flex-1">
                      {product.title}
                    </span>
                    <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                      {product.quantity} left
                    </span>
                  </div>
                ))}
                <button 
                  onClick={() => router.push('/seller/products?filter=low-stock')}
                  className="w-full text-sm text-blue-600 hover:text-blue-700 text-center pt-2"
                >
                  View all low stock items
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Recent Orders & Analytics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Recent Orders</h2>
              <button 
                onClick={() => router.push('/seller/orders')}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                View all
              </button>
            </div>
            <div className="space-y-4">
              {recentOrders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FiShoppingCart className="mx-auto text-3xl mb-2" />
                  <p>No orders yet</p>
                </div>
              ) : (
                recentOrders.map((order) => (
                  <div key={order._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        Order #{order._id.substring(18, 24).toUpperCase()}
                      </p>
                      <p className="text-xs text-gray-600">
                        {order.customerName} • {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(order.totalAmount)}
                      </p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Inventory Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Products</span>
                  <span className="text-sm font-medium">{stats.totalProducts}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Active Products</span>
                  <span className="text-sm font-medium text-green-600">{stats.activeProducts}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Low Stock Items</span>
                  <span className="text-sm font-medium text-orange-600">{stats.lowStockProducts}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Orders</span>
                  <span className="text-sm font-medium">{stats.totalOrders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Pending Orders</span>
                  <span className="text-sm font-medium text-yellow-600">{stats.pendingOrders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Revenue</span>
                  <span className="text-sm font-medium text-green-600">{formatCurrency(stats.totalRevenue)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}