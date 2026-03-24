// Script to create notifications for real vendors
async function createNotificationsForRealVendors() {
  // First, let's try to get vendor IDs from the system
  // We'll create notifications for common test vendor IDs
  
  const possibleVendorIds = [
    'test-vendor-123',
    'vendor-1',
    'vendor-2', 
    'demo-vendor',
    // Add more common test IDs
  ];
  
  const notification = {
    title: "System Test Notification",
    message: "This is a test notification to verify the notification system is working properly. If you can see this, the system is functioning correctly!",
    type: "system"
  };
  
  console.log('Creating test notifications for multiple vendor IDs...');
  
  for (const vendorId of possibleVendorIds) {
    try {
      const response = await fetch('http://localhost:3000/api/admin/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...notification,
          vendorId: vendorId
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log(`✅ Created notification for vendor: ${vendorId}`);
      } else {
        console.log(`❌ Failed for vendor ${vendorId}: ${result.error}`);
      }
    } catch (error) {
      console.log(`❌ Error for vendor ${vendorId}:`, error.message);
    }
  }
  
  console.log('\nNow check your vendor dashboard to see if notifications appear!');
  console.log('If still empty, check browser console for your actual vendor ID.');
}

createNotificationsForRealVendors();