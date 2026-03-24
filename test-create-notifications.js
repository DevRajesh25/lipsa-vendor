// Test script to create sample notifications
async function createTestNotifications() {
  const testNotifications = [
    {
      vendorId: "test-vendor-123",
      title: "New Order Received",
      message: "You have received a new order for Baby Toy Set - Order #ORD001",
      type: "order"
    },
    {
      vendorId: "test-vendor-123", 
      title: "Product Approved",
      message: "Your product 'Kitchen Utensil Set' has been approved and is now live",
      type: "product_approved"
    },
    {
      vendorId: "test-vendor-123",
      title: "Payout Processed", 
      message: "Your payout of ₹5,000 has been processed and will be credited to your account",
      type: "payout_processed"
    },
    {
      vendorId: "test-vendor-123",
      title: "Support Ticket Reply",
      message: "You have received a reply to your support ticket about payment issues",
      type: "support_reply"
    }
  ];

  console.log('Creating test notifications...');
  
  for (const notification of testNotifications) {
    try {
      const response = await fetch('http://localhost:3000/api/admin/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notification)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log(`✅ Created: ${notification.title}`);
      } else {
        console.log(`❌ Failed: ${notification.title} - ${result.error}`);
      }
    } catch (error) {
      console.log(`❌ Error creating ${notification.title}:`, error.message);
    }
  }
}

// Run the test
createTestNotifications();