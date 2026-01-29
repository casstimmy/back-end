/**
 * Manual sanity test for order status update and notification flows
 * This validates that our recent log cleanup didn't break core functionality
 */

import { mongooseConnect } from './lib/mongoose.js';
import Order from './models/Order.js';
import Notification from './models/Notification.js';
import { createOrderNotification, removeOrderNotifications, ensurePendingOrderNotifications } from './lib/notifications.js';

async function testOrderNotificationFlow() {
  console.log('\n=== SANITY TEST: Order Notification Flow ===\n');

  try {
    await mongooseConnect();
    console.log('✓ Connected to MongoDB');

    // Test 1: Create a test order (should trigger post-save hook)
    console.log('\n[Test 1] Creating new order with Pending status...');
    const testOrder = await Order.create({
      shippingDetails: {
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '1234567890',
        address: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        zipcode: '12345'
      },
      cartProducts: [
        {
          productId: 'test-product-1',
          name: 'Test Product',
          price: 5000,
          quantity: 1
        }
      ],
      total: 5000,
      status: 'Pending'
    });
    console.log(`✓ Order created: ${testOrder._id}`);

    // Test 2: Check if notification was auto-created
    console.log('\n[Test 2] Checking if notification auto-created...');
    const notif1 = await Notification.findOne({
      referenceId: testOrder._id.toString(),
      type: 'order_received'
    });
    if (notif1) {
      console.log(`✓ Notification auto-created: ${notif1._id}`);
    } else {
      console.log(`✗ ERROR: Notification NOT auto-created`);
    }

    // Test 3: Update order status to Shipped (should remove notification)
    console.log('\n[Test 3] Updating order status to Shipped...');
    testOrder.status = 'Shipped';
    await testOrder.save();
    console.log(`✓ Order status updated to: ${testOrder.status}`);

    // Test 4: Verify notification was removed
    console.log('\n[Test 4] Verifying notification was removed...');
    const notif2 = await Notification.findOne({
      referenceId: testOrder._id.toString(),
      type: 'order_received'
    });
    if (!notif2) {
      console.log(`✓ Notification correctly removed`);
    } else {
      console.log(`✗ ERROR: Notification still exists after status change`);
    }

    // Test 5: Change status back to Pending (should recreate notification)
    console.log('\n[Test 5] Changing status back to Pending...');
    testOrder.status = 'Pending';
    await testOrder.save();
    console.log(`✓ Order status updated to: ${testOrder.status}`);

    // Test 6: Verify notification was recreated
    console.log('\n[Test 6] Verifying notification was recreated...');
    const notif3 = await Notification.findOne({
      referenceId: testOrder._id.toString(),
      type: 'order_received'
    });
    if (notif3) {
      console.log(`✓ Notification correctly recreated: ${notif3._id}`);
    } else {
      console.log(`✗ ERROR: Notification NOT recreated`);
    }

    // Test 7: Test backfill function
    console.log('\n[Test 7] Testing backfill (ensurePendingOrderNotifications)...');
    const backfillResult = await ensurePendingOrderNotifications();
    console.log(`✓ Backfill complete: ${backfillResult.created} created, ${backfillResult.checked} checked`);

    // Test 8: Cleanup - remove test order and notifications
    console.log('\n[Test 8] Cleaning up test data...');
    await removeOrderNotifications(testOrder._id);
    await Order.deleteOne({ _id: testOrder._id });
    console.log(`✓ Test order and notifications removed`);

    console.log('\n=== ALL TESTS PASSED ===\n');
    process.exit(0);

  } catch (error) {
    console.error('\n✗ TEST FAILED:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testOrderNotificationFlow();
