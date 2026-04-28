import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/tienda - Returns active products grouped by category from the database
export async function GET() {
  try {
    let products: Awaited<ReturnType<typeof db.tiendaProduct.findMany>> = [];
    try {
      products = await db.tiendaProduct.findMany({
        where: { activo: true },
        orderBy: [{ orden: 'asc' }, { createdAt: 'desc' }],
      });
    } catch (dbError) {
      // Table might not exist yet (migration not applied) - return empty results gracefully
      console.warn('Tienda table not available yet, returning empty products:', dbError);
    }

    // Group products by category
    const grouped: Record<string, typeof products> = {};
    for (const product of products) {
      const cat = product.categoria || 'general';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(product);
    }

    // Return all products and the grouped version for convenience
    return NextResponse.json({
      ok: true,
      data: {
        products,
        grouped,
      },
    });
  } catch (error) {
    console.error('Error fetching tienda:', error);
    // Even on unexpected error, return ok:true with empty data so the frontend renders normally
    return NextResponse.json({
      ok: true,
      data: { products: [], grouped: {} },
    });
  }
}
