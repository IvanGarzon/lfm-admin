import { Prisma, PrismaPromise } from '@/prisma/client';
const MAX_RECORDS_LIMIT = 20;

interface IRepositoryWriter<TModel> {
  create(data: Prisma.Args<TModel, 'create'>['data']): PrismaPromise<TModel>;
  createMany(
    data: Prisma.Args<TModel, 'createMany'>['data'],
    skipDuplicates?: boolean,
  ): PrismaPromise<Prisma.BatchPayload>;
  update(
    id: string | number,
    data: Prisma.Args<TModel, 'update'>['data'],
  ): PrismaPromise<TModel | null>;
  update(
    id: string | number,
    data: Prisma.Args<TModel, 'update'>['data'],
  ): PrismaPromise<TModel | null>;
  updateMany(args: Prisma.Args<TModel, 'updateMany'>): PrismaPromise<Prisma.BatchPayload>;
  delete(id: string | number): PrismaPromise<TModel | null>;
  deleteMany(where: Prisma.Args<TModel, 'deleteMany'>['where']): PrismaPromise<Prisma.BatchPayload>;
  upsert(args: Prisma.Args<TModel, 'upsert'>): PrismaPromise<TModel>;
}

interface IRepositoryReader<TModel> {
  findMany(args?: Prisma.Args<TModel, 'findMany'>): PrismaPromise<TModel[]>;
  findById(id: string | number): PrismaPromise<TModel | null>;
  count(args?: Prisma.Args<TModel, 'count'>): PrismaPromise<number>;
  findBy<K extends keyof TModel>(
    field: K,
    value: TModel[K],
    options?: {
      orderBy?: Prisma.Args<TModel, 'findMany'>['orderBy'];
      skip?: number;
      take?: number;
    },
  ): PrismaPromise<TModel[]>;
  exists(where: Prisma.Args<TModel, 'findFirst'>['where']): PrismaPromise<boolean>;
}

interface IBaseRepository<T> extends IRepositoryWriter<T>, IRepositoryReader<T> {}

export type ModelDelegateOperations<TModel> = {
  findMany: (args?: Prisma.Args<TModel, 'findMany'>) => Prisma.PrismaPromise<TModel[]>;
  findUnique: (args: Prisma.Args<TModel, 'findUnique'>) => Prisma.PrismaPromise<TModel | null>;
  findFirst: (args?: Prisma.Args<TModel, 'findFirst'>) => Prisma.PrismaPromise<TModel | null>;
  count: (args?: Prisma.Args<TModel, 'count'>) => Prisma.PrismaPromise<number>;
  create: (args: Prisma.Args<TModel, 'create'>) => Prisma.PrismaPromise<TModel>;
  createMany: (
    args: Prisma.Args<TModel, 'createMany'>,
  ) => Prisma.PrismaPromise<Prisma.BatchPayload>;
  update: (args: Prisma.Args<TModel, 'update'>) => Prisma.PrismaPromise<TModel>;
  updateMany: (
    args: Prisma.Args<TModel, 'updateMany'>,
  ) => Prisma.PrismaPromise<Prisma.BatchPayload>;
  delete: (args: Prisma.Args<TModel, 'delete'>) => Prisma.PrismaPromise<TModel>;
  deleteMany: (
    args: Prisma.Args<TModel, 'deleteMany'>,
  ) => Prisma.PrismaPromise<Prisma.BatchPayload>;
  upsert: (args: Prisma.Args<TModel, 'upsert'>) => Prisma.PrismaPromise<TModel>;
};

export abstract class BaseRepository<TModel> implements IBaseRepository<TModel> {
  protected abstract get model(): ModelDelegateOperations<TModel>;

  constructor() {
    if (this.constructor === BaseRepository) {
      throw new TypeError('BaseRepository cannot be instantiated directly');
    }
  }

  /*
  ---

  ## Reader Operations

  ---
  */

