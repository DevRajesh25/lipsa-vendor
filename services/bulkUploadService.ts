import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
  writeBatch,
  doc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Papa from 'papaparse';

export interface CSVProduct {
  name: string;
  description: string;
  price: string;
  stock: string;
  categorySlug: string;
  imageUrl: string;
}

export interface ParsedProduct {
  name: string;
  description: string;
  price: number;
  stock: number;
  categorySlug: string;
  imageUrl: string;
}

export interface UploadResult {
  success: boolean;
  message: string;
  successCount: number;
  failureCount: number;
  errors: Array<{ row: number; error: string; product?: CSVProduct }>;
}

export interface CategoryInfo {
  id: string;
  name: string;
  slug: string;
}

// Parse CSV file
export const parseCSVFile = (file: File): Promise<CSVProduct[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error(`CSV parsing error: ${results.errors[0].message}`));
          return;
        }
        resolve(results.data as CSVProduct[]);
      },
      error: (error) => {
        reject(new Error(`Failed to parse CSV: ${error.message}`));
      }
    });
  });
};

// Validate and convert CSV product data
export const validateProduct = (product: CSVProduct, rowIndex: number): { valid: boolean; parsed?: ParsedProduct; error?: string } => {
  // Check required fields
  if (!product.name?.trim()) {
    return { valid: false, error: 'Product name is required' };
  }
  
  if (!product.description?.trim()) {
    return { valid: false, error: 'Product description is required' };
  }
  
  if (!product.categorySlug?.trim()) {
    return { valid: false, error: 'Category slug is required' };
  }
  
  if (!product.imageUrl?.trim()) {
    return { valid: false, error: 'Image URL is required' };
  }

  // Validate price
  const price = parseFloat(product.price);
  if (isNaN(price) || price <= 0) {
    return { valid: false, error: 'Price must be a valid positive number' };
  }

  // Validate stock
  const stock = parseInt(product.stock);
  if (isNaN(stock) || stock < 0) {
    return { valid: false, error: 'Stock must be a valid non-negative number' };
  }

  // Validate image URL format
  const urlPattern = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i;
  if (!urlPattern.test(product.imageUrl)) {
    return { valid: false, error: 'Image URL must be a valid HTTP/HTTPS URL ending with image extension' };
  }

  return {
    valid: true,
    parsed: {
      name: product.name.trim(),
      description: product.description.trim(),
      price,
      stock,
      categorySlug: product.categorySlug.trim().toLowerCase(),
      imageUrl: product.imageUrl.trim()
    }
  };
};

// Get all categories for validation
export const getCategories = async (): Promise<CategoryInfo[]> => {
  try {
    const categoriesQuery = query(collection(db, 'categories'));
    const categoriesSnapshot = await getDocs(categoriesQuery);
    
    return categoriesSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      slug: doc.data().slug
    }));
  } catch (error: any) {
    console.error('Get categories error:', error);
    throw new Error('Failed to fetch categories');
  }
};

// Validate category exists
export const validateCategory = async (categorySlug: string): Promise<CategoryInfo | null> => {
  try {
    const categoryQuery = query(
      collection(db, 'categories'),
      where('slug', '==', categorySlug)
    );
    const categorySnapshot = await getDocs(categoryQuery);
    
    if (categorySnapshot.empty) {
      return null;
    }
    
    const categoryDoc = categorySnapshot.docs[0];
    return {
      id: categoryDoc.id,
      name: categoryDoc.data().name,
      slug: categoryDoc.data().slug
    };
  } catch (error: any) {
    console.error('Validate category error:', error);
    throw new Error('Failed to validate category');
  }
};

