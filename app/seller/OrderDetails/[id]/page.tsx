"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import { 
  FiArrowLeft, 
  FiShoppingCart, 
  FiDollarSign, 
  FiUser, 
  FiMapPin, 
  FiPhone, 
  FiPackage, 
  FiCheckCircle, 
  FiTruck, 
  FiClock, 
  FiCalendar,
  FiPrinter,
  FiCopy
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

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
  userId?: string;
}

interface ShippingInfo {
  name: string;
  address: string;
  city: string;
  country: string;
  phone: string;
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
  shippingInfo: ShippingInfo;
  paymentMethod: string;
  status: string;
  totalPrice: number;
  createdAt: string;
  updatedAt?: string;
  deliveredAt?: string;
  shippedAt?: string;
}

const API_BASE_URL = "https://ecomercebackend-654m.onrender.com/api";
const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,' + btoa(`
  <svg width="150" height="150" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#f3f4f6"/>
    <text x="50%" y="50%" font-family="Arial" font-size="14" text-anchor="middle" dy=".3em" fill="#9ca3af">No Image</text>
  </svg>
`);

export default function OrderDetails() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

 const formatImageUrl = (product: Product): string => {
  if (!product) return PLACEHOLDER_IMAGE;
  
  // Priority 1: Check images array (Cloudinary format)
  if (product.images && product.images.length > 0) {
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

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, productId: string) => {
    const target = e.target as HTMLImageElement;
    target.src = PLACEHOLDER_IMAGE;
    target.onerror = null;
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('authToken');
      const userId = localStorage.getItem('userId');

      if (!token || !userId) {
        throw new Error('Authentication required. Please login again.');
      }

      // First get seller orders to find this specific order
      const response = await axios.get(`${API_BASE_URL}/orders/seller/${userId}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        const foundOrder = response.data.orders.find((o: Order) => o._id === orderId);
        if (foundOrder) {
          setOrder(foundOrder);
        } else {
          throw new Error('Order not found or you do not have permission to view this order');
        }
      } else {
        throw new Error(response.data.message || 'Failed to fetch order details');
      }
    } catch (err: any) {
      console.error("Fetch order details error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (newStatus: string) => {
    if (!order) return;
    
    try {
      setUpdatingStatus(true);
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('Authentication required');

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
        setOrder({ ...order, status: newStatus });
        alert(`Order status updated to ${newStatus}`);
      }
    } catch (err: any) {
      console.error("Update status error:", err);
      alert('Failed to update order status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      Processing: 'bg-orange-100 text-orange-800 border-orange-200',
      Shipped: 'bg-blue-100 text-blue-800 border-blue-200',
      Delivered: 'bg-green-100 text-green-800 border-green-200',
      Cancelled: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusIcon = (status: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      Processing: <FiClock className="w-4 h-4" />,
      Shipped: <FiTruck className="w-4 h-4" />,
      Delivered: <FiCheckCircle className="w-4 h-4" />,
      Cancelled: <FiClock className="w-4 h-4" />
    };
    return icons[status] || <FiPackage className="w-4 h-4" />;
  };

  const handlePrintOrder = () => {
    window.print();
  };

  const handleCopyOrderId = () => {
    if (order) {
      navigator.clipboard.writeText(order._id);
      alert('Order ID copied to clipboard!');
    }
  };

  const handleWhatsAppMessage = () => {
    if (order?.shippingInfo?.phone) {
      const message = `Hello ${order.shippingInfo.name}, regarding your order #${order._id.substring(18, 24).toUpperCase()}`;
      const url = `https://wa.me/${order.shippingInfo.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Order Not Found</h3>
          <p className="text-gray-600 mb-6">{error || 'The order you are looking for does not exist or you do not have permission to view it.'}</p>
          <button
            onClick={() => router.push('/seller/orders')}
            className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 print:bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/seller/orders')}
              className="flex items-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-lg transition-colors"
            >
              <FiArrowLeft className="w-5 h-5 mr-1" />
              Back to Orders
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
              <div className="flex items-center space-x-2 mt-1">
                <p className="text-sm text-gray-600">Order #{order._id.substring(18, 24).toUpperCase()}</p>
                <button
                  onClick={handleCopyOrderId}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Copy Order ID"
                >
                  <FiCopy className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleWhatsAppMessage}
              disabled={!order.shippingInfo?.phone}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                order.shippingInfo?.phone
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              <FaWhatsapp className="w-4 h-4 mr-2" />
              Contact Customer
            </button>
            <button
              onClick={handlePrintOrder}
              className="flex items-center bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors print:hidden"
            >
              <FiPrinter className="w-4 h-4 mr-2" />
              Print
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Order Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status Card */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Order Status</h2>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                  {getStatusIcon(order.status)}
                  <span className="ml-1">{order.status}</span>
                </span>
              </div>
              
              <div className="space-y-4">
                {order.status === 'Processing' && (
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <span className="text-orange-700">This order is being processed</span>
                    <button
                      onClick={() => updateOrderStatus('Shipped')}
                      disabled={updatingStatus}
                      className="bg-orange-600 text-white px-4 py-1 rounded text-sm hover:bg-orange-700 transition-colors disabled:opacity-50"
                    >
                      {updatingStatus ? 'Updating...' : 'Mark as Shipped'}
                    </button>
                  </div>
                )}
                
                {order.status === 'Shipped' && (
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-blue-700">This order has been shipped</span>
                    <button
                      onClick={() => updateOrderStatus('Delivered')}
                      disabled={updatingStatus}
                      className="bg-blue-600 text-white px-4 py-1 rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {updatingStatus ? 'Updating...' : 'Mark as Delivered'}
                    </button>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Order Date</div>
                    <div className="font-medium text-gray-900">{formatDate(order.createdAt)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Payment Method</div>
                    <div className="font-medium text-gray-900">{order.paymentMethod}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Total Amount</div>
                    <div className="font-bold text-lg text-gray-900">${order.totalPrice.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Products List */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Items</h2>
              
              <div className="space-y-4">
                {order.products.map((item, index) => (
                  <div key={index} className="flex items-start space-x-4 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="relative">
<img
  src={formatImageUrl(item.productId)}
  alt={item.productId.title}
  className="w-20 h-20 rounded object-cover border"
  onError={(e) => handleImageError(e, item.productId._id)}
  crossOrigin="anonymous"
  loading="lazy" // Add lazy loading
/>
                      <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.productId.title}</h3>
                      <div className="flex items-center justify-between mt-2">
                        <div className="text-sm text-gray-600">
                          Product ID: {item.productId._id.substring(18, 24).toUpperCase()}
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-900">${item.price.toFixed(2)}</div>
                          <div className="text-sm text-gray-600">Subtotal: ${(item.price * item.quantity).toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-6 border-t">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Order Total</span>
                  <span className="text-xl">${order.totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Customer & Shipping Info */}
          <div className="space-y-6">
            {/* Customer Information */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center mb-4">
                <FiUser className="w-5 h-5 text-gray-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Customer Information</h2>
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600">Customer Name</div>
                  <div className="font-medium text-gray-900">{order.shippingInfo.name}</div>
                </div>
                
                {order.userId?.email && (
                  <div>
                    <div className="text-sm text-gray-600">Email</div>
                    <div className="font-medium text-gray-900">{order.userId.email}</div>
                  </div>
                )}
                
                {order.userId?.username && (
                  <div>
                    <div className="text-sm text-gray-600">Username</div>
                    <div className="font-medium text-gray-900">{order.userId.username}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Shipping Information */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center mb-4">
                <FiMapPin className="w-5 h-5 text-gray-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Shipping Information</h2>
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600">Address</div>
                  <div className="font-medium text-gray-900">{order.shippingInfo.address}</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">City</div>
                    <div className="font-medium text-gray-900">{order.shippingInfo.city}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-600">Country</div>
                    <div className="font-medium text-gray-900">{order.shippingInfo.country}</div>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600">Phone Number</div>
                  <div className="font-medium text-gray-900 flex items-center">
                    <FiPhone className="w-4 h-4 mr-2" />
                    {order.shippingInfo.phone}
                    <button
                      onClick={handleWhatsAppMessage}
                      className="ml-2 text-green-600 hover:text-green-700"
                      title="Message on WhatsApp"
                    >
                      <FaWhatsapp className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Timeline */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center mb-4">
                <FiCalendar className="w-5 h-5 text-gray-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Order Timeline</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                    order.status === 'Processing' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
                  }`}>
                    <FiClock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Order Placed</div>
                    <div className="text-sm text-gray-600">{formatDate(order.createdAt)}</div>
                  </div>
                </div>
                
                {order.updatedAt && order.status !== 'Processing' && (
                  <div className="flex items-start">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                      order.status === 'Shipped' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                    }`}>
                      <FiTruck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Order {order.status}</div>
                      <div className="text-sm text-gray-600">{formatDate(order.updatedAt)}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}