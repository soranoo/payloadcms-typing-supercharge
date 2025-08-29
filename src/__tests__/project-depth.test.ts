import { assertEquals, assertThrows } from "@std/assert";
import oxc from "oxc-parser";
import { generateDepthInterfaces } from "../depth-types-generator/transform.ts";

// Build a tiny schema and dynamically import the generated module to test runtime mappers
const schema = `
export interface User { id: string; name?: string | null; tenants?: { tenant: string | Tenant; id?: string | null }[] | null }
export interface Tenant { id: string; label: string }
export interface Profile {
  id: string;
  tenant: string | Tenant;
  owner: string | User;
  // inline object literal with a nested relation
  settings?: { theme?: string | null; nested?: string | Tenant } | null;
  // array of relations at top-level
  list?: (string | Tenant)[] | null;
}
export interface Config { collections: { users: User; tenants: Tenant; profiles: Profile } }
`;

const importGenerated = async () => {
  const res = oxc.parseSync("schema.ts", schema);
  const code = generateDepthInterfaces(res.program, 2);
  // data: URL module for the generated code
  const base64 = btoa(code);
  const url = `data:application/typescript;base64,${base64}`;
  return await import(url);
};

Deno.test("__getId basic behavior", async () => {
  const mod = await importGenerated();
  assertEquals(mod.__getId(undefined), undefined);
  assertEquals(mod.__getId(null), null);
  assertEquals(mod.__getId("x"), "x");
  assertEquals(mod.__getId(42), 42);
  assertEquals(mod.__getId({ id: "abc" }), "abc");
  const obj = { foo: 1 };
  assertEquals(mod.__getId(obj), obj); // no id field, passthrough
});

Deno.test("__pruneUndefined removes undefined deeply", async () => {
  const mod = await importGenerated();
  const input = {
    a: 1,
    b: undefined,
    c: { d: undefined, e: 2 },
    f: [1, undefined, { g: undefined, h: 3 }],
  };
  const pruned = mod.__pruneUndefined(input);
  // Implementation preserves array positions; only object keys are pruned
  assertEquals(pruned, { a: 1, c: { e: 2 }, f: [1, undefined, { h: 3 }] });
});

Deno.test("per-interface mapper maps D1 -> D0 for relations and prunes undefined", async () => {
  const mod = await importGenerated();
  // Build a User_D1 with an inline array of objects containing a nested relation
  const tenantD0 = { id: "t1", label: "Tenant 1" };
  const userD1 = {
    id: "u1",
    name: undefined,
    tenants: [
      { tenant: tenantD0, id: undefined },
      { tenant: "t2", id: "rel2" },
    ],
  } as unknown;
  const userD0 = mod.map_User_D1_to_D0(
    userD1 as unknown as ReturnType<typeof mod["map_User_D2_to_D1"]>,
  );
  // name should be pruned; nested relation inside inline object should collapse to string id at D0 (always strings)
  assertEquals(userD0, {
    id: "u1",
    tenants: [
      { tenant: "t1" },
      { tenant: "t2", id: "rel2" },
    ],
  });
});

Deno.test("projectDepth maps Profile D2 -> D1 and D0 respecting inline object vs refs", async () => {
  const mod = await importGenerated();
  type Depth = 0 | 1 | 2; // local help for readability

  const profileD2 = {
    id: "p1",
    tenant: { id: "t1", label: "Tenant 1" },
    owner: {
      id: "u1",
      name: "Ann",
      tenants: [{ tenant: { id: "t2", label: "T2" } }],
    },
    settings: { theme: "dark", nested: { id: "t3", label: "T3" } },
    list: [{ id: "t4", label: "T4" }],
  } as unknown;

  // D2 -> D1: top-level tenant becomes Tenant_D0 object; owner becomes User_D0; inline object 'settings.nested' collapses to string; list[] becomes Tenant_D0[]
  // @ts-ignore bypass types from dynamic import
  const p1 = mod.projectDepth(profileD2, "profiles", 2 as Depth, 1 as Depth);
  assertEquals(p1, {
    id: "p1",
    tenant: { id: "t1", label: "Tenant 1" },
    owner: {
      id: "u1",
      name: "Ann",
      tenants: [{ tenant: "t2" }],
    },
    settings: { theme: "dark", nested: "t3" },
    list: [{ id: "t4", label: "T4" }],
  });

  // D1 -> D0: all relations collapse to IDs; inline object primitives preserved
  const profileD1 = p1 as unknown;
  // @ts-ignore bypass types from dynamic import
  const p0 = mod.projectDepth(profileD1, "profiles", 1 as Depth, 0 as Depth);
  assertEquals(p0, {
    id: "p1",
    tenant: "t1",
    owner: "u1",
    settings: { theme: "dark", nested: "t3" },
    list: ["t4"],
  });
});

// Test error when project from low level to high level
Deno.test("projectDepth throws error when projecting from low to high level", async () => {
  const mod = await importGenerated();
  const profileD0 = {
    id: "p1",
    tenant: "t1",
    owner: "u1",
    settings: { theme: "dark", nested: "t3" },
    list: ["t4"],
  } as unknown;
  // @ts-ignore bypass types from dynamic import
  assertThrows(() => mod.projectDepth(profileD0, "profiles", 0, 1));
});