  /**
   * Finds multiple records based on a comprehensive set of Prisma arguments.
   * Applies `MAX_RECORDS_LIMIT` if `args.take` is not specified or exceeds the limit.
   *
   * @template TModel The type of the entity.
   * @param {Prisma.Args<TModel, 'findMany'>} [args] Optional Prisma arguments object for filtering,
   * ordering, pagination, field selection (`select`), and including relations (`include`).
   * @returns {PrismaPromise<TModel[]>} A PrismaPromise that resolves to an array of found records.
   * The shape of records can be altered if `args.select` or `args.include` is used.
   *
   * @example
   * 1. Find all records of the entity:
   * const allItems = await repository.findMany();
   *
   * 2. Find all active records:
   * const activeItems = await repository.findMany({ where: { status: 'ACTIVE' } });
   *
   * 3. Find the first 10 records, ordered by creation date:
   * const recentItems = await repository.findMany({ take: 10, orderBy: { createdAt: 'desc' } });
   */
  findMany(args?: Prisma.Args<TModel, 'findMany'>): PrismaPromise<TModel[]> {
    if (!this.model.findMany) {
      throw new Error(`The 'findMany' operation is not available on this model delegate.`);
    }

    const processedArgs: Prisma.Args<TModel, 'findMany'> = args
      ? { ...args }
      : ({} as Prisma.Args<TModel, 'findMany'>);

    if (typeof processedArgs.take === 'number') {
      if (processedArgs.take > 0) {
        processedArgs.take = Math.min(processedArgs.take, MAX_RECORDS_LIMIT);
      } else if (processedArgs.take < 0) {
        processedArgs.take = Math.max(processedArgs.take, -MAX_RECORDS_LIMIT);
      } else {
        delete processedArgs.take;
      }
    }

    return this.model.findMany(processedArgs);
  }

  /**
   * Finds a single record by its primary ID.
   * This implementation assumes the unique identifier field in the model is named 'id'.
   *
   * @template TModel The type of the entity.
   * @param {string | number} id The unique ID (string or number) of the record to find.
   * @returns {PrismaPromise<TModel | null>} A PrismaPromise that resolves to the found record of type `TModel`,
   * or null if no record is found with the given ID.
   *
   * @example
   * const item = await repository.findById(123);
   * if (item) {
   * console.log('Item found:', item);
   * } else {
   * console.log('Item not found');
   * }
   */
  findById(id: string | number): PrismaPromise<TModel | null> {
    if (!this.model.findUnique) {
      throw new Error(`The 'findById' operation is not available on this model delegate.`);
    }

    const findArgs = {
      where: { id },
    } as Prisma.Args<TModel, 'findUnique'>;

    return this.model.findUnique(findArgs);
  }

  /**
   * Finds the first record matching a specific field and value.
   *
   * @template TModel The type of the entity.
   * @template K A key (field name) of the entity type TModel.
   * @param {K} field The field (key) of the model TModel to search by.
   * @param {TModel[K]} value The value of the field TModel[K] to match.
   * @returns {PrismaPromise<TModel | null>} A PrismaPromise that resolves to the first matching record of type `TModel`,
   * or null if not found.
   *
   * @example
   * const itemByName = await repository.findOneBy('name', 'Product A');
   * if (itemByName) {
   * console.log('Found item:', itemByName);
   * } else {
   * console.log('Item not found by name');
   * }
   */
  findOneBy<K extends keyof TModel>(field: K, value: TModel[K]): PrismaPromise<TModel | null> {
    if (!this.model.findFirst) {
      throw new Error(`The 'findFirst' operation is not available on this model delegate.`);
    }

    // Construct the 'where' part of the arguments for findFirst.
    // { [field]: value } creates an object like { email: 'user@example.com' }.
    // We use a type assertion because TypeScript cannot statically guarantee that this
    // dynamic structure is a valid Prisma.WhereInput for all generic K and T combinations,
    // even though it's a common and valid pattern for simple equality checks.

    const findArgs = {
      where: {
        [field]: value,
      } as Prisma.Args<TModel, 'findFirst'>['where'],
    } as Prisma.Args<TModel, 'findFirst'>;

    return this.model.findFirst(findArgs);
  }

