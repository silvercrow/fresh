import type { Signal } from "@preact/signals";

export const KEY = "_f";

export function b64decode(b64: string): Uint8Array {
  const binString = atob(b64);
  const size = binString.length;
  const bytes = new Uint8Array(size);
  for (let i = 0; i < size; i++) {
    bytes[i] = binString.charCodeAt(i);
  }
  return bytes;
}

export function deserialize(str: string, signal?: () => Signal): unknown {
  const signals: Signal[] = [];

  function reviver(_key: string, value: unknown): unknown {
    if (typeof value === "object" && value && KEY in value) {
      // deno-lint-ignore no-explicit-any
      const v: any = value;
      if (v[KEY] === "s") {
        if (!signals[v.i]) signals[v.i] = signal!();
        if (v.v !== undefined) signals[v.i].value = v.v;
        return signals[v.i];
      }
      if (v[KEY] === "u8a") {
        return b64decode(v.d);
      }
      if (v[KEY] === "l") {
        const val = v.v;
        val[KEY] = v.k;
        return val;
      }
      throw new Error(`Unknown key: ${v[KEY]}`);
    }
    return value;
  }

  return JSON.parse(str, reviver);
}
