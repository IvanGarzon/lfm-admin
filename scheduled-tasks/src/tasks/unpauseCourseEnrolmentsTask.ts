import { djs } from '@duke-hq/djs';
import { TaskDefinition } from '../lib';
import { db } from '@duke-hq/svc-api-db/connection';
import { createProviderUserDrn } from '@duke-hq/drn/svc/provider';
import { createStudentUserDrn } from '@duke-hq/drn/svc/student';
import { StudentCourseEnrolmentStatus, AdminNoteType } from '@duke-hq/svc-api-db/client';
import { studentCourseEnrolmentApi } from '@duke-hq/svc-api/student/internal/courseEnrolment';
import { sendEmailNotification } from '@duke-hq/svc-api/provider/services/emailService';
import { getUserFullName } from '@duke-hq/lib';
import { Span } from '@duke-hq/libtracing';
import pLimit from 'p-limit';

const BATCH_SIZE = 100;
const CONCURRENCY = 5;

interface EnrolmentWithAdjustment {
  enrolment: {
    id: number;
    user_id: string;
    consultant_id: string | null;
    tenant_id: number | null;
    course_id: string;
    user: {
      email: string | null;
      first_name: string | null;
      last_name: string | null;
    };
    CourseEnrolmentScheduleAdjustments: {
      id: string;
      item_type: string;
      scheduled_start_date: Date;
    }[];
  };
  adjustment: {
    id: string;
    item_type: string;
    scheduled_start_date: Date;
  };
}

interface ProcessingResults {
  processed: number;
  errors: number;
}

interface NotificationData {
  supportUserId: string;
  student: {
    email: string | null;
    first_name: string | null;
    last_name: string | null;
  };
  consultant: {
    email: string | null;
    first_name: string | null;
    last_name: string | null;
  };
  courseTitle: string;
}

async function findPausedEnrolments() {
  return db.studentCourseEnrolment.findMany({
    where: {
      status: StudentCourseEnrolmentStatus.PAUSED,
      deleted_at: null,
      completed_at: null,
    },
    select: {
      id: true,
      user_id: true,
      consultant_id: true,
      tenant_id: true,
      course_id: true,
      user: {
        select: {
          email: true,
          first_name: true,
          last_name: true,
        },
      },
      CourseEnrolmentScheduleAdjustments: {
        where: {
          item_type: 'UNIT',
        },
        select: {
          id: true,
          item_type: true,
          scheduled_start_date: true,
        },
        orderBy: { scheduled_start_date: 'desc' },
      },
    },
    take: BATCH_SIZE,
    orderBy: { created_at: 'asc' },
  });
}

async function findSupportUser() {
  return db.user.findFirst({
    where: { email: 'support@duke.co' },
    select: { id: true },
  });
}

async function findCourse(courseId: string) {
  return db.course.findUnique({
    where: { id: courseId },
    select: { title: true },
  });
}

async function findConsultant(providerUserDrn: string) {
  return db.providerUser.findUnique({
    where: { drn: providerUserDrn },
    select: { email: true, first_name: true, last_name: true },
  });
}