  /**
   * Finds all records where a specific field matches a given value.
   * This method directly uses the Prisma client's `findMany` without the `BaseRepository`'s
   * default `MAX_RECORDS_LIMIT` unless `take` is provided in the options.
   *
   * @template TModel The type of the entity managed by the repository.
   * @template K A key (field name) of the entity type TModel.
   * @param {K} field The specific field of the model TModel to filter by.
   * @param {TModel[K]} value The value that the specified `field` should match.
   * @param {object} [options] Optional parameters to control ordering and pagination.
   * @param {Prisma.Args<TModel, 'findMany'>['orderBy']} [options.orderBy] Optional Prisma `orderBy` input object (or array of objects) to sort the results.
   * @param {number} [options.skip] Optional number of records to skip from the beginning of the result set (for pagination).
   * @param {number} [options.take] Optional number of records to retrieve. If provided, it's capped by `MAX_RECORDS_LIMIT`.
   *
   * @returns {PrismaPromise<TModel[]>} A PrismaPromise that resolves to an array of matching records.
   *
   * @example
   * 1. Find all items with a specific status:
   * const activeItems = await this.findBy('status', 'ACTIVE');
   *
   * 2. Find all items by category, ordered by price:
   * const electronics = await this.findBy('category', 'Electronics', { orderBy: { price: 'asc' } });
   *
   * 3. Find items by ID range, skipping the first 5 and taking the next 10:
   * const paginatedItems = await this.findBy('id', { gt: 100 }, { skip: 5, take: 10 });
   */
  findBy<K extends keyof TModel>(
    field: K,
    value: TModel[K],
    options?: {
      orderBy?: Prisma.Args<TModel, 'findMany'>['orderBy'];
      skip?: number;
      take?: number;
    },
  ): PrismaPromise<TModel[]> {
    if (!this.model.findMany) {
      throw new Error(`The 'findMany' operation is not available on this model delegate.`);
    }

    const whereCondition = { [field]: value } as Prisma.Args<TModel, 'findMany'>['where'];
    const findManyArgs = { where: whereCondition } as Prisma.Args<TModel, 'findMany'>;

    if (options?.orderBy) {
      findManyArgs.orderBy = options.orderBy;
    }

    if (typeof options?.skip === 'number' && options.skip >= 0) {
      findManyArgs.skip = options.skip;
    }

    if (typeof options?.take === 'number') {
      if (options.take > 0) {
        findManyArgs.take = Math.min(options.take, MAX_RECORDS_LIMIT);
      } else if (options.take <= 0) {
        // Prisma's `take` cannot be <= 0.
        // You could choose to throw an error, or fetch 0 records, or ignore `take`.
        // Fetching 0 records:
        return Promise.resolve([]) as PrismaPromise<TModel[]>; // Or throw new Error("options.take must be a positive number");
      }
    }

    return this.model.findMany(findManyArgs);
  }

