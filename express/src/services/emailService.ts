import nodemailer from "nodemailer";
import { env } from "../utils/env";

export interface SendEmailInput {
  to: string;
  subject: string;
  text: string;
  html: string;
}

const assertMailerConfigured = (): void => {
  if (!env.MAILER_GMAIL_USER) {
    throw new Error("MAILER_GMAIL_USER is not configured.");
  }

  if (!env.MAILER_GMAIL_PASS) {
    throw new Error("MAILER_GMAIL_PASS is not configured.");
  }

  if (!env.MAILER_FROM_EMAIL) {
    throw new Error("MAILER_FROM_EMAIL is not configured.");
  }
};

const getTransport = () => {
  assertMailerConfigured();

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: env.MAILER_GMAIL_USER,
      pass: env.MAILER_GMAIL_PASS,
    },
  });
};

const getFromAddress = (): string => {
  const fromName = env.MAILER_FROM_NAME || "Plotstack";
  return `${fromName} <${env.MAILER_FROM_EMAIL}>`;
};

export const sendEmail = async (input: SendEmailInput): Promise<void> => {
  const transport = getTransport();

  await transport.sendMail({
    from: getFromAddress(),
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });
};
