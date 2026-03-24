import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  orderBy,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { generateCategorySlug } from '@/lib/utils/slugUtils';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  createdAt: Date;
}

export interface CategoryInput {
  name: string;
  description: string;
  image?: string;
}

/**
 * Add a new category with auto-generated slug
 */
export const addCategory = async (categoryData: CategoryInput): Promise<string> => {
  try {
    const slug = generateCategorySlug(categoryData.name);
    
    const categoryRef = await addDoc(collection(db, 'categories'), {
      name: categoryData.name,
      slug: slug,
      description: categoryData.description,
      image: categoryData.image || '',
      createdAt: serverTimestamp()
    });

    return categoryRef.id;
  } catch (error: any) {
    console.error('Add category error:', error);
    throw new Error(error.message || 'Failed to add category');
  }
};

/**
 * Update a category and regenerate slug if name changed
 */
export const updateCategory = async (
  categoryId: string,
  categoryData: Partial<CategoryInput>
): Promise<void> => {
  try {
    const updateData: any = { ...categoryData };
    
    // If name is being updated, also update the slug
    if (categoryData.name) {
      updateData.slug = generateCategorySlug(categoryData.name);
    }

    await updateDoc(doc(db, 'categories', categoryId), updateData);
  } catch (error: any) {
    console.error('Update category error:', error);
    throw new Error(error.message || 'Failed to update category');
  }
};

/**
 * Get all categories
 */
export const getAllCategories = async (): Promise<Category[]> => {
  try {
    const q = query(
      collection(db, 'categories'),
      orderBy('createdAt', 'asc')
    );

    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      slug: doc.data().slug || '',
      description: doc.data().description,
      image: doc.data().image,
      createdAt: doc.data().createdAt?.toDate() || new Date()
    })) as Category[];
  } catch (error: any) {
    console.error('Get categories error:', error);
    throw new Error(error.message || 'Failed to fetch categories');
  }
};

/**
 * Migration function to fix existing categories with empty slug
 */
export const fixCategorySlugs = async (): Promise<{
  totalCategories: number;
  fixedCategories: number;
  errors: string[];
}> => {
  try {
    console.log('Starting category slug migration...');
    
    // Get all categories
    const q = query(collection(db, 'categories'));
    const querySnapshot = await getDocs(q);
    
    const totalCategories = querySnapshot.docs.length;
    let fixedCategories = 0;
    const errors: string[] = [];
    
    console.log(`Found ${totalCategories} categories to check`);
    
    for (const categoryDoc of querySnapshot.docs) {
      try {
        const categoryData = categoryDoc.data();
        const categoryId = categoryDoc.id;
        const currentSlug = categoryData.slug || '';
        
        if (!currentSlug && categoryData.name) {
          const newSlug = generateCategorySlug(categoryData.name);
          
          await updateDoc(doc(db, 'categories', categoryId), {
            slug: newSlug
          });
          
          console.log(`✅ Fixed category ${categoryId}: "${categoryData.name}" → "${newSlug}"`);
          fixedCategories++;
        }
      } catch (error: any) {
        const errorMsg = `❌ Error fixing category ${categoryDoc.id}: ${error.message}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }
    
    console.log(`Category migration complete: ${fixedCategories}/${totalCategories} categories fixed`);
    
    return {
      totalCategories,
      fixedCategories,
      errors
    };
  } catch (error: any) {
    console.error('Category migration error:', error);
    throw new Error(`Category migration failed: ${error.message}`);
  }
};

/**
 * Get categories with empty slug for debugging
 */
export const getCategoriesWithEmptySlug = async (): Promise<Category[]> => {
  try {
    const q = query(collection(db, 'categories'));
    const querySnapshot = await getDocs(q);
    
    const categoriesWithEmptySlug = querySnapshot.docs
      .filter(doc => {
        const data = doc.data();
        return !data.slug || data.slug === '';
      })
      .map(doc => ({
        id: doc.id,
        name: doc.data().name,
        slug: doc.data().slug || '',
        description: doc.data().description,
        image: doc.data().image,
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Category[];
    
    return categoriesWithEmptySlug;
  } catch (error: any) {
    console.error('Get categories with empty slug error:', error);
    throw new Error(error.message || 'Failed to fetch categories with empty slug');
  }
};