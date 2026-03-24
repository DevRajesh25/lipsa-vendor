#!/bin/bash

# Production Deployment Script for Multi-Vendor Marketplace
# This script deploys all components to Firebase

echo "🚀 Starting Production Deployment..."
echo "=================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Build and Deploy Cloud Functions
echo -e "\n${YELLOW}Step 1: Deploying Cloud Functions...${NC}"
cd functions
npm install
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Cloud Functions built successfully${NC}"
else
    echo -e "${RED}✗ Cloud Functions build failed${NC}"
    exit 1
fi

firebase deploy --only functions
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Cloud Functions deployed successfully${NC}"
else
    echo -e "${RED}✗ Cloud Functions deployment failed${NC}"
    exit 1
fi
cd ..

# Step 2: Deploy Firestore Rules
echo -e "\n${YELLOW}Step 2: Deploying Firestore Rules...${NC}"
firebase deploy --only firestore:rules
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Firestore Rules deployed successfully${NC}"
else
    echo -e "${RED}✗ Firestore Rules deployment failed${NC}"
    exit 1
fi

# Step 3: Deploy Storage Rules
echo -e "\n${YELLOW}Step 3: Deploying Storage Rules...${NC}"
firebase deploy --only storage
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Storage Rules deployed successfully${NC}"
else
    echo -e "${RED}✗ Storage Rules deployment failed${NC}"
    exit 1
fi

# Step 4: Build Next.js Application
echo -e "\n${YELLOW}Step 4: Building Next.js Application...${NC}"
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Next.js build completed successfully${NC}"
else
    echo -e "${RED}✗ Next.js build failed${NC}"
    exit 1
fi

# Step 5: Deploy to Firebase Hosting
echo -e "\n${YELLOW}Step 5: Deploying to Firebase Hosting...${NC}"
firebase deploy --only hosting
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Hosting deployed successfully${NC}"
else
    echo -e "${RED}✗ Hosting deployment failed${NC}"
    exit 1
fi

# Deployment Summary
echo -e "\n${GREEN}=================================="
echo -e "✅ DEPLOYMENT COMPLETED SUCCESSFULLY"
echo -e "==================================${NC}"
echo -e "\nDeployed Components:"
echo -e "  ✓ Cloud Functions (6 functions)"
echo -e "  ✓ Firestore Security Rules"
echo -e "  ✓ Storage Rules"
echo -e "  ✓ Next.js Application"
echo -e "  ✓ Firebase Hosting"

echo -e "\n${YELLOW}Cloud Functions Deployed:${NC}"
echo -e "  1. onOrderCreated - Automatic stock reduction"
echo -e "  2. calculateVendorEarnings - Earnings calculation"
echo -e "  3. notifyVendorsOnNewOrder - Vendor notifications"
echo -e "  4. onOrderCancelled - Stock restoration"
echo -e "  5. markOrdersAsPaidOut - Payout processing"
echo -e "  6. validateStockBeforeOrder - Stock validation"

echo -e "\n${YELLOW}Next Steps:${NC}"
echo -e "  1. Test Cloud Functions in Firebase Console"
echo -e "  2. Create Firestore indexes (if prompted)"
echo -e "  3. Test order flow end-to-end"
echo -e "  4. Monitor function logs: firebase functions:log"
echo -e "  5. Set up monitoring and alerts"

echo -e "\n${GREEN}🎉 Your marketplace is now PRODUCTION READY!${NC}\n"
