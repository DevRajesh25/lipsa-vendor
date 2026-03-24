'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Search, MessageSquare } from 'lucide-react';
import { Review } from '@/lib/types';
import { useVendorAuth } from '@/hooks/useVendorAuth';
import { getVendorReviews, replyToReview } from '@/services/reviewService';
import Toast from '@/components/vendor/Toast';

export default function ReviewsPage() {
  const { vendor } = useVendorAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState<string>('all');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    if (vendor) {
      loadReviews();
    }
  }, [vendor]);

  const loadReviews = async () => {
    if (!vendor) return;
    
    try {
      setLoading(true);
      const fetchedReviews = await getVendorReviews(vendor.uid);
      setReviews(fetchedReviews);
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to load reviews', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim()) {
      setToast({ message: 'Please enter a reply', type: 'error' });
      return;
    }

    try {
      await replyToReview(reviewId, replyText);
      setReviews(reviews.map(review => 
        review.id === reviewId ? { ...review, vendorReply: replyText } : review
      ));
      setToast({ message: 'Reply posted successfully', type: 'success' });
      setReplyingTo(null);
      setReplyText('');
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to post reply', type: 'error' });
    }
  };

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = (review.productName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (review.customerName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterRating === 'all' || review.rating === parseInt(filterRating);
    return matchesSearch && matchesFilter;
  });

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
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
          <h1 className="text-3xl font-bold text-gray-800">Product Reviews</h1>
          <p className="text-gray-600 mt-1">Manage customer feedback</p>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-4 rounded-2xl shadow-lg">
          <p className="text-sm opacity-90">Average Rating</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-3xl font-bold">{getAverageRating()}</p>
            <Star className="w-6 h-6 fill-white" />
          </div>
          <p className="text-sm opacity-90 mt-1">{reviews.length} reviews</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by product or customer name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 text-gray-900 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none shadow-sm"
          />
        </div>
        <select
          value={filterRating}
          onChange={(e) => setFilterRating(e.target.value)}
          className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none shadow-sm text-gray-900"
        >
          <option value="all">All Ratings</option>
          <option value="5">5 Stars</option>
          <option value="4">4 Stars</option>
          <option value="3">3 Stars</option>
          <option value="2">2 Stars</option>
          <option value="1">1 Star</option>
        </select>
      </div>

      {filteredReviews.length === 0 ? (
        <div className="text-center py-12">
          <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No reviews found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">{review.productName}</h3>
                  <p className="text-sm text-gray-600 mb-2">by {review.customerName}</p>
                  {renderStars(review.rating)}
                </div>
                <p className="text-sm text-gray-500">{review.createdAt.toLocaleDateString()}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-gray-700">{review.comment}</p>
              </div>

              {review.vendorReply ? (
                <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                  <p className="text-sm font-semibold text-purple-700 mb-1">Your Reply:</p>
                  <p className="text-gray-700">{review.vendorReply}</p>
                </div>
              ) : replyingTo === review.id ? (
                <div className="space-y-3">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write your reply..."
                    className="w-full px-4 py-3 text-gray-900 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReply(review.id)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-all font-medium"
                    >
                      Post Reply
                    </button>
                    <button
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyText('');
                      }}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl transition-all font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setReplyingTo(review.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-xl transition-all font-medium"
                >
                  <MessageSquare className="w-4 h-4" />
                  Reply to Review
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}
