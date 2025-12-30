import { TaskDefinition } from '../lib';
import { example } from './example';
import { causeTimeframePayoutTask } from './causeTimeframePayoutTask';
import { causeMonthlyBonusTask } from './causeMonthlyBonusTask';
import { updateCourseEnrolmentHealthStatuses } from './updateCourseEnrolmentHealthStatuses';
import { unpauseCourseEnrolmentsTask } from './unpauseCourseEnrolmentsTask';

export const tasks: Record<string, TaskDefinition> = {
  example,
  causeTimeframePayoutTask,
  causeMonthlyBonusTask,
  updateCourseEnrolmentHealthStatuses,
  unpauseCourseEnrolmentsTask,
};
