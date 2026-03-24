// Debug script to check vendor authentication
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

// This would need actual Firebase config
console.log('To debug vendor authentication, you need to:');
console.log('1. Check if you are logged in as a vendor');
console.log('2. Check your vendor ID in the browser console');
console.log('3. Create notifications for your actual vendor ID');
console.log('');
console.log('Steps to debug:');
console.log('1. Open browser dev tools (F12)');
console.log('2. Go to vendor dashboard');
console.log('3. Check console for "Vendor data:" log');
console.log('4. Note the vendor UID');
console.log('5. Create notifications for that UID');
console.log('');
console.log('Example: If your vendor UID is "abc123", create notifications like:');
console.log('curl -X POST http://localhost:3000/api/admin/notifications \\');
console.log('  -H "Content-Type: application/json" \\');
console.log('  -d \'{"vendorId":"abc123","title":"Test","message":"Test message","type":"system"}\'');