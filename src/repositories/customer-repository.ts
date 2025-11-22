// import { Prisma, PrismaClient } from '@/prisma/client';
// import { BaseRepository, type ModelDelegateOperations } from '@/lib/baseRepository';
// import { getPaginationMetadata } from '@/lib/utils';

// import type { CustomerPagination, CustomerFilters } from '@/features/finances/customers/types';

// /**
//  * Invoice Repository
//  * Handles all database operations for invoices
//  * Extends BaseRepository for common CRUD operations
//  */
// export class CustomerRepository extends BaseRepository<Prisma.CustomerGetPayload<object>> {
//   constructor(private prisma: PrismaClient) {
//     super();
//   }

//   protected get model(): ModelDelegateOperations<Prisma.CustomerGetPayload<object>> {
//     return this.prisma.invoice as unknown as ModelDelegateOperations<
//       Prisma.CustomerGetPayload<object>
//     >;
//   }

//   /**
//    * Search and paginate invoices with filters
//    * Follows the same pattern as employeeRepository.searchAndPaginate
//    */
//   async searchAndPaginate(params: CustomerFilters): Promise<CustomerPagination> {
//     const { search, status, page, perPage, sort } = params;

//     const whereClause: Prisma.CustomerWhereInput = {
//       deletedAt: null,
//     };

//     if (status && status.length > 0) {
//       whereClause.status = {
//         in: status,
//       };
//     }

//     // if (search) {
//     // const searchFilter: Prisma.StringFilter = {
//     //   contains: search,
//     //   mode: Prisma.QueryMode.insensitive,
//     // };

//     // whereClause.OR = [
//     //   { invoiceNumber: searchFilter },
//     //   {
//     //     customer: {
//     //       OR: [{ firstName: searchFilter }, { lastName: searchFilter }, { email: searchFilter }],
//     //     },
//     //   },
//     // ];
//     // }

//     const skip = page > 0 ? perPage * (page - 1) : 0;

//     const orderBy: Prisma.CustomerOrderByWithRelationInput[] =
//       sort && sort.length > 0
//         ? sort.map((sortItem) => {
//             const order: Prisma.SortOrder = sortItem.desc ? 'desc' : 'asc';
//             if (sortItem.id === 'customer') {
//               return { customer: { firstName: order } };
//             }

//             if (sortItem.id === 'search') {
//               return { invoiceNumber: order };
//             }

//             return { [sortItem.id]: order };
//           })
//         : [{ invoiceNumber: 'desc' }];

//     const countOperation = this.model.count({ where: whereClause });
//     const findManyOperation = this.model.findMany({
//       where: whereClause,
//       include: {
//         organization: {
//           select: {
//             id: true,
//             name: true,
//           },
//         },
//       },
//       orderBy,
//       skip,
//       take: perPage,
//     });

//     const [totalItems, customers] = await this.prisma.$transaction([
//       countOperation,
//       findManyOperation,
//     ]);

//     return {
//       customers,
//       pagination: getPaginationMetadata(totalItems, perPage, page),
//     };

//     // const items: InvoiceListItem[] = invoices.map((invoice) => ({
//     //   id: invoice.id,
//     //   invoiceNumber: invoice.invoiceNumber,
//     //   customerId: invoice.customerId,
//     //   customerName: `${invoice.customer.firstName} ${invoice.customer.lastName}`,
//     //   customerEmail: invoice.customer.email,
//     //   status: invoice.status,
//     //   amount: Number(invoice.amount),
//     //   currency: invoice.currency,
//     //   issuedDate: invoice.issuedDate,
//     //   dueDate: invoice.dueDate,
//     //   itemCount: invoice._count.items,
//     // }));

//     // return {
//     //   items,
//     //   pagination: getPaginationMetadata(totalItems, perPage, page),
//     // };
//   }

//   async findByEmail(email: string): Promise<Customer | null> {
//     return this.model.findUnique({ where: { email } });
//   }

//   /*
//    * Find an invoice by its ID with details.
//    */
//   // async findByIdWithDetails(id: string): Promise<InvoiceWithDetails | null> {
//   //   const invoice = await this.prisma.invoice.findUnique({
//   //     where: { id, deletedAt: null },
//   //     select: {
//   //       id: true,
//   //       invoiceNumber: true,
//   //       status: true,
//   //       amount: true,
//   //       gst: true,
//   //       discount: true,
//   //       currency: true,
//   //       issuedDate: true,
//   //       dueDate: true,
//   //       remindersSent: true,
//   //       paidDate: true,
//   //       paymentMethod: true,
//   //       cancelledDate: true,
//   //       cancelReason: true,
//   //       notes: true,
//   //       customer: {
//   //         select: {
//   //           id: true,
//   //           firstName: true,
//   //           lastName: true,
//   //           email: true,
//   //           phone: true,
//   //           organization: {
//   //             select: {
//   //               id: true,
//   //               name: true,
//   //             },
//   //           },
//   //         },
//   //       },
//   //       items: {
//   //         select: {
//   //           id: true,
//   //           invoiceId: true,
//   //           description: true,
//   //           quantity: true,
//   //           unitPrice: true,
//   //           total: true,
//   //           productId: true,
//   //         },
//   //         orderBy: { createdAt: 'asc' },
//   //       },
//   //     },
//   //   });

//   //   if (!invoice) {
//   //     return null;
//   //   }

//   //   return {
//   //     ...invoice,
//   //     amount: Number(invoice.amount),
//   //     gst: Number(invoice.gst),
//   //     discount: Number(invoice.discount),
//   //     notes: invoice.notes ?? undefined,
//   //     items: invoice.items.map((item) => ({
//   //       ...item,
//   //       unitPrice: Number(item.unitPrice),
//   //       total: Number(item.total),
//   //     })),
//   //   };
//   // }

//   /**
//    * Soft delete invoice
//    */
//   async softDelete(id: string): Promise<boolean> {
//     const result = await this.prisma.customer.update({
//       where: { id, deletedAt: null },
//       data: {
//         deletedAt: new Date(),
//         updatedAt: new Date(),
//       },
//     });

//     return result !== null;
//   }
// }
