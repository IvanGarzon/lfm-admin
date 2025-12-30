import { TaskDefinition } from '../lib';
import { db } from '@duke-hq/svc-api-db/connection';
import { ProviderUserIncentivePointEventSchema } from '@duke-hq/svc-api-db/zod/inputTypeSchemas/ProviderUserIncentivePointEventSchema';

export const causeMonthlyBonusTask: TaskDefinition = {
  schedule: {
    cron: '15 2 1 * *', // Run at 2:15 AM on the 1st day of each month
    timezone: 'Australia/Sydney',
    enabled: true,
  },
  timeout: 5, // 5 minutes timeout
  retryPolicy: 'retry-on-fail',
  handler: async (span) => {
    span.log('Monthly bonus calculation task starting', { stdout: true });

    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    span.log(
      `Processing bonuses for period: ${lastMonth.toISOString()} to ${currentMonth.toISOString()}`,
      { stdout: true },
    );

    const platinumTier = await db.providerRewardTiers.findFirst({
      where: {
        name: 'Platinum',
        isActive: true,
      },
    });

    if (!platinumTier) {
      const message = 'Platinum tier not found or inactive, skipping bonus calculation';
      span.log(message, { stdout: true });
      return message;
    }

    const platinumUsers = await db.providerUserRewardTiers.findMany({
      where: {
        tierId: platinumTier.id,
        tierAssignedAt: {
          lt: currentMonth, // Assigned before current month started
        },
      },
      include: {
        user: true,
      },
    });

    span.log(`Found ${platinumUsers.length} Platinum tier users to process`, {
      stdout: true,
    });

    let processedCount = 0;
    let totalBonusAwarded = 0;

    for (const userTier of platinumUsers) {
      try {
        // if we've already processed bonuses for this specific lastMonth period
        // We look for MONTHLY_BONUS records that were created to reward points from the lastMonth period
        const existingMonthlyBonus = await db.providerUserIncentivePoints.findFirst({
          where: {
            userDrn: userTier.userDrn,
            providerDrn: userTier.providerDrn,
            eventType: ProviderUserIncentivePointEventSchema.enum.MONTHLY_BONUS,
            createdAt: {
              gte: new Date(now.getFullYear(), now.getMonth(), 1), // Start of current month
            },
          },
        });

        if (existingMonthlyBonus) {
          span.log(
            `User ${userTier.userDrn} already received monthly bonus for ${lastMonth.toLocaleDateString()}, skipping`,
            { stdout: true },
          );
          continue;
        }

        // Get points earned since becoming Platinum (or last month, whichever is later), excluding previous bonuses
        const bonusEligibleStartDate = new Date(
          Math.max(lastMonth.getTime(), userTier.tierAssignedAt.getTime()),
        );

        const monthlyPointsByEnrollment = await db.providerUserIncentivePoints.groupBy({
          by: ['courseEnrolmentId'],
          where: {
            userDrn: userTier.userDrn,
            providerDrn: userTier.providerDrn,
            createdAt: {
              gte: bonusEligibleStartDate,
              lt: currentMonth,
            },
            eventType: {
              not: ProviderUserIncentivePointEventSchema.enum.MONTHLY_BONUS,
            },
          },
          _sum: {
            pointsAwarded: true,
          },
        });

        if (monthlyPointsByEnrollment.length === 0) {
          span.log(
            `User ${userTier.userDrn} earned no bonus-eligible points since ${bonusEligibleStartDate.toLocaleDateString()}, skipping bonus`,
            { stdout: true },
          );
          continue;
        }

        let userTotalBonus = 0;

        for (const enrollmentPoints of monthlyPointsByEnrollment) {
          const pointsEarnedForEnrollment = enrollmentPoints._sum.pointsAwarded ?? 0;

          if (pointsEarnedForEnrollment <= 0) {
            continue;
          }

          // Calculate bonus using tier's bonus percentage, rounded up
          const bonusPercentage = Number(platinumTier.bonusPercentage) / 100;
          const bonusAmount = Math.ceil(pointsEarnedForEnrollment * bonusPercentage);

          // Check lifetime total points for this enrollment (for $28 cap enforcement)
          const enrollmentLifetimeTotal = await db.providerUserIncentivePoints.aggregate({
            where: {
              userDrn: userTier.userDrn,
              providerDrn: userTier.providerDrn,
              courseEnrolmentId: enrollmentPoints.courseEnrolmentId,
            },
            _sum: {
              pointsAwarded: true,
            },
          });

          const currentTotal = enrollmentLifetimeTotal._sum.pointsAwarded ?? 0;
          const maxPoints = 28; // $28 maximum per enrollment

          // Calculate how much bonus we can actually award without exceeding the cap
          const availableRoom = Math.max(0, maxPoints - currentTotal);
          const actualBonusAmount = Math.min(bonusAmount, availableRoom);

          if (actualBonusAmount > 0) {
            await db.providerUserIncentivePoints.create({
              data: {
                providerDrn: userTier.providerDrn,
                userDrn: userTier.userDrn,
                courseEnrolmentId: enrollmentPoints.courseEnrolmentId,
                pointsAwarded: actualBonusAmount,
                eventType: ProviderUserIncentivePointEventSchema.enum.MONTHLY_BONUS,
              },
            });

            userTotalBonus += actualBonusAmount;

            span.log(
              `Enrollment ${enrollmentPoints.courseEnrolmentId}: earned ${pointsEarnedForEnrollment} points, calculated bonus ${bonusAmount}, awarded ${actualBonusAmount} (cap: ${maxPoints}, current total: ${currentTotal})`,
              { stdout: true },
            );
          } else {
            span.log(
              `Enrollment ${enrollmentPoints.courseEnrolmentId}: earned ${pointsEarnedForEnrollment} points, calculated bonus ${bonusAmount}, but already at cap (${currentTotal}/${maxPoints})`,
              { stdout: true },
            );
          }
        }

        if (userTotalBonus > 0) {
          processedCount++;
          totalBonusAwarded += userTotalBonus;

          span.log(
            `Awarded total ${userTotalBonus} bonus points to ${userTier.user.first_name} ${userTier.user.last_name ?? ''} (${userTier.userDrn}) for ${lastMonth.toLocaleDateString()}`,
            { stdout: true },
          );
        } else {
          span.log(
            `User ${userTier.user.first_name} ${userTier.user.last_name ?? ''} (${userTier.userDrn}) earned points but already at caps, no bonus awarded`,
            { stdout: true },
          );
        }
      } catch (error) {
        span.log(
          `Error processing bonus for user ${userTier.userDrn}: ${error instanceof Error ? error.message : String(error)}`,
          { stdout: true },
        );
      }
    }

    const message = `Monthly bonus calculation completed: processed ${processedCount} Platinum users, awarded ${totalBonusAwarded} total bonus points for ${lastMonth.toLocaleDateString()}`;
    span.log(message, { stdout: true });

    return message;
  },
};
