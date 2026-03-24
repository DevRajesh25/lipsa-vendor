'use client';

import { Truck } from 'lucide-react';

export default function ShippingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
          <Truck className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Shipping Methods</h1>
        <p className="text-gray-600">This feature will be implemented soon</p>
      </div>
    </div>
  );
}
