import { TaskDefinition } from '../lib';
import { db } from '@duke-hq/svc-api-db/connection';
import { ProviderCauseStatusSchema } from '@duke-hq/svc-api-db/zod/inputTypeSchemas/ProviderCauseStatusSchema';
import { ProviderCausePayoutTriggerKindSchema } from '@duke-hq/svc-api-db/zod/inputTypeSchemas/ProviderCausePayoutTriggerKindSchema';
import { ProviderCausePayoutStatusSchema } from '@duke-hq/svc-api-db/zod/inputTypeSchemas/ProviderCausePayoutStatusSchema';

export const causeTimeframePayoutTask: TaskDefinition = {
  schedule: {
    cron: '0 2 * * *', // Run every day at 2 AM
    timezone: 'Australia/Sydney',
    enabled: true,
  },
  timeout: 5, // 5 minutes timeout
  retryPolicy: 'retry-on-fail',
  handler: async (span) => {
    span.log('Cause timeframe payout task starting', { stdout: true });

    const expiredCauses = await db.providerCause.findMany({
      where: {
        timeframeDate: {
          lt: new Date(), // timeframeDate is in the past
        },
        status: ProviderCauseStatusSchema.enum.APPROVED,
      },
      include: {
        userPointsAllocation: {
          select: {
            pointsAllocated: true,
          },
        },
      },
    });

    span.log(`Found ${expiredCauses.length} expired causes to process`, {
      stdout: true,
    });

    let processedCount = 0;

    for (const cause of expiredCauses) {
      try {
        // Check if a payout record already exists for this cause
        const existingPayout = await db.providerCausePayout.findUnique({
          where: {
            providerDrn_causeId: {
              providerDrn: cause.providerDrn,
              causeId: cause.id,
            },
          },
        });

        // Skip if payout record already exists
        if (existingPayout) {
          span.log(`Cause payout record already exists for cause ${cause.id}, skipping`, {
            stdout: true,
          });
          continue;
        }

        // Calculate total points contributed to this cause
        const totalPointsContributed = cause.userPointsAllocation.reduce(
          (sum, allocation) => sum + allocation.pointsAllocated,
          0,
        );

        await db.$transaction(async (tx) => {
          // Create the payout record with TIMEFRAME_REACHED trigger
          await tx.providerCausePayout.create({
            data: {
              providerDrn: cause.providerDrn,
              causeId: cause.id,
              totalPointsContributed,
              payoutAmount: totalPointsContributed,
              triggerKind: ProviderCausePayoutTriggerKindSchema.enum.TIMEFRAME_REACHED,
              triggeredAt: new Date(),
              status: ProviderCausePayoutStatusSchema.enum.PENDING,
            },
          });

          // Update the cause status to ARCHIVED
          await tx.providerCause.update({
            where: { id: cause.id },
            data: {
              status: ProviderCauseStatusSchema.enum.ARCHIVED,
            },
          });
        });

        processedCount++;
        span.log(
          `Processed expired cause: ${cause.name} (ID: ${cause.id}) - ${totalPointsContributed} points`,
          { stdout: true },
        );
      } catch (error) {
        span.log(
          `Error processing cause ${cause.id}: ${error instanceof Error ? error.message : String(error)}`,
          { stdout: true },
        );
      }
    }

    const message = `Cause timeframe payout task completed: processed ${processedCount} expired causes out of ${expiredCauses.length} found.`;
    span.log(message, { stdout: true });

    return message;
  },
};
