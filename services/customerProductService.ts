import { 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit,
  getDoc,
  doc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product } from '@/lib/types';

/**
 * Customer-facing product service
 * Uses categorySlug for filtering products on homepage sections
 */

/**
 * Get products by category slug
 * Used for homepage sections like "Kitchen Accessories", "Electronics", etc.
 */
export const getProductsByCategorySlug = async (
  categorySlug: string,
  limitCount: number = 10
): Promise<Product[]> => {
  try {
    const q = query(
      collection(db, 'products'),
      where('categorySlug', '==', categorySlug),
      where('status', '==', 'approved'), // Only show approved products
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      categorySlug: doc.data().categorySlug || '',
      categoryName: doc.data().categoryName || doc.data().category || '',
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as Product[];
  } catch (error: any) {
    console.error(`Get products by category slug error (${categorySlug}):`, error);
    throw new Error(error.message || 'Failed to fetch products');
  }
};

/**
 * Get all approved products
 * Used for "All Products" page
 */
export const getAllApprovedProducts = async (limitCount?: number): Promise<Product[]> => {
  try {
    let q;
    
    if (limitCount) {
      q = query(
        collection(db, 'products'),
        where('status', '==', 'approved'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
    } else {
      q = query(
        collection(db, 'products'),
        where('status', '==', 'approved'),
        orderBy('createdAt', 'desc')
      );
    }

    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      categorySlug: doc.data().categorySlug || '',
      categoryName: doc.data().categoryName || doc.data().category || '',
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as Product[];
  } catch (error: any) {
    console.error('Get all approved products error:', error);
    throw new Error(error.message || 'Failed to fetch products');
  }
};

/**
 * Get featured products
 * Products marked as featured by admin
 */
export const getFeaturedProducts = async (limitCount: number = 8): Promise<Product[]> => {
  try {
    const q = query(
      collection(db, 'products'),
      where('status', '==', 'approved'),
      where('featured', '==', true),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      categorySlug: doc.data().categorySlug || '',
      categoryName: doc.data().categoryName || doc.data().category || '',
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as Product[];
  } catch (error: any) {
    console.error('Get featured products error:', error);
    throw new Error(error.message || 'Failed to fetch featured products');
  }
};

/**
 * Get best selling products
 * Products marked as best selling
 */
export const getBestSellingProducts = async (limitCount: number = 8): Promise<Product[]> => {
  try {
    const q = query(
      collection(db, 'products'),
      where('status', '==', 'approved'),
      where('bestSelling', '==', true),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      categorySlug: doc.data().categorySlug || '',
      categoryName: doc.data().categoryName || doc.data().category || '',
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as Product[];
  } catch (error: any) {
    console.error('Get best selling products error:', error);
    throw new Error(error.message || 'Failed to fetch best selling products');
  }
};

/**
 * Get new arrival products
 * Recently added products
 */
export const getNewArrivalProducts = async (limitCount: number = 8): Promise<Product[]> => {
  try {
    const q = query(
      collection(db, 'products'),
      where('status', '==', 'approved'),
      where('newArrival', '==', true),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      categorySlug: doc.data().categorySlug || '',
      categoryName: doc.data().categoryName || doc.data().category || '',
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as Product[];
  } catch (error: any) {
    console.error('Get new arrival products error:', error);
    throw new Error(error.message || 'Failed to fetch new arrival products');
  }
};

/**
 * Get product by ID
 * Used for product detail page
 */
export const getProductById = async (productId: string): Promise<Product | null> => {
  try {
    const productDoc = await getDoc(doc(db, 'products', productId));
    
    if (!productDoc.exists()) {
      return null;
    }

    const data = productDoc.data();
    return {
      id: productDoc.id,
      ...data,
      categorySlug: data.categorySlug || '',
      categoryName: data.categoryName || data.category || '',
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    } as Product;
  } catch (error: any) {
    console.error('Get product by ID error:', error);
    return null;
  }
};

/**
 * Search products by name or description
 */
export const searchProducts = async (searchTerm: string): Promise<Product[]> => {
  try {
    // Note: Firestore doesn't support full-text search natively
    // This is a basic implementation that gets all approved products
    // and filters client-side. For production, consider using Algolia or similar.
    
    const q = query(
      collection(db, 'products'),
      where('status', '==', 'approved'),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const searchLower = searchTerm.toLowerCase();
    
    const products = querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        categorySlug: doc.data().categorySlug || '',
        categoryName: doc.data().categoryName || doc.data().category || '',
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Product[];

    // Filter by search term
    return products.filter(product => 
      product.name.toLowerCase().includes(searchLower) ||
      product.description.toLowerCase().includes(searchLower) ||
      product.categoryName.toLowerCase().includes(searchLower)
    );
  } catch (error: any) {
    console.error('Search products error:', error);
    throw new Error(error.message || 'Failed to search products');
  }
};

/**
 * Get products for homepage sections
 * Returns products grouped by category slug
 */
export const getHomepageProducts = async (): Promise<{
  kitchenAccessories: Product[];
  homeEssentials: Product[];
  electronics: Product[];
  baby: Product[];
  bestSelling: Product[];
  newArrivals: Product[];
}> => {
  try {
    const [
      kitchenAccessories,
      homeEssentials,
      electronics,
      baby,
      bestSelling,
      newArrivals
    ] = await Promise.all([
      getProductsByCategorySlug('kitchen-accessories', 8),
      getProductsByCategorySlug('home-essentials', 8),
      getProductsByCategorySlug('electronics', 8),
      getProductsByCategorySlug('baby', 8),
      getBestSellingProducts(8),
      getNewArrivalProducts(8)
    ]);

    return {
      kitchenAccessories,
      homeEssentials,
      electronics,
      baby,
      bestSelling,
      newArrivals
    };
  } catch (error: any) {
    console.error('Get homepage products error:', error);
    throw new Error(error.message || 'Failed to fetch homepage products');
  }
};
