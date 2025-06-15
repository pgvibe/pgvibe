# Table Aliases Support Implementation Plan

## Overview

Implement comprehensive table alias support in ZenQ query builder, enabling `selectFrom("users as u")` syntax with flexible column referencing (`"u.id"` and `"id"`) across all query operations.

---

## 🚨 **EMERGENCY STATE: ALIASES WORK, BASIC QUERIES BROKEN**

### **Current Crisis Summary**

- **✅ ALIASES FULLY WORKING**: All 24 alias tests pass perfectly
- **❌ BASIC QUERIES BROKEN**: `db.selectFrom("users").select(["id", "name"])` fails
- **❌ TYPE SYSTEM COLLAPSED**: 474 type errors, core issue: `ColumnReference<DB, TB, never>` resolves to `never`

### **Root Cause**: Type system regression - when `TAliasContext = never` (non-aliased queries), column references break.

---

## 🎯 **TDD APPROACH: OUR SECRET WEAPON** ✅

### **Why This is CRITICAL**

We have an **excellent TypeScript test infrastructure** in `tests/types/` that gives us:

1. **✅ Immediate Feedback**: `bun run test:types` shows exactly what's broken
2. **✅ Precise Error Messages**: "Type string is not assignable to type never" - pinpoints the issue
3. **✅ Comprehensive Coverage**: 474 test cases across all scenarios
4. **✅ Red-Green-Refactor**: Perfect TDD setup already exists

### **TDD Strategy**

```bash
# 1. SEE THE RED: Current state (474 failures)
bun run test:types  # Shows "Type string is not assignable to type never"

# 2. MAKE IT GREEN: Fix the ColumnReference type
# Target: Fix the one type that makes all 474 tests pass

# 3. REFACTOR: Ensure aliases still work
bun test tests/builders/table-aliases.test.ts  # Should remain 24/24 passing
```

### **TDD Evidence - The Exact Problem**

From type test output:

```
tests/types/advanced/edge-cases.test-d.ts:21:13
✖  21:13  Type string is not assignable to type never.
       .select(["id", "name"])  ← THIS is where it breaks
```

**Translation**: `ColumnReference<DB, TB, never>` → `never` when no aliases used

---

## 🔬 **KYSELY RESEARCH INSIGHTS** ✅ COMPLETE

### Key Findings:

1. **✅ Our approach matches Kysely's proven design**
2. **✅ String parsing with `' as '` separator is correct**
3. **✅ Template literal types for alias extraction are right**
4. **✅ Flexible column referencing (`"u.id"` and `"id"`) is the standard**

### **Validation**: Our alias implementation is architecturally sound and follows industry best practices.

---

## **PHASE 1: EMERGENCY RECOVERY USING TDD** 🚨 (IMMEDIATE)

### **1.1 TDD: Define the Target State**

**Goal**: Make this basic test pass

```typescript
// FROM: tests/types/core/select.test-d.ts
async function testBasicSelectAll() {
  const users = await db.selectFrom("users").select(["id", "name"]).execute();
  expectType<Array<{ id: number; name: string }>>(users);
}
```

**Current**: ❌ "Type string is not assignable to type never"
**Target**: ✅ Test passes

### **1.2 TDD: Find the Broken Type**

**Method**: Use type tests to trace the issue

```bash
# Run specific type tests to isolate the problem
bun run test:types | grep "Type string is not assignable to type never" -A2 -B2
```

**Target**: Identify the exact location where `ColumnReference` resolves to `never`

### **1.3 TDD: Fix & Validate**

**Red → Green Cycle**:

1. **RED**: 474 type test failures
2. **GREEN**: Fix `ColumnReference<DB, TB, never>` case
3. **VALIDATE**: All type tests pass + alias tests still work

**Success Criteria**:

- **Type Tests**: 474 → 0 failures
- **Alias Tests**: 24/24 still passing
- **Runtime Tests**: 487/488 passing

