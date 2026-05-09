export interface BaseEmailTemplateInput {
  previewText?: string;
  heading?: string;
  bodyHtml: string;
  footerHtml?: string;
  appTitle?: string;
  logoUrl?: string;
}

const DEFAULT_APP_TITLE = "Writers' CheckIn";
const DEFAULT_LOGO_URL =
  "https://writerscheck.in/images/logo-white-transparent.png";

// Fallback hex values are included for older email clients.
const COLORS = {
  pageBackgroundHex: "#1f2f46",
  cardBackground: "#ffffff",
  cardBorder: "#dbe4f0",
  heading: "#0f172a",
  text: "#1e293b",
  mutedText: "#475569",
  accentHex: "#3568a6",
  accentOklch: "oklch(0.54 0.12 223)",
  codeBackground: "#f8fafc",
  codeBorder: "#cbd5e1",
  codeInlineBackground: "#d1d5db",
  codeInlineBorder: "#3b82f6",
  white: "#ffffff",
};

const BASE_FONT_FAMILY =
  "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

export const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export const emailTypography = {
  paragraph: (value: string, escape = false): string =>
    `<p style=\"margin: 0 0 16px; color: ${COLORS.text}; font-size: 16px; line-height: 1.6;\">${escape ? escapeHtml(value) : value}</p>`,

  muted: (value: string, escape = false): string =>
    `<p style=\"margin: 0 0 14px; color: ${COLORS.mutedText}; font-size: 14px; line-height: 1.6;\">${escape ? escapeHtml(value) : value}</p>`,

  codeBlock: (value: string, escape = false): string =>
    `<p style=\"margin: 0 0 18px; padding: 14px 16px; background: ${COLORS.codeBackground}; border: 1px solid ${COLORS.codeBorder}; border-radius: 10px; color: ${COLORS.heading}; font-size: 28px; line-height: 1; letter-spacing: 0.2em; font-weight: 700; text-align: center;\">${escape ? escapeHtml(value) : value}</p>`,

  codeLink: (value: string, href: string, escape = false): string =>
    `<p style=\"margin: 0 0 16px;\"><a href=\"${escape ? escapeHtml(href) : href}\" style=\"display: inline-block; padding: 10px 12px; background: ${COLORS.codeInlineBackground}; border: 1px solid ${COLORS.codeInlineBorder}; border-radius: 8px; color: ${COLORS.heading}; font-size: 18px; line-height: 1.5; font-weight: 700; text-decoration: none; word-break: break-all;\">${escape ? escapeHtml(value) : value}</a></p>`,
};

export const emailComponents = {
  button: (label: string, href: string, escape = false): string =>
    `<p style=\"margin: 0 0 20px;\"><a href=\"${escape ? escapeHtml(href) : href}\" style=\"display: inline-block; background: ${COLORS.accentHex}; background: ${COLORS.accentOklch}; color: ${COLORS.white}; font-size: 15px; font-weight: 600; line-height: 1; text-decoration: none; padding: 12px 16px; border-radius: 10px;\">${escape ? escapeHtml(label) : label}</a></p>`,
};

const BASE_URL = "https://writerscheck.in";

export const emailLinks = {
  joinGroup: (membershipId: string, inviteToken: string) =>
    `${BASE_URL}/join/${membershipId}?inviteToken=${encodeURIComponent(inviteToken)}`,
};

export const buildBaseEmailTemplate = (
  input: BaseEmailTemplateInput,
): string => {
  const appTitle = input.appTitle?.trim() || DEFAULT_APP_TITLE;
  const logoUrl = input.logoUrl?.trim() || DEFAULT_LOGO_URL;
  const heading = input.heading?.trim();
  const previewText = input.previewText?.trim();

  const contentHtml = [
    heading
      ? `<h1 style=\"margin: 0 0 16px; color: ${COLORS.heading}; font-size: 24px; line-height: 1.35; font-weight: 700;\">${escapeHtml(heading)}</h1>`
      : "",
    input.bodyHtml,
    input.footerHtml ??
      `<p style=\"margin: 24px 0 0; color: ${COLORS.mutedText}; font-size: 13px; line-height: 1.6;\">This is an automated message from ${escapeHtml(appTitle)}.</p>`,
  ]
    .filter((part) => part.length > 0)
    .join("");

  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '  <meta charset="utf-8" />',
    '  <meta name="viewport" content="width=device-width, initial-scale=1" />',
    `  <title>${escapeHtml(appTitle)}</title>`,
    "</head>",
    `<body style=\"margin: 0; padding: 0; background: ${COLORS.pageBackgroundHex}; font-family: ${BASE_FONT_FAMILY};\">`,
    previewText
      ? `  <div style=\"display: none; max-height: 0; overflow: hidden; opacity: 0;\">${escapeHtml(previewText)}</div>`
      : "",
    `<div style="background: ${COLORS.pageBackgroundHex};">`,
    '  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; background: inherit;">',
    "    <tr>",
    '      <td align="center" style="padding: 32px 16px;">',
    '        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; max-width: 600px;">',
    "          <tr>",
    '            <td align="center" style="padding-bottom: 18px;">',
    `              <img src=\"${escapeHtml(logoUrl)}\" alt=\"${escapeHtml(appTitle)} logo\" width=\"52\" height=\"52\" style=\"display: block; width: 52px; height: 52px; border: 0; margin: 0 auto 10px;\" />`,
    `              <div style=\"color: ${COLORS.white}; font-size: 24px; line-height: 1.25; font-weight: 700;\">${escapeHtml(appTitle)}</div>`,
    "            </td>",
    "          </tr>",
    "          <tr>",
    `            <td style=\"background: ${COLORS.cardBackground}; border: 1px solid ${COLORS.cardBorder}; border-radius: 14px; padding: 28px 24px;\">`,
    `              <div style=\"font-family: ${BASE_FONT_FAMILY};\">${contentHtml}</div>`,
    "            </td>",
    "          </tr>",
    "        </table>",
    "      </td>",
    "    </tr>",
    "  </table>",
    "</div>",
    "</body>",
    "</html>",
  ]
    .filter((part) => part.length > 0)
    .join("");
};
