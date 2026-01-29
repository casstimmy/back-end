# 🧪 NOTIFICATION SYSTEM - TESTING GUIDE

## Quick Start: Verify Everything Works

### 1. Test the API Endpoint
Open your browser and go to:
```
http://localhost:3000/api/test-notifications
```

**Expected Response:**
```json
{
  "success": true,
  "stats": {
    "total": 0,          // Or higher if you have existing notifications
    "unread": 0,
    "orderReceived": 0,
    "outOfStock": 0,
    "created": {
      "orders": 0,       // Will increase after you create orders
      "outOfStock": 0    // Will increase when products hit 0 qty
    }
  }
}
```

---

## End-to-End Test: Create Order → See Notification

### Step 1: Create an Order
1. Go to shop front (/) and browse products
2. Add a product to cart
3. Go to checkout (/checkout)
4. Fill shipping details:
   - Name: "Test Customer"
   - Email: "test@example.com"
   - Phone: "1234567890"
   - Address: "Test Address"
   - City: "Test City"
5. Click "Place Order"

### Step 2: Check Browser Console
Open browser DevTools (F12) and check Console for:

```
[✓ Notification Created] Type: order_received, ID: ..., Ref: {orderId}
```

If you see this, notification was created successfully!

### Step 3: Check Notification Bell
The bell icon (top right of navbar) should now show:
- ✅ Red badge with number "1"
- ✅ Bell icon with notification dot

### Step 4: Click Bell to View
Click the bell icon and you should see:
- ✅ "New Order Received" title
- ✅ Order details (customer name, items, total)
- ✅ "View Order" link

### Step 5: Go to Order Management
1. Click "View Order" in notification
2. Should go to `/manage/orders` page
3. Should show your new order in the table

### Step 6: Change Order Status
1. In order details, change status from "Pending" to "Processing"
2. Save the change
3. Go back to home page
4. Click bell icon again
5. ✅ Notification should be GONE (deleted from DB)

---

## Test: Out of Stock Notification

### Setup: Create Low Stock Product
1. Go to `/manage/products`
2. Create new product:
   - Name: "Test Product"
   - Price: 1000
   - Category: Any
   - Quantity: **0** (out of stock)
   - Min Stock: 5
3. Save

### Test Out of Stock Check
1. Go to `/api/test-notifications` in browser
2. Check response for:
   ```json
   "created": {
     "orders": 0,
     "outOfStock": 1    // ← Should increase
   }
   ```
3. Response should show:
   ```json
   "recentNotifications": [{
     "type": "out_of_stock",
     "title": "⚠️ Out of Stock",
     "message": "Product \"Test Product\" is OUT OF STOCK!...",
     ...
   }]
   ```

---

## Test: Mark as Read

### From Bell Icon
1. Click bell → see notification
2. Hover over notification → "Mark as read" icon appears
3. Click checkmark icon
4. Notification becomes grayed out (isRead = true)
5. Unread count decreases

### From API
```bash
curl -X PUT http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -d '{ "_id": "{notificationId}", "isRead": true }'
```

---

## Browser Console Logs to Look For

### Successful Order Creation:
```
[ORDER NOTIFICATION] Processing order 507f1f77bcf86cd799439011
  Status: Pending
  Items: 2
[✓ ORDER NOTIFICATION] Success for order 507f1f77bcf86cd799439011
```

### Successful Fetch:
```
[Notifications API] GET request - limit: 30, type: undefined
[Notifications API] Returned 5 notifications, 3 unread
```

### Backend Backfill Running:
```
[BACKFILL] Starting for pending orders...
  Found 5 pending orders
[✓ BACKFILL] Created 2 missing notifications
```

### Out of Stock Check:
```
[OUT OF STOCK CHECK] Starting...
  Found 1 out of stock products
[✓ OUT OF STOCK CHECK] Created 1 new notifications
```

---

## Expected Behavior Summary

