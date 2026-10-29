import { type EmailProviderId, getEmailProvider } from "@/content/email-providers";

/**
 * The truth behind the figure. Each dial position is a real adapter, and whether its gate
 * opens wide enough for an enclosure comes from that adapter's declared `capabilities`.
 * `Email.send` runs `unsupportedFeature` before `submit`, so a message the adapter can't
 * carry fails with `EmailError { acceptance: "notSubmitted", reason: UnsupportedFeatureError }`
 * and no request is made. The message here has an HTML body (every adapter on the dial
 * supports `html`) and, when attached, one attachment.
 */
const DIAL: readonly EmailProviderId[] = ["resend", "postmark", "mailersend", "brevo", "plunk"];

export interface Station {
  readonly id: EmailProviderId;
  readonly name: string;
  readonly attachments: boolean;
}

export const STATIONS: readonly Station[] = DIAL.map((id) => {
  const provider = getEmailProvider(id);
  return { id, name: provider.name, attachments: provider.capabilities.attachments };
});

export interface Setup {
  readonly station: number;
  readonly attached: boolean;
}

export type Outcome =
  | { readonly kind: "sent" }
  | { readonly kind: "rejected"; readonly feature: "attachments" };

export const stationAt = (index: number): Station =>
  STATIONS[((index % STATIONS.length) + STATIONS.length) % STATIONS.length] as Station;

export function outcomeOf({ station, attached }: Setup): Outcome {
  return attached && !stationAt(station).attachments
    ? { kind: "rejected", feature: "attachments" }
    : { kind: "sent" };
}

export const requestsOf = (setup: Setup) => (outcomeOf(setup).kind === "sent" ? 1 : 0);

export function readoutOf(setup: Setup, decided: boolean) {
  const { name } = stationAt(setup.station);
  if (!decided) return `${name} · sending`;
  const outcome = outcomeOf(setup);
  return outcome.kind === "sent"
    ? `${name} · sent · 1 request`
    : `${name} · UnsupportedFeatureError: ${outcome.feature} · 0 requests`;
}

export function spokenOf(setup: Setup) {
  const { name } = stationAt(setup.station);
  const what = setup.attached ? "A message with an attachment" : "A message without attachments";
  return outcomeOf(setup).kind === "sent"
    ? `${what} through ${name}: sent, 1 request.`
    : `${what} through ${name}: EmailError with reason UnsupportedFeatureError, feature attachments, not submitted, 0 requests.`;
}

/** The pose the server renders and reduced motion keeps: an enclosure stopped at MailerSend's gate. */
export const REST_SETUP: Setup = { station: 2, attached: true };

/** The idle tour: alternate adapters that carry an enclosure with ones that refuse it. */
export const TOUR: readonly Setup[] = [
  { station: 0, attached: true },
  { station: 2, attached: true },
  { station: 2, attached: false },
  { station: 3, attached: true },
  { station: 1, attached: true },
  { station: 4, attached: true },
];
