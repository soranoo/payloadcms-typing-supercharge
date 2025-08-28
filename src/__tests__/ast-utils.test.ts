import { assertEquals } from "@std/assert";
import { getProp, qualifiedNameToString, type NodeLike } from "@/depth-types-generator/ast-utils.ts";

Deno.test("getProp safely reads existing and missing keys", () => {
  const obj = { a: 1, b: { c: 2 } } as const;
  assertEquals(getProp<number>(obj, "a"), 1);
  assertEquals(getProp<number>(obj, "missing"), undefined);
  assertEquals(getProp<number>(null, "a"), undefined);
  assertEquals(getProp<number>(undefined, "a"), undefined);
});

Deno.test("qualifiedNameToString handles Identifier and TSQualifiedName", () => {
  const id: NodeLike = { type: "Identifier", name: "Foo" };
  const qn: NodeLike = {
    type: "TSQualifiedName",
    left: { type: "Identifier", name: "A" },
    right: { type: "Identifier", name: "B" },
  };
  assertEquals(qualifiedNameToString(id), "Foo");
  assertEquals(qualifiedNameToString(qn), "A.B");
});
