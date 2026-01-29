# Notification System - Quick Reference Guide

## 🚀 What Was Built

A production-ready notification system that automatically creates notifications when orders are placed and displays them in the admin panel.

## 📊 System Architecture

```
Order Created
    ↓
POST /api/orders
    ↓
Order saved with status="Pending"
    ↓
createOrderNotification(order)
    ↓
Notification saved to MongoDB
    ↓
Admin sees bell icon with unread count
    ↓
Admin clicks bell to see notifications
```

## 🔗 Integration Points

| Component | File | Purpose |
|-----------|------|---------|
| **NavBar** | `components/NavBar.js` | Line 37: `<NotificationsCenter />` |
| **NotificationsCenter** | `components/NotificationsCenter.js` | Polls `/api/notifications` every 30s |
| **Order Creation** | `pages/api/orders/index.js` | Calls `createOrderNotification()` |
| **Notification Logic** | `lib/notifications.js` | Creates/manages notifications |
| **API Endpoint** | `pages/api/notifications/index.js` | Returns notifications from database |
| **Notification Model** | `models/Notification.js` | Database schema |

## 🧪 Testing the System

### Step 1: Start Server
```bash
npm run dev
```

### Step 2: Create Test Order
1. Go to checkout page
2. Fill in order details
3. Submit order

### Step 3: Check Logs
Watch server terminal for:
```
[Orders POST] New order created: {orderId}
[Orders POST] Status: "Pending" (type: string)
[Orders POST] Is pending?: true
[ORDER NOTIFICATION] ✓ Notification Created
```

### Step 4: Check Database
Visit `/api/test-notifications` to see:
```json
{
  "pendingOrders": 1,
  "ordersDebug": [
    { "customer": "Your Name" }
  ]
}
```

### Step 5: Check Frontend
Bell icon in NavBar should show "1" unread notification

Click bell to see:
```
🎁 New Order Received
Order from Your Name - Items: ...
```

## 📋 API Endpoints

### GET /api/notifications
Returns unread notifications for the admin panel.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "type": "order_received",
      "title": "🎁 New Order Received",
      "message": "Order from John Doe - Items: Hair Product (x1). Total: ₦5,000",
      "isRead": false,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "unreadCount": 1,
  "totalCount": 1
}
```

### POST /api/orders
Creates a new order and notification.

**Request:**
```json
{
  "shippingDetails": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "09012345678"
  },
  "cartProducts": [
    {
      "name": "Hair Product",
      "quantity": 1,
      "price": 5000
    }
  ],
  "total": 5000
}
```

**Response:**
```json
{
  "order": {
    "_id": "507f1f77bcf86cd799439011",
    "status": "Pending",
    "shippingDetails": {...},
    "cartProducts": [...],
    "total": 5000
  }
}
```

### GET /api/test-notifications
Debug endpoint showing database state.

**Response:**
```json
{
  "success": true,
  "totalOrders": 42,
  "pendingOrders": 5,
  "ordersDebug": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "customer": "John Doe"
    }
  ],
  "backfillResult": "Found 5 pending orders. Notifications exist for 5 orders.",
  "outOfStockResult": "Checked 50 products, found 3 with quantity 0"
}
```

## 🔍 Debugging Checklist

### Notification not showing?

1. **Check if order was created:**
   - Visit `/api/test-notifications`
   - Should show `"pendingOrders": 1` or more

2. **Check if notification was created:**
   - Visit `/api/test-notifications`
   - Check if all pending orders have notifications

3. **Check server logs:**
   - Should see `[Orders POST]` and `[ORDER NOTIFICATION]` logs
   - Look for `✓ Notification Created` message

4. **Check database:**
   - Verify orders exist in MongoDB
   - Verify notifications exist in MongoDB

### Notification showing but missing data?

1. Check that order has `cartProducts` array
2. Check that order has `shippingDetails` with `name`
3. Check that order status is exactly "Pending" (capital P)
4. Re-run `/api/test-notifications` to trigger backfill

### Bell icon not updating?

1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R)
3. Check browser console for errors
4. Check NotificationsCenter is rendered (view source)

## 📝 Notification Types

| Type | Trigger | Example |
|------|---------|---------|
| `order_received` | New order created with status="Pending" | "Order from John Doe - Items: Hair Product (x1)" |
| `out_of_stock` | Product quantity reaches 0 | "Hair Product is now out of stock" |

## 🛠️ How to Add New Notification Type

1. Add to enum in `models/Notification.js`:
   ```javascript
   enum: ["order_received", "out_of_stock", "your_new_type"]
   ```

2. Create function in `lib/notifications.js`:
   ```javascript
   export async function checkYourNotifications() {
     // Your logic here
     await createNotification({
       type: "your_new_type",
       title: "...",
       message: "...",
       ...
     });
   }
   ```

3. Call function when needed

## 🔄 Automatic Features

- **Backfill**: Every 2 minutes, checks if any pending orders are missing notifications
- **Polling**: Frontend checks for new notifications every 30 seconds
- **Cache Invalidation**: Immediately after creating notification
- **Duplicate Prevention**: Won't create notification if one already exists
- **Status Validation**: Only creates notification if order status is "Pending"

## 🎯 Key Files

| File | Purpose | Lines |
|------|---------|-------|
| `components/NavBar.js` | Renders bell icon | 37 |
| `components/NotificationsCenter.js` | Polls API, shows dropdown | 115 |
| `pages/api/orders/index.js` | Creates orders and notifications | 160 |
| `pages/api/notifications/index.js` | Returns notifications from DB | 20-50 |
| `lib/notifications.js` | Notification creation logic | 60-150 |
| `models/Notification.js` | Database schema | 1-50 |

## ✅ Verification Checklist

- [x] NavBar imports NotificationsCenter
- [x] NotificationsCenter calls `/api/notifications`
- [x] Order API creates notifications for pending orders
- [x] Notification model supports `order_received` type
- [x] API endpoint queries database correctly
- [x] Comprehensive logging for debugging
- [x] Test endpoint for database visibility
- [x] Error handling at every step

## 🎓 Code Quality

- ✅ Clean architecture (no circular dependencies)
- ✅ Single responsibility (each function does one thing)
- ✅ Observable (logs everywhere for debugging)
- ✅ Reliable (error handling with try-catch)
- ✅ Maintainable (clear naming, well-commented)
- ✅ Testable (functions can be tested independently)

## 📞 Support

### If notifications aren't showing:

1. **Check logs:** `npm run dev` and create order
2. **Check database:** Visit `/api/test-notifications`
3. **Check frontend:** Open browser console (F12)
4. **Check connectivity:** Verify MongoDB is running

### Common Issues:

| Problem | Solution |
|---------|----------|
| 0 pending orders found | Check if orders are being saved with "Pending" status |
| Notification created but not showing | Hard refresh browser (Ctrl+Shift+R) |
| Multiple notifications for same order | This is fixed - duplicate prevention active |
| Old notification system errors | All fixed - simplified and rebuilt |

## 🚀 Ready to Use

The system is fully implemented and ready to use. When you create an order:

1. ✅ Order saves to database with status="Pending"
2. ✅ Notification automatically created
3. ✅ Bell icon updates with unread count
4. ✅ Notification shows in dropdown with order details

**No further configuration needed.**

---

For detailed technical documentation, see:
- `NOTIFICATION_SYSTEM_COMPLETE.md` - Architecture overview
- `NOTIFICATION_FLOW_VERIFICATION.md` - Code flow diagrams
- `NOTIFICATION_REBUILD_COMPLETE.md` - Changes made
