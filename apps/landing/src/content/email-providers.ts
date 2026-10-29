import type { BrandKey } from "@/components/brands/data";

/**
 * What each @effect-kit/emails adapter declares it can honour, copied from the adapters'
 * `capabilities` (`packages/emails/src/providers/*`). Keep in sync with the package.
 */
export interface EmailCapabilities {
  readonly text: boolean;
  readonly html: boolean;
  readonly htmlAndText: boolean;
  readonly senderName: boolean;
  readonly cc: boolean;
  readonly bcc: boolean;
  readonly replyTo: "none" | "single" | "multiple";
  readonly headers: boolean;
  readonly attachments: boolean;
  readonly inlineAttachments: boolean;
  readonly idempotency: "unsupported" | "replay" | "reject";
}

export type EmailProviderId =
  | "resend"
  | "ses"
  | "postmark"
  | "sendgrid"
  | "mailgun"
  | "nodemailer"
  | "azure"
  | "mailersend"
  | "brevo"
  | "mailtrap"
  | "scaleway"
  | "zeptomail"
  | "mailchimp-transactional"
  | "lettermint"
  | "eusend"
  | "plunk";

export interface EmailProvider {
  readonly id: EmailProviderId;
  readonly name: string;
  /** Namespace used in `import * as X from "@effect-kit/emails/<id>"`. */
  readonly namespace: string;
  /** Provider SDK(s) installed alongside the package. */
  readonly sdk: string;
  readonly brand?: BrandKey;
  /** Layer construction shown in code (most adapters read credentials from Config). */
  readonly layer: string;
  readonly capabilities: EmailCapabilities;
}

const standard: EmailCapabilities = {
  text: true,
  html: true,
  htmlAndText: true,
  senderName: true,
  cc: true,
  bcc: true,
  replyTo: "multiple",
  headers: true,
  attachments: true,
  inlineAttachments: true,
  idempotency: "unsupported",
};

export const emailProviders: readonly EmailProvider[] = [
  {
    id: "resend",
    name: "Resend",
    namespace: "Resend",
    sdk: "resend",
    brand: "resend",
    layer: "Resend.layerConfig()",
    capabilities: { ...standard, idempotency: "replay" },
  },
  {
    id: "ses",
    name: "Amazon SES",
    namespace: "Ses",
    sdk: "@aws-sdk/client-sesv2",
    brand: "aws",
    layer: "Ses.layerConfig()",
    capabilities: standard,
  },
  {
    id: "postmark",
    name: "Postmark",
    namespace: "Postmark",
    sdk: "postmark",
    brand: "postmark",
    layer: "Postmark.layerConfig()",
    capabilities: standard,
  },
  {
    id: "sendgrid",
    name: "SendGrid",
    namespace: "SendGrid",
    sdk: "@sendgrid/mail",
    brand: "sendgrid",
    layer: "SendGrid.layerConfig()",
    capabilities: { ...standard, replyTo: "single" },
  },
  {
    id: "mailgun",
    name: "Mailgun",
    namespace: "Mailgun",
    sdk: "mailgun.js form-data",
    brand: "mailgun",
    layer: "Mailgun.layerConfig()",
    capabilities: { ...standard, inlineAttachments: false },
  },
  {
    id: "nodemailer",
    name: "SMTP · Nodemailer",
    namespace: "Nodemailer",
    sdk: "nodemailer",
    layer: "Nodemailer.layerConfig()",
    capabilities: standard,
  },
  {
    id: "azure",
    name: "Azure",
    namespace: "Azure",
    sdk: "@azure/communication-email",
    brand: "azure",
    layer: "Azure.layerConfig()",
    capabilities: { ...standard, senderName: false },
  },
  {
    id: "mailersend",
    name: "MailerSend",
    namespace: "MailerSend",
    sdk: "mailersend",
    layer: "MailerSend.layerConfig()",
    capabilities: { ...standard, replyTo: "single", attachments: false, inlineAttachments: false },
  },
  {
    id: "brevo",
    name: "Brevo",
    namespace: "Brevo",
    sdk: "@getbrevo/brevo",
    brand: "brevo",
    layer: "Brevo.layerConfig()",
    capabilities: {
      ...standard,
      replyTo: "single",
      attachments: false,
      inlineAttachments: false,
      idempotency: "reject",
    },
  },
  {
    id: "mailtrap",
    name: "Mailtrap",
    namespace: "Mailtrap",
    sdk: "mailtrap",
    brand: "mailtrap",
    layer: 'Mailtrap.layer({ token, mode: "production" })',
    capabilities: { ...standard, replyTo: "single" },
  },
  {
    id: "scaleway",
    name: "Scaleway",
    namespace: "Scaleway",
    sdk: "@scaleway/sdk-tem @scaleway/sdk-client",
    brand: "scaleway",
    layer: "Scaleway.layerConfig()",
    capabilities: { ...standard, inlineAttachments: false },
  },
  {
    id: "zeptomail",
    name: "ZeptoMail",
    namespace: "ZeptoMail",
    sdk: "zeptomail",
    brand: "zoho",
    layer: "ZeptoMail.layerConfig()",
    capabilities: standard,
  },
  {
    id: "mailchimp-transactional",
    name: "Mailchimp",
    namespace: "Mailchimp",
    sdk: "@mailchimp/mailchimp_transactional",
    brand: "mailchimp",
    layer: "Mailchimp.layerConfig()",
    capabilities: { ...standard, inlineAttachments: false },
  },
  {
    id: "lettermint",
    name: "Lettermint",
    namespace: "Lettermint",
    sdk: "lettermint",
    layer: "Lettermint.layerConfig()",
    capabilities: { ...standard, idempotency: "replay" },
  },
  {
    id: "eusend",
    name: "eusend",
    namespace: "Eusend",
    sdk: "@eusend_dev/sdk",
    layer: "Eusend.layerConfig()",
    capabilities: { ...standard, idempotency: "replay" },
  },
  {
    id: "plunk",
    name: "Plunk",
    namespace: "Plunk",
    sdk: "@plunk/node",
    brand: "plunk",
    layer: "Plunk.layerConfig()",
    capabilities: {
      ...standard,
      text: false,
      htmlAndText: false,
      cc: false,
      bcc: false,
      replyTo: "none",
      headers: false,
      attachments: false,
      inlineAttachments: false,
    },
  },
];

export function getEmailProvider(id: EmailProviderId): EmailProvider {
  const provider = emailProviders.find((entry) => entry.id === id);
  if (!provider) throw new Error(`Unknown email provider: ${id}`);
  return provider;
}

export const capabilityColumns = [
  { key: "text", label: "Text" },
  { key: "html", label: "HTML" },
  { key: "htmlAndText", label: "Both bodies" },
  { key: "senderName", label: "Sender name" },
  { key: "cc", label: "CC" },
  { key: "bcc", label: "BCC" },
  { key: "replyTo", label: "Reply-to" },
  { key: "headers", label: "Headers" },
  { key: "attachments", label: "Attachments" },
  { key: "inlineAttachments", label: "Inline images" },
  { key: "idempotency", label: "Idempotency" },
] as const satisfies readonly { key: keyof EmailCapabilities; label: string }[];
