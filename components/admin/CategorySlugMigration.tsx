'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { fixProductCategorySlugs, getProductsWithEmptySlug } from '@/services/productService';
import Toast from '@/components/vendor/Toast';

interface MigrationResult {
  totalProducts: number;
  fixedProducts: number;
  errors: string[];
}

export default function CategorySlugMigration() {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [productsNeedingFix, setProductsNeedingFix] = useState<number>(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const checkProductsNeedingFix = async () => {
    setChecking(true);
    try {
      const products = await getProductsWithEmptySlug();
      setProductsNeedingFix(products.length);
      
      if (products.length === 0) {
        setToast({ message: 'All products have valid categorySlug!', type: 'success' });
      } else {
        setToast({ message: `Found ${products.length} products needing categorySlug fix`, type: 'info' });
      }
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to check products', type: 'error' });
    } finally {
      setChecking(false);
    }
  };

  const runMigration = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const migrationResult = await fixProductCategorySlugs();
      setResult(migrationResult);
      
      if (migrationResult.fixedProducts > 0) {
        setToast({ 
          message: `Successfully fixed ${migrationResult.fixedProducts} products!`, 
          type: 'success' 
        });
      } else {
        setToast({ 
          message: 'No products needed fixing', 
          type: 'info' 
        });
      }
      
      // Refresh the count
      await checkProductsNeedingFix();
    } catch (error: any) {
      setToast({ message: error.message || 'Migration failed', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-100 rounded-lg">
          <RefreshCw className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800">Category Slug Migration</h3>
          <p className="text-gray-600 text-sm">Fix products with empty categorySlug for homepage filtering</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">What this does:</h4>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>• Finds products with empty or missing categorySlug</li>
            <li>• Generates URL-friendly slugs from category names</li>
            <li>• Updates products so they appear in homepage sections</li>
            <li>• Safe to run multiple times</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <button
            onClick={checkProductsNeedingFix}
            disabled={checking}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium disabled:opacity-50"
          >
            {checking ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            Check Products
          </button>

          <button
            onClick={runMigration}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-lg transition-all shadow-lg font-medium disabled:opacity-50"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Play className="w-4 h-4" />
            )}
            Run Migration
          </button>
        </div>

        {productsNeedingFix > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <span className="font-semibold text-yellow-800">
                {productsNeedingFix} products need categorySlug fix
              </span>
            </div>
          </motion.div>
        )}

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-50 border border-gray-200 rounded-lg p-4"
          >
            <h4 className="font-semibold text-gray-800 mb-3">Migration Results:</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total Products:</span>
                <div className="font-bold text-gray-800">{result.totalProducts}</div>
              </div>
              <div>
                <span className="text-gray-600">Fixed:</span>
                <div className="font-bold text-green-600">{result.fixedProducts}</div>
              </div>
              <div>
                <span className="text-gray-600">Errors:</span>
                <div className="font-bold text-red-600">{result.errors.length}</div>
              </div>
            </div>
            
            {result.errors.length > 0 && (
              <div className="mt-4">
                <h5 className="font-semibold text-red-800 mb-2">Errors:</h5>
                <div className="bg-red-50 border border-red-200 rounded p-3 max-h-32 overflow-y-auto">
                  {result.errors.map((error, index) => (
                    <div key={index} className="text-red-700 text-xs mb-1">{error}</div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}