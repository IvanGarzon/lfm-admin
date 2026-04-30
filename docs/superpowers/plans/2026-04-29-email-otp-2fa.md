# Email OTP Two-Factor Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When `isTwoFactorEnabled = true` on a user, intercept the credentials sign-in flow with an email OTP challenge before creating a session.

**Architecture:** `initiateSignIn` server action verifies the password and, if 2FA is enabled, generates a hashed 6-digit OTP stored in a new `TwoFactorToken` DB record and sends it by email. The `SignInForm` transitions in-place to an OTP input step; on successful `verifyTwoFactorCode`, it calls `signIn('credentials')` to complete the NextAuth session.

**Tech Stack:** Next.js, NextAuth (JWT), Prisma (Neon PostgreSQL), Zod, react-hook-form, `input-otp` (shadcn/ui), `@react-email/components`, bcryptjs, Node.js `crypto`

---

## File Map

| File                                                                    | Action                                          |
| ----------------------------------------------------------------------- | ----------------------------------------------- |
| `prisma/schema.prisma`                                                  | Add `TwoFactorToken` model + relation on `User` |
| `src/repositories/two-factor-token-repository.ts`                       | New repository                                  |
| `src/repositories/__tests__/two-factor-token-repository.integration.ts` | Integration tests                               |
| `src/schemas/auth.ts`                                                   | Add `OtpVerifySchema`                           |
| `src/actions/auth/two-factor.ts`                                        | New server actions                              |
| `src/emails/otp-email.tsx`                                              | New email template                              |
| `src/emails/index.tsx`                                                  | Register `otp` template                         |
| `src/features/sessions/components/sign-in-form.tsx`                     | Add OTP step                                    |

---

## Task 1: Prisma Schema

**Files:**

- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add `TwoFactorToken` model and `User` relation**

Open `prisma/schema.prisma`. Add after the `TwoFactorConfirmation` model (around line 318):

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

Find the `User` model and add the relation field alongside `twoFactorConfirmation`:

```prisma
  twoFactorToken        TwoFactorToken?
```

- [ ] **Step 2: Run migration**

```bash
pnpm prisma migrate dev --name add_two_factor_tokens
```

Expected: migration file created, `two_factor_tokens` table exists in DB.

- [ ] **Step 3: Regenerate Prisma client**

```bash
pnpm prisma generate
```

- [ ] **Step 4: Commit**

```bash
git add prisma/
git commit -m "feat(db): add TwoFactorToken model for email OTP 2FA"
```

---

## Task 2: Repository

**Files:**

- Create: `src/repositories/two-factor-token-repository.ts`
- Create: `src/repositories/__tests__/two-factor-token-repository.integration.ts`

- [ ] **Step 1: Write the failing integration tests**

Create `src/repositories/__tests__/two-factor-token-repository.integration.ts`:

