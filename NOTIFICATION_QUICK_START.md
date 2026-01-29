# Quick Start Guide - Notification System

## 5-Minute Setup

### Step 1: Verify Installation ✓
All files are already created. Verify these files exist:

```
✓ /models/Notification.js
✓ /pages/api/notifications/index.js
✓ /lib/notifications.js
✓ /pages/api/cron/check-notifications.js
✓ /components/NotificationsCenter.js
✓ /pages/notifications.js
✓ /pages/manage/notifications.js
```

### Step 2: Add Environment Variable

Edit your `.env.local` or `.env`:

```env
CRON_KEY=your_super_secret_random_string_12345
```

Example: Use `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` to generate a secure key.

### Step 3: Restart Your App

```bash
npm run dev
# or
yarn dev
```

### Step 4: Test It Works

1. Open your app in browser
2. Look for bell icon in top-right corner of navbar (next to profile)
3. Click the bell - you should see "No notifications" message
4. Go to `/manage/notifications`
5. Fill out the form and click "Create Notification"
6. Go back to homepage - bell should show "1" unread

**✅ Success!** System is working.

---

## Using the Notification System

### For Admins

**Dashboard:** `/manage/notifications`
- View all notifications
- Create manual notifications
- See statistics
- Delete notifications

**Quick Menu:** Bell icon in navbar
- Dropdown list of notifications
- Click to expand details
- Quick delete/mark as read

### For Developers

#### Create a Notification Programmatically
```javascript
const res = await fetch('/api/notifications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: "Low Stock Alert",
    message: "Hair Serum quantity is 5 (minimum: 10)",
    type: "low_stock",
    priority: "high",
    action: {
      label: "Manage Stock",
      link: "/stock/management"
    }
  })
});
```

#### Get All Notifications
```javascript
const res = await fetch('/api/notifications?limit=50');
const { data, unreadCount } = await res.json();
```

#### Mark as Read
```javascript
const res = await fetch('/api/notifications', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    _id: "notification_id_here",
    isRead: true
  })
});
```

#### Delete a Notification
```javascript
const res = await fetch('/api/notifications', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    _id: "notification_id_here"
  })
});
```

---

## Setting Up Automatic Notifications

### Automatic Features (Already Working)

✅ **When a customer places an order:**
- System automatically creates an "Order Received" notification
- Shows customer name, total amount
- Links to order management page

✅ **When product stock gets low:**
- System automatically detects it when order is placed
- Creates "Low Stock Alert" notification
- Shows product name and current quantity

### Semi-Automatic Feature (Needs Cron Setup)

⚙️ **When promotion period ends:**
- Needs cron job running on schedule
- Automatically detects and disables expired promotions
- Creates "Promotion Ended" notification

**Choose one option to set up cron:**

#### Option A: Vercel (Easiest)

1. Create `vercel.json` in project root:
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

2. Deploy to Vercel: `vercel deploy`

Done! Runs every hour automatically.

#### Option B: External Service (EasyCron)

1. Go to **easycron.com**
2. Sign up for free
3. Click "Add Cron Job"
4. Fill in:
   - **Cron Expression:** `0 * * * *` (every hour)
   - **URL:** `https://yoursite.com/api/cron/check-notifications?cronKey=YOUR_CRON_KEY`
   - Replace `YOUR_CRON_KEY` with value from `.env`

5. Click Create
6. Done!

#### Option C: Development (Local Testing)

For testing without real cron:

```bash
# In Node.js REPL or script
const res = await fetch(
  'http://localhost:3000/api/cron/check-notifications?cronKey=your_key'
);
console.log(await res.json());
```

---

## Testing Notifications

### Test Order Notification
1. Go to `/manage/products`
2. Create a product with `minStock: 10`, `quantity: 15`
3. Go to shop, add product to cart, checkout
4. Check bell icon - "Order Received" notification appears ✓

### Test Low Stock Alert
1. Create product with `minStock: 10`, `quantity: 5`
2. Go to `/manage/notifications`
3. Click "Refresh" or wait 30 seconds
4. Low stock notification appears ✓

### Test Promotion End
1. Create a product with promotion ending today
2. Run cron manually: `/api/cron/check-notifications?cronKey=YOUR_KEY`
3. Check notifications - "Promotion Ended" appears ✓

