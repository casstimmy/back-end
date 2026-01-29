# Notification System Documentation

## Overview

The comprehensive notification system tracks and alerts for three major events:
1. **Order Received** - Customer placed an order
2. **Low Stock Alert** - Product quantity falls below minimum threshold
3. **Promotion Ended** - Promotional period has expired

## Architecture

### Models

#### Notification Model (`/models/Notification.js`)
Central data model for all notifications with the following fields:

```javascript
{
  type: String,                    // enum: ['promotion_end', 'order_received', 'low_stock']
  title: String,                   // Notification title
  message: String,                 // Detailed message
  referenceId: String,             // Product/Order ID
  referenceType: String,           // 'order', 'product', 'promotion'
  data: Object,                    // Extra context data
  isRead: Boolean,                 // Read status
  readAt: Date,                    // When marked as read
  priority: String,                // 'low', 'medium', 'high'
  action: {
    label: String,                 // Button text
    link: String                   // Action URL
  },
  createdAt: Date,
  updatedAt: Date
}
```

### API Endpoints

#### GET `/api/notifications`
Retrieve notifications with optional filtering.

**Query Parameters:**
- `limit` (number): Maximum notifications to return (default: 50)
- `isRead` (boolean): Filter by read status
- `type` (string): Filter by notification type

**Response:**
```json
{
  "success": true,
  "data": [...],
  "unreadCount": 5
}
```

#### POST `/api/notifications`
Create a new notification.

**Body:**
```json
{
  "title": "Order Received",
  "message": "New order from John Doe",
  "type": "order_received",
  "priority": "high",
  "action": {
    "label": "View Order",
    "link": "/manage/orders/123"
  }
}
```

#### PUT `/api/notifications`
Mark notification as read.

**Body:**
```json
{
  "_id": "notification_id",
  "isRead": true
}
```

#### DELETE `/api/notifications`
Delete a notification.

**Body:**
```json
{
  "_id": "notification_id"
}
```

### Utility Functions (`/lib/notifications.js`)

#### `createNotification(notificationData)`
Generic function to create any notification type.

```javascript
const notification = await createNotification({
  title: "Custom Notification",
  message: "Description here",
  type: "order_received",
  priority: "high",
  action: { label: "View", link: "/path" },
  data: { customField: "value" }
});
```

#### `checkLowStockNotifications()`
Automatically scans all products and creates notifications for low stock items.

**Logic:**
- Finds products where `quantity <= minStock`
- Creates one notification per day per product (deduplication)
- Sets priority to "high"
- Includes product details in notification data

```javascript
// Called periodically (e.g., from cron job)
await checkLowStockNotifications();
```

#### `checkEndedPromotions()`
Detects expired promotions and disables them.

**Logic:**
- Finds products where `promoEnd < now`
- Creates "promotion_end" notification
- Sets `isPromotion = false` on product
- Sets priority to "medium"

```javascript
// Called periodically (e.g., from cron job)
await checkEndedPromotions();
```

#### `createOrderNotification(order)`
Creates a high-priority notification when an order is received.

**Called from:**
- `/pages/api/transactions/from-order.js` when transaction is created

```javascript
// Automatically triggered when order is placed
const order = { 
  _id: "123",
  customer: { name: "John", email: "john@email.com", phone: "555-1234" },
  items: [...],
  totalAmount: 500
};
await createOrderNotification(order);
```

### Integration Points

#### Order Processing (`/pages/api/transactions/from-order.js`)
When an order is received:
1. Creates transaction record
2. Calls `createOrderNotification(order)` - High priority
3. Calls `checkLowStockNotifications()` - Checks for low stock after fulfillment

#### Scheduled Checks (Cron Endpoint)

**Endpoint:** `GET/POST /api/cron/check-notifications`

**Requires:** `CRON_KEY` environment variable matching request header/query param

**Triggers:**
- `checkEndedPromotions()` - Disables expired promotions
- `checkLowStockNotifications()` - Detects low stock items

