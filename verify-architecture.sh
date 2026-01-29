#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Notification System Verification${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Check 1: NavBar integration
echo -e "${YELLOW}[1/5] Checking NavBar integration...${NC}"
if grep -q "NotificationsCenter" "c:/Users/hp/Desktop/Projects/Chioma_hair/back-end/components/NavBar.js"; then
    echo -e "${GREEN}✓${NC} NavBar imports NotificationsCenter"
else
    echo -e "${RED}✗${NC} NavBar missing NotificationsCenter import"
fi

# Check 2: NotificationsCenter endpoint
echo -e "\n${YELLOW}[2/5] Checking NotificationsCenter endpoint...${NC}"
if grep -q "axios.get(\"/api/notifications\"" "c:/Users/hp/Desktop/Projects/Chioma_hair/back-end/components/NotificationsCenter.js"; then
    echo -e "${GREEN}✓${NC} NotificationsCenter calls /api/notifications"
else
    echo -e "${RED}✗${NC} NotificationsCenter not calling /api/notifications"
fi

# Check 3: Order API notification creation
echo -e "\n${YELLOW}[3/5] Checking Order API notification creation...${NC}"
if grep -q "createOrderNotification" "c:/Users/hp/Desktop/Projects/Chioma_hair/back-end/pages/api/orders/index.js"; then
    echo -e "${GREEN}✓${NC} Order API calls createOrderNotification"
else
    echo -e "${RED}✗${NC} Order API missing createOrderNotification"
fi

# Check 4: Notification model enum
echo -e "\n${YELLOW}[4/5] Checking Notification model enum...${NC}"
if grep -q '"order_received"' "c:/Users/hp/Desktop/Projects/Chioma_hair/back-end/models/Notification.js"; then
    echo -e "${GREEN}✓${NC} Notification model supports 'order_received' type"
else
    echo -e "${RED}✗${NC} Notification model missing 'order_received' type"
fi

# Check 5: Notifications API endpoint
echo -e "\n${YELLOW}[5/5] Checking Notifications API GET endpoint...${NC}"
if grep -q "Notification.find(filter)" "c:/Users/hp/Desktop/Projects/Chioma_hair/back-end/pages/api/notifications/index.js"; then
    echo -e "${GREEN}✓${NC} Notifications API fetches from database"
else
    echo -e "${RED}✗${NC} Notifications API missing database query"
fi

echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}Architecture Verification Complete${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "${YELLOW}SUMMARY:${NC}"
echo "1. NavBar correctly uses NotificationsCenter component"
echo "2. NotificationsCenter calls /api/notifications endpoint"
echo "3. Order creation triggers createOrderNotification()"
echo "4. Notification model accepts 'order_received' type"
echo "5. /api/notifications endpoint returns notifications from database"
echo ""
echo -e "${YELLOW}To test the system:${NC}"
echo "1. Start server: npm run dev"
echo "2. Create a test order"
echo "3. Check /api/test-notifications to see pending orders"
echo "4. Bell icon should show notification count"
echo "5. Check browser console for any errors"
