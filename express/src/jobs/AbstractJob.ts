export class AbstractJob {
  public static get key(): string {
    throw new Error("Must implement static getter 'key' in subclass");
  }

  public static async execute(): Promise<void> {
    // This job will be responsible for publishing meetings that are scheduled to be published.
    // It will check for meetings that have a publishScheduledFor time in the past and a status of 'scheduled',
    // and will update their status to 'published' and send out any necessary notifications.

    // Implementation details would go here, such as querying the database for meetings that need to be published,
    // updating their status, and sending notifications.
    throw new Error("Must implement static method 'execute' in subclass");
  }
}
