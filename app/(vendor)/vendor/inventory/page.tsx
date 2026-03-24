'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Package, Edit2, Save, X } from 'lucide-react';
import { Product } from '@/lib/types';
import { useVendorAuth } from '@/hooks/useVendorAuth';
import { getVendorProducts, updateProductStock } from '@/services/productService';
import Toast from '@/components/vendor/Toast';

export default function InventoryPage() {
  const { vendor } = useVendorAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStock, setEditStock] = useState<number>(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    if (vendor) {
      loadProducts();
    }
  }, [vendor]);

  const loadProducts = async () => {
    if (!vendor) return;
    
    try {
      setLoading(true);
      const fetchedProducts = await getVendorProducts(vendor.uid);
      setProducts(fetchedProducts);
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to load products', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products
    .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      // Sort by stock: low stock (< 5) first, then by stock amount ascending
      const aLowStock = a.stock < 5;
      const bLowStock = b.stock < 5;
      
      if (aLowStock && !bLowStock) return -1;
      if (!aLowStock && bLowStock) return 1;
      
      // If both are low stock or both are not, sort by stock amount
      return a.stock - b.stock;
    });

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setEditStock(product.stock);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditStock(0);
  };

  const saveStock = async (productId: string) => {
    try {
      await updateProductStock(productId, editStock);
      setProducts(products.map(p => 
        p.id === productId ? { ...p, stock: editStock } : p
      ));
      setToast({ message: 'Stock updated successfully', type: 'success' });
      setEditingId(null);
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to update stock', type: 'error' });
    }
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-700' };
    if (stock < 5) return { label: 'Critical', color: 'bg-red-100 text-red-700' };
    if (stock < 10) return { label: 'Low Stock', color: 'bg-orange-100 text-orange-700' };
    return { label: 'In Stock', color: 'bg-green-100 text-green-700' };
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
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Inventory Management</h1>
        <p className="text-gray-600 mt-1">Track and update your product stock levels</p>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 text-gray-900 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none shadow-sm"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">Product</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Category</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Price</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Stock</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.map((product, index) => {
                const status = getStockStatus(product.stock);
                const isEditing = editingId === product.id;

                return (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {product.images?.[0] ? (
                          <img 
                            src={product.images[0]} 
                            alt={product.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Package className="w-6 h-6 text-purple-600" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-800">{product.name}</p>
                          <p className="text-sm text-gray-500">ID: {product.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{product.category}</td>
                    <td className="px-6 py-4 text-gray-700 font-semibold">₹{product.price}</td>
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          value={editStock}
                          onChange={(e) => setEditStock(parseInt(e.target.value) || 0)}
                          className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-gray-900 font-bold bg-white"
                        />
                      ) : (
                        <span className="font-bold text-gray-900 text-lg">{product.stock}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveStock(product.id)}
                            className="p-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(product)}
                          className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}
