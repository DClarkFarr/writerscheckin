export const ATTENDANCE_EMAIL_MESSAGE_DEFAULT_TEMPLATE = `
  <p>Hello my author friends!</p>
  <p>Our next meeting of [groupName] is coming up on [meetingDate] at [meetingTime] at [meetingAddress].</p>
  <p>I'm very excited to see all of you there!</p>
  <p>&nbsp;</p>
  <p>Below, here are the current RSVPs for this meeting</p>
  [attendanceList]
  <p>&nbsp;</p>
  <p>If you have not RSVP'd you can still come and participate. If you have pages to share, please contact the group admin at: <b>[adminEmail]</b>.</p>
  <p>&nbsp;</p>
  <p>Warmly,</p>
  <p>Administrator Name here</p>
`;

export const PUBLISH_EMAIL_MESSAGE_DEFAULT_TEMPLATE = `
  <p>Good morning my author friends!</p>
  <p>This is a reminder about the next meeting of our group, [meetingName], on [meetingDate] at [meetingTime] at [meetingAddress].</p>
  <p>Please RSVP if you plan to attend AND if you have pages to read.
  (Even if you're not reading, we need an accurate headcount to know how many copies to bring)</p>
  <p>&nbsp;</p>
  [checkinButton]
  <p>&nbsp;</p>
  <p><b>*To ensure your reservation, please respond to this email no later than 5pm [dateOfNotification]. </b></p>
  <p>If we have more than six readers, this will allow us to reserve a second room in advance.</p>
  <p>&nbsp;</p>
  <p>Warmly,</p>
  <p>Administrator Name here</p>
`;

export interface GroupMessageTemplateDefaults {
  publishEmailMessage: string;
  attendanceEmailMessage: string;
}

export const GROUP_MESSAGE_TEMPLATE_DEFAULTS: GroupMessageTemplateDefaults = {
  publishEmailMessage: PUBLISH_EMAIL_MESSAGE_DEFAULT_TEMPLATE,
  attendanceEmailMessage: ATTENDANCE_EMAIL_MESSAGE_DEFAULT_TEMPLATE,
};
