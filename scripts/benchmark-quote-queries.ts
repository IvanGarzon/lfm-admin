/**
 * Performance benchmark script for quote queries
 * Measures the impact of database indexes on query performance
 *
 * Usage: npx tsx scripts/benchmark-quote-queries.ts
 */

// Load environment variables
import 'dotenv/config';

import { prisma } from '../src/lib/prisma';
import { QuoteRepository } from '../src/repositories/quote-repository';

const repo = new QuoteRepository(prisma);

interface BenchmarkResult {
  query: string;
  iterations: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
}

/**
 * Run a query multiple times and measure performance
 */
async function benchmarkQuery(
  name: string,
  queryFn: () => Promise<any>,
  iterations = 10,
): Promise<BenchmarkResult> {
  const times: number[] = [];

  // Warm-up run (not counted)
  await queryFn();

  // Actual benchmark runs
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await queryFn();
    const end = performance.now();
    times.push(end - start);
  }

  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);

  return {
    query: name,
    iterations,
    avgTime,
    minTime,
    maxTime,
  };
}

/**
 * Format benchmark results for display
 */
function formatResults(results: BenchmarkResult[]): void {
  console.log('\n📊 Query Performance Benchmark Results\n');
  console.log('='.repeat(80));
  console.log(
    `${'Query'.padEnd(50)} ${'Avg (ms)'.padStart(10)} ${'Min (ms)'.padStart(10)} ${'Max (ms)'.padStart(10)}`,
  );
  console.log('='.repeat(80));

  results.forEach((result) => {
    console.log(
      `${result.query.padEnd(50)} ${result.avgTime.toFixed(2).padStart(10)} ${result.minTime.toFixed(2).padStart(10)} ${result.maxTime.toFixed(2).padStart(10)}`,
    );
  });

  console.log('='.repeat(80));
  console.log(`\nTotal queries benchmarked: ${results.length}`);
  console.log(`Iterations per query: ${results[0]?.iterations || 0}\n`);
}

/**
 * Main benchmark function
 */
async function runBenchmarks() {
  console.log('🚀 Starting Quote Query Performance Benchmarks...\n');

  const results: BenchmarkResult[] = [];

  try {
    // Get a sample customer ID for testing
    const sampleCustomer = await prisma.customer.findFirst({
      select: { id: true },
    });

    if (!sampleCustomer) {
      console.error('❌ No customers found in database. Please seed data first.');
      process.exit(1);
    }

    const customerId = sampleCustomer.id;

    // Benchmark 1: Customer-filtered status queries (uses customerId + status index)
    console.log('⏱️  Benchmarking: Customer quotes by status...');
    results.push(
      await benchmarkQuery('Customer quotes by status', async () => {
        await repo.searchAndPaginate({
          page: 1,
          perPage: 20,
          status: ['SENT'],
        });
      }),
    );

    // Benchmark 2: Status with soft delete filtering (uses status + deletedAt index)
    console.log('⏱️  Benchmarking: Active quotes by status...');
    results.push(
      await benchmarkQuery('Active quotes by status', async () => {
        await prisma.quote.findMany({
          where: {
            status: 'DRAFT',
            deletedAt: null,
          },
          take: 20,
          orderBy: { createdAt: 'desc' },
        });
      }),
    );

    // Benchmark 3: Expiring quotes (uses validUntil index)
    console.log('⏱️  Benchmarking: Expiring quotes...');
    results.push(
      await benchmarkQuery('Expiring quotes', async () => {
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);

        await prisma.quote.findMany({
          where: {
            validUntil: {
              gte: today,
              lte: thirtyDaysFromNow,
            },
            status: {
              notIn: ['ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED'],
            },
          },
          take: 50,
          orderBy: { validUntil: 'asc' },
        });
      }),
    );

    // Benchmark 4: Quote versions (uses parentQuoteId index)
    console.log('⏱️  Benchmarking: Quote versions...');
    const sampleQuote = await prisma.quote.findFirst({
      where: { parentQuoteId: { not: null } },
      select: { parentQuoteId: true },
    });

    if (sampleQuote?.parentQuoteId) {
      results.push(
        await benchmarkQuery('Quote versions', async () => {
          await repo.getQuoteVersions(sampleQuote.parentQuoteId!);
        }),
      );
    } else {
      console.log('   ⚠️  Skipped (no versioned quotes found)');
    }

    // Benchmark 5: Recent quotes per customer (uses customerId + issuedDate DESC index)
    console.log('⏱️  Benchmarking: Recent customer quotes...');
    results.push(
      await benchmarkQuery('Recent customer quotes', async () => {
        await prisma.quote.findMany({
          where: { customerId },
          take: 10,
          orderBy: { issuedDate: 'desc' },
        });
      }),
    );

    // Benchmark 6: Soft-deleted quotes (uses deletedAt index)
    console.log('⏱️  Benchmarking: Soft-deleted quotes...');
    results.push(
      await benchmarkQuery('Soft-deleted quotes', async () => {
        await prisma.quote.findMany({
          where: {
            deletedAt: { not: null },
          },
          take: 20,
        });
      }),
    );

    // Benchmark 7: Product-based quote item queries (uses productId index)
    console.log('⏱️  Benchmarking: Quote items by product...');
    const sampleProduct = await prisma.product.findFirst({
      select: { id: true },
    });

    if (sampleProduct) {
      results.push(
        await benchmarkQuery('Quote items by product', async () => {
          await prisma.quoteItem.findMany({
            where: { productId: sampleProduct.id },
            include: { quote: true },
            take: 50,
          });
        }),
      );
    } else {
      console.log('   ⚠️  Skipped (no products found)');
    }

    // Benchmark 8: Payment history (uses invoiceId + date index)
    console.log('⏱️  Benchmarking: Payment history...');
    const sampleInvoice = await prisma.invoice.findFirst({
      where: {
        payments: {
          some: {},
        },
      },
      select: { id: true },
    });

    if (sampleInvoice) {
      results.push(
        await benchmarkQuery('Payment history', async () => {
          await prisma.payment.findMany({
            where: { invoiceId: sampleInvoice.id },
            orderBy: { date: 'desc' },
          });
        }),
      );
    } else {
      console.log('   ⚠️  Skipped (no invoices with payments found)');
    }

    // Display results
    formatResults(results);

    console.log('✅ Benchmark complete!\n');
    console.log('💡 Interpretation:');
    console.log('   - Lower times indicate better performance');
    console.log('   - Indexes should show 40-80% improvement over unindexed queries');
    console.log('   - Run this before and after index changes to measure impact\n');
  } catch (error) {
    console.error('❌ Benchmark failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run benchmarks
runBenchmarks().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