**Environment Setup:**
```env
CRON_KEY=your_secret_cron_key_here
```

**Usage Examples:**

Via cURL:
```bash
curl -X POST https://yoursite.com/api/cron/check-notifications \
  -H "X-Cron-Key: your_secret_cron_key_here"
```

Via Node.js:
```javascript
const response = await fetch(
  'https://yoursite.com/api/cron/check-notifications?cronKey=your_secret_cron_key_here'
);
```

### Frontend Components

#### NotificationsCenter (`/components/NotificationsCenter.js`)
Dropdown notification bell with real-time updates.

**Features:**
- Bell icon with unread count badge
- Filtered notification list
- Mark as read / Delete actions
- 30-second polling interval
- Priority-based styling
- Click action links

**Usage:**
```jsx
import NotificationsCenter from "@/components/NotificationsCenter";

// In navbar or header
<NotificationsCenter />
```

#### Notifications Page (`/pages/notifications.js`)
Full-page notification center for detailed view.

**Features:**
- Filter by type, read status
- Sort by date, priority
- View notification details
- Action buttons with links
- Refresh functionality

**Route:** `/notifications`

#### Admin Dashboard (`/pages/manage/notifications.js`)
Admin panel for notification management.

**Features:**
- Create manual notifications
- View notification statistics
- Delete notifications
- Monitor notification types

**Route:** `/manage/notifications`

### Notification Types Reference

#### Order Received (`order_received`)
- **Priority:** High
- **Trigger:** When new order is placed
- **Action:** Link to order details
- **Data:** Customer name, email, phone, order total, items list

```json
{
  "type": "order_received",
  "title": "New Order Received",
  "message": "Order from John Doe - $500.00",
  "priority": "high",
  "action": {
    "label": "View Order",
    "link": "/manage/orders/123"
  },
  "data": {
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "customerPhone": "555-1234",
    "totalAmount": 500,
    "itemCount": 3
  }
}
```

#### Low Stock Alert (`low_stock`)
- **Priority:** High
- **Trigger:** When product quantity <= minStock
- **Action:** Link to product management
- **Data:** Product details, current quantity, min stock level

```json
{
  "type": "low_stock",
  "title": "Low Stock Alert",
  "message": "Hair Serum has 3 units left (minimum: 10)",
  "priority": "high",
  "action": {
    "label": "Manage Stock",
    "link": "/stock/management"
  },
  "data": {
    "productId": "prod_123",
    "productName": "Hair Serum",
    "currentQuantity": 3,
    "minStock": 10
  }
}
```

#### Promotion Ended (`promotion_end`)
- **Priority:** Medium
- **Trigger:** When promotion expiration date passes
- **Action:** Link to products
- **Data:** Product details, promotion type, original/promo prices

```json
{
  "type": "promotion_end",
  "title": "Promotion Ended",
  "message": "Black Friday sale ended for Hair Care Bundle",
  "priority": "medium",
  "action": {
    "label": "View Products",
    "link": "/manage/products"
  },
  "data": {
    "productId": "prod_456",
    "productName": "Hair Care Bundle",
    "promoType": "black friday",
    "originalPrice": 100,
    "promoPrice": 75
  }
}
```

## Setup Instructions

### 1. Database Setup

Ensure MongoDB is running and `MONGODB_URI` is set in `.env`:

```env
MONGODB_URI=mongodb://localhost:27017/chioma_hair
```

### 2. Environment Configuration

Add to `.env`:

```env
# Cron job security key
CRON_KEY=your_secure_random_string_here
```

### 3. Integration

Notifications are automatically created/checked in these workflows:

**Automatic Triggers:**
- ✅ Order received → Creates notification
- ✅ Product stock updated → Automatic low stock check
- ✅ Promotion date passes → Automatic check (requires cron)

**Manual Triggers:**
- Create via admin dashboard (`/manage/notifications`)
- Create via API POST request

### 4. Cron Job Setup

#### Option A: Vercel Cron (Recommended for Vercel deployments)

