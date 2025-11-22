import { Prisma, prisma } from '@/lib/prisma';
import { faker } from '@faker-js/faker';
import { Employee, Customer, Organization } from '@/prisma/client';
import {
  EmployeeStatusType,
  EmployeeStatusSchema,
} from '@/zod/inputTypeSchemas/EmployeeStatusSchema';
import {
  CustomerStatusType,
  CustomerStatusSchema,
} from '@/zod/inputTypeSchemas/CustomerStatusSchema';
import { GenderType, GenderSchema } from '@/zod/inputTypeSchemas/GenderSchema';

function generateRandomAustralianPhoneNumber(type: 'mobile' | 'landline' = 'mobile'): string {
  if (type === 'mobile') {
    return `04${Math.floor(10000000 + Math.random() * 90000000)}`;
  }

  const areaCodes = ['02', '03', '07', '08']; // Australian landline area codes
  const randomAreaCode = areaCodes[Math.floor(Math.random() * areaCodes.length)];
  return `${randomAreaCode}${Math.floor(10000000 + Math.random() * 90000000)}`;
}

const generateRandomOrganizations = (count: number): Partial<Organization>[] =>
  Array.from({ length: count }, () => ({
    name: faker.company.name(),
    address: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.helpers.arrayElement(['VIC', 'NSW', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT']),
    postcode: faker.location.zipCode(),
    country: 'Australia',
  }));

const generateRandomEmployees = (count: number): Partial<Employee>[] =>
  Array.from({ length: count }, (_, i) => ({
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    phone: generateRandomAustralianPhoneNumber('mobile'),
    dob: faker.date.past({ years: faker.number.int({ min: 18, max: 65 }) }),
    rate: new Prisma.Decimal(faker.number.float({ min: 20, max: 50, multipleOf: 0.25 })),
    gender: faker.helpers.arrayElement([
      GenderSchema.enum.MALE,
      GenderSchema.enum.FEMALE,
    ]) as GenderType,
    status: faker.helpers.arrayElement([
      EmployeeStatusSchema.enum.ACTIVE,
      EmployeeStatusSchema.enum.INACTIVE,
    ]) as EmployeeStatusType,
    avatarUrl: `https://api.slingacademy.com/public/sample-users/${i + 1}.png`,
  }));

const generateRandomCustomers = async (count: number): Promise<Partial<Customer>[]> => {
  const organizations = await prisma.organization.findMany();

  return Array.from({ length: count }, () => ({
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    gender: faker.helpers.arrayElement([
      GenderSchema.enum.MALE,
      GenderSchema.enum.FEMALE,
    ]) as GenderType,
    email: faker.internet.email(),
    phone: generateRandomAustralianPhoneNumber('mobile'),
    status: faker.helpers.arrayElement([
      CustomerStatusSchema.enum.ACTIVE,
      CustomerStatusSchema.enum.INACTIVE,
      CustomerStatusSchema.enum.DELETED,
    ]) as CustomerStatusType,
    organizationId: organizations.length ? faker.helpers.arrayElement(organizations).id : null,
  }));
};

async function main() {
  console.log('Cleaning up tables...');
  await prisma.customer.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.organization.deleteMany();

  console.log('Generating data...');
  const organizations = await generateRandomOrganizations(10);
  await prisma.organization.createMany({
    data: organizations.map((org) => ({
      name: org.name!,
      address: org.address!,
      city: org.city!,
      state: org.state!,
      postcode: org.postcode!,
      country: org.country!,
    })),
    skipDuplicates: true,
  });

  const employees = await generateRandomEmployees(65);
  await prisma.employee.createMany({
    data: employees.map((employee: Partial<Employee>) => ({
      firstName: employee.firstName!,
      lastName: employee.lastName!,
      email: employee.email!,
      dob: employee.dob!,
      phone: employee.phone!,
      gender: employee.gender as GenderType,
      rate: employee.rate!,
      status: employee.status!,
      avatarUrl: employee.avatarUrl!,
    })),
    skipDuplicates: true,
  });

  const customers = await generateRandomCustomers(65);
  await prisma.customer.createMany({
    data: customers.map((customer: Partial<Customer>) => ({
      firstName: customer.firstName!,
      lastName: customer.lastName!,
      email: customer.email!,
      phone: customer.phone!,
      gender: customer.gender as GenderType,
      status: customer.status!,
      organizationId: customer.organizationId,
    })),
    skipDuplicates: true,
  });

  console.log('Seeding finished! 🚀');
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
