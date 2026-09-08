# Funds (Design)

Date: 2026-09-08 — Phases 6 and 7 of the product plan (sections 12–16, 31).

## Goal

An offline accounting ledger with full transparency: admins record contributions collected and
expenses paid; every member sees the balance, the month's totals, and every transaction; every
change is audited; monthly and date-range reports can be exported as CSV. No payment gateway.

## Money

Amounts are stored as integer **paise** (`amountPaise`) to avoid floating-point drift, and
displayed as rupees with Indian digit grouping (`₹48,500`, `₹1,234.50`) by a tested formatter.
Maximum single amount: ₹1,00,00,000 (1 crore).

## Data

| Class | Fields | Row ACL | CLP |
|---|---|---|---|
| `Contribution` | `group`, `member` Pointer<_User>, `amountPaise` Number, `transactionDate` Date, `paymentMethod` (`cash`\|`bank`\|`other`), `reference` (≤120), `note` (≤500), `createdBy`, `updatedBy` | read: group roles | reads authenticated; writes master only |
| `Expense` | `group`, `category` (`hall`\|`food`\|`transport`\|`charity`\|`event`\|`supplies`\|`other`), `amountPaise`, `paidTo` (≤120, required), `description` (≤500), `transactionDate`, `createdBy`, `updatedBy` | read: group roles | same |
| `FinancialAuditLog` | `group`, `user`, `entityType` (`contribution`\|`expense`), `entityId`, `action` (`create`\|`update`\|`delete`), `oldValues` Object, `newValues` Object, `reason` (≤200) | read: **admin role only** | same |

## Cloud Code (`finance.js`, pure; wired in `main.js`)

All six writers require the caller to hold an active **admin** membership; the admin's group is the
target. Every call writes one `FinancialAuditLog` row. Update and delete require a `reason`.

| Function | Notes |
|---|---|
| `addContribution({ memberId, amountPaise, transactionDate, paymentMethod, reference, note })` | `memberId` must be an active member of the group. |
| `updateContribution({ contributionId, reason, ...fields })` | Partial update; old/new values audited. |
| `deleteContribution({ contributionId, reason })` | |
| `addExpense({ category, amountPaise, paidTo, description, transactionDate })` | |
| `updateExpense({ expenseId, reason, ...fields })` | |
| `deleteExpense({ expenseId, reason })` | |

Validation messages: `adminOnly` "Only admins can change financial records."; `memberNotFound`
"That member isn't in the group."; `invalidAmount` "Enter an amount greater than zero.";
`amountTooLarge` "That amount is too large."; `invalidDate` "Enter a valid date."; `futureDate`
"The date can't be in the future."; `invalidMethod` "Choose a payment method."; `invalidCategory`
"Choose a category."; `paidToRequired` "Enter who was paid."; `paidToTooLong` "Keep the payee under
120 characters."; `referenceTooLong` "Keep the reference under 120 characters."; `noteTooLong` "Keep
the note under 500 characters."; `descriptionTooLong` "Keep the description under 500 characters.";
`reasonRequired` "Say why this record is changing."; `reasonTooLong` "Keep the reason under 200
characters."; `notFound` "That record isn't available."

## Mobile

- `src/features/funds/` — `money.ts` (`formatRupees`, `parseRupees`), `summary.ts` (pure:
  `summarise(transactions, { from, to })` → collected, spent, net; `monthlyReport(transactions,
  year, month)` → opening balance, contributions by member, expenses by category, closing balance;
  `toCsv(rows)`), `types.ts`, `service.ts`, `useFunds()`, tests for all pure functions and the
  service.
- **Funds tab**: forest balance card (current balance, "This month: collected / expenses / net"),
  admin buttons "Record contribution" and "Record expense", a "Reports" link, then recent
  transactions (mixed, newest first: `+ ₹5,000 Sarah` / `− ₹3,500 Hall`). Tapping a row opens
  edit (admins) or a read-only detail (members).
- **Record / edit contribution** modal: member picker (chips from `useMembers`), amount (rupees
  input), date (defaults to today, simple date field `YYYY-MM-DD` with validation), payment method
  chips, reference, note; on edit a required "Reason for change" and a Delete action with its own
  reason.
- **Record / edit expense** modal: category chips, amount, paid to, description, date; same
  edit/delete rules.
- **Reports**: month picker (previous / next), opening balance, contributions grouped by member,
  expenses grouped by category, closing balance, "Export CSV" (writes a file via
  `expo-file-system` and opens the share sheet via `expo-sharing`).
- **Audit log** (admins): list of changes with who, when, action, and reason.

## Out of scope

Receipt uploads, members self-submitting contributions, PDF export, multiple currencies, bank
integrations, budgets.
