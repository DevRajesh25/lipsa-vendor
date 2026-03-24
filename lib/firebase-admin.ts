import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin SDK
const initializeFirebaseAdmin = () => {
  if (getApps().length === 0) {
    // Check if we have service account credentials
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    if (serviceAccount) {
      // Use service account key (recommended for production)
      try {
        const serviceAccountKey = JSON.parse(serviceAccount);
        console.log('Initializing Firebase Admin with service account');
        return initializeApp({
          credential: cert(serviceAccountKey),
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        });
      } catch (error) {
        console.error('Failed to parse service account key:', error);
        throw new Error('Invalid Firebase service account key');
      }
    } else {
      // Fallback: Use application default credentials (for development)
      console.warn('No service account key found, using application default credentials');
      console.warn('This requires Firebase CLI authentication: firebase login');
      
      try {
        return initializeApp({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        });
      } catch (error) {
        console.error('Failed to initialize Firebase Admin with default credentials:', error);
        throw new Error('Firebase Admin initialization failed. Please set up service account key or use Firebase CLI authentication.');
      }
    }
  }
  
  return getApps()[0];
};

// Initialize the admin app
let adminApp: any = null;
let adminDb: any = null;
let adminAuth: any = null;

try {
  adminApp = initializeFirebaseAdmin();
  adminDb = getFirestore(adminApp);
  adminAuth = getAuth(adminApp);
  console.log('Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('Firebase Admin SDK initialization failed:', error);
  // For development, we'll create a fallback that shows helpful error messages
  adminDb = null;
  adminAuth = null;
}

// Export admin services with error handling
export { adminDb, adminAuth };

// Helper function to verify if admin SDK is properly initialized
export const verifyAdminSDK = async (): Promise<boolean> => {
  if (!adminDb) {
    console.error('Firebase Admin SDK not initialized');
    return false;
  }
  
  try {
    // Try to access Firestore to verify connection
    await adminDb.collection('_test').limit(1).get();
    console.log('Firebase Admin SDK verification successful');
    return true;
  } catch (error) {
    console.error('Firebase Admin SDK verification failed:', error);
    return false;
  }
};

// Helper function to check if Admin SDK is available
export const isAdminSDKAvailable = (): boolean => {
  return adminDb !== null;
};