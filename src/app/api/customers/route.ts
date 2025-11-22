import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// import { ProductRepository } from '@/repositories/productRepository';
// const productRepo = new ProductRepository();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Extract filters from query params
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const category = searchParams.get('category') || undefined;

    // const products = await productRepo.findWithFilters({
    //   search,
    //   status: status as 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK' | undefined
    // });

    const products = await prisma.customer.findMany();
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
