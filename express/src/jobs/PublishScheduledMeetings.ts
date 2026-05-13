import { AbstractJob, type JobExecutionResult } from "./AbstractJob";
import { publishDueMeetingsBatch } from "../services/groupMeetingsService";

export class PublishScheduledMeetings extends AbstractJob {
  public static get key(): string {
    return "PublishScheduledMeetings";
  }

  public static async execute(): Promise<JobExecutionResult> {
    const startedAt = new Date();

    const batch = await publishDueMeetingsBatch({
      now: startedAt,
      windowMinutes: 20,
      limit: 500,
    });

    console.info(
      `[${PublishScheduledMeetings.key}] candidates=${batch.candidateCount} published=${batch.publishedCount} skipped=${batch.skippedCount} errors=${batch.errorCount}`,
    );

    return {
      jobKey: PublishScheduledMeetings.key,
      startedAt: startedAt.toISOString(),
      finishedAt: new Date().toISOString(),
      succeeded: batch.errorCount === 0,
      summary: `Published ${batch.publishedCount} of ${batch.candidateCount} due meetings.`,
    };
  }
}
