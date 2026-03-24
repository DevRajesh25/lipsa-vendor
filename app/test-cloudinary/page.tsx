'use client';

import { useState, useRef } from 'react';
import { Upload, CheckCircle, XCircle, Info } from 'lucide-react';

export default function TestCloudinaryPage() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const checkConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-cloudinary');
      const data = await response.json();
      setConfig(data);
    } catch (error) {
      setConfig({ error: 'Failed to check configuration' });
    } finally {
      setLoading(false);
    }
  };

  const testUpload = async (file: File) => {
    setUploadLoading(true);
    setUploadResult(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/test-cloudinary', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      setUploadResult(data);
    } catch (error: any) {
      setUploadResult({ success: false, error: error.message });
    } finally {
      setUploadLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      testUpload(file);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Cloudinary Configuration Test</h1>
        
        {/* Configuration Check */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Configuration Status</h2>
            <button
              onClick={checkConfig}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Check Config'}
            </button>
          </div>
          
          {config && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {config.configured ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <span className={config.configured ? 'text-green-700' : 'text-red-700'}>
                  {config.configured ? 'Cloudinary Configured' : 'Cloudinary Not Configured'}
                </span>
              </div>
              
              {config.cloudName && (
                <div className="text-sm text-gray-600">
                  <strong>Cloud Name:</strong> {config.cloudName}
                </div>
              )}
              
              {config.uploadPreset && (
                <div className="text-sm text-gray-600">
                  <strong>Upload Preset:</strong> {config.uploadPreset}
                </div>
              )}
              
              {config.presetExists !== undefined && (
                <div className="flex items-center gap-2">
                  {config.presetExists === true ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : config.presetExists === false ? (
                    <XCircle className="w-4 h-4 text-red-500" />
                  ) : (
                    <Info className="w-4 h-4 text-yellow-500" />
                  )}
                  <span className="text-sm">
                    Upload Preset: {
                      config.presetExists === true ? 'Exists' :
                      config.presetExists === false ? 'Not Found' :
                      'Unknown'
                    }
                  </span>
                </div>
              )}
              
              {config.presetData && (
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  <strong>Preset Details:</strong>
                  <pre className="mt-1 text-xs">
                    {JSON.stringify(config.presetData, null, 2)}
                  </pre>
                </div>
              )}
              
              {config.error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                  <strong>Error:</strong> {config.error}
                </div>
              )}
              
              {config.note && (
                <div className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded">
                  <strong>Note:</strong> {config.note}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Upload Test */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Upload Test</h2>
          
          <div className="space-y-4">
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadLoading}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
              >
                {uploadLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {uploadLoading ? 'Uploading...' : 'Test Upload'}
              </button>
            </div>
            
            {uploadResult && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {uploadResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className={uploadResult.success ? 'text-green-700' : 'text-red-700'}>
                    {uploadResult.success ? 'Upload Successful' : 'Upload Failed'}
                  </span>
                </div>
                
                {uploadResult.url && (
                  <div>
                    <div className="text-sm text-gray-600 mb-2">
                      <strong>Uploaded Image:</strong>
                    </div>
                    <img 
                      src={uploadResult.url} 
                      alt="Uploaded test" 
                      className="max-w-xs rounded-lg border"
                    />
                    <div className="text-xs text-gray-500 mt-1 break-all">
                      {uploadResult.url}
                    </div>
                  </div>
                )}
                
                {uploadResult.error && (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                    <strong>Error:</strong> {uploadResult.error}
                  </div>
                )}
                
                {uploadResult.status && (
                  <div className="text-sm text-gray-600">
                    <strong>Status:</strong> {uploadResult.status}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">Troubleshooting Steps</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-700">
            <li>Check if all environment variables are set correctly</li>
            <li>Verify the upload preset exists in your Cloudinary dashboard</li>
            <li>Ensure the upload preset is set to "Unsigned" mode</li>
            <li>Check if your Cloudinary account is active and within limits</li>
            <li>Try uploading a small test image (less than 1MB)</li>
          </ol>
        </div>
      </div>
    </div>
  );
}