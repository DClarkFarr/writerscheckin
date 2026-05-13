export const ATTENDANCE_EMAIL_MESSAGE_DEFAULT_TEMPLATE =
  "TODO: add template here";

export const PUBLISH_EMAIL_MESSAGE_DEFAULT_TEMPLATE = `<p>Good morning my author friends!</p>
<p>This is a reminder about our [meetingName] on [meetingDate] at [meetingTime] at [meetingAddress].</p>
<p>Please RSVP if you plan to attend AND if you have pages to read.
(Even if you're not reading, we need an accurate headcount to know how many copies to bring)</p>
[checkinButton]
<p><b>*To ensure your reservation, please respond to this email no later than 5pm [dateOfNotification]. </b></p>
<p>If we have more than six readers, this will allow us to reserve a second room in advance.</p>

<p>Warmly,</p>

<p>Administrator Name here</p>`;

export interface GroupMessageTemplateDefaults {
  publishEmailMessage: string;
  attendanceEmailMessage: string;
}

export const GROUP_MESSAGE_TEMPLATE_DEFAULTS: GroupMessageTemplateDefaults = {
  publishEmailMessage: PUBLISH_EMAIL_MESSAGE_DEFAULT_TEMPLATE,
  attendanceEmailMessage: ATTENDANCE_EMAIL_MESSAGE_DEFAULT_TEMPLATE,
};
