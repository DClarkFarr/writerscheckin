export interface PasswordResetEmailInput {
  firstName?: string;
  resetCode: string;
  expiresInMinutes: number;
}

export interface PasswordResetEmailContent {
  subject: string;
  text: string;
  html: string;
}

export const buildPasswordResetEmail = (
  input: PasswordResetEmailInput,
): PasswordResetEmailContent => {
  const greetingName = input.firstName?.trim() || "there";
  const subject = "Your Plotstack password reset code";

  const text = [
    `Hi ${greetingName},`,
    "",
    "Use this code to reset your Plotstack password:",
    "",
    input.resetCode,
    "",
    `This code expires in ${input.expiresInMinutes} minutes.`,
    "If you did not request this reset, you can safely ignore this email.",
  ].join("\n");

  const html = [
    `<p>Hi ${greetingName},</p>`,
    "<p>Use this code to reset your Plotstack password:</p>",
    `<p style=\"font-size: 24px; font-weight: bold; letter-spacing: 0.2em;\">${input.resetCode}</p>`,
    `<p>This code expires in <strong>${input.expiresInMinutes} minutes</strong>.</p>`,
    "<p>If you did not request this reset, you can safely ignore this email.</p>",
  ].join("");

  return {
    subject,
    text,
    html,
  };
};
