'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, Download, FileText, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';
import { useVendorAuth } from '@/hooks/useVendorAuth';
import { 
  parseCSVFile, 
  validateProduct, 
  bulkUploadProducts, 
  generateSampleCSV,
  CSVProduct,
  ParsedProduct,
  UploadResult
} from '@/services/bulkUploadService';
import Toast from '@/components/vendor/Toast';

export default function BulkUploadPage() {
  const { vendor } = useVendorAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        setToast({ message: 'Please select a CSV file', type: 'error' });
        return;
      }
      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !vendor) {
      setToast({ message: 'Please select a file and ensure you are logged in', type: 'error' });
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      // Parse CSV file
      const csvData: CSVProduct[] = await parseCSVFile(selectedFile);
      
      if (csvData.length === 0) {
        setToast({ message: 'CSV file is empty', type: 'error' });
        setUploading(false);
        return;
      }

      // Validate products
      const validProducts: ParsedProduct[] = [];
      const validationErrors: Array<{ row: number; error: string; product?: CSVProduct }> = [];

      csvData.forEach((product, index) => {
        const validation = validateProduct(product, index + 2); // +2 for header and 1-indexed
        if (validation.valid && validation.parsed) {
          validProducts.push(validation.parsed);
        } else {
          validationErrors.push({
            row: index + 2,
            error: validation.error || 'Unknown validation error',
            product
          });
        }
      });

      if (validProducts.length === 0) {
        setUploadResult({
          success: false,
          message: 'No valid products found in CSV',
          successCount: 0,
          failureCount: csvData.length,
          errors: validationErrors
        });
        setUploading(false);
        return;
      }

      // Upload products
      const result = await bulkUploadProducts(validProducts, vendor.uid);
      
      // Combine validation errors with upload errors
      result.errors = [...validationErrors, ...result.errors];
      result.failureCount += validationErrors.length;

      setUploadResult(result);
      
      if (result.success) {
        setToast({ message: result.message, type: 'success' });
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setToast({ message: result.message, type: 'error' });
      }

    } catch (error: any) {
      setToast({ message: error.message || 'Failed to upload products', type: 'error' });
      setUploadResult({
        success: false,
        message: error.message || 'Upload failed',
        successCount: 0,
        failureCount: 0,
        errors: []
      });
    } finally {
      setUploading(false);
    }
  };

  const downloadSampleCSV = () => {
    const csvContent = generateSampleCSV();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sample-products.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Bulk Product Upload</h1>
        <p className="text-gray-600 mt-1">Upload multiple products at once using a CSV file</p>
      </div>

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-blue-50 border border-blue-200 rounded-2xl p-6"
      >
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-800 mb-2">How to use bulk upload:</h3>
            <ol className="text-blue-700 space-y-1 text-sm list-decimal list-inside">
              <li>Download the sample CSV file to see the required format</li>
              <li>Fill in your product data following the same structure</li>
              <li>Make sure category slugs match existing categories</li>
              <li>Upload your CSV file and review the results</li>
              <li>All uploaded products will be pending admin approval</li>
            </ol>
          </div>
        </div>
      </motion.div>

      {/* CSV Format Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <h2 className="text-xl font-bold text-gray-800 mb-4">CSV Format Requirements</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Required Columns:</h3>
            <ul className="space-y-1 text-sm text-gray-600">
              <li><code className="bg-gray-100 px-2 py-1 rounded">name</code> - Product name</li>
              <li><code className="bg-gray-100 px-2 py-1 rounded">description</code> - Product description</li>
              <li><code className="bg-gray-100 px-2 py-1 rounded">price</code> - Price (number)</li>
              <li><code className="bg-gray-100 px-2 py-1 rounded">stock</code> - Stock quantity (number)</li>
              <li><code className="bg-gray-100 px-2 py-1 rounded">categorySlug</code> - Category identifier</li>
              <li><code className="bg-gray-100 px-2 py-1 rounded">imageUrl</code> - Product image URL</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Valid Category Slugs:</h3>
            <ul className="space-y-1 text-sm text-gray-600">
              <li><code className="bg-gray-100 px-2 py-1 rounded">baby-essentials</code></li>
              <li><code className="bg-gray-100 px-2 py-1 rounded">health-beauty</code></li>
              <li><code className="bg-gray-100 px-2 py-1 rounded">kitchen-accessories</code></li>
              <li><code className="bg-gray-100 px-2 py-1 rounded">home-essentials</code></li>
              <li><code className="bg-gray-100 px-2 py-1 rounded">electronics</code></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-6">
          <button
            onClick={downloadSampleCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Sample CSV
          </button>
        </div>
      </motion.div>

      {/* File Upload */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <h2 className="text-xl font-bold text-gray-800 mb-4">Upload CSV File</h2>
        
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-purple-400 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload" className="cursor-pointer">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                {selectedFile ? selectedFile.name : 'Choose CSV file'}
              </p>
              <p className="text-sm text-gray-500">
                Click to select or drag and drop your CSV file here
              </p>
            </label>
          </div>

          {selectedFile && (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-800">{selectedFile.name}</p>
                  <p className="text-sm text-gray-600">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg transition-colors"
              >
                <Upload className="w-4 h-4" />
                {uploading ? 'Uploading...' : 'Upload Products'}
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Upload Results */}
      {uploadResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            {uploadResult.success ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : (
              <XCircle className="w-6 h-6 text-red-600" />
            )}
            <h2 className="text-xl font-bold text-gray-800">Upload Results</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-green-800">Products Uploaded</span>
              </div>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {uploadResult.successCount}
              </p>
            </div>
            
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <span className="font-semibold text-red-800">Products Failed</span>
              </div>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {uploadResult.failureCount}
              </p>
            </div>
          </div>

          {uploadResult.errors.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                Error Details
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {uploadResult.errors.map((error, index) => (
                  <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="font-medium text-red-800">Row {error.row}: {error.error}</p>
                    {error.product && (
                      <p className="text-sm text-red-600 mt-1">
                        Product: {error.product.name}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {uploadResult.successCount > 0 && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800">
                <strong>Note:</strong> All uploaded products are pending admin approval. 
                They will appear on the customer website once approved by an administrator.
              </p>
            </div>
          )}
        </motion.div>
      )}

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}