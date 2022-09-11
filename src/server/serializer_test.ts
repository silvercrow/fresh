import { serialize } from "./serializer.ts";
import { assert, assertEquals } from "../../tests/deps.ts";
import { deserialize, KEY } from "../runtime/deserializer.ts";

Deno.test("serializer", () => {
  const data = {
    a: 1,
    b: "2",
    c: true,
    d: null,
    f: [1, 2, 3],
    g: { a: 1, b: 2, c: 3 },
    h: new Uint8Array([1, 2, 3]),
    i: { [KEY]: "u8a" },
  };
  const res = serialize(data);
  assert(res.requiresDeserializer);
  assert(!res.hasSignals);
  const deserialized = deserialize(res.serialized);
  assertEquals(deserialized, data);
});
