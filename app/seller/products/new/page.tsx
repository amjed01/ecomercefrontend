"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { FiArrowLeft, FiImage, FiTruck, FiDollarSign, FiCheck, FiTrash2, FiStar } from 'react-icons/fi';

interface FormData {
  title: string;
  supplier: string;
  price: string;
  description: string;
  product_location: string;
  livraison: string;
  couleur: string;
  category: string;
  quantity: string;
}

interface ProductImage {
  url: string;
  isPrimary: boolean;
  order: number;
}

const CATEGORIES = [
  { id: 'smartphones', name: 'smartphones' },
  { id: 'tablets', name: 'tablets' },
  { id: 'smartwatches', name: 'smartwatches' },
];

export default function AddProduct() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    title: '',
    supplier: '',
    price: '',
    description: '',
    product_location: '',
    livraison: '',
    couleur: '',
    category: '',
    quantity: '0',
  });
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('free');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  // Add this function near your other validation functions
const validateImages = (files: File[]): boolean => {
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  for (const file of files) {
    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      alert(`File "${file.name}" is not a supported image type. Please upload JPEG, PNG, GIF, or WebP.`);
      return false;
    }
    
    // Check file size
    if (file.size > MAX_SIZE) {
      alert(`File "${file.name}" is too large. Maximum size is 5MB.`);
      return false;
    }
  }
  
  return true;
};

  const handleChange = (name: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = Array.from(e.target.files || []);
  
  // Validate files before processing
  if (!validateImages(files)) {
    e.target.value = ''; // Clear the input
    return;
  }
  
  if (files.length + images.length > 10) {
    alert('Maximum 10 images allowed');
    e.target.value = ''; // Clear the input
    return;
  }

  const newImages = [...images, ...files];
  setImages(newImages);

  // Create previews
  const newPreviews = [...imagePreviews];
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      newPreviews.push(e.target?.result as string);
      setImagePreviews([...newPreviews]);
    };
    reader.readAsDataURL(file);
  });
  
  e.target.value = ''; // Clear input for next selection
};

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    
    setImages(newImages);
    setImagePreviews(newPreviews);
    
    // Adjust primary image index if needed
    if (primaryImageIndex === index) {
      setPrimaryImageIndex(0);
    } else if (primaryImageIndex > index) {
      setPrimaryImageIndex(primaryImageIndex - 1);
    }
  };

  const setAsPrimary = (index: number) => {
    setPrimaryImageIndex(index);
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};
    
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.supplier.trim()) newErrors.supplier = 'Supplier is required';
    if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = 'Valid price is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.product_location.trim()) newErrors.product_location = 'Location is required';
    if (!formData.livraison.trim()) newErrors.livraison = 'Delivery option is required';
    if (!formData.couleur.trim()) newErrors.couleur = 'Color is required';
    if (!formData.quantity || parseInt(formData.quantity) < 0) newErrors.quantity = 'Valid quantity is required';
    if (images.length === 0) {
      alert('At least one image is required');
      return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!validateForm()) return;
  if (isSubmitting) return;
  
  setIsSubmitting(true);
  
  try {
    const token = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');
    const username = localStorage.getItem('username');
    
    if (!token || !userId) {
      throw new Error("Authentication required");
    }

    const data = new FormData();
    
    // Append form data
    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, value);
    });
    
    data.append('userId', userId);
    data.append('user[_id]', userId);
    data.append('user[username]', username || '');
    
    // Append all images
    images.forEach((image, index) => {
      data.append('images', image); // Try 'images[]' if this doesn't work
    });

    // DEBUG: Check what's being sent
    console.log('Uploading images:', images.length);
