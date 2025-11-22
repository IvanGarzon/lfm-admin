import { NextResponse } from 'next/server';
import { ProductRepository } from '@/repositories/productRepository';
import { prisma } from '@/lib/prisma';

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

    const products = await prisma.product.findMany({});
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { imageUrl, name, description, status, price, stock, availableAt } = body;

    // Validate required fields
    if (!name || price === undefined || stock === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: name, price, and stock are mandatory.' },
        { status: 400 },
      );
    }

    // Create the product
    const newProduct = await prisma.product.create({
      data: {
        imageUrl,
        name,
        description,
        status,
        price,
        stock,
        availableAt: availableAt ? new Date(availableAt) : null, // Ensure availableAt is a valid Date object
      },
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
