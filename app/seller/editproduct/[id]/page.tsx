"use client";
import React, { useState, useEffect, ChangeEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import { FiArrowLeft, FiCamera, FiSave, FiTrash2, FiStar, FiX } from 'react-icons/fi';

interface Category {
  value: string;
  label: string;
}

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
  category: string;
  quantity: number;
  isActive: boolean;
  imageUrl: string | null;
  images: ProductImage[];
  couleur: string;
  livraison: string;
}

interface FormData {
  title: string;
  price: string;
  description: string;
  category: string;
  quantity: string;
  isActive: boolean;
  couleur: string;
  livraison: string;
}

const categories: Category[] = [
  { value: 'electronics', label: 'Electronics' },
  { value: 'smartphones', label: 'smartphones' },
  { value: 'home', label: 'Home & Kitchen' },
  { value: 'beauty', label: 'Beauty' },
  { value: 'sports', label: 'Sports' },
  { value: 'other', label: 'Other' }
];

const API_BASE_URL = "https://ecomercebackend-654m.onrender.com/api";
// Use base64 placeholder to avoid 404 errors (same as other components)
const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,' + btoa(`
  <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#f3f4f6"/>
    <text x="50%" y="50%" font-family="Arial" font-size="14" text-anchor="middle" dy=".3em" fill="#9ca3af">No Image</text>
  </svg>
