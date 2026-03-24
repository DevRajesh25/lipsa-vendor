import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User } from '@/lib/types';

export interface VendorRegistrationData {
  email: string;
  password: string;
  name: string;
  phone: string;
  storeName: string;
}

export const registerVendor = async (data: VendorRegistrationData): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );

    const vendorData: Omit<User, 'uid'> = {
      email: data.email,
      role: 'vendor',
      storeName: data.storeName,
      status: 'pending', // New vendors start as pending
      createdAt: new Date()
    };

    await setDoc(doc(db, 'vendors', userCredential.user.uid), {
      ...vendorData,
      name: data.name,
      phone: data.phone,
      createdAt: serverTimestamp()
    });

    return {
      uid: userCredential.user.uid,
      ...vendorData
    };
  } catch (error: any) {
    throw new Error(error.message || 'Registration failed');
  }
};

export const loginVendor = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    const vendorDoc = await getDoc(doc(db, 'vendors', userCredential.user.uid));
    
    if (!vendorDoc.exists()) {
      await signOut(auth);
      const error = new Error('Vendor account not found. Please register as a vendor first.');
      (error as any).code = 'auth/vendor-not-found';
      throw error;
    }

    const vendorData = vendorDoc.data();
    
    return {
      uid: userCredential.user.uid,
      email: vendorData.email,
      role: vendorData.role,
      storeName: vendorData.storeName,
      status: vendorData.status || 'pending',
      createdAt: vendorData.createdAt?.toDate() || new Date()
    };
  } catch (error: any) {
    // Preserve the original Firebase error code and message
    if (error.code) {
      throw error; // Re-throw Firebase errors as-is
    } else {
      // For custom errors, add a code
      const customError = new Error(error.message || 'Login failed');
      (customError as any).code = 'auth/login-failed';
      throw customError;
    }
  }
};

export const logoutVendor = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    throw new Error(error.message || 'Logout failed');
  }
};

export const getCurrentVendor = async (firebaseUser: FirebaseUser): Promise<User | null> => {
  try {
    console.log('Fetching vendor data for:', firebaseUser.uid);
    const vendorDoc = await getDoc(doc(db, 'vendors', firebaseUser.uid));
    
    if (!vendorDoc.exists()) {
      console.error('Vendor document not found for user:', firebaseUser.uid);
      console.log('Please register this account as a vendor first');
      return null;
    }

    const vendorData = vendorDoc.data();
    console.log('Vendor data retrieved:', vendorData);
    
    return {
      uid: firebaseUser.uid,
      email: vendorData.email,
      role: vendorData.role,
      storeName: vendorData.storeName,
      storeDescription: vendorData.storeDescription,
      storeLogo: vendorData.storeLogo,
      ownerName: vendorData.ownerName,
      phone: vendorData.phone,
      address: vendorData.address,
      status: vendorData.status || 'pending',
      bankDetails: vendorData.bankDetails,
      createdAt: vendorData.createdAt?.toDate() || new Date(),
      updatedAt: vendorData.updatedAt?.toDate()
    };
  } catch (error) {
    console.error('Error fetching vendor:', error);
    return null;
  }
};
