# depth-types-generator

Generate depth-aware TypeScript interfaces for Payload-like schemas, and report optional/nullable/reference properties directly from source code.

## What it does

- Parses a TypeScript file using `oxc-parser` (fast Rust-based parser).
- Finds interfaces and emits depth variants: `Name_D0`, `Name_D1`, ..., up to a configurable max depth.
- Depth rules for relations of the form `string | RefType`:
  - Depth 0 → `string` (plus `null`/`undefined` if present)
  - Depth > 0 → drop `string`, keep `RefType_D{d-1}` (plus `null`/`undefined`)
- Array relations: `(string | RefType)[]` collapse to `string[]` at D0 and to `RefType_D{d-1}[]` at D>0.
- Preserves literal unions (e.g., `('admin' | 'user')[]`).
- Preserves object type literals and index signatures (e.g., `{ [k: string]: unknown }`).
- Includes a helper type `Depth<T, D>` that maps a base interface to its depth variant via an object map.
- Also provides a property report for interfaces (optional, null, undefined, referenced types) as JSON.

## Quick start

Prerequisites: Deno 1.45+.

- Generate from the sample config (collections only) and write to `export/payload-depth-types.ts`:

```cmd
deno task cli --in ./sample/payload-types.ts --out ./export/payload-depth-types.ts
```

- Run tests:

```cmd
deno task test
```

- Dev mode (runs the same generation as above):

```cmd
deno task dev
```

Notes:

- The parser uses a native binding. Tasks include `--allow-env` and `--allow-ffi` so it loads correctly on Windows.

## CLI

Invoke the CLI with flags (see `deno.json` task `cli` or run directly):

- `--in <path>`: The path of your `payload-types.ts`. Default: `./src/payload-types.ts`.
- `--out <dir>`: Output directory to write types. Default: `./src/__generated__/payloadcms-typing-supercharge`.
- `--depth <n>`: Max depth to emit (inclusive from 0..n). Default: `6`.

Examples:

```cmd
deno run --allow-read --allow-write --allow-env --allow-ffi cli.ts --in ./sample/payload-types.ts --out ./export/payload-depth-types.ts --depth 2
```

## Outputs

- `export/payload-depth-types.ts` – Generated depth interfaces and `Depth<T, D>` helper.
- `export/output.json` – Interface property report (optional, null, undefined, referenced types).

## Library API

You can also call the generator from code.

```ts
import oxc from "oxc-parser";
import {
  generateDepthInterfaces,
  generateInterfacePropertyReport,
} from "./src/index.ts";

const filename = "./sample/payload-types.ts";
const code = await Deno.readTextFile(filename);
const { program } = oxc.parseSync(filename, code);

const report = generateInterfacePropertyReport(program);
```

## How it works

- `src/ast-utils.ts`: Safe AST navigation helpers and qualified name rendering.
- `src/report.ts`: Walks type nodes to find optional/nullable/undefined/reference properties.
- `src/transform.ts`: Indexes interfaces and renders depth variants; preserves literals, index signatures; handles relation unions and arrays; includes `Depth<T, D>`.
- `dev.ts`: Sample runner wiring `sample/payload-types.ts` → `export/*`.
- `cli.ts`: Minimal flag parser for batch generation.

### Depth rules (summary)

- Union: `string | RefType` → D0: `string`; D>0: `RefType_D{d-1}` (plus `null`/`undefined` if present).
- Array: `(string | RefType)[]` → D0: `string[]`; D>0: `RefType_D{d-1}[]`.
- Literal unions and literal arrays preserved as-is.
- Index signatures preserved, e.g., `{ [k: string]: unknown }`.

## Troubleshooting

- If you see native binding errors from `oxc-parser`, ensure you run with `--allow-env --allow-ffi` (tasks already do this):

```cmd
deno test --allow-read --allow-env --allow-ffi
```

- When using the CLI directly, include `--allow-read --allow-write --allow-env --allow-ffi`.

## License

MIT (or your chosen license)
