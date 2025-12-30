import { updateStudentCourseEnrolmentStatuses } from '@duke-hq/svc-api/student/internal/courseEnrolment';
import { TaskDefinition } from '../lib';
import { db } from '@duke-hq/svc-api-db/connection';

const BATCH_SIZE = 500;
const CONCURRENCY = 10;

export const updateCourseEnrolmentHealthStatuses: TaskDefinition = {
  schedule: {
    cron: '0 0 * * *', // Run daily at midnight
    timezone: 'Australia/Sydney',
    enabled: true,
  },
  timeout: 5,
  retryPolicy: 'retry-on-fail',
  handler: async (span) => {
    let lastProcessedId = 1;
    let totalProcessed = 0;
    let totalSucceeded = 0;
    let totalFailed = 0;
    let batchIndex = 0;
    let firstFailureMessage = '';

    const fetchNextBatch = async () => {
      return await db.studentCourseEnrolment.findMany({
        where: {
          courseEnrolmentScheduleItems: { some: {} },
          id: { gte: lastProcessedId },
        },
        include: { courseEnrolmentScheduleItems: true },
        orderBy: { id: 'asc' },
        take: BATCH_SIZE,
      });
    };

    let enrolments = await fetchNextBatch();

    while (enrolments.length > 0) {
      batchIndex += 1;

      for (let i = 0; i < enrolments.length; i += CONCURRENCY) {
        const subset = enrolments.slice(i, i + CONCURRENCY);
        const results = await Promise.allSettled(subset.map(updateStudentCourseEnrolmentStatuses));

        results.forEach((result) => {
          totalProcessed += 1;

          if (result.status === 'fulfilled') {
            totalSucceeded += 1;
            return;
          }

          totalFailed += 1;

          if (totalFailed === 1) {
            firstFailureMessage = String(result.reason);
          }
        });
      }

      const batchLastId = enrolments.length > 0 ? enrolments[enrolments.length - 1]?.id : undefined;

      if (batchLastId !== undefined) {
        lastProcessedId = batchLastId + 1;
      }

      span.log(
        `Batch ${batchIndex}: processed ${enrolments.length} enrolments (total processed: ${totalProcessed}).`,
        { stdout: true },
      );

      enrolments = enrolments.length === BATCH_SIZE ? await fetchNextBatch() : [];
    }

    span.setAttributes({
      batchCount: batchIndex,
      totalProcessed,
      totalSucceeded,
      totalFailed,
      lastProcessedId: lastProcessedId,
      concurrency: CONCURRENCY,
    });

    let failureSummary = '';
    if (totalFailed > 0) {
      span.warn(`Failed to update ${totalFailed} enrolments`, { stdout: true });
      failureSummary = `, ${totalFailed} failed. First error: ${firstFailureMessage}`;
    }

    return `Processed ${totalProcessed} course enrolments; ${totalSucceeded} succeeded${failureSummary}.`;
  },
};
