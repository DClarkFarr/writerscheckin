import { buildBaseEmailTemplate, emailTypography } from "./baseEmailTemplate";

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
  const subject = "Your Writers CheckIn password reset code";

  const text = [
    `Hi ${greetingName},`,
    "",
    "Use this code to reset your Writers CheckIn password:",
    "",
    input.resetCode,
    "",
    `This code expires in ${input.expiresInMinutes} minutes.`,
    "If you did not request this reset, you can safely ignore this email.",
  ].join("\n");

  const html = buildBaseEmailTemplate({
    previewText: "Use this code to reset your Writers CheckIn password.",
    heading: "Password Reset Request",
    bodyHtml: [
      emailTypography.paragraph(`Hi ${greetingName},`),
      emailTypography.paragraph(
        "Use this code to reset your Writers CheckIn password:",
      ),
      emailTypography.codeBlock(input.resetCode),
      emailTypography.paragraph(
        `This code expires in ${input.expiresInMinutes} minutes.`,
      ),
      emailTypography.muted(
        "If you did not request this reset, you can safely ignore this email.",
      ),
    ].join(""),
  });

  return {
    subject,
    text,
    html,
  };
};
