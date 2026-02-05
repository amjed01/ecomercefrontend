"use client";
import React, { useState, useEffect } from 'react';

// Mock Next.js useRouter
const mockRouter = {
  push: (path: string) => {
    console.log(`[NAVIGATION] Routing to: ${path}`);
    window.location.href = path;
  },
};
const useRouter = () => mockRouter;

// Icons (same as before)
const IconUser = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);
const IconHeart = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
);
const IconTruck = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
);
const IconShoppingCart = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
);
const IconLogOut = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
);
const IconCamera = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
);
const IconLoader = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 0 0-9-9 9 9 0 0 0-9 9 9 9 0 0 0 9 9"></path>
  </svg>
);
const IconMail = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
);
const IconPhone = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-5.65-5.65A19.79 19.79 0 0 1 2 3.18 2 2 0 0 1 4.1 1h3a2 2 0 0 1 2 1.72 17.5 17.5 0 0 0 .1 1.7a2 2 0 0 1-.35 1.76L8.1 8.63a16 16 0 0 0 6.67 6.67l1.45-1.45a2 2 0 0 1 1.76-.35 17.5 17.5 0 0 0 1.7.1 2 2 0 0 1 1.72 2z"></path></svg>
);
const IconBriefcase = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
);
const IconMapPin = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
);
const IconShield = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
);

// Default images
const DEFAULT_PROFILE_PHOTO = "";
const DEFAULT_COVER_PHOTO = "";

// Real API calls
const api = {
  async get(url: string, options?: any) {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });
    return await response.json();
  },

  async post(url: string, data: any, options?: any) {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...options?.headers,
      },
      body: data,
      ...options,
    });
    return await response.json();
  },
};

