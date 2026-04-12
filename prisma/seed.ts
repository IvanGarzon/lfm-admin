import { prisma } from '@/lib/prisma';
import { faker } from '@faker-js/faker';
import { select, confirm, input, number } from '@inquirer/prompts';
import { seedTenants } from './seeds/seed-tenants';
import { seedOrganizations } from './seeds/seed-organizations';
import { seedCustomers } from './seeds/seed-customers';
import { seedProducts } from './seeds/seed-products';
import { seedEmployees } from './seeds/seed-employees';
import { seedVendors } from './seeds/seed-vendors';
import { seedInvoices } from './seeds/seed-invoices';
import { seedQuotes } from './seeds/seed-quotes';
import { seedTransactions } from './seeds/seed-transactions';
import { seedPriceListItems } from './seeds/seed-price-list-items';
import { seedRecipes } from './seeds/seed-recipes';
import { seedE2EUser } from './seeds/seed-e2e-user';
import { seedSuperAdmin } from './seeds/seed-superadmin';
import { hasFlag, parseArg } from './seeds/seed-helpers';

// -- Types -------------------------------------------------------------------

type Profile = 'minimal' | 'full' | 'custom';

interface SeedConfig {
  profile: Profile;
  tenantCount: number;
  password: string;
  fresh: boolean;
  customersPerTenant: number;
  employeesPerTenant: number;
  vendorsPerTenant: number;
  invoicesPerTenant: number;
  quotesPerTenant: number;
  fakerSeed: number | undefined;
}

// -- Profiles ----------------------------------------------------------------

const PROFILES: Record<
  Exclude<Profile, 'custom'>,
  Omit<SeedConfig, 'fresh' | 'password' | 'fakerSeed'>
> = {
  minimal: {
    profile: 'minimal',
    tenantCount: 1,
    customersPerTenant: 20,
    employeesPerTenant: 10,
    vendorsPerTenant: 5,
    invoicesPerTenant: 10,
    quotesPerTenant: 10,
  },
  full: {
    profile: 'full',
    tenantCount: 3,
    customersPerTenant: 50,
    employeesPerTenant: 20,
    vendorsPerTenant: 8,
    invoicesPerTenant: 30,
    quotesPerTenant: 30,
  },
};

// -- Config resolution -------------------------------------------------------

async function resolveConfig(): Promise<SeedConfig> {
  const isCi = hasFlag('yes');
  const fakerSeedArg = parseArg('seed');
  const fakerSeed = fakerSeedArg !== undefined ? parseInt(fakerSeedArg, 10) : undefined;

  if (isCi) {
    const profileArg = (parseArg('profile') ?? 'minimal') as Exclude<Profile, 'custom'>;
    const tenantArg = parseArg('tenants');
    const password = parseArg('password') ?? 'Password1!';
    const preset = PROFILES[profileArg] ?? PROFILES.minimal;
    return {
      ...preset,
      tenantCount: tenantArg ? parseInt(tenantArg, 10) : preset.tenantCount,
      password,
      fresh: true,
      fakerSeed,
    };
  }

  const profile = await select<Profile>({
    message: 'Seed profile',
    choices: [
      { name: 'Minimal  — 1 tenant, small data set (fast)', value: 'minimal' },
      { name: 'Full     — 3 tenants, full data set', value: 'full' },
      { name: 'Custom   — choose your own counts', value: 'custom' },
    ],
  });

  const password = await input({ message: 'Seed password', default: 'Password1!' });
  const fresh = await confirm({
    message: 'Fresh mode (truncate all tables first)?',
    default: true,
  });

  if (profile !== 'custom') {
    return { ...PROFILES[profile], password, fresh, fakerSeed };
  }

  const tenantCount = await number({ message: 'Tenant count', default: 2 });
  const customersPerTenant = await number({ message: 'Customers per tenant', default: 50 });
  const employeesPerTenant = await number({ message: 'Employees per tenant', default: 20 });
  const vendorsPerTenant = await number({ message: 'Vendors per tenant', default: 8 });
  const invoicesPerTenant = await number({ message: 'Invoices per tenant', default: 30 });
  const quotesPerTenant = await number({ message: 'Quotes per tenant', default: 30 });

  return {
    profile: 'custom',
    tenantCount: tenantCount ?? 2,
    password,
    fresh,
    customersPerTenant: customersPerTenant ?? 50,
    employeesPerTenant: employeesPerTenant ?? 20,
    vendorsPerTenant: vendorsPerTenant ?? 8,
    invoicesPerTenant: invoicesPerTenant ?? 30,
    quotesPerTenant: quotesPerTenant ?? 30,
    fakerSeed,
  };
}

