export interface JobExecutionResult {
  jobKey: string;
  startedAt: string;
  finishedAt: string;
  succeeded: boolean;
  summary?: string;
}

export class AbstractJob {
  public static get key(): string {
    throw new Error("Must implement static getter 'key' in subclass");
  }

  public static async execute(): Promise<JobExecutionResult> {
    throw new Error("Must implement static method 'execute' in subclass");
  }
}
