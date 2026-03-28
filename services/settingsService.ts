import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface PlatformSettings {
  commissionPercentage: number;
  taxPercentage: number;
  currency: string;
  currencySymbol: string;
  platformName: string;
}

/**
 * Fetches platform settings from Firestore
 * Returns default values if settings don't exist
 */
export const getPlatformSettings = async (): Promise<PlatformSettings> => {
  try {
    const settingsDoc = await getDoc(doc(db, 'settings', 'platform'));
    
    if (settingsDoc.exists()) {
      const data = settingsDoc.data();
      return {
        commissionPercentage: data.commissionPercentage || 10,
        taxPercentage: data.taxPercentage || 18,
        currency: data.currency || 'INR',
        currencySymbol: data.currencySymbol || '₹',
        platformName: data.platformName || 'Multi-Vendor Marketplace'
      };
    }
    
    // Return default values if settings don't exist
    return {
      commissionPercentage: 10,
      taxPercentage: 18,
      currency: 'INR',
      currencySymbol: '₹',
      platformName: 'Multi-Vendor Marketplace'
    };
  } catch (error) {
    console.error('Error fetching platform settings:', error);
    // Return default values on error
    return {
      commissionPercentage: 10,
      taxPercentage: 18,
      currency: 'INR',
      currencySymbol: '₹',
      platformName: 'Multi-Vendor Marketplace'
    };
  }
};

/**
 * Server-side function to get platform settings using Admin SDK
 * Use this in API routes
 */
export const getPlatformSettingsServer = async (adminDb: any): Promise<PlatformSettings> => {
  try {
    const settingsDoc = await adminDb.collection('settings').doc('platform').get();
    
    if (settingsDoc.exists) {
      const data = settingsDoc.data();
      return {
        commissionPercentage: data.commissionPercentage || 10,
        taxPercentage: data.taxPercentage || 18,
        currency: data.currency || 'INR',
        currencySymbol: data.currencySymbol || '₹',
        platformName: data.platformName || 'Multi-Vendor Marketplace'
      };
    }
    
    // Return default values if settings don't exist
    return {
      commissionPercentage: 10,
      taxPercentage: 18,
      currency: 'INR',
      currencySymbol: '₹',
      platformName: 'Multi-Vendor Marketplace'
    };
  } catch (error) {
    console.error('Error fetching platform settings (server):', error);
    // Return default values on error
    return {
      commissionPercentage: 10,
      taxPercentage: 18,
      currency: 'INR',
      currencySymbol: '₹',
      platformName: 'Multi-Vendor Marketplace'
    };
  }
};
