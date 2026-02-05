"use client";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { FaSearch, FaShoppingCart, FaHeart, FaUser, FaBars, FaTimes } from "react-icons/fa";
import { useRouter } from "next/navigation";
import axios from "axios";

// Interface matching your actual cart structure
interface ProductDetails {
  _id: string;
  title: string;
  price: number;
  description: string;
  product_location?: string;
  imageUrl?: string;
  livraison?: string;
}

interface CartItem {
  _id: string;
  quantity: number;
  cartItem: ProductDetails;
}

const Header: React.FC = () => {
  const [cartTotal, setCartTotal] = useState(0.0);
  const [cartCount, setCartCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Client-side authentication check
    const token = localStorage.getItem("authToken");
    const userId = localStorage.getItem("userId");
    setIsLoggedIn(!!token && !!userId);

    // Load cart data
    fetchCartData();

    // Scroll handler
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch cart data from your API
  const fetchCartData = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const userId = localStorage.getItem("userId");
      
      if (!token || !userId) {
        setCartTotal(0.0);
        setCartCount(0);
        return;
      }

      const response = await axios.get(`https://ecomercebackend-654m.onrender.com/api/cart/find/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data && response.data[0] && response.data[0].products) {
        const cartItems: CartItem[] = response.data[0].products;
        
        // Calculate total and count
        const total = cartItems.reduce((sum, item) => {
          const price = item.cartItem?.price || 0;
          return sum + (price * item.quantity);
        }, 0);
        
        const count = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        
        setCartTotal(total);
        setCartCount(count);
      } else {
        setCartTotal(0.0);
        setCartCount(0);
      }
    } catch (error) {
      console.error("Error fetching cart data for header:", error);
      setCartTotal(0.0);
      setCartCount(0);
    }
  };

  // Listen for cart updates
  useEffect(() => {
    const handleCartUpdate = () => {
      fetchCartData();
    };

    // Listen for custom events when cart is updated
    window.addEventListener('cartUpdated', handleCartUpdate);
    
    // Poll for cart updates every 2 seconds (optional, for real-time sync)
    const interval = setInterval(fetchCartData, 2000);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      clearInterval(interval);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch(e);
    }
  };

  const categories = [
    "Electronics", "Fashion", "Home & Garden", "Beauty", "Sports",
    "Toys", "Books", "Automotive", "Health"
  ];

  return (
    <header className={`fixed w-full top-0 left-0 z-50 transition-all duration-300 ${
      isScrolled
        ? "bg-white/95 backdrop-blur-md shadow-2xl shadow-black/5 border-b border-gray-100"
        : "bg-white/90 backdrop-blur-sm"
    }`}>

      {/* === TOP BAR (Logo, Search, Icons) === */}
      <div className="py-4 border-b border-gray-100/70">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-4 sm:px-6 lg:px-8">

          {/* === LOGO === */}
          <Link 
            href="/" 
            className="flex items-center space-x-3 group transition-transform duration-300 hover:scale-105"
          >
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl flex items-center justify-center shadow-lg shadow-gray-300 group-hover:shadow-xl group-hover:shadow-gray-400 transition-all duration-300">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-gray-800 to-gray-600 rounded-2xl opacity-20 blur-sm group-hover:opacity-30 transition-opacity duration-300"></div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-baseline">
                <span className="text-gray-900 font-extrabold text-3xl tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Peakbuy
                </span>
                <span className="text-gray-800 text-2xl font-black ml-0.5">.</span>
              </div>
              <span className="text-xs text-gray-500 font-medium tracking-wide">Premium Shopping Experience</span>
            </div>
          </Link>

          {/* === SEARCH BAR (Desktop/Tablet) === */}
          <form 
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-xl xl:max-w-2xl mx-4 lg:mx-8 relative"
          >
            <div className="relative w-full group">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Discover amazing products, brands, and deals..."
                className="w-full rounded-2xl py-3 pl-6 pr-14 text-sm border-2 border-gray-200/80 shadow-lg shadow-gray-200/50 focus:outline-none focus:border-gray-600/50 transition-all duration-300 bg-white/80 backdrop-blur-sm text-gray-800 placeholder-gray-400"
              />
              <button 
                type="submit"
                className="absolute top-1/2 -translate-y-1/2 right-2 bg-gray-800 hover:bg-gray-700 transition-all duration-300 p-3 rounded-xl shadow-lg group-hover:scale-[1.03]"
              >
                <FaSearch className="text-white h-4 w-4" />
              </button>
            </div>
          </form>

          {/* === ACTION ICONS (Account, Favorites, Cart) === */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            
            {/* Favorites */}
            <Link
              href="/favorites"
              className="hidden sm:group relative sm:flex items-center space-x-2 p-3 rounded-2xl transition-all duration-300 hover:bg-gray-50 hover:shadow-lg"
            >
              <div className="relative">
                <FaHeart className="text-xl text-gray-600 group-hover:text-gray-800 transition-colors duration-300" />
              </div>
              <div className="hidden lg:flex flex-col leading-tight text-left">
                <span className="text-xs text-gray-500">My</span>
                <strong className="text-sm font-semibold text-gray-900">Favorites</strong>
              </div>
            </Link>

            {/* Account */}
            <Link
              href={isLoggedIn ? "/profile" : "/login"}
              className="group relative flex items-center space-x-2 p-3 rounded-2xl transition-all duration-300 hover:bg-gray-50 hover:shadow-lg"
            >
              <div className="relative">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center group-hover:bg-gray-800 transition-all duration-300">
                  <FaUser className="text-gray-600 group-hover:text-white text-sm transition-colors duration-300" />
                </div>
              </div>
              <div className="hidden lg:flex flex-col leading-tight text-left">
                <span className="text-xs text-gray-500">{isLoggedIn ? "Welcome" : "Sign In"}</span>
                <strong className="text-sm font-semibold text-gray-900">Account</strong>
              </div>
            </Link>

            {/* Shopping Cart */}
            <div className="relative group">
              <Link
                href="/cart"
                className="flex items-center p-3 rounded-2xl transition-all duration-300 hover:bg-gray-50 hover:shadow-lg"
              >
                <div className="relative">
                  <FaShoppingCart className="h-6 w-6 text-gray-600 group-hover:text-gray-800 transition-colors duration-300" />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-[10px] rounded-full px-[6px] py-[2px] font-bold text-white shadow-lg min-w-[20px] text-center">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                </div>
              </Link>
              {/* Cart Total Tooltip */}
              <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none shadow-2xl">
                <div className="font-semibold">${cartTotal.toFixed(2)}</div>
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="p-3 lg:hidden text-gray-700 hover:text-gray-900 transition-colors duration-300"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <FaTimes className="h-5 w-5" /> : <FaBars className="h-5 w-5" />}
            </button>

          </div>
        </div>
      </div>

      {/* === MOBILE MENU === */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white shadow-xl">
          <div className="max-w-7xl mx-auto px-4 py-4">
            {/* Mobile Search Bar */}
            <form onSubmit={handleSearch} className="relative mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search products..."
                className="w-full rounded-xl py-3 pl-4 pr-12 text-sm border border-gray-200 focus:outline-none focus:border-gray-600/50 bg-white text-gray-800 placeholder-gray-400"
              />
              <button 
                type="submit"
                className="absolute top-1/2 -translate-y-1/2 right-2 bg-gray-800 p-2 rounded-lg"
              >
                <FaSearch className="text-white h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;