  /**
   * Checks if at least one record exists that matches the given 'where' clause.
   * This method is efficient as it typically only needs to find the first matching record.
   *
   * @template TModel The type of the entity managed by the repository.
   * @param {Prisma.Args<TModel, 'findFirst'>['where']} where The Prisma 'where' input object to specify
   * the conditions for checking existence. This is equivalent to `Prisma.YourModelWhereInput`.
   *
   * @returns {PrismaPromise<boolean>} A PrismaPromise that resolves to `true` if at least one matching record exists,
   * `false` otherwise.
   *
   * @example
   * 1. Check if an item with a specific unique identifier exists:
   * const itemExists = await this.exists({ id: 456 });
   * if (itemExists) {
   *  console.log('An item with this ID already exists.');
   * }
   *
   * 2. Check if there are any pending orders from a specific customer:
   * const pendingOrderExists = await this.exists({
   *  AND: [
   *    { customerId: 'cust_abc' },
   *    { status: 'PENDING' }
   *  ]
   * });
   * if (pendingOrderExists) {
   *  console.log('There are pending orders for this customer.');
   * }
   */
  exists(where: Prisma.Args<TModel, 'findFirst'>['where']): PrismaPromise<boolean> {
    if (!this.model.findFirst) {
      throw new Error(`The 'findFirst' operation is not available on this model delegate.`);
    }

    // Prepare arguments for findFirst. We don't need to select any specific fields,
    // as Prisma's findFirst is optimized for existence checks.
    const findFirstArgs = {
      where,
    } as Prisma.Args<TModel, 'findFirst'>;

    const item = this.model.findFirst(findFirstArgs);
    return Promise.resolve(item !== null) as PrismaPromise<boolean>;
  }

  /**
   * Counts the number of records that match the given Prisma 'count' arguments.
   *
   * @template TModel The type of the entity managed by the repository.
   * @param {Prisma.Args<TModel, 'count'>} [args] Optional Prisma 'count' arguments object.
   * @returns {Promise<number>} A Promise that resolves to the count of matching records.
   *
   * @example
   * 1. Count all items:
   * const totalItems = await repository.count();
   * console.log(`Total items: ${totalItems}`);
   *
   * 2. Count all items with a specific status:
   * const activeItemsCount = await repository.count({
   *  where: { status: 'ACTIVE' }
   * });
   * console.log(`Active items: ${activeItemsCount}`);
   *
   * 3. Count items created within a date range:
   * const recentItemsCount = await repository.count({
   *  where: { createdAt: { gte: new Date('2024-01-01') } }
   * });
   * console.log(`Recent items: ${recentItemsCount}`);
   */
  count(args?: Prisma.Args<TModel, 'count'>): PrismaPromise<number> {
    if (!this.model.count) {
      throw new Error('count not implemented on model type');
    }

    return this.model.count(args);
  }

  /*
  ---

  ## Writer Operations

  ---
  */

  /**
   * Creates a new record of type `TModel`.
   *
   * @template TModel The type of the entity.
   * @param {Prisma.Args<TModel, 'create'>['data']} data The data to create the new record with.
   * @returns {PrismaPromise<TModel>} A PrismaPromise that resolves to the newly created record.
   *
   * @example
   * const newItem = await repository.create({ name: 'New Gadget', price: 99.99 });
   * console.log('Created item:', newItem);
   */
  create(dataInput: Prisma.Args<TModel, 'create'>['data']): PrismaPromise<TModel> {
    if (!this.model.create) {
      throw new Error('create not on model');
    }

    // Construct the arguments object for Prisma's create method.
    // Use a type assertion 'as Prisma.Args<T, 'create'>' on the object literal.
    // This tells TypeScript to trust that this object, containing only 'data',
    // is compatible with the full Prisma.Args<T, 'create'> type,
    // given that other properties like 'select' and 'include' are optional.
    const createArgs = {
      data: dataInput,
    } as Prisma.Args<TModel, 'create'>;

    return this.model.create(createArgs);
  }

