'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Video, Check, X, Eye, Calendar } from 'lucide-react';
import { InfluencerVideo } from '@/lib/types';
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<InfluencerVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'influencerVideos'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const fetchedVideos = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as InfluencerVideo[];
      setVideos(fetchedVideos);
    } catch (error) {
      console.error('Failed to load videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateVideoStatus = async (videoId: string, status: 'approved' | 'rejected') => {
    try {
      setUpdating(videoId);
      const videoRef = doc(db, 'influencerVideos', videoId);
      await updateDoc(videoRef, {
        status,
        updatedAt: new Date()
      });
      
      // Update local state
      setVideos(videos.map(video => 
        video.id === videoId 
          ? { ...video, status, updatedAt: new Date() }
          : video
      ));
    } catch (error) {
      console.error('Failed to update video status:', error);
    } finally {
      setUpdating(null);
    }
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
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Video Management</h1>
        <p className="text-gray-600 mt-1">Review and approve vendor product videos</p>
      </div>

      {videos.length === 0 ? (
        <div className="text-center py-12">
          <Video className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No videos uploaded yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video, index) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
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
                <p className="text-gray-600 text-sm mb-2">Product: {video.productName}</p>
                <p className="text-gray-500 text-xs mb-4">Vendor ID: {video.vendorId}</p>
                
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
                
                <div className="space-y-2">
                  <a
                    href={video.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-xl transition-all font-medium"
                  >
                    <Video className="w-4 h-4" />
                    Watch Video
                  </a>
                  
                  {video.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateVideoStatus(video.id, 'approved')}
                        disabled={updating === video.id}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-xl transition-all font-medium disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => updateVideoStatus(video.id, 'rejected')}
                        disabled={updating === video.id}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all font-medium disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}