```ts
/**
 * TwoFactorTokenRepository Integration Tests
 *
 * Tests the repository against a real Postgres database.
 * Run with: pnpm test:integration
 */

import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { TwoFactorTokenRepository } from '../two-factor-token-repository';
import {
  setupTestDatabaseLifecycle,
  getTestPrisma,
  createTestTenant,
} from '@/lib/testing/integration/database';
import { createUserData } from '@/lib/testing';
import crypto from 'node:crypto';

vi.mock('@/lib/prisma', () => ({ prisma: {} }));

setupTestDatabaseLifecycle();

function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

async function createTestUser(tenantId: string, email?: string) {
  return getTestPrisma().user.create({
    data: { ...createUserData({ email }), tenantId },
    select: { id: true, email: true },
  });
}

describe('TwoFactorTokenRepository (integration)', () => {
  let repository: TwoFactorTokenRepository;
  let tenantId: string;
  let userId: string;

  beforeAll(() => {
    repository = new TwoFactorTokenRepository(getTestPrisma());
  });

  beforeEach(async () => {
    ({ id: tenantId } = await createTestTenant({ name: '2FA Test Tenant' }));
    ({ id: userId } = await createTestUser(tenantId));
  });

  // -- upsertToken -----------------------------------------------------------

  describe('upsertToken', () => {
    it('creates a new token record', async () => {
      const expires = new Date(Date.now() + 15 * 60 * 1000);
      const result = await repository.upsertToken({
        userId,
        hashedCode: hashCode('123456'),
        expires,
      });

      expect(result.userId).toBe(userId);
      expect(result.otpCode).toBe(hashCode('123456'));
      expect(result.numberOfAttempts).toBe(0);
      expect(result.usedAt).toBeNull();
    });

    it('replaces existing token for same userId', async () => {
      const expires = new Date(Date.now() + 15 * 60 * 1000);
      await repository.upsertToken({ userId, hashedCode: hashCode('111111'), expires });
      const second = await repository.upsertToken({
        userId,
        hashedCode: hashCode('222222'),
        expires,
      });

      const db = getTestPrisma();
      const tokens = await db.twoFactorToken.findMany({ where: { userId } });
      expect(tokens).toHaveLength(1);
      expect(second.otpCode).toBe(hashCode('222222'));
    });

    it('stores optional userAgent and requestedIpAddress', async () => {
      const expires = new Date(Date.now() + 15 * 60 * 1000);
      const result = await repository.upsertToken({
        userId,
        hashedCode: hashCode('123456'),
        expires,
        userAgent: 'Mozilla/5.0',
        requestedIpAddress: '127.0.0.1',
      });

      expect(result.userAgent).toBe('Mozilla/5.0');
      expect(result.requestedIpAddress).toBe('127.0.0.1');
    });
  });

  // -- findByChallengeToken --------------------------------------------------

  describe('findByChallengeToken', () => {
    it('returns the token record by challengeToken', async () => {
      const expires = new Date(Date.now() + 15 * 60 * 1000);
      const created = await repository.upsertToken({
        userId,
        hashedCode: hashCode('123456'),
        expires,
      });

      const found = await repository.findByChallengeToken(created.challengeToken);
      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
    });

    it('returns null for unknown challengeToken', async () => {
      const found = await repository.findByChallengeToken('nonexistent-token');
      expect(found).toBeNull();
    });
  });

  // -- incrementAttempts -----------------------------------------------------

  describe('incrementAttempts', () => {
    it('increments numberOfAttempts by 1', async () => {
      const expires = new Date(Date.now() + 15 * 60 * 1000);
      const token = await repository.upsertToken({
        userId,
        hashedCode: hashCode('123456'),
        expires,
      });

      await repository.incrementAttempts(token.id);
      const updated = await getTestPrisma().twoFactorToken.findUnique({ where: { id: token.id } });
      expect(updated?.numberOfAttempts).toBe(1);
    });
  });

  // -- markUsed --------------------------------------------------------------

  describe('markUsed', () => {
    it('sets usedAt timestamp', async () => {
      const expires = new Date(Date.now() + 15 * 60 * 1000);
      const token = await repository.upsertToken({
        userId,
        hashedCode: hashCode('123456'),
        expires,
      });

      await repository.markUsed(token.id);
      const updated = await getTestPrisma().twoFactorToken.findUnique({ where: { id: token.id } });
      expect(updated?.usedAt).not.toBeNull();
    });

    it('stores loggedInIpAddress when provided', async () => {
      const expires = new Date(Date.now() + 15 * 60 * 1000);
      const token = await repository.upsertToken({
        userId,
        hashedCode: hashCode('123456'),
        expires,
      });

      await repository.markUsed(token.id, '192.168.1.1');
      const updated = await getTestPrisma().twoFactorToken.findUnique({ where: { id: token.id } });
      expect(updated?.loggedInIpAddress).toBe('192.168.1.1');
    });
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
pnpm test:integration two-factor-token-repository
```

