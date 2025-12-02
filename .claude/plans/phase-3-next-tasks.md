# Phase 3 - Quality & Standards - Next Tasks

## Status: READY TO CONTINUE
**Branch**: `more-updates`
**Date**: 2025-12-02

---

## ✅ Completed So Far

### Task 1: Apply Error Handler (Partially Complete)
- ✅ **Invoice Actions**: 100% complete (8/8 functions)
- 🔄 **Quote Actions**: 16% complete (4/25 functions)
- **Decision**: Paused to move to other tasks
- **Remaining**: 21 quote action functions (can be completed later)

---

## 🎯 Remaining Phase 3 Tasks

### Task 2: Optimize Statistics Queries ⭐ RECOMMENDED NEXT
**Priority**: HIGH | **Impact**: Performance | **Complexity**: Medium

**Current Issue**: Quote statistics runs 6 separate database queries
**Goal**: Reduce to 2 queries using Prisma's `groupBy` with counts AND sums

**Files to modify**:
- `src/repositories/quote-repository.ts` (lines 334-385)

**Current Implementation**:
```typescript
// 6 separate queries - SLOW
const totalQuotes = await this.count({ where });
const draftQuotes = await this.count({ where: { ...where, status: 'DRAFT' } });
const sentQuotes = await this.count({ where: { ...where, status: 'SENT' } });
// ... 3 more queries
```

**Optimized Implementation**:
```typescript
// 2 queries - FAST
const statusGroups = await this.groupBy({
  by: ['status'],
  where,
  _count: { _all: true },
  _sum: { amount: true }
});
```

**Expected Impact**:
- 🚀 3x faster query execution
- 📉 Reduced database load
- ✅ Same functionality

---

### Task 3: Add Comprehensive JSDoc
**Priority**: MEDIUM | **Impact**: Developer Experience | **Complexity**: Low

**Goal**: Document all exported functions with JSDoc comments

**Files to update**:
- `src/lib/error-handler.ts` ✅ (Already has JSDoc)
- `src/hooks/use-unsaved-changes.ts` ✅ (Already has JSDoc)
- `src/repositories/invoice-repository.ts` (Add JSDoc to all methods)
- `src/repositories/quote-repository.ts` (Add JSDoc to all methods)
- `src/actions/invoices.ts` ✅ (Already has JSDoc)
- `src/actions/quotes.ts` ✅ (Already has JSDoc)

**Template**:
```typescript
/**
 * Brief description of what the function does
 * 
 * @param paramName - Description of parameter
 * @param anotherParam - Description of another parameter
 * @returns Description of return value
 * @throws Description of errors that might be thrown
 * 
 * @example
 * ```typescript
 * const result = await functionName(param1, param2);
 * ```
 */
```

---

### Task 4: Remove `any` Types
**Priority**: MEDIUM | **Impact**: Type Safety | **Complexity**: Medium

**Goal**: Replace all `any` types with proper TypeScript types

**Search for**:
```bash
grep -rn "any" src/ --include="*.ts" --include="*.tsx" | grep -v "node_modules"
```

**Common patterns to fix**:
- `data: any` → `data: unknown` or proper type
- `error: any` → `error: unknown`
- `params: any` → `params: Record<string, unknown>` or proper type

---

### Task 5: Standardize Validation Messages
**Priority**: LOW | **Impact**: Consistency | **Complexity**: Low

**Goal**: Use `message:` instead of `error:` in all Zod schemas

**Current (inconsistent)**:
```typescript
z.string({ error: "Name is required" })  // ❌ Non-standard
z.string({ message: "Name is required" }) // ✅ Zod convention
```

**Files to check**:
- `src/schemas/invoices.ts`
- `src/schemas/quotes.ts`
- Any other schema files

---

### Task 6: Remove Commented Code
**Priority**: LOW | **Impact**: Code Cleanliness | **Complexity**: Simple

**Files with commented code**:
- `src/repositories/invoice-repository.ts` (lines 49-67)
- `prisma/schema.prisma` (line 4: `// engineType = "binary"`)

**Action**: Remove or implement the commented code

---

## 📋 Recommended Implementation Order

### Option A: Performance First (Recommended)
1. **Optimize Statistics Queries** (30 min) ⭐
2. **Remove `any` Types** (45 min)
3. **Add JSDoc to Repositories** (30 min)
4. **Standardize Validation Messages** (15 min)
5. **Remove Commented Code** (5 min)
6. **Complete Quote Error Handlers** (30 min)

**Total Time**: ~2.5 hours

### Option B: Quick Wins First
1. **Remove Commented Code** (5 min)
2. **Standardize Validation Messages** (15 min)
3. **Add JSDoc to Repositories** (30 min)
4. **Optimize Statistics Queries** (30 min)
5. **Remove `any` Types** (45 min)
6. **Complete Quote Error Handlers** (30 min)

**Total Time**: ~2.5 hours

### Option C: Complete Error Handler First
1. **Complete Quote Error Handlers** (30 min)
2. **Optimize Statistics Queries** (30 min)
3. **Remove `any` Types** (45 min)
4. **Add JSDoc to Repositories** (30 min)
5. **Standardize Validation Messages** (15 min)
6. **Remove Commented Code** (5 min)

**Total Time**: ~2.5 hours

---

## 🎯 Success Metrics

After completing Phase 3:

**Code Quality**:
- ✅ Zero production console.logs (Phase 1)
- ✅ Standardized error handling (Phase 2)
- ✅ Form data loss prevention (Phase 2)
- ⏳ Optimized database queries
- ⏳ Zero `any` types
- ⏳ Comprehensive JSDoc
- ⏳ Clean codebase (no commented code)

**Performance**:
- ⏳ Statistics queries < 100ms (currently ~300ms)
- ✅ PDF generation < 2s

**Developer Experience**:
- ✅ Reusable utilities
- ✅ Well-documented code
- ⏳ Type-safe implementations
- ⏳ Consistent patterns

---

## 📝 Next Steps

**Immediate**: Choose which task to tackle next
**Recommended**: Start with **Task 2: Optimize Statistics Queries** for immediate performance improvement

Would you like to:
1. **Optimize statistics queries** (biggest performance impact)
2. **Remove `any` types** (improve type safety)
3. **Add JSDoc to repositories** (improve documentation)
4. **Something else**?

---

**Current Branch**: `more-updates`
**Ready to implement**: Yes ✅