// -- Truncation --------------------------------------------------------------

async function truncateAll(): Promise<void> {
  console.log('Truncating tables...');

  // Child tables first (foreign-key order)
  await prisma.transactionCategoryOnTransaction.deleteMany();
  await prisma.transactionAttachment.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoiceStatusHistory.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.quoteStatusHistory.deleteMany();
  await prisma.quoteItemAttachment.deleteMany();
  await prisma.quoteItem.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.recipeGroupItem.deleteMany();
  await prisma.recipeGroup.deleteMany();
  await prisma.recipeItem.deleteMany();
  await prisma.recipe.deleteMany();
  await prisma.priceListCostHistory.deleteMany();
  await prisma.priceListItem.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.product.deleteMany();
  await prisma.vendor.deleteMany();

  // Remove tenant data (keeps super-admin users intact)
  await prisma.tenantSettings.deleteMany();
  await prisma.user.deleteMany({ where: { role: { not: 'SUPER_ADMIN' } } });
  await prisma.tenant.deleteMany();

  console.log('Tables truncated.\n');
}

// -- Main --------------------------------------------------------------------

async function main() {
  const config = await resolveConfig();

  if (config.fakerSeed !== undefined) {
    faker.seed(config.fakerSeed);
    console.log(`Faker seed: ${config.fakerSeed}`);
  }

  console.log(`\nProfile: ${config.profile}`);
  console.log(`Tenants: ${config.tenantCount}`);
  console.log(`Fresh:   ${config.fresh ? 'yes' : 'no'}\n`);

  if (!hasFlag('yes')) {
    const ready = await confirm({ message: 'Ready to seed the database?', default: true });
    if (!ready) {
      console.log('Aborted.');
      return;
    }
  }

  if (config.fresh) await truncateAll();

  console.log('Starting seed...\n');

  try {
    const tenants = await seedTenants({ count: config.tenantCount, password: config.password });

    await seedSuperAdmin();
    await seedE2EUser();

    await seedOrganizations({ tenants });
    await seedCustomers({ tenants, countPerTenant: config.customersPerTenant });
    await seedProducts({ tenants });
    await seedEmployees({ tenants, countPerTenant: config.employeesPerTenant });
    await seedVendors({ tenants, countPerTenant: config.vendorsPerTenant });
    await seedPriceListItems({ tenants });
    await seedRecipes({ tenants });
    await seedQuotes({ tenants, countPerTenant: config.quotesPerTenant });
    await seedInvoices({ tenants, countPerTenant: config.invoicesPerTenant });
    await seedTransactions({ tenants });

    console.log('\nAll seeding completed!\n');

    const stats = await Promise.all([
      prisma.tenant.count(),
      prisma.organization.count(),
      prisma.customer.count(),
      prisma.employee.count(),
      prisma.product.count(),
      prisma.vendor.count(),
      prisma.priceListItem.count(),
      prisma.recipe.count(),
      prisma.recipeItem.count(),
      prisma.invoice.count(),
      prisma.invoiceItem.count(),
      prisma.quote.count(),
      prisma.quoteItem.count(),
      prisma.transaction.count(),
    ]);

    const [
      tenantCount,
      orgCount,
      customerCount,
      employeeCount,
      productCount,
      vendorCount,
      priceListCount,
      recipeCount,
      recipeItemCount,
      invoiceCount,
      invoiceItemCount,
      quoteCount,
      quoteItemCount,
      transactionCount,
    ] = stats;

    console.log('Summary:');
    console.log(`   Tenants:          ${tenantCount}`);
    console.log(`   Organisations:    ${orgCount}`);
    console.log(`   Customers:        ${customerCount}`);
    console.log(`   Employees:        ${employeeCount}`);
    console.log(`   Products:         ${productCount}`);
    console.log(`   Vendors:          ${vendorCount}`);
    console.log(`   Price List Items: ${priceListCount}`);
    console.log(`   Recipes:          ${recipeCount}`);
    console.log(`   Recipe Items:     ${recipeItemCount}`);
    console.log(`   Invoices:         ${invoiceCount}`);
    console.log(`   Invoice Items:    ${invoiceItemCount}`);
    console.log(`   Quotes:           ${quoteCount}`);
    console.log(`   Quote Items:      ${quoteItemCount}`);
    console.log(`   Transactions:     ${transactionCount}`);
    console.log('\nReady. Start your server: pnpm dev\n');
  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