Create `/pages/api/cron/check-notifications.js` and configure in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/check-notifications",
      "schedule": "0 * * * *"
    }
  ]
}
```

#### Option B: External Cron Service

Use services like EasyCron, Cron-job.org, or AWS Lambda:

```bash
# Every hour at minute 0
0 * * * *
```

Webhook URL:
```
https://yoursite.com/api/cron/check-notifications?cronKey=YOUR_CRON_KEY
```

#### Option C: Node.js Job Scheduler

```javascript
// In a background worker
const schedule = require('node-schedule');
const axios = require('axios');

schedule.scheduleJob('0 * * * *', async () => {
  await axios.post('http://localhost:3000/api/cron/check-notifications', {}, {
    headers: { 'X-Cron-Key': process.env.CRON_KEY }
  });
});
```

## Testing

### Run Test Suite

```bash
# Test all notification functionality
node pages/api/test-notifications.js
```

Tests included:
- Create notification
- Retrieve notifications with filters
- Low stock detection
- Ended promotion detection
- Order notifications
- Mark as read functionality

### Manual Testing

**Create a notification:**
```javascript
const res = await fetch('/api/notifications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: "Test Notification",
    message: "This is a test",
    type: "order_received",
    priority: "medium"
  })
});
```

**Fetch notifications:**
```javascript
const res = await fetch('/api/notifications?limit=10');
const data = await res.json();
console.log(data);
```

**Mark as read:**
```javascript
const res = await fetch('/api/notifications', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    _id: "notification_id",
    isRead: true
  })
});
```

## Monitoring & Debugging

### Check Notification Logs

```javascript
// View all notifications
GET /api/notifications?limit=100

// View unread notifications
GET /api/notifications?isRead=false&limit=50

// View by type
GET /api/notifications?type=order_received&limit=50
```

### Database Queries

```javascript
// Find unread notifications
db.notifications.find({ isRead: false }).sort({ createdAt: -1 })

// Find by type
db.notifications.find({ type: "low_stock" }).sort({ priority: -1 })

// Count by priority
db.notifications.aggregate([
  { $group: { _id: "$priority", count: { $sum: 1 } } }
])
```

### Common Issues

**Problem:** Notifications not appearing
- Check MongoDB connection
- Verify `MONGODB_URI` in `.env`
- Check API response for errors

**Problem:** Low stock notifications not firing
- Verify products have `minStock` set
- Check that `quantity` is updated when orders are placed
- Run cron manually: `/api/cron/check-notifications`

**Problem:** Promotion end notifications not firing
- Verify products have `promoEnd` date
- Check that `isPromotion` is set to true
- Ensure cron job is running

**Problem:** Order notifications missing
- Check transaction API logs
- Verify order object has required fields (customer, items, totalAmount)
- Check for database connection errors

## Future Enhancements

- [ ] Real-time notifications via WebSocket
- [ ] Email notification delivery
- [ ] SMS alerts for critical notifications
- [ ] Notification templates and customization
- [ ] User notification preferences/subscriptions
- [ ] Batch notification digest emails
- [ ] Notification retry logic for failed deliveries
- [ ] Notification analytics and reporting

## API Response Examples

### Success Response (GET)
```json
{
  "success": true,
  "data": [
    {
      "_id": "634f5a2c8f8b9c0001234567",
      "type": "order_received",
      "title": "New Order",
      "message": "Order from Jane Smith received",
      "isRead": false,
      "priority": "high",
      "createdAt": "2024-01-15T10:30:00Z",
      "action": {
        "label": "View Order",
        "link": "/manage/orders/123"
      }
    }
  ],
  "unreadCount": 3
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error retrieving notifications"
}
```

## Security

- ✅ CRON_KEY validation for scheduled jobs
- ✅ Database connection pooling
- ✅ Error handling and logging
- ✅ Input validation on API routes
- ✅ Read timestamps for audit trail

---

**Last Updated:** January 2024
**Status:** Production Ready
