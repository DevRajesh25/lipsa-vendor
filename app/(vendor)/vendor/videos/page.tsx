'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Video, Calendar, Eye, Badge } from 'lucide-react';
import { InfluencerVideo, Product } from '@/lib/types';
import Toast from '@/components/vendor/Toast';
import VideoUploadModal from '@/components/vendor/VideoUploadModal';
import { useVendorAuth } from '@/hooks/useVendorAuth';
import { getVendorVideos } from '@/services/videoService';
import { getVendorProducts } from '@/services/productService';

export default function VideosPage() {
  const { vendor } = useVendorAuth();
  const [videos, setVideos] = useState<InfluencerVideo[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    if (vendor) {
      loadData();
    }
  }, [vendor]);

  const loadData = async () => {
    if (!vendor) return;
    
    try {
      setLoading(true);
      const [fetchedVideos, fetchedProducts] = await Promise.all([
        getVendorVideos(vendor.uid),
        getVendorProducts(vendor.uid)
      ]);
      setVideos(fetchedVideos);
      // Show all products, not just approved ones, so vendors can upload videos for any product
      setProducts(fetchedProducts);
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to load data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleVideoUploaded = () => {
    loadData();
    setShowUploadModal(false);
    setToast({ message: 'Video uploaded successfully! It will be reviewed by admin.', type: 'success' });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status as keyof typeof styles]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Product Videos</h1>
          <p className="text-gray-600 mt-1">Upload influencer-style videos to promote your products</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          disabled={products.length === 0}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl transition-all shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-5 h-5" />
          Upload Video
        </button>
      </div>

      {products.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-yellow-800">
            You need to add products before you can upload videos. 
            <a href="/vendor/products" className="underline ml-1">Add products first</a>
          </p>
        </div>
      )}

      {videos.length === 0 ? (
        <div className="text-center py-12">
          <Video className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No videos uploaded yet</p>
          {products.length > 0 && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Upload Your First Video
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video, index) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100"
            >
              <div className="relative">
                {video.thumbnail ? (
                  <img 
                    src={video.thumbnail} 
                    alt={video.title} 
                    className="w-full h-48 object-cover" 
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
                    <Video className="w-16 h-16 text-purple-300" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  {getStatusBadge(video.status)}
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2">{video.title}</h3>
                <p className="text-gray-600 text-sm mb-4">Product: {video.productName}</p>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Eye className="w-4 h-4" />
                    <span>{video.views} views</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>{video.createdAt.toLocaleDateString()}</span>
                  </div>
                </div>
                
                <a
                  href={video.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-xl transition-all font-medium"
                >
                  <Video className="w-4 h-4" />
                  Watch Video
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      
      <VideoUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={handleVideoUploaded}
        products={products}
      />
    </div>
  );
}