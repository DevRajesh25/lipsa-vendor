import { NextRequest, NextResponse } from 'next/server';
import { fixProductCategorySlugs, getProductsWithEmptySlug } from '@/services/productService';
import { fixCategorySlugs, getCategoriesWithEmptySlug } from '@/services/categoryService';

/**
 * API endpoint to fix category slugs
 * POST /api/admin/fix-category-slugs
 * 
 * Query parameters:
 * - action: 'check' | 'fix-products' | 'fix-categories' | 'fix-all'
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'check';

    switch (action) {
      case 'check': {
        const [productsNeedingFix, categoriesNeedingFix] = await Promise.all([
          getProductsWithEmptySlug(),
          getCategoriesWithEmptySlug()
        ]);

        return NextResponse.json({
          success: true,
          data: {
            productsNeedingFix: productsNeedingFix.length,
            categoriesNeedingFix: categoriesNeedingFix.length,
            products: productsNeedingFix.map(p => ({
              id: p.id,
              name: p.name,
              categoryName: p.categoryName || p.category
            })),
            categories: categoriesNeedingFix.map(c => ({
              id: c.id,
              name: c.name
            }))
          }
        });
      }

      case 'fix-products': {
        const result = await fixProductCategorySlugs();
        return NextResponse.json({
          success: true,
          message: `Fixed ${result.fixedProducts} products`,
          data: result
        });
      }

      case 'fix-categories': {
        const result = await fixCategorySlugs();
        return NextResponse.json({
          success: true,
          message: `Fixed ${result.fixedCategories} categories`,
          data: result
        });
      }

      case 'fix-all': {
        const [categoryResult, productResult] = await Promise.all([
          fixCategorySlugs(),
          fixProductCategorySlugs()
        ]);

        return NextResponse.json({
          success: true,
          message: `Fixed ${categoryResult.fixedCategories} categories and ${productResult.fixedProducts} products`,
          data: {
            categories: categoryResult,
            products: productResult
          }
        });
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: check, fix-products, fix-categories, or fix-all'
        }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Category slug fix API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to process request'
    }, { status: 500 });
  }
}

/**
 * Usage examples:
 * 
 * Check what needs fixing:
 * POST /api/admin/fix-category-slugs?action=check
 * 
 * Fix products only:
 * POST /api/admin/fix-category-slugs?action=fix-products
 * 
 * Fix categories only:
 * POST /api/admin/fix-category-slugs?action=fix-categories
 * 
 * Fix everything:
 * POST /api/admin/fix-category-slugs?action=fix-all
 */