  /**
   * Creates multiple records of type `TModel` in a single operation.
   *
   * @template TModel The type of the entity.
   * @param {Prisma.Args<TModel, 'createMany'>['data']} data An array of data objects to create multiple records.
   * @param {boolean} [skipDuplicates] Optional. Set to `true` to ignore unique constraint violations.
   * @returns {PrismaPromise<Prisma.BatchPayload>} A PrismaPromise that resolves to an object
   * containing the `count` of records created.
   *
   * @example
   * 1. Create multiple items:
   * const newItemsData = [
   *  { name: 'Item A', value: 10 },
   *  { name: 'Item B', value: 20 },
   * ];
   * const result = await repository.createMany(newItemsData);
   * console.log(`Created ${result.count} items.`);
   *
   * 2. Create multiple items, skipping duplicates:
   * const moreItemsData = [
   *  { name: 'Item C', value: 30 },
   *  { name: 'Item A', value: 100 }, // This might be skipped if 'name' is unique
   * ];
   * const resultWithSkip = await repository.createMany(moreItemsData, true);
   * console.log(`Created ${resultWithSkip.count} items, skipping duplicates.`);
   */
  createMany(
    data: Prisma.Args<TModel, 'createMany'>['data'],
    skipDuplicates?: boolean,
  ): PrismaPromise<Prisma.BatchPayload> {
    if (!this.model.createMany) {
      throw new Error('createMany operation is not available on this model delegate.');
    }

    const createManyArgs = {
      data,
      skipDuplicates,
    } as Prisma.Args<TModel, 'createMany'>;

    return this.model.createMany(createManyArgs);
  }

