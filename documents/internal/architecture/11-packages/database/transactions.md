# Transaction patterns

When to use a transaction, isolation levels, savepoints, and the serialization-failure retry helper. Most operations are single-statement and **do not** need a transaction.

> **Version note.** Built on `drizzle-orm@1.0.0-rc.3`. The transaction API is unchanged from 0.x. Prepared statements (`.prepare()`) are **session-scoped** in Postgres and **transaction-scoped** in Drizzle v1 — see the note at the end of this file. See [`decisions/0002-drizzle-v1-rc.md`](./decisions/0002-drizzle-v1-rc.md) for the version choice.

## When to use a transaction

Use a transaction when **multiple statements must succeed or fail as a unit**. The classic case: a logical operation that spans multiple tables.

```ts
// Multi-step: invite user, create membership, queue welcome email
await db.transaction(async (tx) => {
  const user = await tx.insert(users).values({ email, name }).returning()
  await tx.insert(memberships).values({ userId: user.id, orgId, role: 'member' })
  await tx.insert(emailJobs).values({ userId: user.id, template: 'welcome' })
})
```

**Do not** use a transaction for:
- A single `select` / `insert` / `update` / `delete` (overhead, no benefit)
- Calls to external services (Stripe, Resend) — those go through jobs, not transactions
- Read-heavy list queries

**Do** use a transaction for:
- Multi-table writes that must be atomic
- Read-modify-write sequences (read balance, check, write — must be serialized)
- Any time the partial-failure case is worse than a rollback

## The `db.transaction` pattern

```ts
const result = await db.transaction(async (tx) => {
  const [account] = await tx
    .select({ balance: accounts.balance })
    .from(accounts)
    .where(eq(accounts.userId, userId))

  if (account.balance < amount) {
    tx.rollback()  // throws, rolls back, propagates out
  }

  await tx
    .update(accounts)
    .set({ balance: sql`${accounts.balance} - ${amount}` })
    .where(eq(accounts.userId, userId))

  return { newBalance: account.balance - amount }
})
```

**Rules:**
- The callback can return a value. The return type is the transaction's return type.
- `tx.rollback()` throws and aborts. The error propagates out of the transaction.
- Throwing inside the callback also rolls back. The error is re-thrown.
- The `tx` object is typed. Use it instead of `db` inside the transaction.

## Savepoints (nested transactions)

For partial rollback within a larger transaction:

```ts
await db.transaction(async (tx) => {
  await tx.update(accounts).set({ balance: sql`${accounts.balance} - 100` }).where(eq(users.name, 'Dan'))

  try {
    await tx.transaction(async (tx2) => {
      // If this fails, the outer transaction continues — only tx2 rolls back
      await tx2.update(inventory).set({ stock: sql`${inventory.stock} - 1` }).where(...)
    })
  } catch (e) {
    // Inventory check failed; the account is still debited. Decide if that's OK.
  }

  await tx.update(accounts).set({ balance: sql`${accounts.balance} + 100` }).where(eq(users.name, 'Andrew'))
})
```

Use sparingly. Savepoints add complexity; usually a flatter transaction is clearer.

## Isolation levels

Default is the Postgres default (`read committed`). Override only when you have a specific reason.

```ts
await db.transaction(
  async (tx) => { /* ... */ },
  {
    isolationLevel: 'serializable',
    accessMode: 'read write',
  },
)
```

| Level | When to use |
|---|---|
| `read committed` (default) | Most cases. Statements see data committed before they started. |
| `repeatable read` | Snapshot isolation for the whole transaction. Use for reports. |
| `serializable` | Strict ordering, no anomalies. Use for read-modify-write that must be exact (e.g. balance transfers). Triggers serialization failures → retry. |
| `read uncommitted` | Almost never. Dirty reads. |

**DeesseJS default** : `read committed` everywhere, except explicit `serializable` for monetary operations and inventory. The repo methods that need it set the level explicitly.

## Serialization failure retry (Postgres `40001`)

`serializable` transactions can fail with `SQLSTATE 40001` (`serialization_failure`) when Postgres detects a serialization anomaly. The transaction has already rolled back; the fix is to **retry the whole transaction**.

```ts
// packages/database/src/transactions.ts
export async function withSerializableRetry<T>(
  fn: () => Promise<T>,
  { maxAttempts = 3, baseDelayMs = 10 } = {},
): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (!isSerializationFailure(err) || attempt === maxAttempts - 1) {
        throw err
      }
      // Exponential backoff + jitter
      const delay = baseDelayMs * 2 ** attempt + Math.random() * baseDelayMs
      await sleep(delay)
    }
  }
  throw lastError
}

function isSerializationFailure(err: unknown): boolean {
  return err instanceof Error && 'code' in err && (err as { code: string }).code === '40001'
}
```

**Usage in a repo:**

```ts
async transferFunds(from: AccountId, to: AccountId, amount: number) {
  return withSerializableRetry(() =>
    this.db.transaction(async (tx) => {
      // ...read, check, debit, credit...
    }, { isolationLevel: 'serializable' }),
  )
}
```

**Rules:**
- Only `40001` is retried. Other errors propagate.
- Max 3 attempts. If still failing, the request gets a `503 upstream_unavailable` and the client retries with backoff (and an idempotency key).
- Retried transactions must be **idempotent** at the application level. If the side effects include external calls (e.g. send email), gate them on a successful commit.

## Prepared statements + transactions

`.prepare()` returns a statement object with `.execute(params)`. Inside `db.transaction(...)`, the prepared statement is bound to the transaction and is **not re-used across transactions**.

**Implication:** do not cache a `.prepare()` statement at the repo level and then call `.execute()` from inside a transaction. The statement will be re-prepared each time, negating the perf win.

**Two correct patterns:**

1. **Hot-path reads (no transaction needed):** prepare at construction, execute on each call. See [`queries.md`](./queries.md).

2. **Transaction-scoped queries:** build the query inside the transaction callback. No `.prepare()`. The overhead is amortized across the transaction's statements anyway.

```ts
async transferFunds(from: AccountId, to: AccountId, amount: number) {
  return withSerializableRetry(() =>
    this.db.transaction(async (tx) => {
      // Build queries inside the transaction — no .prepare()
      const [fromAccount] = await tx
        .select({ balance: accounts.balance })
        .from(accounts)
        .where(eq(accounts.id, from))

      if (fromAccount.balance < amount) tx.rollback()

      await tx.update(accounts).set({ balance: sql`${accounts.balance} - ${amount}` }).where(eq(accounts.id, from))
      await tx.update(accounts).set({ balance: sql`${accounts.balance} + ${amount}` }).where(eq(accounts.id, to))
    }, { isolationLevel: 'serializable' }),
  )
}
```

## What goes where — quick reference

| You want to... | Pattern |
|---|---|
| Single insert/update/delete | No transaction |
| Multi-table write | `db.transaction(async tx => { ... })` |
| Read-modify-write with strict ordering | `db.transaction(..., { isolationLevel: 'serializable' })` + `withSerializableRetry` |
| Partial rollback | `tx.transaction(async tx2 => { ... })` |
| Explicit abort | `tx.rollback()` |
| Hot-path reads with prepared statement | `.prepare()` at construction + `.execute(params)` per call (no transaction) |
| Queries inside a transaction | Build inside the callback, no `.prepare()` |
| External call inside a transaction | **Don't.** Move the external call to a Trigger.dev job, queued after commit. |