---

## Common Tasks

### View Notification Stats
Dashboard: `/manage/notifications`
- Total notifications count
- Unread count
- Breakdown by type

### Filter Notifications
1. Click bell icon
2. Use filter buttons: "All", "Unread", "Orders", "Stock", "Promos"
3. List updates instantly

### Delete Old Notifications
1. Go to `/manage/notifications`
2. Click trash icon next to notification
3. Confirm delete

### Create Custom Notification
1. Go to `/manage/notifications`
2. Click "Create Manual Notification"
3. Fill form:
   - Title (required)
   - Type (order, low stock, or promo)
   - Message (required)
   - Priority (low, medium, or high)
   - Optional: Action button label + link
4. Click "Create Notification"

---

## File Locations Reference

| Purpose | Location |
|---------|----------|
| **View Notifications** | `/notifications` |
| **Admin Dashboard** | `/manage/notifications` |
| **Bell Icon** | Navbar (top-right) |
| **API Docs** | `/NOTIFICATION_SYSTEM.md` |
| **Implementation Docs** | `/NOTIFICATION_IMPLEMENTATION.md` |
| **Test Suite** | `node pages/api/test-notifications.js` |

---

## Troubleshooting

### Bell Icon Not Showing
1. Check if `NotificationsCenter` imported in NavBar.js
2. Restart dev server
3. Clear browser cache

### No Notifications Appearing
1. Check MongoDB is running
2. Check `MONGODB_URI` in `.env`
3. Try creating manual notification via dashboard
4. Check browser console for errors

### Low Stock Alert Not Triggering
1. Make sure product has `minStock` set
2. Place a test order to reduce quantity below `minStock`
3. Check `/manage/notifications` dashboard
4. If still missing, run: `/api/cron/check-notifications?cronKey=YOUR_KEY`

### Cron Job Not Running
1. Check `CRON_KEY` is set in `.env`
2. Test manually with: `GET /api/cron/check-notifications?cronKey=YOUR_KEY`
3. If error, check server logs
4. Verify Vercel crons are deployed: `vercel env pull`

### Notifications Not Disappearing
1. Try refreshing page
2. Clear browser cache
3. Check console for JavaScript errors
4. Try in different browser

---

## Next Steps

1. ✅ **Deployed?** Configure cron job (Vercel or EasyCron)
2. ✅ **Testing?** Create test notification via dashboard
3. ✅ **Training?** Show team the bell icon and dashboard
4. ✅ **Monitoring?** Check notification counts daily

---

## Need Help?

### Check Documentation
- **System Overview:** `/NOTIFICATION_SYSTEM.md`
- **Implementation Details:** `/NOTIFICATION_IMPLEMENTATION.md`
- **API Reference:** `/NOTIFICATION_SYSTEM.md` (API Endpoints section)

### Run Test Suite
```bash
node pages/api/test-notifications.js
```

### Check Logs
```bash
# View recent notifications
curl http://localhost:3000/api/notifications?limit=10
```

---

## Features at a Glance

| Feature | Status | Automatic? |
|---------|--------|-----------|
| Order notifications | ✅ Working | ✅ Yes |
| Low stock alerts | ✅ Working | ✅ Yes |
| Promotion end alerts | ✅ Working | ⚙️ Needs cron |
| Bell icon in navbar | ✅ Working | ✅ Yes |
| Dashboard page | ✅ Working | - |
| Admin panel | ✅ Working | - |
| Real-time updates | ✅ Working | ✅ 30-sec polling |

---

## Production Checklist

Before going live:

- [ ] Set `CRON_KEY` to a strong random string
- [ ] Configure cron job in your hosting provider
- [ ] Test order notification with a real purchase
- [ ] Test low stock detection
- [ ] Verify cron job runs automatically
- [ ] Set up monitoring alerts if available
- [ ] Document CRON_KEY in password manager
- [ ] Train staff on notification system

---

**You're all set!** 🎉

Your notification system is ready to:
- 📦 Alert on new orders
- ⚠️ Warn about low stock
- 📉 Notify promotion ends

Go to `/manage/notifications` to get started!