  /**
   * Updates an existing record of type `TModel` identified by its ID.
   * This implementation assumes the unique identifier field in the model is named 'id'.
   *
   * @template TModel The type of the entity.
   * @param {string | number} id The ID (string or number) of the record to update.
   * @param {Prisma.Args<TModel, 'update'>['data']} data The data to update the record with.
   * @returns {PrismaPromise<TModel | null>} A PrismaPromise that resolves to the updated record,
   * or null if the record was not found.
   *
   * @example
   * const updatedItem = await repository.update(1, { name: 'Updated Gadget', price: 89.99 });
   * if (updatedItem) {
   *  console.log('Updated item:', updatedItem);
   * } else {
   *  console.log('Item not found for update.');
   * }
   */
  update(
    id: string | number,
    data: Prisma.Args<TModel, 'update'>['data'],
  ): PrismaPromise<TModel | null> {
    if (!this.model.update) {
      throw new Error(`The 'update' operation is not available on this model delegate.`);
    }

    try {
      const updateArgs = {
        where: { id } as Prisma.Args<TModel, 'update'>['where'], // Assumes 'id' is the unique field
        data,
      } as Prisma.Args<TModel, 'update'>;

      return this.model.update(updateArgs);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return Promise.resolve(null) as PrismaPromise<TModel | null>;
      }

      throw error;
    }
  }

  /**
   * Updates multiple records of type `TModel` based on `where` and `data` clauses.
   *
   * @template TModel The type of the entity.
   * @param {Prisma.Args<TModel, 'updateMany'>} args An object containing `where` to filter records
   * and `data` to specify the updates.
   * @returns {PrismaPromise<Prisma.BatchPayload>} A PrismaPromise that resolves to an object
   * containing the `count` of records updated.
   *
   * @example
   * 1. Set the status of all inactive items to 'ARCHIVED':
   * const result = await repository.updateMany({
   *  where: { status: 'INACTIVE' },
   *  data: { status: 'ARCHIVED' }
   * });
   * console.log(`Updated ${result.count} items.`);
   *
   * // 2. Increase the price of all items in a specific category:
   * const priceUpdateResult = await repository.updateMany({
   *  where: { category: 'Books' },
   *  data: { price: { increment: 5.00 } }
   * });
   * console.log(`Updated prices for ${priceUpdateResult.count} books.`);
   */
  updateMany(args: Prisma.Args<TModel, 'updateMany'>): PrismaPromise<Prisma.BatchPayload> {
    if (!this.model.updateMany) {
      throw new Error(`updateMany operation is not available on this model delegate.`);
    }

    const updateManyArgs: Prisma.Args<TModel, 'updateMany'> = args;

    return this.model.updateMany(updateManyArgs);
  }

  /**
   * Deletes an existing record of type `TModel` identified by its ID.
   * This implementation assumes the unique identifier field in the model is named 'id'.
   *
   * @template TModel The type of the entity.
   * @param {string | number} id The unique ID (string or number) of the record to delete.
   * @returns {PrismaPromise<TModel | null>} A PrismaPromise that resolves to the deleted record,
   * or null if the record was not found.
   *
   * @example
   * const deletedItem = await repository.delete(123);
   * if (deletedItem) {
   *  console.log('Deleted item:', deletedItem);
   * } else {
   *  console.log('Item not found for deletion.');
   * }
   */
  delete(id: string | number): PrismaPromise<TModel | null> {
    if (!this.model.delete) {
      throw new Error(`The 'delete' operation is not available on this model delegate.`);
    }

    try {
      const deleteArgs = {
        where: { id } as Prisma.Args<TModel, 'delete'>['where'],
      } as Prisma.Args<TModel, 'delete'>;

      return this.model.delete(deleteArgs);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return Promise.resolve(null) as PrismaPromise<TModel | null>;
      }

      throw error;
    }
  }

  /**
   * Deletes multiple records of type `TModel` based on a `where` clause.
   *
   * @template TModel The type of the entity.
   * @param {Prisma.Args<TModel, 'deleteMany'>['where']} where A Prisma `where` input object
   * to specify the conditions for deleting multiple records.
   * @returns {PrismaPromise<Prisma.BatchPayload>} A PrismaPromise that resolves to an object
   * containing the `count` of records deleted.
   *
   * @example
   * // 1. Delete all inactive items:
   * const result = await repository.deleteMany({ status: 'INACTIVE' });
   * console.log(`Deleted ${result.count} inactive items.`);
   *
   * // 2. Delete all items older than a specific date:
   * const oldItemsResult = await repository.deleteMany({
   * createdAt: { lt: new Date('2023-01-01') }
   * });
   * console.log(`Deleted ${oldItemsResult.count} old items.`);
   */
  deleteMany(
    where: Prisma.Args<TModel, 'deleteMany'>['where'],
  ): PrismaPromise<Prisma.BatchPayload> {
    if (!this.model.deleteMany) {
      throw new Error(`The 'deleteMany' operation is not available on this model delegate.`);
    }

    const deleteManyArgs = {
      where,
    } as Prisma.Args<TModel, 'deleteMany'>;

    return this.model.deleteMany(deleteManyArgs);
  }

  /**
   * Creates a record if it does not exist, or updates it if it does.
   *
   * @template TModel The type of the entity.
   * @param {Prisma.Args<TModel, 'upsert'>} args An object containing `where` to find the record,
   * `create` data for creation, and `update` data for updating.
   * @returns {PrismaPromise<TModel>} A PrismaPromise that resolves to the created or updated record.
   *
   * @example
   * 1. Upsert an item by unique identifier (e.g., 'sku'):
   * const upsertItem = await repository.upsert({
   *  where: { sku: 'SKU001' },
   *  create: { sku: 'SKU001', name: 'New Item', quantity: 1 },
   *  update: { quantity: { increment: 1 } },
   * });
   * console.log('Upserted item:', upsertItem);
   *
   * 2. Upsert a user based on email, creating if new, updating lastLogin otherwise:
   * const upsertUser = await repository.upsert({
   *  where: { email: 'test@example.com' },
   *  create: { email: 'test@example.com', username: 'testuser' },
   *  update: { lastLogin: new Date() },
   * });
   * console.log('Upserted user:', upsertUser);
   */
  upsert(args: Prisma.Args<TModel, 'upsert'>): PrismaPromise<TModel> {
    if (!this.model.upsert) {
      throw new Error(`The 'upsert' operation is not available on this model delegate.`);
    }

    const upsertArgs: Prisma.Args<TModel, 'upsert'> = args;

    return this.model.upsert(upsertArgs);
  }
}