Expected: FAIL — `TwoFactorTokenRepository` does not exist yet.

- [ ] **Step 3: Implement the repository**

Create `src/repositories/two-factor-token-repository.ts`:

```ts
import { Prisma, PrismaClient } from '@/prisma/client';
import { BaseRepository, type ModelDelegateOperations } from '@/lib/baseRepository';

type TwoFactorToken = Prisma.TwoFactorTokenGetPayload<object>;

interface UpsertTokenInput {
  userId: string;
  hashedCode: string;
  expires: Date;
  userAgent?: string;
  requestedIpAddress?: string;
}

export class TwoFactorTokenRepository extends BaseRepository<TwoFactorToken> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected get model(): ModelDelegateOperations<TwoFactorToken> {
    return this.prisma.twoFactorToken as unknown as ModelDelegateOperations<TwoFactorToken>;
  }

  /**
   * Creates or replaces the OTP token for a user.
   * Only one active token per user is kept — upsert replaces any existing record.
   * @param input - Token data including hashed code and expiry
   * @returns The created or updated token record
   */
  async upsertToken(input: UpsertTokenInput): Promise<TwoFactorToken> {
    const { userId, hashedCode, expires, userAgent, requestedIpAddress } = input;
    return this.prisma.twoFactorToken.upsert({
      where: { userId },
      update: {
        otpCode: hashedCode,
        challengeToken: crypto.randomUUID(),
        expires,
        numberOfAttempts: 0,
        usedAt: null,
        userAgent: userAgent ?? null,
        requestedIpAddress: requestedIpAddress ?? null,
        loggedInIpAddress: null,
      },
      create: {
        userId,
        otpCode: hashedCode,
        expires,
        userAgent: userAgent ?? null,
        requestedIpAddress: requestedIpAddress ?? null,
      },
    });
  }

  /**
   * Finds a token by its challenge token identifier.
   * @param challengeToken - The challenge token issued to the client
   * @returns The token record, or null if not found
   */
  async findByChallengeToken(challengeToken: string): Promise<TwoFactorToken | null> {
    return this.prisma.twoFactorToken.findUnique({ where: { challengeToken } });
  }

  /**
   * Increments the failed attempt counter for a token.
   * @param id - The token ID to update
   * @returns The updated token record
   */
  async incrementAttempts(id: string): Promise<TwoFactorToken> {
    return this.prisma.twoFactorToken.update({
      where: { id },
      data: { numberOfAttempts: { increment: 1 } },
    });
  }

  /**
   * Marks a token as consumed, preventing further use.
   * Called on successful verification and on max-attempts lockout.
   * @param id - The token ID to mark
   * @param loggedInIpAddress - Optional IP address of the client that verified the code
   * @returns The updated token record
   */
  async markUsed(id: string, loggedInIpAddress?: string): Promise<TwoFactorToken> {
    return this.prisma.twoFactorToken.update({
      where: { id },
      data: {
        usedAt: new Date(),
        loggedInIpAddress: loggedInIpAddress ?? null,
      },
    });
  }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
pnpm test:integration two-factor-token-repository
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/repositories/two-factor-token-repository.ts src/repositories/__tests__/two-factor-token-repository.integration.ts
git commit -m "feat(db): add TwoFactorTokenRepository with integration tests"
```

---

## Task 3: Zod Schema

**Files:**

- Modify: `src/schemas/auth.ts`

- [ ] **Step 1: Add `OtpVerifySchema`**

Open `src/schemas/auth.ts` and append:

```ts
export const OtpVerifySchema = z.object({
  challengeToken: z.string().min(1, 'Challenge token is required'),
  code: z
    .string()
    .length(6, 'Code must be 6 digits')
    .regex(/^\d{6}$/, 'Code must be 6 digits'),
});

export type OtpVerifyInput = z.infer<typeof OtpVerifySchema>;
```

- [ ] **Step 2: Commit**