`);

export default function EditProduct() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    price: '',
    description: '',
    category: 'other',
    quantity: '',
    isActive: true,
    couleur: '',
    livraison: ''
  });
  const [images, setImages] = useState<ProductImage[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState<boolean>(false);

const formatImageUrl = (imageUrl: string): string => {
  if (!imageUrl) return PLACEHOLDER_IMAGE;
  
  // Cloudinary URLs are already complete - just return them
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }
  
  // If not a full URL, use placeholder
  console.warn('Image is not a Cloudinary URL:', imageUrl);
  return PLACEHOLDER_IMAGE;
};

const getImageUrl = (image: ProductImage): string => {
  if (!image || !image.url) return PLACEHOLDER_IMAGE;
  
  const url = image.url.trim();
  // Cloudinary URLs should already be complete
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Fallback to formatImageUrl for backward compatibility
  return formatImageUrl(url);
};

  // Handle image error
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.log("Image failed to load");
    const target = e.target as HTMLImageElement;
    target.src = PLACEHOLDER_IMAGE;
    target.onerror = null; // Prevent infinite loop
  };

  useEffect(() => {
    fetchProduct();
  }, []);

  const fetchProduct = async (): Promise<void> => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_BASE_URL}/products/${productId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        const productData: Product = response.data.product;
        setProduct(productData);
        setFormData({
          title: productData.title,
          price: productData.price.toString(),
          description: productData.description,
          category: productData.category,
          quantity: productData.quantity.toString(),
          isActive: productData.isActive,
          couleur: productData.couleur || '',
          livraison: productData.livraison || ''
        });

        // Set images array (fallback to single imageUrl if no images array)
        if (productData.images && productData.images.length > 0) {
          setImages(productData.images);
        } else if (productData.imageUrl) {
          // Convert single imageUrl to images array for backward compatibility
          setImages([{
            url: productData.imageUrl,
            isPrimary: true,
            order: 0
          }]);
        }
      }
    } catch (error) {
      console.error("Fetch product error:", error);
      alert("Failed to fetch product details");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (): Promise<void> => {
    try {
      setUpdating(true);
      const token = localStorage.getItem('authToken');
      
      const updatedData = {
        title: formData.title,
        price: parseFloat(formData.price),
        description: formData.description,
        category: formData.category,
        quantity: parseInt(formData.quantity),
        isActive: formData.isActive,
        couleur: formData.couleur,
        livraison: formData.livraison
      };

      const response = await axios.put(
        `${API_BASE_URL}/products/${productId}`,
        updatedData,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.success) {
        alert("Product updated successfully");
        router.push('/seller/products');
      }
    } catch (error) {
      console.error("Update error:", error);
      if (axios.isAxiosError(error)) {
        alert(error.response?.data?.message || "Failed to update product");
      } else {
        alert("Failed to update product");
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const files = Array.from(e.target.files || []);
    
    if (files.length + images.length + newImages.length > 10) {
      alert('Maximum 10 images allowed');
      return;
    }

    const newImageFiles = [...newImages, ...files];
    setNewImages(newImageFiles);

    // Create previews for new images
    const newPreviews = [...imagePreviews];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push(e.target?.result as string);
        setImagePreviews([...newPreviews]);
      };
      reader.readAsDataURL(file);
    });
  };

  const uploadImages = async (): Promise<void> => {
    if (newImages.length === 0) return;

    try {
      setUploadingImages(true);
      const token = localStorage.getItem('authToken');
      
      const imageFormData = new FormData();
      newImages.forEach((file, index) => {
        imageFormData.append('images', file);
      });

      const response = await axios.post(
        `${API_BASE_URL}/products/${productId}/images`,
        imageFormData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        // Add new images to existing images
        const newProductImages = response.data.product.images.slice(images.length);
        setImages(prev => [...prev, ...newProductImages]);
        setNewImages([]);
        setImagePreviews([]);
        alert("Images uploaded successfully");
        fetchProduct(); // Refresh product data
      }
    } catch (error) {
      console.error("Image upload error:", error);
      alert("Failed to upload images");
    } finally {
      setUploadingImages(false);
    }
  };

  const setPrimaryImage = async (imageIndex: number): Promise<void> => {
    try {
      const token = localStorage.getItem('authToken');
      
      const response = await axios.patch(
        `${API_BASE_URL}/products/${productId}/primary-image`,
        { imageIndex },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        // Update local state
        setImages(prev => 
          prev.map((img, index) => ({
            ...img,
            isPrimary: index === imageIndex
          }))
        );
        alert("Primary image set successfully");
      }
    } catch (error) {
      console.error("Set primary image error:", error);
      alert("Failed to set primary image");
    }
  };

  const deleteImage = async (imageIndex: number): Promise<void> => {
    if (!confirm("Are you sure you want to delete this image?")) return;

    try {
      const token = localStorage.getItem('authToken');
      
      const response = await axios.delete(
        `${API_BASE_URL}/products/${productId}/images/${imageIndex}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        // Remove image from local state
        setImages(prev => prev.filter((_, index) => index !== imageIndex));
        alert("Image deleted successfully");
        fetchProduct(); // Refresh product data
      }
    } catch (error) {
      console.error("Delete image error:", error);
      alert("Failed to delete image");
    }
  };

  const removeNewImage = (index: number): void => {
    const newNewImages = newImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    
    setNewImages(newNewImages);
    setImagePreviews(newPreviews);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { checked } = e.target;
    setFormData(prev => ({ ...prev, isActive: checked }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <button 
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
          >
            <FiArrowLeft className="mr-2" /> Back
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">Edit Product</h1>
        </div>
        <button
          onClick={handleUpdate}
          disabled={updating}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {updating ? (
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
          ) : (
            <FiSave className="mr-2" />
          )}
          Save Changes
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        {/* Image Management */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">Product Images</label>
          <p className="text-sm text-gray-500 mb-4">Upload up to 10 images. Set primary image by clicking the star icon.</p>
          
          {/* Upload new images */}
          <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 mb-6">
            <FiCamera className="text-gray-400 text-3xl mb-2" />
            <span className="text-gray-600">
              {newImages.length > 0 ? 'Add More Images' : 'Upload New Images'}
            </span>
            <span className="text-sm text-gray-500 mt-1">
              Click to browse or drag and drop (Max 10 images total)
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              multiple
              className="hidden"
            />
          </label>

          {/* Upload button for new images */}
          {newImages.length > 0 && (
            <div className="mb-6">
              <button
                onClick={uploadImages}
                disabled={uploadingImages}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center"
              >
                {uploadingImages ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <FiSave className="mr-2" />
                    Upload {newImages.length} New Image(s)
                  </>
                )}
              </button>
            </div>
          )}

          {/* New image previews */}
          {newImages.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">New Images to Upload ({newImages.length})</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={preview} 
                      alt={`New image ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeNewImage(index)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove image"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Existing images */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Current Images ({images.length}/10)
            </h3>
            {images.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No images uploaded yet</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                  <img 
  src={getImageUrl(image)} 
  alt={`Product image ${index + 1}`}
  className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
  onError={handleImageError}
  crossOrigin="anonymous"
  loading="lazy" // Add lazy loading
/>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => setPrimaryImage(index)}
                          className={`p-2 rounded-full ${
                            image.isPrimary 
                              ? 'bg-yellow-500 text-white' 
                              : 'bg-white text-gray-700'
                          }`}
                          title={image.isPrimary ? "Primary image" : "Set as primary"}
                        >
                          <FiStar size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteImage(index)}
                          className="p-2 bg-white text-red-500 rounded-full"
                          title="Delete image"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </div>
                    {image.isPrimary && (
                      <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                        Primary
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Product Name */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Product Name
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter product name"
            />
          </div>

          {/* Price */}
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
              Price ($)
            </label>
            <input
              type="number"
              id="price"
              value={formData.price}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter price"
              step="0.01"
            />
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter product description"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Color */}
          <div>
            <label htmlFor="couleur" className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <input
              type="text"
              id="couleur"
              value={formData.couleur}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter product color"
            />
          </div>

          {/* Delivery */}
          <div>
            <label htmlFor="livraison" className="block text-sm font-medium text-gray-700 mb-1">
              Delivery Information
            </label>
            <input
              type="text"
              id="livraison"
              value={formData.livraison}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter delivery information"
            />
          </div>
        </div>

        {/* Category */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {categories.map((cat) => (
              <div
                key={cat.value}
                onClick={() => setFormData({ ...formData, category: cat.value })}
                className={`border rounded-md p-3 text-center cursor-pointer transition-colors ${
                  formData.category === cat.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {cat.label}
              </div>
            ))}
          </div>
        </div>

        {/* Stock Quantity */}
        <div className="mb-6">
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
            Stock Quantity
          </label>
          <input
            type="number"
            id="quantity"
            value={formData.quantity}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter quantity"
          />
        </div>

        {/* Active Status */}
        <div className="flex items-center mb-6">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={handleCheckboxChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
            Product is active and visible to customers
          </label>
        </div>
      </div>
    </div>
  );
}