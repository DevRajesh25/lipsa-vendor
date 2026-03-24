// Script to generate realistic business notifications for testing
async function generateRealisticNotifications() {
  // You'll need to replace this with actual vendor IDs from your system
  const vendorIds = [
    'test-vendor-123', // Replace with real vendor IDs
    'vendor-1',
    'vendor-2'
  ];

  const notifications = [
    // Order notifications
    {
      type: 'order',
      templates: [
        {
          title: 'New Order Received',
          message: 'You have received a new order for Kitchen Utensil Set - Order #ORD{random} (₹{amount})'
        },
        {
          title: 'New Order Received', 
          message: 'Customer ordered Baby Toy Collection - Order #ORD{random} (₹{amount})'
        },
        {
          title: 'New Order Received',
          message: 'New order for Home Decor Items - Order #ORD{random} (₹{amount})'
        }
      ]
    },
    
    // Product approval notifications
    {
      type: 'product_approved',
      templates: [
        {
          title: 'Product Approved',
          message: 'Your product "Stainless Steel Kitchen Set" has been approved and is now live on the marketplace'
        },
        {
          title: 'Product Approved',
          message: 'Great news! Your "Wooden Toy Collection" has been approved and customers can now purchase it'
        },
        {
          title: 'Product Approved',
          message: 'Your "Home Garden Tools" product has been reviewed and approved for sale'
        }
      ]
    },

    // Product rejection notifications  
    {
      type: 'product_rejected',
      templates: [
        {
          title: 'Product Needs Review',
          message: 'Your product "Electronic Gadget" was rejected. Reason: Images need better quality and clearer product description'
        },
        {
          title: 'Product Needs Review', 
          message: 'Your "Fashion Accessories" submission was rejected. Reason: Price seems too high for the category'
        }
      ]
    },

    // Payout notifications
    {
      type: 'payout_processed',
      templates: [
        {
          title: 'Payout Processed',
          message: 'Your payout of ₹{amount} has been processed and will be credited to your account within 2-3 business days'
        },
        {
          title: 'Payment Released',
          message: 'Great news! Your earnings of ₹{amount} have been transferred to your registered bank account'
        }
      ]
    },

    // Support notifications
    {
      type: 'support_reply',
      templates: [
        {
          title: 'Support Team Reply',
          message: 'You have received a reply to your support ticket about "Payment Processing Issue"'
        },
        {
          title: 'Support Update',
          message: 'Our team has responded to your query about "Product Upload Problems"'
        }
      ]
    },

    // System notifications
    {
      type: 'system',
      templates: [
        {
          title: 'Platform Update',
          message: 'New features added: Bulk product upload and enhanced analytics dashboard are now available'
        },
        {
          title: 'Maintenance Notice',
          message: 'Scheduled maintenance on Sunday 2 AM - 4 AM. Platform may be temporarily unavailable'
        },
        {
          title: 'Policy Update',
          message: 'Updated commission structure: Reduced fees for high-performing vendors. Check your dashboard for details'
        }
      ]
    }
  ];

  console.log('Generating realistic business notifications...\n');

  for (const vendorId of vendorIds) {
    console.log(`Creating notifications for vendor: ${vendorId}`);
    
    // Create 2-3 notifications per vendor from different categories
    const selectedNotifications = [];
    
    // Always include at least one order notification
    const orderNotif = notifications.find(n => n.type === 'order');
    if (orderNotif) {
      const template = orderNotif.templates[Math.floor(Math.random() * orderNotif.templates.length)];
      selectedNotifications.push({
        ...template,
        type: orderNotif.type,
        message: template.message
          .replace('{random}', Math.floor(Math.random() * 9000) + 1000)
          .replace('{amount}', (Math.floor(Math.random() * 5000) + 500).toLocaleString())
      });
    }

    // Add 1-2 random other notifications
    const otherTypes = notifications.filter(n => n.type !== 'order');
    for (let i = 0; i < Math.floor(Math.random() * 2) + 1; i++) {
      const randomType = otherTypes[Math.floor(Math.random() * otherTypes.length)];
      const template = randomType.templates[Math.floor(Math.random() * randomType.templates.length)];
      
      selectedNotifications.push({
        ...template,
        type: randomType.type,
        message: template.message.replace('{amount}', (Math.floor(Math.random() * 10000) + 1000).toLocaleString())
      });
    }

    // Create the notifications
    for (const notification of selectedNotifications) {
      try {
        const response = await fetch('http://localhost:3000/api/admin/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            vendorId: vendorId,
            title: notification.title,
            message: notification.message,
            type: notification.type
          })
        });

        if (response.ok) {
          console.log(`  ✅ ${notification.title}`);
        } else {
          const error = await response.json();
          console.log(`  ❌ Failed: ${error.error}`);
        }
      } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
      }
    }
    
    console.log(''); // Empty line between vendors
  }

  console.log('🎉 Realistic notifications generated!');
  console.log('\nNext steps:');
  console.log('1. Log in to your vendor dashboard');
  console.log('2. Check the notification bell (top right)');
  console.log('3. Visit /vendor/notifications page');
  console.log('4. You should see realistic business notifications');
  console.log('\nIf notifications are still empty:');
  console.log('1. Check browser console for your actual vendor ID');
  console.log('2. Update the vendorIds array in this script');
  console.log('3. Run the script again with your real vendor ID');
}

generateRealisticNotifications();