```bash
git add src/schemas/auth.ts
git commit -m "feat(auth): add OtpVerifySchema"
```

---

## Task 4: OTP Email Template

**Files:**

- Create: `src/emails/otp-email.tsx`
- Modify: `src/emails/index.tsx`

- [ ] **Step 1: Create the email template**

Create `src/emails/otp-email.tsx`:

```tsx
import { Heading, Hr, Section, Text, Row, Column } from '@react-email/components';
import * as React from 'react';
import { BaseTemplateEmail } from './base-template';
import { styles } from './styles';

type OtpEmailProps = {
  userName: string;
  otpCode: string;
  expiresInMinutes: number;
};

export const OtpEmailContent = ({ userName, otpCode, expiresInMinutes }: OtpEmailProps) => {
  const digits = otpCode.split('');

  return (
    <>
      <Heading style={styles.h1}>Your sign-in code</Heading>

      <Text style={styles.text}>Hi {userName},</Text>

      <Text style={styles.text}>
        Use the code below to complete your sign-in. It expires in {expiresInMinutes} minutes.
      </Text>

      <Hr style={styles.hr} />

      <Section style={{ textAlign: 'center', padding: '24px 0' }}>
        <Row>
          {digits.map((digit, i) => (
            <Column key={i} style={{ width: '48px', textAlign: 'center' }}>
              <Text
                style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  color: '#111827',
                  margin: '0',
                  padding: '8px 0',
                  borderBottom: '2px solid #6366f1',
                }}
              >
                {digit}
              </Text>
            </Column>
          ))}
        </Row>
      </Section>

      <Hr style={styles.hr} />

      <Text style={styles.text}>
        If you did not attempt to sign in, please ignore this email. Your account is safe.
      </Text>

      <Text style={styles.footer}>The Team</Text>
    </>
  );
};

export function OtpEmail(props: OtpEmailProps): React.ReactElement {
  return (
    <BaseTemplateEmail previewText="Your sign-in verification code">
      <OtpEmailContent {...props} />
    </BaseTemplateEmail>
  );
}

OtpEmail.PreviewProps = {
  userName: 'Alex Taylor',
  otpCode: '482951',
  expiresInMinutes: 15,
} satisfies OtpEmailProps;

export default OtpEmail;
```

- [ ] **Step 2: Register in the email index**

Open `src/emails/index.tsx`. Add the import alongside the others:

```ts
import { OtpEmail } from './otp-email';
```

Add to the `emailTemplates` object:

```ts
'otp': OtpEmail,
```

The full updated registry section:

```ts
const emailTemplates = {
  invoice: InvoiceEmail,
  receipt: ReceiptEmail,
  reminder: ReminderEmail,
  quote: QuoteEmail,
  'quote-followup': QuoteFollowUpEmail,
  invitation: InvitationEmail,
  'password-reset': PasswordResetEmail,
  'login-notification': LoginNotificationEmail,
  otp: OtpEmail,
} as const;
```

- [ ] **Step 3: Commit**

```bash
git add src/emails/otp-email.tsx src/emails/index.tsx
git commit -m "feat(email): add OTP verification email template"
```

---

## Task 5: Server Actions

**Files:**

- Create: `src/actions/auth/two-factor.ts`

- [ ] **Step 1: Create the server actions file**

Create `src/actions/auth/two-factor.ts`:

```ts
'use server';

import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { handleActionError } from '@/lib/error-handler';
import { sendEmailNotification } from '@/lib/email-service';
import { getClientDetails } from '@/lib/agent';
import { UserRepository } from '@/repositories/user-repository';
import { TwoFactorTokenRepository } from '@/repositories/two-factor-token-repository';
import { SignInSchema, OtpVerifySchema, type OtpVerifyInput } from '@/schemas/auth';
import type { SignInInput } from '@/schemas/auth';
import type { ActionResult } from '@/types/actions';

const OTP_EXPIRY_MINUTES = 15;
const MAX_ATTEMPTS = 5;

function hashOtpCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

/**
 * First step of the 2FA sign-in flow.
 * Verifies the user's password and, if 2FA is enabled, generates an OTP
 * and sends it to the user's email address.
 *
 * @param data - Email and password from the sign-in form
 * @returns Whether an OTP challenge is required, plus the challengeToken if so
 */
export async function initiateSignIn(
  data: SignInInput,
): Promise<ActionResult<{ requiresOtp: false } | { requiresOtp: true; challengeToken: string }>> {
  try {
    const { email, password } = SignInSchema.parse(data);

    const userRepo = new UserRepository(prisma);
    const user = await userRepo.getUserByEmail(email);

    if (!user?.password) {
      return { success: false, error: 'Invalid email or password' };
    }

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      return { success: false, error: 'Invalid email or password' };
    }

    if (!user.isTwoFactorEnabled) {
      return { success: true, data: { requiresOtp: false } };
    }

    const code = crypto.randomInt(100000, 999999).toString();
    const hashedCode = hashOtpCode(code);
    const expires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    const details = await getClientDetails();
    const tokenRepo = new TwoFactorTokenRepository(prisma);
    const token = await tokenRepo.upsertToken({
      userId: user.id,
      hashedCode,
      expires,
      userAgent: details.userAgent,
      requestedIpAddress: details.ipAddress,
    });

    const userName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'there';

    sendEmailNotification({
      to: email,
      subject: 'Your sign-in verification code',
      template: 'otp',
      props: { userName, otpCode: code, expiresInMinutes: OTP_EXPIRY_MINUTES },
    }).catch((err) =>
      logger.error('Failed to send OTP email', err, {
        context: 'initiateSignIn',
        metadata: { userId: user.id },
      }),
    );

    return { success: true, data: { requiresOtp: true, challengeToken: token.challengeToken } };
  } catch (error) {
    return handleActionError(error, 'Sign-in failed. Please try again.', {
      action: 'initiateSignIn',
    });
  }
}

/**
 * Second step of the 2FA sign-in flow.
 * Verifies the OTP code submitted by the user.
 * Invalidates the token after 5 failed attempts or on success.
 *
 * @param data - Challenge token and 6-digit OTP code
 * @returns Success or a descriptive error
 */
export async function verifyTwoFactorCode(
  data: OtpVerifyInput,
): Promise<ActionResult<{ verified: true }>> {
  try {
    const { challengeToken, code } = OtpVerifySchema.parse(data);

    const tokenRepo = new TwoFactorTokenRepository(prisma);
    const token = await tokenRepo.findByChallengeToken(challengeToken);

    if (!token) {
      return { success: false, error: 'Invalid or expired code. Please request a new one.' };
    }

    if (token.usedAt) {
      return {
        success: false,
        error: 'This code has already been used. Please request a new one.',
      };
    }

    if (token.expires < new Date()) {
      return { success: false, error: 'Code has expired. Please request a new one.' };
    }

    if (token.numberOfAttempts >= MAX_ATTEMPTS) {
      return { success: false, error: 'Too many failed attempts. Please request a new code.' };
    }

    const hashedSubmitted = hashOtpCode(code);
    if (hashedSubmitted !== token.otpCode) {
      const updated = await tokenRepo.incrementAttempts(token.id);
      const remaining = MAX_ATTEMPTS - updated.numberOfAttempts;

      if (remaining <= 0) {
        await tokenRepo.markUsed(token.id);
        return { success: false, error: 'Too many failed attempts. Please request a new code.' };
      }

      return {
        success: false,
        error: `Invalid code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
      };
    }

    const details = await getClientDetails();
    await tokenRepo.markUsed(token.id, details.ipAddress);

    return { success: true, data: { verified: true } };
  } catch (error) {
    return handleActionError(error, 'Verification failed. Please try again.', {
      action: 'verifyTwoFactorCode',
    });
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit 2>&1 | grep two-factor
```

Expected: no output (no errors).

- [ ] **Step 3: Commit**

```bash
git add src/actions/auth/two-factor.ts
git commit -m "feat(auth): add initiateSignIn and verifyTwoFactorCode server actions"
```

---

## Task 6: Install `input-otp` and Add shadcn Component

**Files:**

- None permanent — installs package + generates UI component

- [ ] **Step 1: Check if `input-otp` is already installed**

```bash
grep "input-otp" package.json
```

If no output, proceed to Step 2. Otherwise skip to Task 7.

- [ ] **Step 2: Add the shadcn InputOTP component**

```bash
pnpm dlx shadcn@latest add input-otp
```

Expected: installs `input-otp` package and creates `src/components/ui/input-otp.tsx`.

- [ ] **Step 3: Verify component exists**

```bash
ls src/components/ui/input-otp.tsx
```

Expected: file exists.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/input-otp.tsx package.json pnpm-lock.yaml
git commit -m "chore(ui): add InputOTP shadcn component"
```

---

## Task 7: Update SignInForm with OTP Step

**Files:**

- Modify: `src/features/sessions/components/sign-in-form.tsx`

- [ ] **Step 1: Replace `sign-in-form.tsx` with the updated version**

Full file content:

```tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { SignInSchema, type SignInInput } from '@/schemas/auth';
import { initiateSignIn, verifyTwoFactorCode } from '@/actions/auth/two-factor';
import { toast } from 'sonner';

const RESEND_COOLDOWN_SECONDS = 60;

interface SignInFormProps {
  callbackUrl?: string;
}

type Step = 'credentials' | 'otp';

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  return `${local[0]}***@${domain}`;
}

export function SignInForm({ callbackUrl = '/' }: SignInFormProps) {
  const [step, setStep] = useState<Step>('credentials');
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<SignInInput | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SignInInput>({
    mode: 'onChange',
    resolver: zodResolver(SignInSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleCredentialsSubmit: SubmitHandler<SignInInput> = useCallback(
    async (data) => {
      setIsLoading(true);
      try {
        const result = await initiateSignIn(data);

        if (!result.success) {
          toast.error(result.error ?? 'Sign-in failed. Please try again.');
          return;
        }

        if (!result.data.requiresOtp) {
          const res = await signIn('credentials', {
            email: data.email,
            password: data.password,
            callbackUrl,
            redirect: false,
          });

          if (res?.error) {
            toast.error('Sign-in failed', {
              description: 'Invalid email or password. Please try again.',
            });
          } else if (res?.ok) {
            window.location.href = callbackUrl;
          }
          return;
        }

        setCredentials(data);
        setChallengeToken(result.data.challengeToken);
        setStep('otp');
        setResendCooldown(RESEND_COOLDOWN_SECONDS);
      } catch {
        toast.error('An unexpected error occurred. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [callbackUrl],
  );

  const handleVerify = useCallback(async () => {
    if (!challengeToken || otpCode.length !== 6 || !credentials) return;

    setIsVerifying(true);
    setOtpError(null);

    try {
      const result = await verifyTwoFactorCode({ challengeToken, code: otpCode });

      if (!result.success) {
        setOtpError(result.error ?? 'Invalid code. Please try again.');
        return;
      }

      const res = await signIn('credentials', {
        email: credentials.email,
        password: credentials.password,
        callbackUrl,
        redirect: false,
      });

      if (res?.error) {
        toast.error('Sign-in failed. Please try again.');
      } else if (res?.ok) {
        window.location.href = callbackUrl;
      }
    } catch {
      toast.error('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  }, [challengeToken, otpCode, credentials, callbackUrl]);

  const handleResend = useCallback(async () => {
    if (!credentials || resendCooldown > 0) return;

    setIsResending(true);
    setOtpError(null);
    setOtpCode('');

    try {
      const result = await initiateSignIn(credentials);

      if (!result.success) {
        toast.error(result.error ?? 'Failed to resend code. Please try again.');
        return;
      }

      if (result.data.requiresOtp) {
        setChallengeToken(result.data.challengeToken);
        setResendCooldown(RESEND_COOLDOWN_SECONDS);
        toast.success('A new code has been sent to your email.');
      }
    } catch {
      toast.error('Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  }, [credentials, resendCooldown]);

  const handleBack = useCallback(() => {
    setStep('credentials');
    setChallengeToken(null);
    setCredentials(null);
    setOtpCode('');
    setOtpError(null);
    setResendCooldown(0);
  }, []);

  if (step === 'otp') {
    const email = credentials?.email ?? '';
    const isMaxAttempts = otpError?.includes('Too many');
    const isExpired = otpError?.includes('expired');
    const showResend = isMaxAttempts || isExpired || resendCooldown === 0;

    return (
      <div className="flex flex-col gap-4 w-full">
        <div>
          <p className="text-sm font-medium">Check your email</p>
          <p className="text-sm text-muted-foreground mt-1">
            We sent a 6-digit code to <span className="font-medium">{maskEmail(email)}</span>. Enter
            it below to continue.
          </p>
        </div>

        <div className="flex flex-col items-center gap-4">
          <InputOTP
            maxLength={6}
            value={otpCode}
            onChange={(value) => {
              setOtpCode(value);
              setOtpError(null);
            }}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>

          {otpError ? <p className="text-sm text-destructive text-center">{otpError}</p> : null}
        </div>

        <Button
          onClick={handleVerify}
          disabled={isVerifying || otpCode.length !== 6}
          className="w-full"
        >
          {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Verify
        </Button>

        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={handleBack}
            className="text-muted-foreground hover:text-foreground underline underline-offset-4"
          >
            Back
          </button>

          {showResend ? (
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending || resendCooldown > 0}
              className="text-muted-foreground hover:text-foreground underline underline-offset-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResending
                ? 'Sending…'
                : resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : 'Resend code'}
            </button>
          ) : (
            <span className="text-muted-foreground">Resend in {resendCooldown}s</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleCredentialsSubmit)}
        className="flex flex-col gap-2 w-full"
      >
        <FieldGroup className="gap-1.5 mb-0">
          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldContent>
                  <FieldLabel htmlFor="form-rhf-email">Email</FieldLabel>
                </FieldContent>
                <Input
                  {...field}
                  id="form-rhf-email"
                  type="email"
                  placeholder="m@example.com"
                  disabled={isLoading}
                  autoComplete="email"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </FieldGroup>

        <FieldGroup className="gap-1.5 mb-0">
          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldContent>
                  <FieldLabel htmlFor="form-rhf-password">Password</FieldLabel>
                </FieldContent>
                <Input
                  {...field}
                  id="form-rhf-password"
                  type="password"
                  placeholder="Enter your password"
                  disabled={isLoading}
                  autoComplete="current-password"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
        </FieldGroup>

        <Button type="submit" disabled={isLoading} className="w-full mt-2">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Sign In
        </Button>
      </form>
    </Form>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit 2>&1 | grep sign-in-form
```

Expected: no output.

- [ ] **Step 3: Start dev server and test manually**

```bash
pnpm dev
```

Test plan:

1. Enable 2FA on a user via the Security tab in the user drawer.
2. Sign out, then sign in with that user's credentials.
3. Confirm the form transitions to the OTP step and an email is received.
4. Enter the 6-digit code — confirm sign-in completes.
5. Enter a wrong code 5 times — confirm lockout message and resend option appear.
6. Sign in with a user that has 2FA disabled — confirm no OTP step.

- [ ] **Step 4: Commit**

```bash
git add src/features/sessions/components/sign-in-form.tsx
git commit -m "feat(auth): add email OTP step to sign-in form"
```
