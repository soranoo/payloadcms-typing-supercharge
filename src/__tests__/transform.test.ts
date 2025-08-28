import { assertStringIncludes } from "@std/assert";
import oxc from "oxc-parser";
import { generateDepthInterfaces } from "../depth-types-generator/transform.ts";

const code = `
export interface Foo { id: string; }
export interface Bar { owner: string | Foo; tags: ('x' | 'y')[]; list?: (string | Foo)[] | null; }
export interface Baz { value?: { [k: string]: unknown } | unknown[] | string | number | boolean | null }
export interface Config {
  collections: {
    foo: Foo;
    bar: Bar;
  baz: Baz;
  }
}
`;

Deno.test("generateDepthInterfaces applies depth to relations and preserves literal unions", () => {
  const res = oxc.parseSync("test.ts", code);
  const out = generateDepthInterfaces(res.program, 2);
  // D0: owner is string
  assertStringIncludes(out, "export interface Bar_D0");
  assertStringIncludes(out, "owner: string;");
  // D1: owner is Foo_D0 (no string) and array element collapses to Foo_D0[]
  assertStringIncludes(out, "export interface Bar_D1");
  assertStringIncludes(out, "owner: Foo_D0;");
  assertStringIncludes(out, "list?: Foo_D0[] | null;");
  // Literal union array preserved across depths
  assertStringIncludes(out, "tags: ('x' | 'y')[];");
  // Depth helper exists and maps Bar by collection key name
  assertStringIncludes(out, "export type DepthQuery<");
  assertStringIncludes(out, "Name extends \"bar\" ? Bar_D0");
  // Independent Depth type is exported
  assertStringIncludes(out, "export type Depth = 0 | 1 | 2");

  // Index signature object inside union is preserved (not `{ }`)
  assertStringIncludes(out, "[k: string]: unknown");
});