---

## **PHASE 2: TDD VALIDATION & POLISH** ✨ (AFTER RECOVERY)

### **2.1 TDD: Comprehensive Type Coverage**

**Expand type tests for edge cases**:

```typescript
// Ensure we test both scenarios work perfectly
function testAliasAndBasicBothWork() {
  // ✅ Basic queries work
  expectType<Array<{ id: number; name: string }>>(
    db.selectFrom("users").select(["id", "name"])
  );

  // ✅ Alias queries work
  expectType<Array<{ id: number; name: string }>>(
    db.selectFrom("users as u").select(["u.id", "u.name"])
  );
}
```

### **2.2 TDD: Performance & Edge Cases**

**Use type tests to validate**:

- Complex queries with multiple aliases
- Mixed alias/non-alias column references
- Error handling for invalid aliases

---

## **TDD COMMANDS FOR RECOVERY**

```bash
# 🔴 SEE THE CURRENT RED STATE
bun run test:types | head -50  # Shows the 474 type errors

# 🔍 FOCUS ON THE CORE ISSUE
grep -r "ColumnReference" src/core/types/ # Find the type definition

# 🟢 MAKE IT GREEN
# Fix the type definition to handle TAliasContext = never

# ✅ VALIDATE SUCCESS
bun run test:types                        # Should show 0 errors
bun test tests/builders/table-aliases.test.ts  # Should show 24/24 pass
bun test                                  # Should show 488/488 pass
```

---

## **TDD SUCCESS METRICS**

### **Before (Current Red State)**

- **Type Tests**: 474 failures ❌
- **Runtime Tests**: 487/488 pass ✅
- **Alias Tests**: 24/24 pass ✅
- **Status**: Emergency - basic queries broken

### **Target (Green State)**

- **Type Tests**: 0 failures ✅
- **Runtime Tests**: 488/488 pass ✅
- **Alias Tests**: 24/24 pass ✅
- **Status**: Production ready

---

## **KEY PRINCIPLES FOR TDD RECOVERY**

1. **🎯 TDD IS OUR COMPASS**: The 474 type test failures show exactly what to fix
2. **🔬 PRECISION GUIDED**: "Type string is not assignable to type never" pinpoints the issue
3. **🚨 ALIASES WORK - DON'T BREAK THEM**: Use TDD to ensure no regression
4. **⚡ LASER FOCUS**: Fix the one `ColumnReference` type that breaks everything
5. **✅ CONTINUOUS VALIDATION**: Every change validated by comprehensive type tests

---

## **IMPLEMENTATION STATUS**

### ✅ **COMPLETED (DO NOT TOUCH)**

- **Alias Parsing**: ✅ Working perfectly (matches Kysely approach)
- **Runtime Implementation**: ✅ All 24 alias tests pass
- **SQL Generation**: ✅ Correct `AS` syntax in generated SQL
- **Architecture**: ✅ Follows proven Kysely design patterns
- **TDD Infrastructure**: ✅ Comprehensive type test suite ready

### 🚨 **BROKEN (EMERGENCY FIX NEEDED)**

- **Basic Type System**: ❌ `ColumnReference<DB, TB, never>` → `never`
- **Non-Aliased Queries**: ❌ `db.selectFrom("users").select(["id"])` fails
- **Type Tests**: ❌ 474 type errors blocking development

---

## **NEXT IMMEDIATE ACTION - TDD GUIDED**

1. **🔴 RED**: Run `bun run test:types` - see the 474 failures
2. **🔍 TRACE**: Find `ColumnReference` type definition
3. **🔧 FIX**: Handle `TAliasContext = never` case properly
4. **🟢 GREEN**: Run `bun run test:types` - see 0 failures
5. **✅ VALIDATE**: Ensure aliases still work (24/24 tests)

**The TDD approach gives us laser-guided precision to fix this emergency quickly and safely.**
