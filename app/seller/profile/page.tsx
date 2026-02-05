"use client";
import React, { useState, useEffect, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { FiLogOut, FiCamera, FiUser, FiMail, FiSettings } from 'react-icons/fi';

interface UserData {
  _id?: string;
  username?: string;
  email: string;
  profilePhoto?: string;
  coverPhoto?: string;
  profilePic?: string;
  coverPic?: string;
}

// Default images
const DEFAULT_PROFILE_PHOTO = "";
const DEFAULT_COVER_PHOTO = "";

export default function Profile() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profilePic, setProfilePic] = useState(DEFAULT_PROFILE_PHOTO);
  const [coverPic, setCoverPic] = useState(DEFAULT_COVER_PHOTO);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageUrls, setImageUrls] = useState<{ [key: string]: string }>({});

  // Function to fetch image with proper authentication
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
        throw new Error(`Failed to fetch ${type} photo: ${response.status}`);
      }
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      setImageUrls(prev => ({ ...prev, [`${type}-${userId}`]: blobUrl }));
      
      // Update the respective image state
      if (type === 'profile') {
        setProfilePic(blobUrl);
      } else {
        setCoverPic(blobUrl);
      }
    } catch (error) {
      console.error(`Error fetching ${type} photo:`, error);
      // Set default image on error
      if (type === 'profile') {
        setProfilePic(DEFAULT_PROFILE_PHOTO);
      } else {
        setCoverPic(DEFAULT_COVER_PHOTO);
      }
    }
  };

  // Function to get image URL
  const getImageUrl = (userId: string | undefined, type: 'profile' | 'cover') => {
    if (!userId) {
      return type === 'profile' ? DEFAULT_PROFILE_PHOTO : DEFAULT_COVER_PHOTO;
    }
    
    // Return blob URL if available
    if (imageUrls[`${type}-${userId}`]) {
      return imageUrls[`${type}-${userId}`];
    }
    
    // Otherwise fetch the image
    fetchImage(userId, type);
    
    // Return placeholder while loading
    return type === 'profile' ? DEFAULT_PROFILE_PHOTO : DEFAULT_COVER_PHOTO;
  };

  useEffect(() => {
    initializeProfile();
  }, []);

  const initializeProfile = async () => {
    await checkExistingUser();
    await fetchProfileData();
  };

  const fetchProfileData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await axios.get('https://ecomercebackend-654m.onrender.com/api/auth/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        const userData = response.data.user;
        setUserData(userData);
        
        // Fetch images if user has photos
        if (userData._id) {
          if (userData.profilePhoto || userData.profilePic) {
            fetchImage(userData._id, 'profile');
          }
          if (userData.coverPhoto || userData.coverPic) {
            fetchImage(userData._id, 'cover');
          }
        }

        // Update localStorage
        localStorage.setItem('userData', JSON.stringify(userData));
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      // Fallback to localStorage data
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
  };

  const checkExistingUser = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/login');
        return;
      }

      const storedUserData = localStorage.getItem('userData');
      if (storedUserData) {
        const parsedData = JSON.parse(storedUserData);
        setUserData(parsedData);
        setIsLoggedIn(true);

        // Use the getImageUrl function instead of direct localStorage
        if (parsedData._id) {
          setProfilePic(getImageUrl(parsedData._id, 'profile'));
          setCoverPic(getImageUrl(parsedData._id, 'cover'));
        }
      }
    } catch (error) {
      console.error('Error retrieving user data:', error);
      router.push('/login');
    }
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>, type: 'profile' | 'cover') => {
    if (!isLoggedIn || !userData?._id) {
      alert('Please login to update your profile');
      router.push('/login');
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPEG, PNG, etc.)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('image', file);

      const endpoint = type === 'profile'
        ? 'https://ecomercebackend-654m.onrender.com/api/profile/profile-photo'
        : 'https://ecomercebackend-654m.onrender.com/api/profile/cover-photo';

      const response = await axios.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 100)
          );
          setUploadProgress(progress);
        },
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Upload failed');
      }

      // Clear the existing blob URLs and refetch the image
      setImageUrls(prev => {
        const newUrls = { ...prev };
        delete newUrls[`${type}-${userData._id}`];
        return newUrls;
      });

      // Refetch the updated image
      await fetchImage(userData._id, type);

      // Clear the file input
      e.target.value = '';

      alert(`${type === 'profile' ? 'Profile' : 'Cover'} photo updated successfully`);
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(error.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const userLogout = async () => {
    try {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('userData');
      localStorage.removeItem('userRole');
      localStorage.removeItem('profilePic');
      localStorage.removeItem('coverPic');
      
      // Clear all blob URLs
      Object.values(imageUrls).forEach(url => URL.revokeObjectURL(url));
      setImageUrls({});
      
      router.push('/login');
    } catch (error) {
      console.log('Error logging out:', error);
    }
  };

  const logout = () => {
    if (confirm('Are you sure you want to logout?')) {
      userLogout();
    }
  };

  const clearCache = () => {
    if (confirm('Are you sure you want to clear all cached images?')) {
      // Clear blob URLs
      Object.values(imageUrls).forEach(url => URL.revokeObjectURL(url));
      setImageUrls({});
      
      // Reset to default images
      setProfilePic(DEFAULT_PROFILE_PHOTO);
      setCoverPic(DEFAULT_COVER_PHOTO);
      
      localStorage.removeItem('profilePic');
      localStorage.removeItem('coverPic');
      
      // Refetch images if user is logged in
      if (userData?._id) {
        fetchImage(userData._id, 'profile');
        fetchImage(userData._id, 'cover');
      }
      
      alert('Cache cleared successfully');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <FiUser className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Please Login</h2>
          <p className="text-gray-600 mb-6">You need to login to view your profile</p>
          <button
            onClick={() => router.push('/login')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Login to Your Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Cover Photo Section */}
      <div className="relative h-64 w-full bg-gray-200">
        <img
          src={coverPic}
          alt="Cover"
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = DEFAULT_COVER_PHOTO;
          }}
        />
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>
        
        <label className={`absolute bottom-4 right-4 p-2 rounded-full shadow-md cursor-pointer transition-colors ${
          uploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-100'
        }`}>
          <FiCamera className="w-5 h-5 text-gray-700" />
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={(e) => handleImageUpload(e, 'cover')}
            disabled={uploading}
          />
        </label>
      </div>

      {/* Profile Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16">
        {/* Profile Picture */}
        <div className="relative">
          <div className="w-32 h-32 mx-auto rounded-full border-4 border-white bg-white shadow-lg">
            <img
              src={profilePic}
              alt="Profile"
              className="w-full h-full rounded-full object-cover"
              onError={(e) => {
                e.currentTarget.src = DEFAULT_PROFILE_PHOTO;
              }}
            />
          </div>
          <label className={`absolute bottom-2 right-1/2 transform translate-x-1/2 p-2 rounded-full shadow-md cursor-pointer transition-colors ${
            uploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-100'
          }`}>
            <FiCamera className="w-4 h-4 text-gray-700" />
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, 'profile')}
              disabled={uploading}
            />
          </label>
        </div>

        {/* User Info */}
        <div className="text-center mt-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {userData?.username || userData?.email}
          </h1>
          <div className="flex items-center justify-center mt-2 text-gray-600">
            <FiMail className="w-4 h-4 mr-2" />
            <span>{userData?.email}</span>
          </div>
        </div>

        {/* Progress Bar (when uploading) */}
        {uploading && (
          <div className="mt-6 max-w-md mx-auto">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Action Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center mb-4">
              <FiUser className="w-6 h-6 text-blue-600 mr-3" />
              <h3 className="text-lg font-medium text-gray-900">Profile Information</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Manage your profile details and personal information
            </p>
            <button className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium">
              Edit Profile
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center mb-4">
              <FiSettings className="w-6 h-6 text-blue-600 mr-3" />
              <h3 className="text-lg font-medium text-gray-900">Account Settings</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Update your account preferences and security settings
            </p>
            <div className="mt-4 space-y-2">
              <button
                onClick={clearCache}
                className="block text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Clear Image Cache
              </button>
              <button
                onClick={logout}
                className="flex items-center text-red-600 hover:text-red-700 text-sm font-medium"
              >
                <FiLogOut className="w-4 h-4 mr-1" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}