# 🔍 Notification Debug Guide - Diagnosing "0 Pending Orders"

## The Problem

You're seeing:
```
Found 0 pending orders
[Notifications API] Returned 0 notifications, 0 unread
```

Even though you just created an order. This means **orders are being created but notifications are not being created for them**.

## Diagnostic Steps

### Step 1: Check the Server Logs When Creating an Order

When you create an order, look for these logs in your server terminal:

**If it's working, you should see:**
```
[Orders POST] ========================================
[Orders POST] New order created: 507f1f77bcf86cd799439011
[Orders POST] Status: "Pending" (type: string)
[Orders POST] Status lowercase: "pending"
[Orders POST] Is pending?: true
[Orders POST] Customer: John Doe
[Orders POST] Items: 2
[Orders POST] Total: 5000
[Orders POST] ========================================

[Orders POST] About to check notification - isPending=true
[Orders POST] Creating notification for order 507f1f77bcf86cd799439011...

[ORDER NOTIFICATION] ========================================
[ORDER NOTIFICATION] Processing order 507f1f77bcf86cd799439011
[ORDER NOTIFICATION] Raw status: "Pending" (type: string)
[ORDER NOTIFICATION] Status lowercase: "pending"
[ORDER NOTIFICATION] Items count: 2
[ORDER NOTIFICATION] ========================================
[ORDER NOTIFICATION] Checking: "pending" === "pending"? true
[ORDER NOTIFICATION] ✅ Status check passed - is pending
[✓ Notification Created] Type: order_received, ID: ..., Ref: 507f1f77bcf86cd799439011

[Orders POST] ✅ Notification created successfully
```

### Step 2: If You DON'T See Those Logs

**Check what status IS being saved:**

Look for:
```
[Orders POST] Status: "???" (type: ...)
```

**Common Issues:**

| Status Logged | Problem | Solution |
|--------------|---------|----------|
| `"Pending"` with `Is pending?: false` | Case sensitivity? | Restart server - might be stale code |
| `""` (empty) | No status in request body | Client not sending status |
| `null` | Database not saving | Check MongoDB connection |
| `"Processing"` | Order created with wrong status | Check checkout form |

### Step 3: Use the Test Endpoint

**Go to:** http://localhost:3000/api/test-notifications

**Look for this section:**
```json
{
  "ordersDebug": {
    "totalOrders": 5,
    "pendingOrders": 1,
    "pendingOrderIds": [
      {
        "id": "507f1f77bcf86cd799439011",
        "status": "Pending",
        "customer": "John Doe"
      }
    ]
  }
}
```

**If `pendingOrders: 0`:**
- Orders are not being saved with "Pending" status
- Check the order creation on the client side

**If `pendingOrders: 1` but no notifications created:**
- The backfill should create the notification
- Check the logs for `[✓ BACKFILL]` message

### Step 4: Check Database Directly

**Open MongoDB and run:**

```javascript
// See ALL orders
db.orders.find().pretty()

// See PENDING orders
db.orders.find({ status: "Pending" }).pretty()
db.orders.find({ status: { $regex: /^pending$/i } }).pretty()

// Count orders by status
db.orders.aggregate([
  { $group: { _id: "$status", count: { $sum: 1 } } }
])
```

**Expected output:**
```javascript
{
  "_id": "Pending",
  "count": 3
}
```

**If you see status as "processing" or other values:**
- Orders are being created with wrong status
- Check the checkout form/API request

## Common Root Causes & Fixes

### Cause 1: Status Not Being Passed in Checkout

**Symptom:** Orders created with empty status

**Check:** Look at your checkout form - is it sending `status: "Pending"`?

**Fix:** Ensure checkout POST request includes:
```json
{
  "shippingDetails": {...},
  "cartProducts": [...],
  "total": 5000,
  "status": "Pending"
}
```

### Cause 2: Status Saved as Different Value

**Symptom:** Orders saved with `"Processing"` instead of `"Pending"`

**Check:** Did you change the checkout to use different status?

**Fix:** Verify Order model default:
```javascript
// In pages/api/orders/index.js
const { status = "Pending" } = req.body;
```

### Cause 3: Race Condition - Notification Runs Before Order Saved

**Symptom:** Notification logs appear before "New order created" log

**Fix:** Already implemented - POST now `await`s the save before creating notification

### Cause 4: Database Connection Lost

**Symptom:** Notification returns null, no error logged

**Check:** Server terminal for:
```
[✗ Notification Error]
```

**Fix:** 
1. Verify `MONGODB_URI` in `.env`
2. Check MongoDB is running
3. Restart server

### Cause 5: Old Code Still Running

**Symptom:** Logs don't match expected format

**Fix:**
1. Ctrl+C to stop server
2. `npm run dev` to restart
3. Create order again

## Full Debug Checklist

- [ ] Server is running (`npm run dev`)
- [ ] MongoDB is connected (check `.env`)
- [ ] Created order at `/` shop
- [ ] Check server terminal for `[Orders POST]` logs
- [ ] If no logs, check if order POST is even being called
- [ ] If logs show status not "Pending", fix checkout
- [ ] If status is "Pending" but notification not created, check notification logs
- [ ] Run `/api/test-notifications` to see database state
- [ ] Check MongoDB for pending orders directly
- [ ] Check MongoDB for order_received notifications

## Quick Fixes

### Fix 1: Restart Everything
```bash
Ctrl+C  # Stop server
npm run dev  # Start server
```

### Fix 2: Clear Old Orders and Retry
```javascript
// In MongoDB
db.orders.deleteMany({ status: "Pending" })
db.notifications.deleteMany({ type: "order_received" })
```
Then create new order and check logs.

### Fix 3: Force Backfill
```
GET /api/test-notifications
```
This will show exactly what's in the database and create any missing notifications.

### Fix 4: Check Network

Are the POST requests even reaching the server?

1. Open DevTools (F12)
2. Go to Network tab
3. Create order
4. Look for `POST /api/orders`
5. Check response status (should be 201)

## Still Not Working?

### Share These Logs:

1. **Server logs** when creating order:
   - Paste entire output from `[Orders POST]` section

2. **Server logs** when running test-notifications:
   - Paste `ordersDebug` section from response

3. **MongoDB query result:**
   ```javascript
   db.orders.find({ status: "Pending" }).pretty()
   db.notifications.find({ type: "order_received" }).pretty()
   ```

4. **Browser console errors** (F12):
   - Any error messages when creating order?

With these details, I can pinpoint exactly where the flow is breaking.

---

## Expected Flow (With Logging)

```
1. Customer clicks "Place Order" on /checkout
   ↓
   POST /api/orders request sent with:
   {
     shippingDetails: {...},
     cartProducts: [...],
     total: 5000,
     status: "Pending"
   }
   ↓
2. Server receives POST, logs:
   [Orders POST] New order created: {id}
   [Orders POST] Status: "Pending"
   [Orders POST] Is pending?: true
   ↓
3. Server calls createOrderNotification()
   [ORDER NOTIFICATION] Processing order {id}
   [ORDER NOTIFICATION] Status lowercase: "pending"
   [ORDER NOTIFICATION] Checking: "pending" === "pending"? true
   ↓
4. Notification created in database
   [✓ Notification Created] Type: order_received
   [Orders POST] ✅ Notification created successfully
   ↓
5. Response sent to client
   ↓
6. User goes to home page, clicks bell
   GET /api/notifications
   [Notifications API] Returned 1 notifications, 1 unread
   ↓
7. Bell shows badge "1"
   ↓
8. User clicks bell, sees order notification
```

If the flow stops at any point, that's where to look.
