/**
 * Firebase Setup Verification Script
 * Run this to verify your Firebase configuration is correct
 * 
 * Usage: node scripts/verifyFirebaseSetup.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Firebase Configuration...\n');

// Read .env.local file
const envPath = path.join(__dirname, '..', '.env.local');

if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local file not found!');
  console.log('📋 Please create .env.local file in the root directory\n');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];

let hasErrors = false;

requiredEnvVars.forEach(varName => {
  const value = envVars[varName];
  
  if (!value) {
    console.log(`❌ ${varName}: MISSING`);
    hasErrors = true;
  } else if (value.includes('your_') || value.includes('your-')) {
    console.log(`❌ ${varName}: Still using placeholder value`);
    console.log(`   Current: ${value}`);
    hasErrors = true;
  } else {
    console.log(`✅ ${varName}: Configured`);
  }
});

console.log('\n' + '='.repeat(60) + '\n');

if (hasErrors) {
  console.log('❌ Firebase configuration has errors!\n');
  console.log('📋 To fix:');
  console.log('1. Go to https://console.firebase.google.com/');
  console.log('2. Select your project');
  console.log('3. Click gear icon → Project Settings');
  console.log('4. Scroll to "Your apps" section');
  console.log('5. Copy the firebaseConfig values');
  console.log('6. Update your .env.local file');
  console.log('7. Restart your dev server\n');
  process.exit(1);
} else {
  console.log('✅ All Firebase environment variables are configured!\n');
  console.log('📋 Next steps:');
  console.log('1. Make sure Firebase Authentication is enabled');
  console.log('2. Make sure Firestore Database is created');
  console.log('3. Make sure Firebase Storage is enabled');
  console.log('4. Publish Firestore security rules');
  console.log('5. Publish Storage security rules');
  console.log('6. Restart your dev server: npm run dev\n');
  process.exit(0);
}
