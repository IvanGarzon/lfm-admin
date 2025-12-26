import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

/**
 * Creates test users with different roles to verify permission system
 *
 * Run with: npx tsx scripts/create-test-users.ts
 */
async function createTestUsers() {
  console.log('🔐 Creating test users for permission testing...\n');

  const password = await bcrypt.hash('Test123!', 10);

  try {
    // 1. USER role - Read-only access
    const readOnlyUser = await prisma.user.upsert({
      where: { email: 'test-user@example.com' },
      update: { role: 'USER' },
      create: {
        email: 'test-user@example.com',
        firstName: 'Test',
        lastName: 'User',
        password,
        role: 'USER',
      },
    });
    console.log('✅ Created/Updated USER role (read-only):');
    console.log(`   Email: ${readOnlyUser.email}`);
    console.log(`   Role: ${readOnlyUser.role}`);
    console.log(`   Permissions: canReadQuotes, canReadInvoices`);
    console.log('');

    // 2. MANAGER role - Can manage quotes/invoices
    const managerUser = await prisma.user.upsert({
      where: { email: 'test-manager@example.com' },
      update: { role: 'MANAGER' },
      create: {
        email: 'test-manager@example.com',
        firstName: 'Test',
        lastName: 'Manager',
        password,
        role: 'MANAGER',
      },
    });
    console.log('✅ Created/Updated MANAGER role (full management):');
    console.log(`   Email: ${managerUser.email}`);
    console.log(`   Role: ${managerUser.role}`);
    console.log(`   Permissions: canReadQuotes, canManageQuotes, canRecordPayments`);
    console.log('');

    // 3. ADMIN role - Full access
    const adminUser = await prisma.user.upsert({
      where: { email: 'test-admin@example.com' },
      update: { role: 'ADMIN' },
      create: {
        email: 'test-admin@example.com',
        firstName: 'Test',
        lastName: 'Admin',
        password,
        role: 'ADMIN',
      },
    });
    console.log('✅ Created/Updated ADMIN role (full access):');
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   Permissions: All permissions including delete`);
    console.log('');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 Test users created successfully!\n');
    console.log('📋 Login Credentials (all users):');
    console.log('   Password: Test123!\n');
    console.log('🧪 Testing Instructions:');
    console.log('   1. Login as test-user@example.com');
    console.log('      - Should VIEW quotes ✓');
    console.log('      - Should NOT create/edit quotes ✗\n');
    console.log('   2. Login as test-manager@example.com');
    console.log('      - Should VIEW and MANAGE quotes ✓\n');
    console.log('   3. Login as test-admin@example.com');
    console.log('      - Should have FULL ACCESS ✓');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error creating test users:', error);
    throw error;
  }
}

createTestUsers()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
