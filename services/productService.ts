import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where,
  serverTimestamp,
  orderBy,
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product } from '@/lib/types';
import { generateCategorySlug } from '@/lib/utils/slugUtils';

export interface ProductInput {
  name: string;
  description: string;
  categoryId: string;
  price: number;
  stock: number;
  images?: File[];
}

export const uploadProductImagesToCloudinary = async (
  images: File[]
): Promise<string[]> => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'vendor_products';

  if (!cloudName) {
    throw new Error('Cloudinary cloud name not configured');
  }

  const uploadPromises = images.map(async (image) => {
    const formData = new FormData();
    formData.append('file', image);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', 'vendor-products');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('Failed to upload image to Cloudinary');
    }

    const data = await response.json();
    return data.secure_url;
  });

  return Promise.all(uploadPromises);
};

export const addProduct = async (
  vendorId: string,
  productData: ProductInput
): Promise<string> => {
  try {
    let imageUrls: string[] = [];

    // Upload images to Cloudinary if provided
    if (productData.images && productData.images.length > 0) {
      imageUrls = await uploadProductImagesToCloudinary(productData.images);
    }

    // Fetch category details from categoryId
    const categoryDoc = await getDoc(doc(db, 'categories', productData.categoryId));
    
    if (!categoryDoc.exists()) {
      throw new Error('Category not found');
    }
    
    const categoryData = categoryDoc.data();
    const categoryName = categoryData.name || '';
    
    // Generate categorySlug - use existing slug or generate from name
    let categorySlug = categoryData.slug || '';
    if (!categorySlug && categoryName) {
      categorySlug = generateCategorySlug(categoryName);
    }

    const productRef = await addDoc(collection(db, 'products'), {
      vendorId,
      name: productData.name,
      description: productData.description,
      category: categoryName, // Legacy field for backward compatibility
      categoryId: productData.categoryId, // Firestore document ID
      categorySlug: categorySlug, // URL-friendly slug (e.g., "kitchen-accessories")
      categoryName: categoryName, // Display name (e.g., "Kitchen Accessories")
      price: productData.price,
      stock: productData.stock,
      images: imageUrls,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return productRef.id;
  } catch (error: any) {
    console.error('Add product error:', error);
    throw new Error(error.message || 'Failed to add product');
  }
};

export const updateProduct = async (
  productId: string,
  productData: Partial<ProductInput>,
  vendorId?: string
): Promise<void> => {
  try {
    const productRef = doc(db, 'products', productId);
    const updateData: any = {
      ...productData,
      updatedAt: serverTimestamp()
    };

    // If categoryId is being updated, also update category slug and name
    if (productData.categoryId) {
      const categoryDoc = await getDoc(doc(db, 'categories', productData.categoryId));
      if (categoryDoc.exists()) {
        const categoryData = categoryDoc.data();
        const categoryName = categoryData.name || '';
        
        // Generate categorySlug - use existing slug or generate from name
        let categorySlug = categoryData.slug || '';
        if (!categorySlug && categoryName) {
          categorySlug = generateCategorySlug(categoryName);
        }
        
        updateData.category = categoryName; // Legacy field
        updateData.categoryName = categoryName; // Display name
        updateData.categorySlug = categorySlug; // URL-friendly slug
      }
    }

    // Upload new images to Cloudinary if provided
    if (productData.images && productData.images.length > 0) {
      const imageUrls = await uploadProductImagesToCloudinary(productData.images);
      updateData.images = imageUrls;
    } else {
      delete updateData.images;
    }

    await updateDoc(productRef, updateData);
  } catch (error: any) {
    console.error('Update product error:', error);
    throw new Error(error.message || 'Failed to update product');
  }
};

export const deleteProduct = async (productId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (error: any) {
    console.error('Delete product error:', error);
    throw new Error(error.message || 'Failed to delete product');
  }
};

export const getVendorProducts = async (vendorId: string): Promise<Product[]> => {
  try {
    const q = query(
      collection(db, 'products'),
      where('vendorId', '==', vendorId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      categorySlug: doc.data().categorySlug || '', // Ensure slug exists
      categoryName: doc.data().categoryName || doc.data().category || '', // Fallback to legacy field
      status: doc.data().status || 'pending',
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as Product[];
  } catch (error: any) {
    console.error('Get vendor products error:', error);
    throw new Error(error.message || 'Failed to fetch products');
  }
};

export const updateProductStock = async (
  productId: string,
  newStock: number
): Promise<void> => {
  try {
    const productRef = doc(db, 'products', productId);
    await updateDoc(productRef, {
      stock: newStock,
      updatedAt: serverTimestamp()
    });
  } catch (error: any) {
    console.error('Update stock error:', error);
    throw new Error(error.message || 'Failed to update stock');
  }
};

/**
 * Migration function to fix existing products with empty categorySlug
 * This should be run once to update all existing products
 */
export const fixProductCategorySlugs = async (): Promise<{
  totalProducts: number;
  fixedProducts: number;
  errors: string[];
}> => {
  try {
    console.log('Starting categorySlug migration...');
    
    // Get all products
    const q = query(collection(db, 'products'));
    const querySnapshot = await getDocs(q);
    
    const totalProducts = querySnapshot.docs.length;
    let fixedProducts = 0;
    const errors: string[] = [];
    
    console.log(`Found ${totalProducts} products to check`);
    
    // Process products in batches to avoid overwhelming Firestore
    const batchSize = 10;
    const batches = [];
    
    for (let i = 0; i < querySnapshot.docs.length; i += batchSize) {
      batches.push(querySnapshot.docs.slice(i, i + batchSize));
    }
    
    for (const batch of batches) {
      const batchPromises = batch.map(async (productDoc) => {
        try {
          const productData = productDoc.data();
          const productId = productDoc.id;
          
          // Check if categorySlug is empty or missing
          const currentSlug = productData.categorySlug || '';
          
          if (!currentSlug) {
            console.log(`Fixing product ${productId}: ${productData.name}`);
            
            let categorySlug = '';
            let categoryName = productData.categoryName || productData.category || '';
            
            // If we have a categoryId, try to get the category document
            if (productData.categoryId) {
              try {
                const categoryDoc = await getDoc(doc(db, 'categories', productData.categoryId));
                if (categoryDoc.exists()) {
                  const categoryData = categoryDoc.data();
                  categoryName = categoryData.name || categoryName;
                  categorySlug = categoryData.slug || '';
                }
              } catch (error) {
                console.warn(`Could not fetch category ${productData.categoryId}:`, error);
              }
            }
            
            // Generate slug from category name if we don't have one
            if (!categorySlug && categoryName) {
              categorySlug = generateCategorySlug(categoryName);
            }
            
            // Update the product if we have a valid slug
            if (categorySlug) {
              await updateDoc(doc(db, 'products', productId), {
                categorySlug: categorySlug,
                categoryName: categoryName,
                updatedAt: serverTimestamp()
              });
              
              console.log(`✅ Fixed product ${productId}: "${categoryName}" → "${categorySlug}"`);
              return true;
            } else {
              const errorMsg = `❌ Could not generate slug for product ${productId}: no category name available`;
              console.error(errorMsg);
              errors.push(errorMsg);
              return false;
            }
          }
          
          return false; // No fix needed
        } catch (error: any) {
          const errorMsg = `❌ Error fixing product ${productDoc.id}: ${error.message}`;
          console.error(errorMsg);
          errors.push(errorMsg);
          return false;
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      fixedProducts += batchResults.filter(Boolean).length;
      
      // Small delay between batches to be nice to Firestore
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`Migration complete: ${fixedProducts}/${totalProducts} products fixed`);
    
    return {
      totalProducts,
      fixedProducts,
      errors
    };
  } catch (error: any) {
    console.error('Migration error:', error);
    throw new Error(`Migration failed: ${error.message}`);
  }
};

/**
 * Get products with empty categorySlug for debugging
 */
export const getProductsWithEmptySlug = async (): Promise<Product[]> => {
  try {
    const q = query(collection(db, 'products'));
    const querySnapshot = await getDocs(q);
    
    const productsWithEmptySlug = querySnapshot.docs
      .filter(doc => {
        const data = doc.data();
        return !data.categorySlug || data.categorySlug === '';
      })
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Product[];
    
    return productsWithEmptySlug;
  } catch (error: any) {
    console.error('Get products with empty slug error:', error);
    throw new Error(error.message || 'Failed to fetch products with empty slug');
  }
};