interface UserData {
  _id?: string;
  username: string;
  email: string;
  location: string;
  role: string;
  profilePhoto?: string;
  coverPhoto?: string;
  profilePic?: string;
  coverPic?: string;
  store?: string;
  createdAt?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] =  useState<'profile' | 'cover' | null>(null);
  const [imageUrls, setImageUrls] = useState<{ [key: string]: string }>({});

  // Function to fetch image as blob WITH AUTHENTICATION
  const fetchImage = async (userId: string, type: 'profile' | 'cover') => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`https://ecomercebackend-654m.onrender.com/api/profile/${type}-photo/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${type} photo: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      setImageUrls(prev => ({ ...prev, [`${type}-${userId}`]: blobUrl }));
    } catch (error) {
      console.error(`Error fetching ${type} photo:`, error);
      // Set default image on error
      setImageUrls(prev => ({ 
        ...prev, 
        [`${type}-${userId}`]: type === 'profile' ? DEFAULT_PROFILE_PHOTO : DEFAULT_COVER_PHOTO 
      }));
    }
  };

  // Function to get image URL - uses blob URLs first, then falls back to direct URLs
  const getImageUrl = (userId: string | undefined, type: 'profile' | 'cover') => {
    if (!userId) {
      return type === 'profile' ? DEFAULT_PROFILE_PHOTO : DEFAULT_COVER_PHOTO;
    }
    
    // First try the blob URL from imageUrls
    if (imageUrls[`${type}-${userId}`]) {
      return imageUrls[`${type}-${userId}`];
    }
    
    // Then try to fetch the image if we haven't already
    const existingUrl = imageUrls[`${type}-${userId}`];
    if (!existingUrl || existingUrl.includes('placehold.co')) {
      fetchImage(userId, type);
    }
    
    // Return placeholder while loading
    return type === 'profile' ? DEFAULT_PROFILE_PHOTO : DEFAULT_COVER_PHOTO;
  };

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/login');
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('https://ecomercebackend-654m.onrender.com/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.success) {
          setUserData(response.user);
          
          // Fetch images if user has photos
          if (response.user._id) {
            if (response.user.profilePhoto || response.user.profilePic) {
              fetchImage(response.user._id, 'profile');
            }
            if (response.user.coverPhoto || response.user.coverPic) {
              fetchImage(response.user._id, 'cover');
            }
          }
        } else {
          console.error('Failed to fetch profile:', response.message);
          const localData = localStorage.getItem('userData');
          if (localData) {
            const parsedData = JSON.parse(localData);
            setUserData(parsedData);
            if (parsedData._id) {
              fetchImage(parsedData._id, 'profile');
              fetchImage(parsedData._id, 'cover');
            }
          }
        }
      } catch (error) {
        console.error('Profile fetch error:', error);
        const localData = localStorage.getItem('userData');
        if (localData) {
          const parsedData = JSON.parse(localData);
          setUserData(parsedData);
          if (parsedData._id) {
            fetchImage(parsedData._id, 'profile');
            fetchImage(parsedData._id, 'cover');
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    router.push('/login');
  };

 const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'cover') => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Validate file type
  if (!file.type.startsWith('image/')) {
    alert('Please select a valid image file (JPEG, PNG, etc.)');
    return;
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    alert('Image size should be less than 5MB');
    return;
  }

  const token = localStorage.getItem('authToken');
  if (!token) {
    router.push('/login');
    return;
  }

  try {
    setUploading(type);
    
    const formData = new FormData();
    formData.append('image', file);

    const endpoint = type === 'profile' 
      ? 'https://ecomercebackend-654m.onrender.com/api/profile/profile-photo' 
      : 'https://ecomercebackend-654m.onrender.com/api/profile/cover-photo';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      // Add cache-busting timestamp to the image URL to force refresh
      const timestamp = Date.now();
      const updatedImageUrl = `${result[type === 'profile' ? 'profilePhoto' : 'coverPhoto']}?t=${timestamp}`;
      
      // Update user data with new image URL
      setUserData(prev => ({
        ...prev!,
        [type === 'profile' ? 'profilePhoto' : 'coverPhoto']: updatedImageUrl
      }));

      // Clear the file input
      e.target.value = '';
      
      // Force a re-render by updating state twice
      setTimeout(() => {
        setUserData(prev => ({ ...prev! }));
      }, 100);

      alert(`${type === 'profile' ? 'Profile' : 'Cover'} photo updated successfully!`);
    } else {
      throw new Error(result.message || `Failed to upload ${type} photo`);
    }
  } catch (error: any) {
    console.error('Upload error:', error);
    alert(error.message || `Failed to upload ${type} photo. Please try again.`);
  } finally {
    setUploading(null);
  }
};

  // Format date for display
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get role display name
  const getRoleDisplay = (role: string | undefined) => {
    switch (role) {
      case 'client': return 'Customer';
      case 'seller': return 'Seller';
      default: return role || 'Customer';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center space-x-3 text-gray-800">
          <IconLoader className="w-8 h-8 mr-2 animate-spin" />
          <span className="text-xl font-medium text-gray-700">Loading Profile Data...</span>
        </div>
      </div>
    );
  }

  const displayName = userData?.username || userData?.email.split('@')[0] || 'User Profile';

  return (
    <div className="min-h-screen bg-gray-100 font-sans pb-16">
      
      {/* Cover Photo Area */}
      <div className="relative h-56 sm:h-72 bg-gradient-to-r from-gray-800 to-gray-900 overflow-hidden shadow-xl">
        <img 
          src={getImageUrl(userData?._id, 'cover')} 
          alt="Cover Photo" 
          className="w-full h-full object-cover opacity-70 transition-opacity duration-300 hover:opacity-80"
          onError={(e) => (e.currentTarget.src = DEFAULT_COVER_PHOTO)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/50 to-transparent"></div>
        
        {/* Cover Upload Button */}
        <label 
          className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg cursor-pointer transition-all duration-300 transform hover:scale-110 hover:bg-white hover:shadow-xl"
          title="Change Cover Photo"
        >
          <IconCamera className="w-5 h-5 text-gray-700" />
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={(e) => handleImageUpload(e, 'cover')}
            disabled={!!uploading}
          />
        </label>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-10">
        
        {/* Profile Header Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border-t-8 border-gray-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gray-800/5 to-gray-900/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-8 relative z-10">
            
            {/* Profile Picture Section */}
            <div className="relative flex-shrink-0">
              <div className="h-32 w-32 sm:h-40 sm:w-40 rounded-full border-6 border-white bg-gradient-to-br from-gray-700 to-gray-800 overflow-hidden shadow-xl ring-4 ring-gray-300/50">
                <img 
                  src={getImageUrl(userData?._id, 'profile')} 
                  alt="Profile Photo" 
                  className="w-full h-full object-cover"
                  onError={(e) => (e.currentTarget.src = DEFAULT_PROFILE_PHOTO)}
                />
              </div>
              
              {/* Profile Picture Upload Button */}
              <label 
                className={`absolute bottom-0 right-0 p-3 rounded-full shadow-xl cursor-pointer transition-all ${uploading ? 'bg-gray-600 animate-pulse' : 'bg-gray-800 hover:bg-gray-700 hover:shadow-2xl'}`}
                title="Change Profile Photo"
              >
                <IconCamera className="w-5 h-5 text-white" />
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => handleImageUpload(e, 'profile')}
                  disabled={!!uploading}
                />
              </label>
            </div>
            
            {/* User Info */}
            <div className="flex-1 pt-4 text-center sm:text-left">
              <h1 className="text-4xl font-extrabold text-gray-900 leading-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                {displayName}
              </h1>
             
              <p className="text-gray-500 mt-2 flex items-center justify-center sm:justify-start">
                <IconMail className="w-4 h-4 mr-2 text-gray-400" /> {userData?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Navigation Grid */}
        <h2 className="text-2xl font-bold text-gray-800 mt-12 mb-6">Your Dashboard</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <NavigationCard 
            icon={IconHeart} 
            title="Favorites" 
            path="/favorites" 
            color="bg-gradient-to-br from-red-50 to-red-100 text-red-700 border-red-200"
            description="Manage your saved items"
          />
          <NavigationCard 
            icon={IconTruck} 
            title="Order History" 
            path="/orders" 
            color="bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 border-blue-200"
            description="Track packages and view past orders"
          />
          <NavigationCard 
            icon={IconShoppingCart} 
            title="Shopping Cart" 
            path="/cart" 
            color="bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-700 border-emerald-200"
            description="Review items before checkout"
          />
          {userData?.role === 'seller' && (
            <NavigationCard 
              icon={IconBriefcase} 
              title="My Store" 
              path="/store/dashboard" 
              color="bg-gradient-to-br from-purple-50 to-purple-100 text-purple-700 border-purple-200"
              description="Manage your store and products"
            />
          )}
          <NavigationCard 
            icon={IconLogOut} 
            title="Sign Out" 
            onClick={handleLogout}
            color="bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 border-gray-300"
            isLogout={true}
            description="Securely exit your account"
          />
        </div>
        
        {/* Account Details Card */}
        <div className="mt-12 bg-white rounded-xl shadow-lg p-6 sm:p-8 border-l-4 border-gray-800 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-gray-800/5 to-gray-900/10 rounded-full -translate-x-12 -translate-y-12"></div>
          <h2 className="text-xl font-bold text-gray-800 mb-6 relative z-10">Personal and Account Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6 relative z-10">
            <DetailItem 
              label="Username" 
              value={userData?.username} 
              icon={IconUser}
            />
            <DetailItem 
              label="Email Address" 
              value={userData?.email} 
              icon={IconMail}
            />
            <DetailItem 
              label="Location" 
              value={userData?.location} 
              icon={IconMapPin}
            />
            <DetailItem 
              label="Account Type" 
              value={getRoleDisplay(userData?.role)} 
              icon={IconShield}
            />
            <DetailItem 
              label="Member Since" 
              value={formatDate(userData?.createdAt)} 
              icon={IconBriefcase}
            />
          </div>
        </div>

      </div>
      
      {/* Uploading Status Message */}
      {uploading && (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-gray-800 to-gray-900 text-white p-4 flex items-center justify-center shadow-2xl z-50">
          <IconLoader className="w-5 h-5 mr-3 animate-spin" />
          <span className="font-medium">Uploading image, please wait...</span>
        </div>
      )}
    </div>
  );
}

// Sub Components
const DetailItem = ({ label, value, icon: Icon }: { label: string, value: string | undefined | null, icon: React.FC<{ className?: string }> }) => (
  <div className="border-b border-gray-100 pb-2 group hover:bg-gray-50/50 rounded-lg px-3 -mx-3 transition-colors duration-200">
    <p className="text-sm font-medium text-gray-500 flex items-center group-hover:text-gray-600 transition-colors duration-200">
      <Icon className="w-4 h-4 mr-2 text-gray-500 group-hover:text-gray-600 transition-colors duration-200" /> {label}
    </p>
    <p className="text-lg font-semibold text-gray-900 break-words ml-6 mt-1 group-hover:text-gray-800 transition-colors duration-200">{value || 'N/A'}</p>
  </div>
);

interface NavigationCardProps {
  icon: React.FC<{ className?: string }>;
  title: string;
  path?: string;
  onClick?: () => void;
  color: string;
  isLogout?: boolean;
  description: string;
}

const NavigationCard = ({ icon: Icon, title, path, onClick, color, isLogout = false, description }: NavigationCardProps) => {
  const baseClasses = `flex flex-col items-start p-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-[1.03] hover:shadow-2xl border-b-4 border-r-2 ${color} w-full text-left group`;
  
  const content = (
    <>
      <Icon className={`w-8 h-8 mb-3 transition-transform duration-300 group-hover:scale-110 ${isLogout ? 'text-gray-600' : ''}`} />
      <span className={`text-xl font-bold text-left transition-colors duration-300 ${isLogout ? 'text-gray-700 group-hover:text-gray-900' : 'group-hover:text-gray-900'}`}>
        {title}
      </span>
      <span className="text-sm text-gray-500 mt-1 text-left group-hover:text-gray-600 transition-colors duration-300">
        {description}
      </span>
    </>
  );

  if (isLogout) {
    return (
      <button onClick={onClick} className={baseClasses}>
        {content}
      </button>
    );
  }
  
  return (
    <a href={path} className={baseClasses}>
      {content}
    </a>
  );
};