| Action | Expected Result | Logs |
|--------|-----------------|------|
| Create order (Pending) | Notification created immediately | `[✓ ORDER NOTIFICATION] Success` |
| Refresh bell after order | Shows 1 unread notification | `[Notifications API] Returned 1 notifications` |
| Click notification | Goes to `/manage/orders?search={orderId}` | None (navigation) |
| Mark as read | Notification grays out, unread count -1 | None (state update) |
| Change order status away from Pending | Notification deleted | `[✓ REMOVED] 1 notification(s)` |
| Product quantity becomes 0 | Out of stock notification created | `[✓ OUT OF STOCK CHECK] Created 1` |
| Visit `/api/test-notifications` | Shows all notification stats | Test results in JSON |

---

## Troubleshooting

### Bell shows 0 unread but I just created order

**Check:**
1. Is order status "Pending"? Check `/manage/orders`
2. Did API return notification? Check browser Network tab → `/api/notifications` response
3. Are you on right page? Hard reload (Ctrl+F5)
4. Check console for errors

**Fix:**
1. Go to `/api/test-notifications`
2. Run backfill - should create missing notification
3. Refresh bell

### No console logs appearing

**Check:**
1. Is Next.js running? Check terminal
2. Are you looking at browser console (F12)?
3. Are you creating order on localhost (not production)?

**Fix:**
1. Check Next.js terminal for `[Orders POST]` logs
2. Look for API errors in Network tab

### Notification appears but doesn't update

**Causes:**
- Browser still on old notification
- Filter is set to specific type
- Tab might be hidden (polling pauses)

**Fix:**
1. Change filter to "all"
2. Click bell icon to focus tab
3. Wait 30 seconds for next poll
4. Hard refresh page (Ctrl+F5)

### Notification doesn't disappear when order shipped

**Cause:**
- PUT request failed
- Order status not actually changed

**Check:**
1. Go to `/manage/orders`
2. Is order status really "Shipped"?
3. Check browser Network tab for PUT `/api/orders/{id}` - did it succeed?

**Fix:**
1. Manually update order status again
2. If still fails, check server logs
3. Run `/api/test-notifications` to verify DB state

---

## API Curl Commands

### Get all notifications
```bash
curl http://localhost:3000/api/notifications
```

### Get only out of stock notifications
```bash
curl "http://localhost:3000/api/notifications?type=out_of_stock"
```

### Get only order_received notifications
```bash
curl "http://localhost:3000/api/notifications?type=order_received"
```

### Mark notification as read
```bash
curl -X PUT http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "_id": "507f1f77bcf86cd799439011",
    "isRead": true
  }'
```

### Delete notification
```bash
curl -X DELETE http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "_id": "507f1f77bcf86cd799439011"
  }'
```

### Test all notification checks
```bash
curl http://localhost:3000/api/test-notifications
```

---

## Database Checks

### MongoDB: See all notifications
```javascript
db.notifications.find().pretty()
```

### See only order received notifications
```javascript
db.notifications.find({ type: "order_received" }).pretty()
```

### See only out of stock notifications
```javascript
db.notifications.find({ type: "out_of_stock" }).pretty()
```

### See unread notifications
```javascript
db.notifications.find({ isRead: false }).pretty()
```

### See recent notifications (last 10)
```javascript
db.notifications.find().sort({ createdAt: -1 }).limit(10).pretty()
```

### Count total notifications
```javascript
db.notifications.countDocuments()
```

### Count unread
```javascript
db.notifications.countDocuments({ isRead: false })
```

### Delete all notifications (if needed to reset)
```javascript
db.notifications.deleteMany({})
```

---

## Success Checklist

✅ Order notification creates when new order placed
✅ Notification appears in bell within 30 seconds
✅ Bell shows correct unread count
✅ Can mark notification as read
✅ Notification deletes when order status changes
✅ Out of stock notification creates when product qty = 0
✅ No duplicate notifications for same order
✅ API endpoints all work (`/api/test-notifications`)
✅ Console shows appropriate logs with [TAGS]
✅ No errors in browser console
✅ No errors in server logs