data.forEach((value, key) => {
  console.log(key, value);
});


    const response = await axios.post('https://ecomercebackend-654m.onrender.com/api/products', data, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });

    console.log('Response:', response.data);
    
    // Check if response contains Cloudinary URLs
    if (response.data.product?.images) {
      response.data.product.images.forEach((img: any, idx: number) => {
        console.log(`Image ${idx}:`, img.url);
      });
    }

    alert("Product created successfully!");
    router.push('/seller/products');
  } catch (error: any) {
    console.error("Submission error:", error);
    const errorMessage = error.response?.data?.message || 
                       error.response?.data?.error || 
                       error.message || 
                       "Failed to add product";
    alert(`Error: ${errorMessage}`);
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <FiArrowLeft className="mr-2" />
            Back
          </button>
          <h1 className="text-2xl font-semibold text-gray-900 ml-4">Add New Product</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Information */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Product Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Title*
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter product title"
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supplier*
                </label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => handleChange('supplier', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter supplier name"
                />
                {errors.supplier && <p className="text-red-500 text-sm mt-1">{errors.supplier}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price*
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => handleChange('price', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg pl-8 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
                {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity Available
                </label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => handleChange('quantity', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
                {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description*
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter detailed product description..."
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>
          </div>

          {/* Product Images */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Product Images</h2>
            <p className="text-sm text-gray-500 mb-4">Upload up to 10 images. First image will be set as primary.</p>
            
            {/* Image upload area */}
            <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400">
              <FiImage className="text-gray-400 text-3xl mb-2" />
              <span className="text-gray-600">
                {images.length > 0 ? 'Add More Images' : 'Upload Product Images'}
              </span>
              <span className="text-sm text-gray-500 mt-1">
                Click to browse or drag and drop (Max 10 images)
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                multiple
                className="hidden"
              />
            </label>
            
            {/* Image previews */}
            {imagePreviews.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Uploaded Images ({images.length}/10)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={preview} 
                        alt={`Product preview ${index + 1}`}
                        className={`w-full h-32 object-cover rounded-lg border-2 ${
                          primaryImageIndex === index ? 'border-blue-500' : 'border-gray-200'
                        }`}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => setAsPrimary(index)}
                            className={`p-2 rounded-full ${
                              primaryImageIndex === index 
                                ? 'bg-yellow-500 text-white' 
                                : 'bg-white text-gray-700'
                            }`}
                            title="Set as primary"
                          >
                            <FiStar size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="p-2 bg-white text-red-500 rounded-full"
                            title="Remove image"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </div>
                      {primaryImageIndex === index && (
                        <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                          Primary
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Location & Shipping */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Location & Shipping</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Location*
                </label>
                <input
                  type="text"
                  value={formData.product_location}
                  onChange={(e) => handleChange('product_location', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="City, Country"
                />
                {errors.product_location && <p className="text-red-500 text-sm mt-1">{errors.product_location}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Option*
                </label>
                <div className="flex space-x-2 mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('free');
                      handleChange('livraison', 'Free Delivery');
                    }}
                    className={`flex items-center px-4 py-2 rounded-lg border ${
                      activeTab === 'free' 
                        ? 'bg-blue-600 text-white border-blue-600' 
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    <FiTruck className="mr-2" />
                    Free Delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('paid')}
                    className={`flex items-center px-4 py-2 rounded-lg border ${
                      activeTab === 'paid' 
                        ? 'bg-blue-600 text-white border-blue-600' 
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    <FiDollarSign className="mr-2" />
                    Paid Delivery
                  </button>
                </div>
                
                {activeTab === 'paid' && (
                  <input
                    type="text"
                    value={formData.livraison}
                    onChange={(e) => handleChange('livraison', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter delivery cost"
                  />
                )}
                {errors.livraison && <p className="text-red-500 text-sm mt-1">{errors.livraison}</p>}
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Additional Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color*
                </label>
                <input
                  type="text"
                  value={formData.couleur}
                  onChange={(e) => handleChange('couleur', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Red, Blue, Multi-color"
                />
                {errors.couleur && <p className="text-red-500 text-sm mt-1">{errors.couleur}</p>}
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category*
                </label>
                <button
                  type="button"
                  onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 flex items-center justify-between"
                >
                  <span>{CATEGORIES.find(c => c.id === formData.category)?.name || 'Select category'}</span>
                  <span>▼</span>
                </button>
                
                {isCategoryDropdownOpen && (
                  <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1">
                    {CATEGORIES.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => {
                          handleChange('category', category.id);
                          setIsCategoryDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center justify-between"
                      >
                        <span>{category.name}</span>
                        {formData.category === category.id && <FiCheck className="text-blue-600" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating Product...' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}