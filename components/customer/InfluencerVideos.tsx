'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Video, Play, Eye } from 'lucide-react';
import { InfluencerVideo } from '@/lib/types';
import { getApprovedVideos, updateVideoViews } from '@/services/videoService';

interface InfluencerVideosProps {
  limit?: number;
}

export default function InfluencerVideos({ limit = 6 }: InfluencerVideosProps) {
  const [videos, setVideos] = useState<InfluencerVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      const approvedVideos = await getApprovedVideos(limit);
      setVideos(approvedVideos);
    } catch (error) {
      console.error('Failed to load videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoClick = async (videoId: string, videoUrl: string) => {
    try {
      // Update view count
      await updateVideoViews(videoId);
      
      // Update local state
      setVideos(videos.map(video => 
        video.id === videoId 
          ? { ...video, views: video.views + 1 }
          : video
      ));
      
      // Open video in new tab
      window.open(videoUrl, '_blank');
    } catch (error) {
      console.error('Failed to update video views:', error);
      // Still open the video even if view count update fails
      window.open(videoUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (videos.length === 0) {
    return null; // Don't show section if no videos
  }

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Product Showcase Videos
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover our products through engaging videos from our vendors
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video, index) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 cursor-pointer group"
              onClick={() => handleVideoClick(video.id, video.videoUrl)}
            >
              <div className="relative">
                {video.thumbnail ? (
                  <img 
                    src={video.thumbnail} 
                    alt={video.title} 
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" 
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center group-hover:from-purple-200 group-hover:to-indigo-200 transition-colors duration-300">
                    <Video className="w-16 h-16 text-purple-300" />
                  </div>
                )}
                
                {/* Play button overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                  <div className="bg-white bg-opacity-90 rounded-full p-3 transform scale-0 group-hover:scale-100 transition-transform duration-300">
                    <Play className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">
                  {video.title}
                </h3>
                <p className="text-gray-600 text-sm mb-3">
                  {video.productName}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Eye className="w-4 h-4" />
                    <span>{video.views} views</span>
                  </div>
                  <span className="text-purple-600 text-sm font-medium group-hover:text-purple-700 transition-colors">
                    Watch Now →
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}