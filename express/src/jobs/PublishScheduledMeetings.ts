import { AbstractJob } from "./AbstractJob";

export class PublishScheduledMeetings extends AbstractJob {
  public static get key() {
    return "PublishScheduledMeetings";
  }

  public static async execute() {
    // TODO: Put logic here.
    console.log("Executing PublishScheduledMeetings job...");
  }
}
