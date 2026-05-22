import { AbstractJob, type JobExecutionResult } from "./AbstractJob";
import {
  announceUpcomingMeetingAttendanceBatch,
  publishDueMeetingsBatch,
} from "../services/groupMeetingsService";

export class AnnounceMeetingAttendance extends AbstractJob {
  public static readonly verbose = true;

  public static get key(): string {
    return "AnnounceMeetingAttendance";
  }

  public static async execute(): Promise<JobExecutionResult> {
    const startedAt = new Date();

    const batch = await announceUpcomingMeetingAttendanceBatch({
      now: startedAt,
      windowMinutes: 20,
      limit: 500,
    });

    console.info(
      `[${AnnounceMeetingAttendance.key}] emails=${batch.emailCount} meetings=${batch.meetingCount} errors=${batch.errorCount}`,
    );

    if (AnnounceMeetingAttendance.verbose && batch.results.length > 0) {
      console.info(`[${AnnounceMeetingAttendance.key}] Detailed results:`);

      console.table(
        batch.results.map((row) => ({
          meeting: row.groupName ?? row.meetingId,
          occursAt: row.occursAt ?? "-",
          notifyAt: row.notifyAt ?? "-",
          emailsSent: row.emailSentCount,
        })),
      );
    }

    return {
      jobKey: AnnounceMeetingAttendance.key,
      startedAt: startedAt.toISOString(),
      finishedAt: new Date().toISOString(),
      succeeded: batch.errorCount === 0,
      summary: `Emailed ${batch.emailCount} atendees for meeting ${batch.meetingCount}.`,
    };
  }
}
