import { assertEquals } from "@std/assert";
import oxc from "oxc-parser";
import { generateInterfacePropertyReport } from "../index.ts";

const code = `
export interface A { id: string; name?: string | null; user?: string | B; }
export interface B { id: string; }
`;

Deno.test("generateInterfacePropertyReport picks optional/nullable/ref props", () => {
  const res = oxc.parseSync("test.ts", code);
  const report = generateInterfacePropertyReport(res.program);
  const a = report.find((r) => r.interfaceName === "A");
  if (!a) throw new Error("missing A");
  const props = a.properties.map((p) => ({
    name: p.name,
    optional: p.optional,
    containsNull: p.containsNull,
    refs: p.referencedTypes,
  }));
  assertEquals(props, [
    { name: "name", optional: true, containsNull: true, refs: [] },
    { name: "user", optional: true, containsNull: false, refs: ["B"] },
  ]);
});
