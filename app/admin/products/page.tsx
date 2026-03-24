'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, CheckCircle, XCircle, Eye, Search } from 'lucide-react';
import { Product } from '@/lib/types';
import { 
  createProductApprovedNotification, 
  createProductRejectedNotification 
} from '@/services/notificationService';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      // In a real app, you'd fetch from your API
      // For now, we'll simulate with empty array
      setProducts([]);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveProduct = async (product: Product) => {
    try {
      // Update product status to approved
      const response = await fetch(`/api/admin/products/${product.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        // Create notification for vendor
        await createProductApprovedNotification(product.vendorId, product.name);
        
        // Update local state
        setProducts(products.map(p => 
          p.id === product.id ? { ...p, status: 'approved' } : p
        ));
        
        alert('Product approved and vendor notified!');
      } else {
        alert('Failed to approve product');
      }
    } catch (error) {
      console.error('Error approving product:', error);
      alert('Error approving product');
    }
  };

  const handleRejectProduct = async (product: Product) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      // Update product status to rejected
      const response = await fetch(`/api/admin/products/${product.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        // Create notification for vendor
        await createProductRejectedNotification(product.vendorId, product.name, reason);
        
        // Update local state
        setProducts(products.map(p => 
          p.id === product.id ? { ...p, status: 'rejected' } : p
        ));
        
        alert('Product rejected and vendor notified!');
      } else {
        alert('Failed to reject product');
      }
    } catch (error) {
      console.error('Error rejecting product:', error);
      alert('Error rejecting product');
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesFilter = filter === 'all' || product.status === filter;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Product Management</h1>
          <p className="text-gray-600 mt-1">Review and approve vendor products</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                filter === status
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
        
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Products List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">
            {products.length === 0 ? 'No products found' : 'No products match your filters'}
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Products will appear here when vendors submit them for review
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-6 border"
            >
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Product Image */}
                <div className="lg:w-48 h-48 bg-gray-100 rounded-xl flex items-center justify-center">
                  {product.images && product.images[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <Package className="w-16 h-16 text-gray-400" />
                  )}
                </div>

                {/* Product Details */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">{product.name}</h3>
                      <p className="text-gray-600 mb-2">{product.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Price: ₹{product.price.toLocaleString()}</span>
                        <span>Stock: {product.stock}</span>
                        <span>Category: {product.categoryName}</span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      product.status === 'approved' ? 'bg-green-100 text-green-800' :
                      product.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {product.status}
                    </span>
                  </div>

                  {/* Actions */}
                  {product.status === 'pending' && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleApproveProduct(product)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectProduct(product)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors">
                        <Eye className="w-4 h-4" />
                        View Details
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