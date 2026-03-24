import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  getDocs,
  getDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Coupon } from '@/lib/types';

export const createCoupon = async (
  vendorId: string,
  couponData: Omit<Coupon, 'id' | 'createdAt' | 'usedCount'>
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'coupons'), {
      ...couponData,
      vendorId,
      usedCount: 0,
      createdAt: new Date(),
      validFrom: Timestamp.fromDate(couponData.validFrom),
      validTo: Timestamp.fromDate(couponData.validTo)
    });
    return docRef.id;
  } catch (error: any) {
    console.error('Error creating coupon:', error);
    throw new Error(error.message || 'Failed to create coupon');
  }
};

export const getVendorCoupons = async (vendorId: string): Promise<Coupon[]> => {
  try {
    const q = query(
      collection(db, 'coupons'),
      where('vendorId', '==', vendorId)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        validFrom: data.validFrom?.toDate() || new Date(),
        validTo: data.validTo?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date()
      } as Coupon;
    });
  } catch (error: any) {
    console.error('Error fetching coupons:', error);
    throw new Error(error.message || 'Failed to fetch coupons');
  }
};

export const updateCoupon = async (
  couponId: string,
  updates: Partial<Omit<Coupon, 'id' | 'vendorId' | 'createdAt' | 'usedCount'>>
): Promise<void> => {
  try {
    const couponRef = doc(db, 'coupons', couponId);
    const updateData: any = { ...updates };
    
    if (updates.validFrom) {
      updateData.validFrom = Timestamp.fromDate(updates.validFrom);
    }
    if (updates.validTo) {
      updateData.validTo = Timestamp.fromDate(updates.validTo);
    }
    
    await updateDoc(couponRef, updateData);
  } catch (error: any) {
    console.error('Error updating coupon:', error);
    throw new Error(error.message || 'Failed to update coupon');
  }
};

export const deleteCoupon = async (couponId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'coupons', couponId));
  } catch (error: any) {
    console.error('Error deleting coupon:', error);
    throw new Error(error.message || 'Failed to delete coupon');
  }
};

export const toggleCouponStatus = async (
  couponId: string,
  isActive: boolean
): Promise<void> => {
  try {
    const couponRef = doc(db, 'coupons', couponId);
    await updateDoc(couponRef, { isActive });
  } catch (error: any) {
    console.error('Error toggling coupon status:', error);
    throw new Error(error.message || 'Failed to toggle coupon status');
  }
};

export const validateCouponCode = async (
  code: string,
  vendorId: string,
  purchaseAmount: number
): Promise<{ valid: boolean; discount?: number; message?: string }> => {
  try {
    const q = query(
      collection(db, 'coupons'),
      where('code', '==', code.toUpperCase()),
      where('vendorId', '==', vendorId),
      where('isActive', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return { valid: false, message: 'Invalid coupon code' };
    }
    
    const couponDoc = querySnapshot.docs[0];
    const coupon = couponDoc.data() as Coupon;
    const now = new Date();
    
    // Check validity dates
    const validFrom = coupon.validFrom instanceof Timestamp 
      ? coupon.validFrom.toDate() 
      : new Date(coupon.validFrom);
    const validTo = coupon.validTo instanceof Timestamp 
      ? coupon.validTo.toDate() 
      : new Date(coupon.validTo);
    
    if (now < validFrom) {
      return { valid: false, message: 'Coupon not yet valid' };
    }
    
    if (now > validTo) {
      return { valid: false, message: 'Coupon has expired' };
    }
    
    // Check usage limit
    if (coupon.usedCount >= coupon.usageLimit) {
      return { valid: false, message: 'Coupon usage limit reached' };
    }
    
    // Check minimum purchase
    if (purchaseAmount < coupon.minPurchase) {
      return { 
        valid: false, 
        message: `Minimum purchase of ₹${coupon.minPurchase} required` 
      };
    }
    
    // Calculate discount
    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (purchaseAmount * coupon.discountValue) / 100;
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      discount = coupon.discountValue;
    }
    
    return { valid: true, discount };
  } catch (error: any) {
    console.error('Error validating coupon:', error);
    return { valid: false, message: 'Error validating coupon' };
  }
};
