/**
 * This module contains a serializer for island props. The serializer is capable
 * of serializing the following:
 *
 * - `null`
 * - `boolean`
 * - `number`
 * - `string`
 * - `array`
 * - `object` (no prototypes)
 * - `Uint8Array`
 *
 * The corresponding deserializer is in `src/runtime/deserializer.ts`.
 */
import type { Signal } from "@preact/signals";
import { KEY } from "../runtime/deserializer.ts";

interface SerializeResult {
  /** The string serialization. */
  serialized: string;
  /** If the deserializer is required to deserialize this string. If this is
   * `false` the serialized string can be deserialized with `JSON.parse`. */
  requiresDeserializer: boolean;
  /** If the serialization contains serialized signals. If this is `true` the
   * deserializer must be passed a factory functions for signals. */
  hasSignals: boolean;
}

// deno-lint-ignore no-explicit-any
function isSignal(x: any): x is Signal {
  return (
    x !== null &&
    typeof x === "object" &&
    typeof x.peek === "function" &&
    "value" in x
  );
}

export function serialize(data: unknown): SerializeResult {
  let requiresDeserializer = false;
  const signals: Signal[] = [];

  function replacer(_key: string, value: unknown): unknown {
    if (isSignal(value)) {
      requiresDeserializer = true;
      const newSignal = !signals.includes(value);
      if (newSignal) signals.push(value);
      return { [KEY]: "s", i: signals.indexOf(value), v: value.peek() };
    } else if (value instanceof Uint8Array) {
      requiresDeserializer = true;
      return { [KEY]: "u8a", d: b64encode(value) };
    } else if (typeof value === "object" && value && KEY in value) {
      requiresDeserializer = true;
      // deno-lint-ignore no-explicit-any
      const v: any = { ...value };
      const k = v[KEY];
      delete v[KEY];
      return { [KEY]: "l", k, v };
    } else {
      return value;
    }
  }

  const serialized = JSON.stringify(data, replacer);
  return {
    serialized,
    requiresDeserializer,
    hasSignals: signals.length > 0,
  };
}

// deno-fmt-ignore
const base64abc = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O",
  "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "a", "b", "c", "d",
  "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s",
  "t", "u", "v", "w", "x", "y", "z", "0", "1", "2", "3", "4", "5", "6", "7",
  "8", "9", "+", "/",
];

/**
 * CREDIT: https://gist.github.com/enepomnyaschih/72c423f727d395eeaa09697058238727
 * Encodes a given Uint8Array, ArrayBuffer or string into RFC4648 base64 representation
 */
export function b64encode(buffer: ArrayBuffer): string {
  const uint8 = new Uint8Array(buffer);
  let result = "",
    i;
  const l = uint8.length;
  for (i = 2; i < l; i += 3) {
    result += base64abc[uint8[i - 2] >> 2];
    result += base64abc[((uint8[i - 2] & 0x03) << 4) | (uint8[i - 1] >> 4)];
    result += base64abc[((uint8[i - 1] & 0x0f) << 2) | (uint8[i] >> 6)];
    result += base64abc[uint8[i] & 0x3f];
  }
  if (i === l + 1) {
    // 1 octet yet to write
    result += base64abc[uint8[i - 2] >> 2];
    result += base64abc[(uint8[i - 2] & 0x03) << 4];
    result += "==";
  }
  if (i === l) {
    // 2 octets yet to write
    result += base64abc[uint8[i - 2] >> 2];
    result += base64abc[((uint8[i - 2] & 0x03) << 4) | (uint8[i - 1] >> 4)];
    result += base64abc[(uint8[i - 1] & 0x0f) << 2];
    result += "=";
  }
  return result;
}
