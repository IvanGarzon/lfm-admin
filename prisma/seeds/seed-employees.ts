import { prisma } from '@/lib/prisma';
import { Gender, EmployeeStatus } from '@/prisma/client';
import { faker } from '@faker-js/faker';

interface Employee {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: Gender;
  dob: Date | null;
  rate: number;
  status: EmployeeStatus;
  avatarUrl: string | null;
}

/**
 * Seed Employee Data
 * Generates fake employees for testing
 */
export async function seedEmployees() {
  console.log('👷 Seeding employees...');

  const employees: Employee[] = [];

  // Create 30 employees
  for (let i = 0; i < 30; i++) {
    const gender = faker.helpers.arrayElement(['MALE', 'FEMALE']);
    const firstName = faker.person.firstName(gender === 'MALE' ? 'male' : 'female');
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName, lastName }).toLowerCase();

    const employee: Employee = {
      firstName,
      lastName,
      email,
      phone: `04${faker.string.numeric(8)}`,
      gender,
      dob: faker.helpers.maybe(
        () => faker.date.birthdate({ min: 18, max: 65, mode: 'age' }),
        { probability: 0.9 },
      ) ?? null,
      rate: faker.number.float({ min: 25, max: 150, multipleOf: 0.25 }),
      status: faker.helpers.weightedArrayElement([
        { value: 'ACTIVE', weight: 0.85 },
        { value: 'INACTIVE', weight: 0.15 },
      ]),
      avatarUrl: faker.helpers.maybe(
        () => `https://api.slingacademy.com/public/sample-users/${i + 1}.png`,
        { probability: 0.7 },
      ) ?? null,
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
