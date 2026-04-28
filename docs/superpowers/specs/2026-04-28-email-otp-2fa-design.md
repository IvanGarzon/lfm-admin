# Email OTP Two-Factor Authentication

**Date:** 2026-04-28
**Scope:** Credentials sign-in flow only (Google OAuth delegates MFA to Google)

## Overview

When a user has `isTwoFactorEnabled = true`, after verifying their password they must enter a 6-digit OTP sent to their email before the session is created. The challenge happens in-place on the sign-in page — no redirect, no new route.

---

## Data Layer

### New Prisma model

```prisma
model TwoFactorToken {
  id                   String    @id @default(cuid())
  userId               String    @map("user_id")
  user                 User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  otpCode              String    @map("otp_code")
  challengeToken       String    @default(cuid()) @map("challenge_token")
  userAgent            String?   @map("user_agent")
  requestedIpAddress   String?   @map("requested_ip_address") @db.Inet
  loggedInIpAddress    String?   @map("logged_in_ip_address") @db.Inet
  numberOfAttempts     Int       @default(0) @map("number_of_attempts")
  expires              DateTime  @db.Timestamptz()
  usedAt               DateTime? @map("used_at") @db.Timestamptz()
  createdAt            DateTime  @default(now()) @map("created_at") @db.Timestamptz()

  @@unique([userId])
  @@unique([challengeToken])
  @@map("two_factor_tokens")
}
```

One token per user (`@@unique([userId])`). Upsert on each request replaces the previous code. `usedAt` marks a token as consumed — hard deletion is not used, preserving audit trail. `challengeToken` is what the client passes back; it never exposes `userId` in the form.

### Repository — `TwoFactorTokenRepository`

File: `src/repositories/two-factor-token-repository.ts`

Methods:

- `upsertToken(userId, hashedCode, challengeToken, expires, requestedIpAddress?, userAgent?)` — create or replace
- `findByChallengeToken(challengeToken)` — lookup for verify step
- `incrementAttempts(id)` — called on each wrong code
- `markUsed(id, loggedInIpAddress?)` — sets `usedAt` + optional IP on success or max-attempts lockout

---

## Auth Flow

### Step 1 — Credentials

**Server action:** `initiateSignIn(email, password)` in `src/actions/auth/two-factor.ts`

This is a plain `'use server'` function — not wrapped in `withAuth` or any HOF, since the user is not yet authenticated at this point.

1. Look up user by email via `UserRepository`
2. Compare password with `bcrypt.compare`
3. If invalid credentials → return `{ success: false, error: 'Invalid email or password' }`
4. If `isTwoFactorEnabled = false` → return `{ success: true, data: { requiresOtp: false } }`
5. If `isTwoFactorEnabled = true`:
   - Generate 6-digit code: `crypto.randomInt(100000, 999999).toString()`
   - Hash with SHA-256 via `crypto.createHash('sha256')`
   - Upsert `TwoFactorToken` with 15-minute expiry, client IP, user-agent
   - Send OTP email (non-blocking, fire-and-forget)
   - Return `{ success: true, data: { requiresOtp: true, challengeToken } }`

### Step 2 — OTP Verification

**Server action:** `verifyTwoFactorCode(challengeToken, code)` in `src/actions/auth/two-factor.ts`

1. Find token by `challengeToken`
2. Reject if not found, `usedAt` is set, or `expires < now`
3. Reject if `numberOfAttempts >= 5` (mark used if not already)
4. Hash submitted `code` and compare with stored `otpCode`
5. On mismatch: `incrementAttempts`; if now >= 5, `markUsed` (invalidate); return error
6. On match: `markUsed(id, clientIp)` → return `{ success: true }`

### Step 3 — Session Creation

After `verifyTwoFactorCode` succeeds, the client calls `signIn('credentials', { email, password })` — the standard NextAuth credentials flow. Password is bcrypt-compared again in `authorize`. This is acceptable: the OTP is the 2FA gate; the second password check is a minor overhead with no security gap.

---

## Email

**New template:** `src/emails/otp-email.tsx`

Props: `{ userName: string; otpCode: string; expiresInMinutes: number }`

Registered in `src/emails/index.tsx` as `'otp'`.

---

## UI — SignInForm

File: `src/features/sessions/components/sign-in-form.tsx`

### State

```ts
type Step = 'credentials' | 'otp';
const [step, setStep] = useState<Step>('credentials');
const [challengeToken, setChallengeToken] = useState<string | null>(null);
const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);
const [resendCooldown, setResendCooldown] = useState(0); // seconds remaining
```

### Credentials step

Unchanged visually. `onSubmit` calls `initiateSignIn` instead of `signIn` directly.

- `requiresOtp: false` → call `signIn('credentials', ...)` as normal
- `requiresOtp: true` → store `challengeToken` + credentials in state, set `step = 'otp'`, start 60s resend cooldown

### OTP step

Renders in the same card, replacing the credentials fields:

- Heading: "Check your email"
- Sub-text: masked email e.g. `i***@example.com`
- `<InputOTP>` — 6-slot component from shadcn/ui (`input-otp` package); auto-advance on input, paste support
- "Verify" button — calls `verifyTwoFactorCode(challengeToken, code)`, then `signIn` on success
- "Resend code" button — disabled with countdown while cooldown > 0; calls `initiateSignIn` with stored credentials, resets cooldown to 60s
- "Back" link — resets `step = 'credentials'`, clears OTP state

### Error states

| Condition            | Message                                                               |
| -------------------- | --------------------------------------------------------------------- |
| Wrong code           | "Invalid code. X attempts remaining."                                 |
| Max attempts reached | "Too many failed attempts. Please request a new code." (resend shown) |
| Code expired         | "Code has expired. Please request a new code." (resend shown)         |
| Email send failure   | Toast: "Failed to send code. Please try again."                       |

---

## Security Notes

- OTP codes are SHA-256 hashed before storage — not stored in plaintext
- `challengeToken` (cuid) is the only identifier passed client-side
- Max 5 attempts before invalidation prevents brute force within the 15-minute window
- 60-second resend cooldown enforced client-side; server upsert naturally limits to one active token per user
- `requestedIpAddress` vs `loggedInIpAddress` provides an audit signal if OTP is used from a different IP

---

## Files Created / Modified

| File                                                | Change                     |
| --------------------------------------------------- | -------------------------- |
| `prisma/schema.prisma`                              | Add `TwoFactorToken` model |
| `src/repositories/two-factor-token-repository.ts`   | New repository             |
| `src/actions/auth/two-factor.ts`                    | New server actions         |
| `src/emails/otp-email.tsx`                          | New email template         |
| `src/emails/index.tsx`                              | Register `otp` template    |
| `src/features/sessions/components/sign-in-form.tsx` | Add OTP step               |
| `src/schemas/auth.ts`                               | Add OTP input schema       |
