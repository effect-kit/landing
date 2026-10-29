/**
 * Redis Cluster hash slots, computed exactly as the server does, so the cluster ring places keys
 * where a real cluster would.
 */
export const SLOTS = 16384;

/** CRC16-XMODEM, as used by Redis Cluster. */
function crc16(input: string) {
  let crc = 0;

  for (const byte of new TextEncoder().encode(input)) {
    crc ^= byte << 8;
    for (let bit = 0; bit < 8; bit++)
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }

  return crc;
}

/** Hash only the first non-empty `{hash tag}` when present, as Redis does. */
export function keySlot(key: string) {
  const open = key.indexOf("{");

  if (open !== -1) {
    const close = key.indexOf("}", open + 1);
    if (close > open + 1) return crc16(key.slice(open + 1, close)) % SLOTS;
  }

  return crc16(key) % SLOTS;
}
