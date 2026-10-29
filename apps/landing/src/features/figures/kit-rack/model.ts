import { emailProviders } from "@/content/email-providers";

/**
 * The truth behind the rack: each selector knob's detents are the Layers that package ships,
 * in the order the docs list them. Turning a knob changes which Layer is provided; the program
 * module and its cables never change.
 */

export type Selector = "redis" | "emails";

export const REDIS_LAYERS = [
  "RedisNode.layer",
  "RedisBun.layer",
  "RedisUpstash.layerConfig",
] as const;

// Mailtrap's layer takes an inline object; the readout keeps the call and elides the fields.
const shortLayer = (layer: string) => layer.replace(/\(\{.*\}\)$/, "({ … })");

export const EMAIL_LAYERS: readonly string[] = emailProviders.map((provider) =>
  shortLayer(provider.layer),
);

export const LAYERS: Record<Selector, readonly string[]> = {
  redis: REDIS_LAYERS,
  emails: EMAIL_LAYERS,
};

/**
 * Degrees between detents, and the angle of detent 0. 0° points to the back of the case; the
 * spans are centred on 150°, the side of the knob that faces the reader.
 */
export const DETENT: Record<Selector, { step: number; first: number }> = {
  redis: { step: 45, first: 105 },
  emails: { step: 300 / (EMAIL_LAYERS.length - 1), first: 0 },
};

export const angleOf = (selector: Selector, index: number) =>
  DETENT[selector].first + DETENT[selector].step * index;

export const nextIndex = (selector: Selector, index: number) =>
  (index + 1) % LAYERS[selector].length;

export const REST: Record<Selector, number> = { redis: 0, emails: 0 };

export const NAMES: Record<Selector, string> = { redis: "Redis", emails: "Emails" };

export const lineOf = (selector: Selector, index: number) =>
  `${NAMES[selector]}: ${LAYERS[selector][index] ?? ""}`;