function filterEligibleEnrolments(
  enrolments: Awaited<ReturnType<typeof findPausedEnrolments>>,
): EnrolmentWithAdjustment[] {
  return enrolments
    .map((enrolment) => {
      const adjustment = enrolment.CourseEnrolmentScheduleAdjustments?.find(
        (adj) => adj.item_type === 'UNIT' && adj.scheduled_start_date != null,
      );

      return adjustment && djs(adjustment.scheduled_start_date).isBefore(djs())
        ? { enrolment, adjustment }
        : null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

async function resumeEnrolment(
  enrolmentId: number,
  resumeDate: Date,
  scheduleAdjustmentId: string,
) {
  return studentCourseEnrolmentApi.resumeCourseEnrolment({
    enrolmentId,
    resumeAt: resumeDate,
    scheduleAdjustmentId,
  });
}

async function createAdminNote(supportUserId: string, studentDrn: string, providerUserDrn: string) {
  return db.adminNotes.create({
    data: {
      note_type: AdminNoteType.RESUMED_ENROLMENT,
      text: 'Resumed enrolment via scheduled task',
      date_time: new Date(),
      created_by: supportUserId,
      about_user_drn: studentDrn,
      with_user_drn: providerUserDrn,
    },
  });
}

function createUserDrns(userId: string, consultantId: string | null, tenantId: number | null) {
  const studentDrn = createStudentUserDrn(userId);
  const providerUserDrn =
    consultantId != null && tenantId != null ? createProviderUserDrn(consultantId, tenantId) : null;

  return { studentDrn, providerUserDrn };
}

function prepareNotificationData(
  supportUserId: string,
  student: {
    email: string | null;
    first_name: string | null;
    last_name: string | null;
  },
  consultant: {
    email: string | null;
    first_name: string | null;
    last_name: string | null;
  },
  courseTitle: string,
): NotificationData {
  return {
    supportUserId,
    student,
    consultant,
    courseTitle,
  };
}

async function sendResumedEnrolmentNotifications(data: NotificationData, span: Span) {
  const body = {
    from_id: data.supportUserId,
    to_id: data.supportUserId,
    type: 'email',
  };

  const studentFullName =
    getUserFullName({
      first_name: data.student.first_name,
      last_name: data.student.last_name,
    }) ?? '';

  const consultantFullName =
    getUserFullName({
      first_name: data.consultant.first_name,
      last_name: data.consultant.last_name,
    }) ?? '';

  const resumedEnrolmentProps = {
    studentName: data.student.first_name ?? '',
    studentFullName: studentFullName,
    courseTitle: data.courseTitle,
  };

  // Send email to the student
  try {
    await sendEmailNotification(
      'Your Enrolment Has Been Resumed',
      'resumedEnrolment',
      {
        ...resumedEnrolmentProps,
        isStudentEmail: true,
      },
      data.student.email ?? '',
      body,
    );
  } catch (error) {
    span.log(
      `Failed to send student email notification: ${error instanceof Error ? error.message : String(error)}`,
      { stdout: true },
    );
  }

  // Send email to the consultant
  try {
    await sendEmailNotification(
      `Resume Notification - ${resumedEnrolmentProps.studentName} From ${resumedEnrolmentProps.courseTitle}`,
      'resumedEnrolment',
      {
        ...resumedEnrolmentProps,
        consultantName: consultantFullName,
        isStudentEmail: false,
      },
      data.consultant.email ?? '',
      body,
    );
  } catch (error) {
    span.log(
      `Failed to send consultant email notification: ${error instanceof Error ? error.message : String(error)}`,
      { stdout: true },
    );
  }
}

async function processEnrolment(
  { enrolment, adjustment }: EnrolmentWithAdjustment,
  span: Span,
): Promise<
  { success: true; enrolmentId: number } | { success: false; enrolmentId: number; error: string }
> {
  try {
    // 1. Resume the enrolment
    await resumeEnrolment(
      enrolment.id,
      djs(adjustment.scheduled_start_date).toDate(),
      adjustment.id,
    );

    // 2. Get support user
    const supportUser = await findSupportUser();
    if (!supportUser) {
      span.log(`Support user not found, skipping admin note creation`, {
        stdout: true,
      });
      return { success: true, enrolmentId: enrolment.id };
    }

    // 3. Create user DRNs
    const { studentDrn, providerUserDrn } = createUserDrns(
      enrolment.user_id,
      enrolment.consultant_id,
      enrolment.tenant_id,
    );

    if (providerUserDrn === null) {
      span.log(
        `Provider user not found for enrolment ${enrolment.id}, skipping admin note creation`,
        { stdout: true },
      );

      return { success: true, enrolmentId: enrolment.id };
    }

    // 4. Create admin note
    await createAdminNote(supportUser.id, studentDrn, providerUserDrn);

    // 5. Get course details
    const course = await findCourse(enrolment.course_id);
    if (course === null) {
      span.log(`Course not found for enrolment ${enrolment.id}, skipping email notification`, {
        stdout: true,
      });

      return { success: true, enrolmentId: enrolment.id };
    }

    // 6. Get consultant details
    const consultant = await findConsultant(providerUserDrn);
    if (consultant === null) {
      span.log(`Consultant not found for enrolment ${enrolment.id}, skipping email notification`, {
        stdout: true,
      });

      return { success: true, enrolmentId: enrolment.id };
    }

    // 7. Send notification emails
    const notificationData = prepareNotificationData(
      supportUser.id,
      enrolment.user,
      consultant,
      course.title ?? '',
    );

    await sendResumedEnrolmentNotifications(notificationData, span);

    return { success: true, enrolmentId: enrolment.id };
  } catch (error) {
    return {
      success: false,
      enrolmentId: enrolment.id,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export const unpauseCourseEnrolmentsTask: TaskDefinition = {
  schedule: {
    cron: '0 1 * * *', // 1:00 AM every day
    timezone: 'Australia/Sydney',
    enabled: true,
  },
  timeout: 9,
  retryPolicy: 'retry-on-fail',
  handler: async (span: Span) => {
    // 1. Find all paused enrolments
    const enrolments = await findPausedEnrolments();

    // 2. Filter for eligible enrolments (those with past scheduled start dates)
    const eligibleEnrolments = filterEligibleEnrolments(enrolments);

    if (eligibleEnrolments.length === 0) {
      const message = `Found ${enrolments.length} paused enrolments, but none are eligible for unpausing`;
      span.log(message, { stdout: true });
      return message;
    }

    span.log(
      `Found ${eligibleEnrolments.length} eligible enrolments out of ${enrolments.length} paused enrolments`,
      { stdout: true },
    );

    // 3. Process enrolments with concurrency limit using p-limit
    const limit = pLimit(CONCURRENCY);
    const results: ProcessingResults = { processed: 0, errors: 0 };
    const failures: Array<{ enrolmentId: number; error: string }> = [];

    span.log(
      `Processing ${eligibleEnrolments.length} enrolments with concurrency limit of ${CONCURRENCY}`,
      {
        stdout: true,
      },
    );

    const processPromises = eligibleEnrolments.map((enrolmentData) =>
      limit(async () => {
        try {
          return await processEnrolment(enrolmentData, span);
        } catch (error) {
          return {
            success: false,
            enrolmentId: enrolmentData.enrolment.id,
            error: error instanceof Error ? error.message : String(error),
          } as const;
        }
      }),
    );

    const batchResults = await Promise.allSettled(processPromises);

    // Analyze results
    batchResults.forEach((result) => {
      if (
        result.status === 'fulfilled' &&
        typeof result.value === 'object' &&
        result.value !== null
      ) {
        if ('success' in result.value && result.value.success) {
          results.processed++;
        } else if ('success' in result.value && !result.value.success) {
          results.errors++;
          failures.push(result.value);
        }
      } else {
        results.errors++;
        const error: unknown = result.status === 'rejected' ? result.reason : 'Unknown error';
        failures.push({
          enrolmentId: -1,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

    // 4. Log failures
    if (failures.length > 0) {
      span.log(`Failed to process ${failures.length} enrolments:`, {
        stdout: true,
      });
      failures.slice(0, 10).forEach((failure) => {
        span.log(`  - Enrolment ${failure.enrolmentId}: ${failure.error}`, {
          stdout: true,
        });
      });

      if (failures.length > 10) {
        span.log(`  ... and ${failures.length - 10} more failures`, {
          stdout: true,
        });
      }

      // Only throw if more than 50% failed - allows partial success
      const failureRate = results.errors / eligibleEnrolments.length;
      if (failureRate > 0.5) {
        throw new Error(
          `Failed to process ${failures.length} out of ${eligibleEnrolments.length} enrolments (${(failureRate * 100).toFixed(1)}% failure rate). ${results.processed} were processed successfully.`,
        );
      }
    }

    span.setAttributes({
      totalEligible: eligibleEnrolments.length,
      processed: results.processed,
      errors: results.errors,
      successRate: ((results.processed / eligibleEnrolments.length) * 100).toFixed(1),
    });

    return `Completed: ${results.processed} processed successfully, ${results.errors} errors out of ${eligibleEnrolments.length} eligible enrolments`;
  },
};
