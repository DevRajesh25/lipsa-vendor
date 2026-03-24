import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { updatePassword, updateEmail, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { User } from '@/lib/types';

export interface VendorSettingsData {
  storeName: string;
  storeDescription: string;
  ownerName: string;
  phone: string;
  address: string;
  storeLogo?: string;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}

export const updateVendorSettings = async (
  vendorId: string,
  settingsData: VendorSettingsData
): Promise<void> => {
  try {
    const vendorRef = doc(db, 'vendors', vendorId);
    await updateDoc(vendorRef, {
      ...settingsData,
      updatedAt: serverTimestamp()
    });
  } catch (error: any) {
    console.error('Update vendor settings error:', error);
    throw new Error(error.message || 'Failed to update settings');
  }
};

export const updateVendorLogo = async (
  vendorId: string,
  logoUrl: string
): Promise<void> => {
  try {
    const vendorRef = doc(db, 'vendors', vendorId);
    await updateDoc(vendorRef, {
      storeLogo: logoUrl,
      updatedAt: serverTimestamp()
    });
  } catch (error: any) {
    console.error('Update vendor logo error:', error);
    throw new Error(error.message || 'Failed to update logo');
  }
};

export const changeVendorPassword = async (
  passwordData: PasswordChangeData
): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) {
      throw new Error('No authenticated user found');
    }

    // Re-authenticate user before changing password
    const credential = EmailAuthProvider.credential(user.email, passwordData.currentPassword);
    await reauthenticateWithCredential(user, credential);

    // Update password
    await updatePassword(user, passwordData.newPassword);
  } catch (error: any) {
    console.error('Change password error:', error);
    if (error.code === 'auth/wrong-password') {
      throw new Error('Current password is incorrect');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('New password is too weak. Please choose a stronger password');
    } else if (error.code === 'auth/requires-recent-login') {
      throw new Error('Please log out and log back in before changing your password');
    }
    throw new Error(error.message || 'Failed to change password');
  }
};

export const uploadVendorLogo = async (file: File): Promise<string> => {
  try {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'vendor_products';

    console.log('Cloudinary config:', { cloudName, uploadPreset });

    // If Cloudinary is not configured, use a fallback approach
    if (!cloudName) {
      console.warn('Cloudinary not configured, using fallback approach');
      
      // For development/testing, convert to base64 data URL
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (reader.result) {
            resolve(reader.result as string);
          } else {
            reject(new Error('Failed to read file'));
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
    }

    // First, try with the configured upload preset
    let formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', 'vendor-logos');

    console.log('Uploading to Cloudinary:', {
      url: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      preset: uploadPreset,
      folder: 'vendor-logos',
      fileSize: file.size,
      fileType: file.type
    });

    let response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    console.log('Cloudinary response status:', response.status);

    // If the preset doesn't exist, try with a default unsigned preset
    if (!response.ok) {
      const errorData = await response.text();
      console.error('First attempt failed:', errorData);
      
      // Try with a more basic approach - no preset, just upload
      if (errorData.includes('Invalid upload preset') || errorData.includes('upload_preset')) {
        console.log('Trying without upload preset...');
        
        formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'vendor-logos');
        
        // Try to use API key for signed upload if available
        const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
        if (apiKey) {
          formData.append('api_key', apiKey);
          formData.append('timestamp', Math.round(Date.now() / 1000).toString());
        }
        
        response = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );
      }
    }

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Cloudinary upload error response:', errorData);
      
      // Try to parse error details
      try {
        const errorJson = JSON.parse(errorData);
        throw new Error(`Cloudinary error: ${errorJson.error?.message || errorData}`);
      } catch {
        throw new Error(`Cloudinary upload failed (${response.status}): ${errorData}`);
      }
    }

    const data = await response.json();
    console.log('Cloudinary upload success:', data.secure_url);
    return data.secure_url;
  } catch (error: any) {
    console.error('Upload logo error:', error);
    
    // Provide more specific error messages
    if (error.message.includes('Invalid upload preset')) {
      throw new Error('Upload preset "vendor_products" not found. Please create it in your Cloudinary dashboard or visit /test-cloudinary to debug.');
    } else if (error.message.includes('Invalid cloud name')) {
      throw new Error('Invalid Cloudinary cloud name. Please check your configuration.');
    } else if (error.message.includes('File size too large')) {
      throw new Error('File size exceeds Cloudinary limits. Please use a smaller image.');
    }
    
    throw new Error(error.message || 'Failed to upload logo');
  }
};