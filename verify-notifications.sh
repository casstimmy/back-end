#!/bin/bash
# Notification System - File Verification Checklist
# Run this to verify all notification system files are in place

echo "================================"
echo "Notification System Verification"
echo "================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

count_found=0
count_missing=0

# Function to check file
check_file() {
  if [ -f "$1" ]; then
    echo -e "${GREEN}✓${NC} $1"
    ((count_found++))
  else
    echo -e "${RED}✗${NC} $1"
    ((count_missing++))
  fi
}

echo "Backend Model:"
check_file "models/Notification.js"

echo ""
echo "Backend APIs:"
check_file "pages/api/notifications/index.js"
check_file "pages/api/cron/check-notifications.js"

echo ""
echo "Backend Libraries:"
check_file "lib/notifications.js"

echo ""
echo "Frontend Components:"
check_file "components/NotificationsCenter.js"

echo ""
echo "Frontend Pages:"
check_file "pages/notifications.js"
check_file "pages/manage/notifications.js"

echo ""
echo "Documentation:"
check_file "NOTIFICATION_SYSTEM.md"
check_file "NOTIFICATION_IMPLEMENTATION.md"
check_file "NOTIFICATION_QUICK_START.md"

echo ""
echo "Testing:"
check_file "pages/api/test-notifications.js"

echo ""
echo "================================"
echo -e "Found: ${GREEN}$count_found${NC} | Missing: ${RED}$count_missing${NC}"
echo "================================"

if [ $count_missing -eq 0 ]; then
  echo -e "${GREEN}✓ All files present!${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Set CRON_KEY in .env"
  echo "2. Start dev server: npm run dev"
  echo "3. Test bell icon in navbar"
  echo "4. Go to /manage/notifications to create test notification"
  echo "5. Read NOTIFICATION_QUICK_START.md for setup guide"
  exit 0
else
  echo -e "${RED}✗ Some files are missing!${NC}"
  exit 1
fi