// Upload products in batches
export const bulkUploadProducts = async (
  products: ParsedProduct[],
  vendorId: string,
  batchSize: number = 10
): Promise<UploadResult> => {
  const result: UploadResult = {
    success: true,
    message: '',
    successCount: 0,
    failureCount: 0,
    errors: []
  };

  try {
    // Get all categories for validation
    const categories = await getCategories();
    const categoryMap = new Map(categories.map(cat => [cat.slug, cat]));

    // Process products in batches
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      const writeBatchRef = writeBatch(db);
      let batchHasValidProducts = false;

      for (let j = 0; j < batch.length; j++) {
        const product = batch[j];
        const rowIndex = i + j + 2; // +2 because CSV has header row and is 1-indexed

        // Validate category exists
        const category = categoryMap.get(product.categorySlug);
        if (!category) {
          result.errors.push({
            row: rowIndex,
            error: `Category '${product.categorySlug}' does not exist`,
            product: {
              name: product.name,
              description: product.description,
              price: product.price.toString(),
              stock: product.stock.toString(),
              categorySlug: product.categorySlug,
              imageUrl: product.imageUrl
            }
          });
          result.failureCount++;
          continue;
        }

        try {
          // Create product document
          const productRef = doc(collection(db, 'products'));
          writeBatchRef.set(productRef, {
            name: product.name,
            description: product.description,
            price: product.price,
            stock: product.stock,
            categoryId: category.id,
            categoryName: category.name,
            categorySlug: category.slug,
            images: [product.imageUrl],
            vendorId: vendorId,
            status: 'pending',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            bestSelling: false,
            featured: false
          });

          batchHasValidProducts = true;
        } catch (error: any) {
          result.errors.push({
            row: rowIndex,
            error: `Failed to prepare product: ${error.message}`,
            product: {
              name: product.name,
              description: product.description,
              price: product.price.toString(),
              stock: product.stock.toString(),
              categorySlug: product.categorySlug,
              imageUrl: product.imageUrl
            }
          });
          result.failureCount++;
        }
      }

      // Commit batch if it has valid products
      if (batchHasValidProducts) {
        try {
          await writeBatchRef.commit();
          result.successCount += batch.length - batch.filter((_, j) => 
            result.errors.some(error => error.row === i + j + 2)
          ).length;
        } catch (error: any) {
          // If batch fails, mark all products in batch as failed
          batch.forEach((product, j) => {
            const rowIndex = i + j + 2;
            if (!result.errors.some(error => error.row === rowIndex)) {
              result.errors.push({
                row: rowIndex,
                error: `Batch upload failed: ${error.message}`,
                product: {
                  name: product.name,
                  description: product.description,
                  price: product.price.toString(),
                  stock: product.stock.toString(),
                  categorySlug: product.categorySlug,
                  imageUrl: product.imageUrl
                }
              });
              result.failureCount++;
            }
          });
        }
      }
    }

    // Set final result
    if (result.successCount > 0 && result.failureCount === 0) {
      result.message = `Successfully uploaded ${result.successCount} products`;
    } else if (result.successCount > 0 && result.failureCount > 0) {
      result.message = `Uploaded ${result.successCount} products successfully, ${result.failureCount} failed`;
    } else {
      result.success = false;
      result.message = `Failed to upload products: ${result.failureCount} errors`;
    }

  } catch (error: any) {
    result.success = false;
    result.message = `Bulk upload failed: ${error.message}`;
    result.failureCount = products.length;
  }

  return result;
};

// Generate sample CSV content
export const generateSampleCSV = (): string => {
  const sampleData = [
    {
      name: 'Baby Toy',
      description: 'Soft toy for kids',
      price: '299',
      stock: '50',
      categorySlug: 'baby-essentials',
      imageUrl: 'https://example.com/images/toy.jpg'
    },
    {
      name: 'Hair Clip',
      description: 'Stylish clip',
      price: '99',
      stock: '100',
      categorySlug: 'health-beauty',
      imageUrl: 'https://example.com/images/clip.jpg'
    },
    {
      name: 'Kitchen Knife',
      description: 'Steel knife set',
      price: '499',
      stock: '30',
      categorySlug: 'kitchen-accessories',
      imageUrl: 'https://example.com/images/knife.jpg'
    }
  ];

  return Papa.unparse(sampleData);
};