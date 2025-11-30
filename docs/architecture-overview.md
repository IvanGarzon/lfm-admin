# Quotes Feature Architecture Overview

## High-Level Architecture

The Quotes feature is built using a modern full-stack architecture leveraging Next.js App Router, Server Actions, and Prisma.

### Backend Layer
- **Server Actions**: Located in `src/actions/quotes.ts`. These act as the API layer, handling authentication, validation (using Zod), and delegating business logic to the repository.
- **Repository Pattern**: Implemented in `src/repositories/quote-repository.ts`. This encapsulates all database interactions, ensuring separation of concerns and testability.
- **Database**: PostgreSQL accessed via Prisma ORM.
- **File Storage**: AWS S3 for storing quote attachments and item images.

### Frontend Layer
- **State Management**: 
  - **Server State**: Managed by `@tanstack/react-query` (via custom hooks in `src/features/finances/quotes/hooks`).
  - **Form State**: Managed by `react-hook-form` with `zod` resolvers.
  - **UI State**: Local React state (`useState`, `useReducer`) for dialogs and drawers.
- **Components**:
  - **QuoteDrawer**: The main container for creating/editing quotes.
  - **QuoteForm**: Handles the complex form logic, including dynamic item lists.
  - **QuoteItemDetails**: Displays rich details like images and color palettes for quote items.
  - **QuoteList**: Displays the paginated list of quotes with filtering.

## Key Data Flows

1.  **Fetching Quotes**: `useQuotes` hook -> `getQuotes` action -> `quoteRepo.searchAndPaginate`.
2.  **Creating/Updating**: `useCreateQuote`/`useUpdateQuote` hooks -> `createQuote`/`updateQuote` actions -> `quoteRepo.createQuoteWithItems`/`updateQuoteWithItems`.
3.  **Status Changes**: Dedicated actions (`markAsAccepted`, `markAsSent`, etc.) handle status transitions and history logging transactionally.

## Optimization Opportunities

### Backend
1.  **Parallel Query Execution**: In `QuoteRepository.getStatistics`, several aggregation queries are run sequentially. These can be executed in parallel to reduce latency.
2.  **N+1 Query Prevention**: The current implementation of `findByIdWithDetails` is efficient, using Prisma's `include` to fetch related data in a single query. However, `getStatistics` uses a raw SQL query mixed with Prisma queries, which can be optimized.

### Frontend
1.  **Redundant Data Fetching**: `QuoteItemDetails` component fetches the quote data again using `useQuote(quoteId)`, even though the parent `QuoteForm` already has this data. Passing the data as props will eliminate this redundant fetch/cache hit.
2.  **Render Optimization**: Large components like `QuoteForm` can benefit from memoization of expensive calculations (totals, taxes) and splitting into smaller, memoized sub-components.

## Database Schema Insights
- **Quote**: The central entity.
- **QuoteItem**: Line items associated with a quote.
- **QuoteStatusHistory**: Audit trail for status changes.
- **QuoteAttachment / QuoteItemAttachment**: Files linked to quotes or specific items.
- **Versions**: Implemented as a self-referencing relation on the `Quote` table (`parentQuoteId`), allowing for a chain of quote versions.
