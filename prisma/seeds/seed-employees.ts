import { prisma } from '../../src/lib/prisma';
import { Gender, EmployeeStatus } from '../generated/client/index.js';
import { faker } from '@faker-js/faker';

/**
 * Seed Employee Data
 * Generates fake employees for testing
 */

function generateRandomAustralianPhoneNumber(): string {
  return `04${faker.string.numeric(8)}`;
}

async function seedEmployees() {
  console.log('👷 Seeding employees...');

  const employees = [];

  // Create 30 employees
  for (let i = 0; i < 30; i++) {
    const gender = faker.helpers.arrayElement(['MALE', 'FEMALE'] as Gender[]);
    const firstName = faker.person.firstName(gender === 'MALE' ? 'male' : 'female');
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName, lastName }).toLowerCase();

    const employee = {
      firstName,
      lastName,
      email,
      phone: generateRandomAustralianPhoneNumber(),
      gender,
      dob: faker.helpers.maybe(
        () => faker.date.birthdate({ min: 18, max: 65, mode: 'age' }),
        { probability: 0.9 },
      ),
      rate: faker.number.float({ min: 25, max: 150, multipleOf: 0.25 }),
      status: faker.helpers.weightedArrayElement([
        { value: 'ACTIVE' as EmployeeStatus, weight: 0.85 },
        { value: 'INACTIVE' as EmployeeStatus, weight: 0.15 },
      ]),
      avatarUrl: faker.helpers.maybe(
        () => `https://api.slingacademy.com/public/sample-users/${i + 1}.png`,
        { probability: 0.7 },
      ),
    };

    employees.push(employee);
  }

  // Create employees
  let created = 0;
  for (const employee of employees) {
    try {
      await prisma.employee.create({
        data: employee,
      });
      created++;
    } catch (error) {
      // Skip duplicates
      console.log(`⚠️  Skipped duplicate email: ${employee.email}`);
    }
  }

  console.log(`✅ Created ${created} employees`);
}

async function main() {
  try {
    await seedEmployees();
    console.log('🎉 Employee seeding completed!');
  } catch (error) {
    console.error('❌ Error seeding employees:', error);
    throw error;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
