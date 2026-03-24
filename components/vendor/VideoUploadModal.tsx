'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Video, Image, AlertCircle } from 'lucide-react';
import { Product } from '@/lib/types';
import { useVendorAuth } from '@/hooks/useVendorAuth';
import { uploadVideoToCloudinary, createInfluencerVideo } from '@/services/videoService';

interface VideoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  products: Product[];
}

export default function VideoUploadModal({ isOpen, onClose, onSuccess, products }: VideoUploadModalProps) {
  const { vendor } = useVendorAuth();
  const [selectedProduct, setSelectedProduct] = useState('');
  const [title, setTitle] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['video/mp4', 'video/quicktime'].includes(file.type)) {
      setError('Only MP4 and MOV files are allowed');
      return;
    }

    // Validate file size (30 seconds ≈ 50MB max for good quality)
    if (file.size > 50 * 1024 * 1024) {
      setError('Video file is too large. Please ensure it\'s under 30 seconds.');
      return;
    }

    setError('');
    setVideoFile(file);
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Thumbnail must be an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Thumbnail file is too large (max 5MB)');
      return;
    }

    setError('');
    setThumbnailFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!vendor || !selectedProduct || !title || !videoFile) {
      setError('Please fill in all required fields');
      return;
    }

    const product = products.find(p => p.id === selectedProduct);
    if (!product) {
      setError('Selected product not found');
      return;
    }

    try {
      setUploading(true);
      setError('');

      // Upload video and thumbnail to Cloudinary
      const { videoUrl, thumbnailUrl } = await uploadVideoToCloudinary(videoFile, thumbnailFile || undefined);

      // Save video metadata to Firestore
      await createInfluencerVideo(
        vendor.uid,
        product.id,
        product.name,
        videoUrl,
        title,
        thumbnailUrl
      );

      // Reset form
      setSelectedProduct('');
      setTitle('');
      setVideoFile(null);
      setThumbnailFile(null);
      
      onSuccess();
    } catch (error: any) {
      setError(error.message || 'Failed to upload video');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setSelectedProduct('');
    setTitle('');
    setVideoFile(null);
    setThumbnailFile(null);
    setError('');
  };

  const handleClose = () => {
    if (!uploading) {
      resetForm();
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={handleClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-white text-gray-900 rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Upload Product Video</h2>
                <button
                  onClick={handleClose}
                  disabled={uploading}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Product Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product *
                  </label>
                  <select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    required
                    disabled={uploading}
                    className="w-full px-4 py-3 text-gray-900 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none disabled:opacity-50 disabled:text-gray-500 appearance-none"
                    style={{ 
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.5rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em',
                      paddingRight: '2.5rem'
                    }}
                  >
                    <option value="" className="text-gray-500 bg-white">Select a product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id} className="text-gray-900 bg-white">
                        {product.name} {product.status !== 'approved' ? `(${product.status})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Video Title / Caption *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter a catchy title for your video"
                    required
                    disabled={uploading}
                    className="w-full px-4 py-3 text-gray-900 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none disabled:opacity-50 disabled:text-gray-500 placeholder:text-gray-400"
                  />
                </div>

                {/* Video Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Video File * (MP4, MOV - Max 30 seconds)
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="video/mp4,video/quicktime"
                      onChange={handleVideoChange}
                      required
                      disabled={uploading}
                      className="hidden"
                      id="video-upload"
                    />
                    <label
                      htmlFor="video-upload"
                      className="flex items-center justify-center gap-3 w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-400 transition-colors cursor-pointer text-gray-600 bg-white"
                    >
                      <Video className="w-6 h-6 text-gray-400" />
                      <span className="text-gray-600">
                        {videoFile ? videoFile.name : 'Click to upload video'}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Thumbnail Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thumbnail (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailChange}
                      disabled={uploading}
                      className="hidden"
                      id="thumbnail-upload"
                    />
                    <label
                      htmlFor="thumbnail-upload"
                      className="flex items-center justify-center gap-3 w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-400 transition-colors cursor-pointer text-gray-600 bg-white"
                    >
                      <Image className="w-6 h-6 text-gray-400" />
                      <span className="text-gray-600">
                        {thumbnailFile ? thumbnailFile.name : 'Click to upload thumbnail'}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-blue-700 text-sm">
                    Your video will be reviewed by admin before appearing on the customer homepage. 
                    Keep it under 30 seconds and make it engaging! Note: Videos for approved products 
                    are more likely to be featured prominently.
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={uploading || !selectedProduct || !title || !videoFile}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl transition-all shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Upload Video
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}