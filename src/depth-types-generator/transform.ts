import { getProp, type NodeLike, qualifiedNameToString } from "./ast-utils.ts";

/**
 * Depth-based type transformer
 *
 * This module walks a parsed TypeScript Program (via `oxc-parser`) and:
 * - indexes interface declarations present in the source file
 * - requires a `Config` interface with a `collections` object; only interfaces referenced there are generated
 * - renders depth-variant interfaces `<Name>_D0.._Dn` where relations of the form
 *   `string | RefType` collapse to `string` at D0 and expand to `RefType_D{d-1}` at D>0
 * - preserves literal unions (e.g., ("a" | "b")[])
 * - handles arrays of relation unions (e.g., (string | RefType)[])
 * - preserves object type literals including index signatures (e.g., { [k: string]: unknown })
 * - emits a generic helper `DepthQuery<Name, D>` mapping collection keys (from `Config.collections`) to their depth variants
 */

type InterfaceMember = {
  name: string;
  optional: boolean;
  typeNode?: NodeLike | null;
};

type InterfaceDecl = {
  name: string;
  members: InterfaceMember[];
  node: NodeLike;
};

/**
 * Collect all top-level interface declarations in the file.
 * Supports both direct and `export interface` forms.
 */
const collectInterfaces = (program: unknown): Map<string, InterfaceDecl> => {
  const map = new Map<string, InterfaceDecl>();
  const bodyUnknown = (program as { body?: unknown } | undefined)?.body;
  const stmts: NodeLike[] = Array.isArray(bodyUnknown)
    ? (bodyUnknown as NodeLike[])
    : [];
  for (const stmt of stmts) {
    let ifaceDecl: NodeLike | null = null;
    const stmtType = getProp<string>(stmt, "type");
    if (stmtType === "TSInterfaceDeclaration") ifaceDecl = stmt;
    else if (stmtType === "ExportNamedDeclaration") {
      const decl = getProp<NodeLike>(stmt, "declaration");
      if (getProp<string>(decl, "type") === "TSInterfaceDeclaration") {
        ifaceDecl = decl ?? null;
      }
    }
    if (!ifaceDecl) continue;

    const idNode = getProp<NodeLike>(ifaceDecl, "id");
    const name = getProp<string>(idNode, "name") ?? "<anonymous>";
    const members: InterfaceMember[] = [];
    const bodyNode = getProp<NodeLike>(ifaceDecl, "body");
    const mlist = getProp<NodeLike[]>(bodyNode, "body") ?? [];
    for (const m of mlist) {
      if (getProp<string>(m, "type") !== "TSPropertySignature") continue;
      const keyNode = getProp<NodeLike>(m, "key");
      const keyName = getProp<string>(keyNode, "name") ??
        (getProp<string>(keyNode, "value") ?? "<computed>");
      const optional = Boolean(getProp<boolean>(m, "optional"));
      const typeAnnotation = getProp<NodeLike>(m, "typeAnnotation");
      const typeNode = getProp<NodeLike>(typeAnnotation, "typeAnnotation");
      members.push({ name: String(keyName), optional, typeNode });
    }
    map.set(name, { name, members, node: ifaceDecl });
  }
  return map;
};

/**
 * Collect names of referenced type identifiers under any type node.
 * Used by configuration parsing helpers.
 */
const collectTypeRefNames = (
  node: NodeLike | undefined | null,
  out: Set<string>,
) => {
  if (!node || typeof node !== "object") return;
  switch (node.type) {
    case "TSTypeReference": {
      const name = qualifiedNameToString(
        (node as { typeName?: NodeLike }).typeName,
      );
      if (name) out.add(name);
      const targs =
        (node as { typeArguments?: { params?: NodeLike[] } }).typeArguments;
      if (targs?.params) {
        targs.params.forEach((p) => collectTypeRefNames(p, out));
      }
      return;
    }
    case "TSArrayType":
      return collectTypeRefNames(
        (node as { elementType?: NodeLike }).elementType,
        out,
      );
    case "TSUnionType":
    case "TSIntersectionType": {
      const arr = (node as { types?: NodeLike[] }).types ?? [];
      arr.forEach((t) => collectTypeRefNames(t, out));
      return;
    }
    case "TSParenthesizedType":
      return collectTypeRefNames(
        (node as { typeAnnotation?: NodeLike }).typeAnnotation,
        out,
      );
    case "TSTypeLiteral": {
      const mems = (node as { members?: NodeLike[] }).members ?? [];
      for (const m of mems) {
        const ta = (m as { typeAnnotation?: { typeAnnotation?: NodeLike } })
          .typeAnnotation?.typeAnnotation;
        collectTypeRefNames(ta, out);
      }
      return;
    }
    default: {
      for (const k of Object.keys(node)) {
        const v = (node as Record<string, unknown>)[k];
        if (v && typeof v === "object") {
          if (Array.isArray(v)) {
            v.forEach((it) => collectTypeRefNames(it as NodeLike, out));
          } else collectTypeRefNames(v as NodeLike, out);
        }
      }
    }
  }
};

/**
 * Find the first referenced type name under a type node, by walking common wrappers.
 */
const findFirstTypeRefName = (
  node: NodeLike | undefined | null,
): string | undefined => {
  if (!node || typeof node !== "object") return undefined;
  switch (node.type) {
    case "TSTypeReference":
      return qualifiedNameToString((node as { typeName?: NodeLike }).typeName);
    case "TSArrayType":
      return findFirstTypeRefName(
        (node as { elementType?: NodeLike }).elementType,
      );
    case "TSParenthesizedType":
      return findFirstTypeRefName(
        (node as { typeAnnotation?: NodeLike }).typeAnnotation,
      );
    case "TSUnionType":
    case "TSIntersectionType": {
      const types = (node as { types?: NodeLike[] }).types ?? [];
      for (const t of types) {
        const name = findFirstTypeRefName(t);
        if (name) return name;
      }
      return undefined;
    }
    case "TSTypeLiteral": {
      const members = (node as { members?: NodeLike[] }).members ?? [];
      for (const m of members) {
        const ta = (m as { typeAnnotation?: { typeAnnotation?: NodeLike } })
          .typeAnnotation?.typeAnnotation;
        const name = findFirstTypeRefName(ta as NodeLike);
        if (name) return name;
      }
      return undefined;
    }
    default:
      return undefined;
  }
};

/**
// removed getCollectionsTypeNames; we now always require Config.collections

/**
 * Parse `interface Config { collections: { key: SomeType } }` and return a mapping
 * from the collection key (string) to the referenced type name (e.g., "users" -> "User").
 */
const getCollectionsKeyToType = (program: unknown): Map<string, string> => {
  const map = new Map<string, string>();
  const body = (program as { body?: NodeLike[] }).body ??
    [] as unknown as NodeLike[];
  for (const stmt of body) {
    let ifaceDecl: NodeLike | null = null;
    if (stmt.type === "TSInterfaceDeclaration") ifaceDecl = stmt;
    else if (stmt.type === "ExportNamedDeclaration") {
      const decl = (stmt as { declaration?: NodeLike }).declaration;
      if (decl?.type === "TSInterfaceDeclaration") ifaceDecl = decl;
    }
    if (!ifaceDecl) continue;
    const { id } = ifaceDecl as { id?: NodeLike };
    const name = id?.type === "Identifier"
      ? (id as { name?: string }).name
      : undefined;
    if (name !== "Config") continue;
    const bodyNode = (ifaceDecl as { body?: NodeLike }).body;
    const members = (bodyNode as { body?: NodeLike[] })?.body ?? [];
    for (const m of members) {
      if (m.type !== "TSPropertySignature") continue;
      const { key } = m as { key?: NodeLike };
      const keyName = (key?.type === "Identifier"
        ? (key as { name?: string }).name
        : (key as { value?: string })?.value) as string | undefined;
      if (keyName !== "collections") {
        continue;
      }
      const ta = (m as { typeAnnotation?: { typeAnnotation?: NodeLike } })
        .typeAnnotation?.typeAnnotation;
      if (!ta || ta.type !== "TSTypeLiteral") {
        return map;
      }
      const cols = (ta as { members?: NodeLike[] }).members ?? [];
      for (const col of cols) {
        if (col.type !== "TSPropertySignature") {
          continue;
        }
        const ckey = (col as { key?: NodeLike }).key;
        const ckeyName = (ckey?.type === "Identifier"
          ? (ckey as { name?: string }).name
          : (ckey as { value?: string })?.value) as string | undefined;
        const cta = (col as { typeAnnotation?: { typeAnnotation?: NodeLike } })
          .typeAnnotation?.typeAnnotation;
        const tname = findFirstTypeRefName(cta as NodeLike);
        if (ckeyName && tname) {
          map.set(String(ckeyName), tname);
        }
      }
      return map;
    }
  }
  return map;
};

/**
 * Render literal TS types (string/number/boolean literals) to source text.
 */
const stringifyLiteralType = (node: NodeLike): string => {
  const lit = (node as { literal?: NodeLike }).literal ??
    (node as unknown as NodeLike);
  const litType = getProp<string>(lit, "type");
  if (litType === "StringLiteral") {
    const raw = getProp<string>(lit, "raw");
    const value = getProp<string>(lit, "value");
    if (raw && typeof raw === "string") return raw;
    if (typeof value === "string") return `'${value.replace(/'/g, "\\'")}'`;
    return "''";
  }
  if (litType === "NumericLiteral") {
    const raw = getProp<string>(lit, "raw");
    const value = getProp<number>(lit, "value");
    return raw ?? String(value ?? "NaN");
  }
  if (litType === "BooleanLiteral") {
    const value = getProp<boolean>(lit, "value");
    return String(value);
  }
  const vAny = (lit as unknown as { value?: unknown }).value;
  if (typeof vAny === "string") {
    return `'${(vAny as string).replace(/'/g, "\\'")}'`;
  }
  if (typeof vAny === "number") return String(vAny);
  if (typeof vAny === "boolean") return String(vAny);
  return "unknown";
};

/**
 * Flatten a union possibly nested within parentheses into a flat list of nodes.
 */
const flattenUnionTypes = (node: NodeLike): NodeLike[] => {
  if (node.type === "TSUnionType") {
    const types = (node as { types?: NodeLike[] }).types ?? [];
    const out: NodeLike[] = [];
    for (const t of types) out.push(...flattenUnionTypes(t));
    return out;
  }
  if (node.type === "TSParenthesizedType") {
    const inner = (node as { typeAnnotation?: NodeLike }).typeAnnotation;
    return inner ? flattenUnionTypes(inner) : [node];
  }
  return [node];
};

/**
 * If the node is a TSTypeReference, return the qualified name as string.
 */
const refName = (node: NodeLike | undefined): string | undefined => {
  if (!node) return undefined;
  if (node.type === "TSTypeReference") {
    return qualifiedNameToString((node as { typeName?: NodeLike }).typeName);
  }
  return undefined;
};

/**
 * Given flattened union parts, if the union looks like a relation of the form
 * `string | RefType` (optionally with null/undefined), apply depth rules:
 * - depth 0 -> "string" (+ null/undefined if present)
 * - depth > 0 -> drop string, keep RefType as `<Name>_D{depth-1}` if available
 */
const transformRelationUnionParts = (
  parts: NodeLike[],
  depth: number,
  ifaceMap: Map<string, InterfaceDecl>,
): string => {
  const hasString = parts.some((p) => p.type === "TSStringKeyword");
  const hasNull = parts.some((p) => p.type === "TSNullKeyword");
  const hasUndefined = parts.some((p) => p.type === "TSUndefinedKeyword");
  const refParts = parts.filter((p) => p.type === "TSTypeReference");
  if (!(hasString && refParts.length > 0)) return "";
  if (depth <= 0) {
    return [
      "string",
      hasNull ? "null" : undefined,
      hasUndefined ? "undefined" : undefined,
    ]
      .filter(Boolean)
      .join(" | ");
  }
  // Depth > 0: drop string (ID) and keep only refs + null/undefined
  const refs = refParts.map((rp) => {
    const name = refName(rp);
    if (!name) return "any";
    return ifaceMap.has(name) ? `${name}_D${depth - 1}` : name;
  });
  const uniqRefs = Array.from(new Set(refs));
  const pieces: string[] = [];
  if (hasNull) pieces.push("null");
  pieces.push(...uniqRefs);
  if (hasUndefined) pieces.push("undefined");
  return pieces.join(" | ");
};

/**
 * Render an arbitrary TS type node into a string, applying depth rules.
 * Handles:
 * - primitives, literals, parenthesized types
 * - arrays and tuples (with special handling for (string | Ref)[])
 * - unions/intersections
 * - type literals (object types), preserving index signatures
 * - type references (by name)
 */
const stringifyType = (
  node: NodeLike | undefined | null,
  depth: number,
  ifaceMap: Map<string, InterfaceDecl>,
): string => {
  if (!node) return "any";
  switch (node.type) {
    case "TSStringKeyword":
      return "string";
    case "TSNumberKeyword":
      return "number";
    case "TSBooleanKeyword":
      return "boolean";
    case "TSNullKeyword":
      return "null";
    case "TSUndefinedKeyword":
      return "undefined";
    case "TSAnyKeyword":
      return "any";
    case "TSUnknownKeyword":
      return "unknown";
    case "TSNeverKeyword":
      return "never";
    case "TSLiteralType":
      return stringifyLiteralType(node);
    case "TSParenthesizedType": {
      const inner = (node as { typeAnnotation?: NodeLike }).typeAnnotation;
      return `(${stringifyType(inner, depth, ifaceMap)})`;
    }
    case "TSArrayType": {
      const el = (node as { elementType?: NodeLike }).elementType;
      // Special collapse: (string | Ref)[] respecting depth; handle optional parentheses
      if (
        el && (el.type === "TSUnionType" || el.type === "TSParenthesizedType")
      ) {
        const parts = flattenUnionTypes(el);
        const hasString = parts.some((p) => p.type === "TSStringKeyword");
        const refParts = parts.filter((p) => p.type === "TSTypeReference");
        if (hasString && refParts.length > 0) {
          if (depth <= 0) return `string[]`;
          const refNames = refParts.map((rp) => {
            const name = refName(rp);
            if (!name) return "any";
            return ifaceMap.has(name) ? `${name}_D${depth - 1}` : name;
          });
          const uniq = Array.from(new Set(refNames));
          return uniq.length > 0 ? `${uniq.join(" | ")}[]` : `any[]`;
        }
      }
      return `${stringifyType(el, depth, ifaceMap)}[]`;
    }
    case "TSTupleType": {
      const els = (node as { elementTypes?: NodeLike[] }).elementTypes ?? [];
      return `[${
        els.map((e) => stringifyType(e, depth, ifaceMap)).join(", ")
      }]`;
    }
    case "TSUnionType": {
      const parts = flattenUnionTypes(node);
      const rel = transformRelationUnionParts(parts, depth, ifaceMap);
      if (rel) return rel;
      return parts.map((p) => stringifyType(p, depth, ifaceMap)).join(" | ");
    }
    case "TSIntersectionType": {
      const parts = (node as { types?: NodeLike[] }).types ?? [];
      return parts.map((p) => stringifyType(p, depth, ifaceMap)).join(" & ");
    }
    case "TSTypeLiteral": {
      const members = (node as { members?: NodeLike[] }).members ?? [];
      const props: string[] = [];
      for (const m of members) {
        const mtype = getProp<string>(m, "type");
        if (mtype === "TSPropertySignature") {
          const keyNode = getProp<NodeLike>(m, "key");
          const keyName = getProp<string>(keyNode, "name") ??
            (getProp<string>(keyNode, "value") ?? "<computed>");
          const isOptional = Boolean(getProp<boolean>(m, "optional"));
          const ta = getProp<NodeLike>(m, "typeAnnotation");
          const tn = getProp<NodeLike>(ta, "typeAnnotation");
          const tStr = stringifyType(tn, depth, ifaceMap);
          const safeKey = /^(\w|\$|_)+$/.test(String(keyName))
            ? String(keyName)
            : JSON.stringify(String(keyName));
          props.push(`${safeKey}${isOptional ? "?" : ""}: ${tStr};`);
        } else if (mtype === "TSIndexSignature") {
          // Index signature: { [k: SomeKeyType]: SomeValueType }
          const params = getProp<NodeLike[]>(m, "parameters") ?? [];
          const p0 = params[0];
          const pName = getProp<string>(p0, "name") ?? "key";
          const pTa = getProp<NodeLike>(p0, "typeAnnotation");
          const pTn = getProp<NodeLike>(pTa, "typeAnnotation");
          const keyType = stringifyType(pTn, depth, ifaceMap);
          const vTa = getProp<NodeLike>(m, "typeAnnotation");
          const vTn = getProp<NodeLike>(vTa, "typeAnnotation");
          const valType = stringifyType(vTn, depth, ifaceMap);
          props.push(`[${pName}: ${keyType}]: ${valType};`);
        }
      }
      return `{ ${props.join(" ")} }`;
    }
    case "TSTypeReference": {
      const name =
        qualifiedNameToString((node as { typeName?: NodeLike }).typeName) ||
        "unknown";
      return name;
    }
    default:
      return "any";
  }
};

/**
 * Helpers for generating runtime mapping functions (projecting Dn -> D{n-1}).
 */
const isRelationUnion = (node: NodeLike | undefined | null): boolean => {
  if (!node) return false;
  const parts = node.type === "TSParenthesizedType"
    ? flattenUnionTypes((node as { typeAnnotation?: NodeLike }).typeAnnotation!)
    : node.type === "TSUnionType"
    ? flattenUnionTypes(node)
    : [];
  if (parts.length === 0) return false;
  const hasString = parts.some((p) => p.type === "TSStringKeyword");
  const hasRef = parts.some((p) => p.type === "TSTypeReference");
  return hasString && hasRef;
};

const pickFirstRefName = (
  node: NodeLike | undefined | null,
): string | undefined => {
  if (!node) return undefined;
  const parts = node.type === "TSParenthesizedType"
    ? flattenUnionTypes((node as { typeAnnotation?: NodeLike }).typeAnnotation!)
    : node.type === "TSUnionType"
    ? flattenUnionTypes(node)
    : [];
  for (const p of parts) {
    if (p.type === "TSTypeReference") {
      const nm = refName(p);
      if (nm) return nm;
    }
  }
  return undefined;
};

/**
 * Render a JS expression that maps a single property from depth d -> d-1.
 * `srcExpr` is the expression to read the source value (e.g. `src.user`).
 */
const renderPropStepMapper = (
  typeNode: NodeLike | undefined | null,
  currentDepth: number,
  ifaceMap: Map<string, InterfaceDecl>,
  srcExpr: string,
  inlineCtx = false,
): string => {
  const destDepth = currentDepth - 1;
  if (destDepth < 0) return srcExpr;
  // Array of relation union: (string | Ref)[]
  if (typeNode && typeNode.type === "TSArrayType") {
    const el = (typeNode as { elementType?: NodeLike }).elementType;
    if (el && (el.type === "TSUnionType" || el.type === "TSParenthesizedType") && isRelationUnion(el)) {
      if (destDepth === 0) {
        return `(${srcExpr}) == null ? ${srcExpr} : ((${srcExpr}) as any[]).map(__getId)`;
      }
      // If inside an inline object literal and we're mapping down to depth 1, collapse to IDs for nested relations
      if (inlineCtx && destDepth === 1) {
        return `(${srcExpr}) == null ? ${srcExpr} : ((${srcExpr}) as any[]).map(__getId)`;
      }
      const rname = pickFirstRefName(el);
      if (rname && ifaceMap.has(rname)) {
        return `(${srcExpr}) == null ? ${srcExpr} : ((${srcExpr}) as any[]).map(v => map_${rname}_D${destDepth}_to_D${destDepth - 1}(v as any))`;
      }
      return srcExpr;
    }
    // Array of object type literals: map each element field-by-field
    if (el && el.type === "TSTypeLiteral") {
      const members = (el as { members?: NodeLike[] }).members ?? [];
      const fieldLines: string[] = [];
      for (const m of members) {
        if (getProp<string>(m, "type") !== "TSPropertySignature") continue;
        const keyNode = getProp<NodeLike>(m, "key");
        const keyName = getProp<string>(keyNode, "name") ?? (getProp<string>(keyNode, "value") ?? "<computed>");
        const safeKeyLiteral = /^(\w|\$|_)+$/.test(String(keyName)) ? String(keyName) : JSON.stringify(String(keyName));
        const accessExpr = /^(\w|\$|_)+$/.test(String(keyName)) ? `v.${String(keyName)}` : `v[${JSON.stringify(String(keyName))}]`;
        const ta = getProp<NodeLike>(m, "typeAnnotation");
        const tn = getProp<NodeLike>(ta, "typeAnnotation");
        const mappedVal = renderPropStepMapper(tn ?? null, currentDepth, ifaceMap, accessExpr, true);
        fieldLines.push(`          ${safeKeyLiteral}: ${mappedVal},`);
      }
      return `(${srcExpr}) == null ? ${srcExpr} : ((${srcExpr}) as any[]).map(v => __pruneUndefined({\n${fieldLines.join("\n")}\n        }))`;
    }
    // Not a relation union array; pass through
    return srcExpr;
  }
  // Unions that wrap a single non-null/undefined branch (e.g., T[] | null)
  if (typeNode && (typeNode.type === "TSUnionType" || typeNode.type === "TSParenthesizedType")) {
    const parts = flattenUnionTypes(typeNode);
    const nonNullish = parts.filter((p) => p.type !== "TSNullKeyword" && p.type !== "TSUndefinedKeyword");
    if (nonNullish.length === 1) {
      // Delegate mapping to the inner non-null type; inner mappers already add null guarding
      return renderPropStepMapper(nonNullish[0], currentDepth, ifaceMap, srcExpr, inlineCtx);
    }
  }
  // Relation union: string | Ref
  if (typeNode && (typeNode.type === "TSUnionType" || typeNode.type === "TSParenthesizedType") && isRelationUnion(typeNode)) {
    if (destDepth === 0) {
      return `(${srcExpr}) == null ? ${srcExpr} : __getId(${srcExpr})`;
    }
    // Inside inline object literals, collapse nested relations to IDs when mapping to depth 1
    if (inlineCtx && destDepth === 1) {
      return `(${srcExpr}) == null ? ${srcExpr} : __getId(${srcExpr})`;
    }
    const rname = pickFirstRefName(typeNode);
    if (rname && ifaceMap.has(rname)) {
      return `(${srcExpr}) == null ? ${srcExpr} : map_${rname}_D${destDepth}_to_D${destDepth - 1}(${srcExpr} as any)`;
    }
    return srcExpr;
  }
  // Inline object type literal: map fields recursively
  if (typeNode && typeNode.type === "TSTypeLiteral") {
    const members = (typeNode as { members?: NodeLike[] }).members ?? [];
    const fieldLines: string[] = [];
    for (const m of members) {
      if (getProp<string>(m, "type") !== "TSPropertySignature") continue;
      const keyNode = getProp<NodeLike>(m, "key");
      const keyName = getProp<string>(keyNode, "name") ?? (getProp<string>(keyNode, "value") ?? "<computed>");
      const safeKeyLiteral = /^(\w|\$|_)+$/.test(String(keyName)) ? String(keyName) : JSON.stringify(String(keyName));
      const accessExpr = /^(\w|\$|_)+$/.test(String(keyName)) ? `${srcExpr}.${String(keyName)}` : `${srcExpr}[${JSON.stringify(String(keyName))}]`;
      const ta = getProp<NodeLike>(m, "typeAnnotation");
      const tn = getProp<NodeLike>(ta, "typeAnnotation");
      const mappedVal = renderPropStepMapper(tn ?? null, currentDepth, ifaceMap, accessExpr, true);
      fieldLines.push(`  ${safeKeyLiteral}: ${mappedVal},`);
    }
    return `(${srcExpr}) == null ? ${srcExpr} : __pruneUndefined({\n${fieldLines.join("\n")}\n})`;
  }
  // Default: passthrough
  return srcExpr;
};

/**
 * Generate source text for all depth-variant interfaces and the DepthQuery<Name, D> helper.
 *
 * Options:
 * - onlyNames: limit generation to these interface names (must still be present in Config.collections)
 */
export const generateDepthInterfaces = (
  program: unknown,
  maxDepth = 2,
  opts?: { onlyNames?: string[] },
): string => {
  const ifaceMap = collectInterfaces(program);
  const out: string[] = [];
  const dUnion = Array.from({ length: maxDepth + 1 }, (_, i) => i).join(" | ");
  // Always export Depth as an independent type for consumers
  out.push(`export type Depth = ${dUnion};\n`);
  // Require Config.collections; select only referenced interfaces
  const keyToType = getCollectionsKeyToType(program);
  if (keyToType.size === 0) {
    throw new Error(
      "Missing Config with collections: please declare `interface Config { collections: { ... } }`",
    );
  }
  const selectedTypes = new Set(keyToType.values());
  let names = Array.from(ifaceMap.keys()).filter((n) => selectedTypes.has(n));
  if (opts?.onlyNames?.length) {
    const set = new Set(opts.onlyNames);
    names = names.filter((n) => set.has(n));
  }
  for (const [iname, idecl] of ifaceMap) {
    if (!names.includes(iname)) continue;
    for (let d = 0; d <= maxDepth; d++) {
      const name = `${idecl.name}_D${d}`;
      out.push(`export interface ${name} {`);
      for (const m of idecl.members) {
        const tStr = stringifyType(m.typeNode ?? null, d, ifaceMap);
        const safeKey = /^(\w|\$|_)+$/.test(String(m.name))
          ? m.name
          : JSON.stringify(m.name);
        out.push(`  ${safeKey}${m.optional ? "?" : ""}: ${tStr};`);
      }
      out.push("}\n");
    }
  }
  // Emit DepthQuery<Name, D> helper mapping string literal names to the corresponding depth alias
  if (names.length > 0) {
    const keys = Array.from(keyToType.keys());
    const lines: string[] = [];
    for (let d = 0; d <= maxDepth; d++) {
      const mapping = keys
        .map((k) => {
          const tname = keyToType.get(k)!;
          return `Name extends "${k}" ? ${tname}_D${d} : `;
        })
        .join("") + "never";
      lines.push(`  ${d}: ${mapping};`);
    }
    const nameUnion = keys.map((k) => `"${k}"`).join(" | ");
    out.push(`export type DepthCollectionSlug = ${nameUnion};`);
    out.push(
      `export type DepthQuery<Name extends DepthCollectionSlug, D extends Depth> = {\n${
        lines.join("\n")
      }\n}[D];`,
    );

    // Runtime helpers: __getId and per-interface mappers (Dn -> D{n-1})
    out.push(
      `\n// Helper to extract id from relation or pass through\n` +
  `export const __getId = (v: any): any => (v == null ? v : (typeof v === "object" && v ? (v as any).id ?? v : v));\n` +
  `// Deeply remove keys with undefined values from objects and arrays\n` +
  `export const __pruneUndefined = (v: any): any => {\n` +
  `  if (v == null) return v;\n` +
  `  if (Array.isArray(v)) return v.map(__pruneUndefined);\n` +
  `  if (typeof v === "object") {\n` +
  `    const out: any = {};\n` +
  `    for (const [k, val] of Object.entries(v)) {\n` +
  `      if (val !== undefined) {\n` +
  `        const pr = __pruneUndefined(val);\n` +
  `        if (pr !== undefined) out[k] = pr;\n` +
  `      }\n` +
  `    }\n` +
  `    return out;\n` +
  `  }\n` +
  `  return v;\n` +
  `};\n`,
    );

    // Generate per-interface step mappers
    for (const iname of names) {
      const idecl = ifaceMap.get(iname)!;
      for (let d = maxDepth; d >= 1; d--) {
        const fnName = `map_${iname}_D${d}_to_D${d - 1}`;
        const srcType = `${iname}_D${d}`;
        const dstType = `${iname}_D${d - 1}`;
        const fields: string[] = [];
        for (const m of idecl.members) {
          const key = String(m.name);
          const safeKeyLiteral = /^(\w|\$|_)+$/.test(key) ? key : JSON.stringify(key);
          const accessExpr = /^(\w|\$|_)+$/.test(key) ? `src.${key}` : `src[${JSON.stringify(key)}]`;
          const expr = renderPropStepMapper(m.typeNode ?? null, d, ifaceMap, accessExpr);
          fields.push(`  ${safeKeyLiteral}: ${expr},`);
        }
        out.push(
          `\nexport const ${fnName} = (src: ${srcType}): ${dstType} => __pruneUndefined({\n${fields.join("\n")}\n}) as ${dstType};\n`,
        );
      }
    }

    // Generate projectDepth dispatcher for any collection slug
    const slugCases: string[] = [];
    for (const [slug, typeName] of keyToType.entries()) {
      const lines: string[] = [];
      lines.push(`      let cur: any = doc as any;`);
      lines.push(`      for (let k = from; k > to; k--) {`);
      lines.push(`        switch (k) {`);
      for (let k = 1; k <= maxDepth; k++) {
        lines.push(
          `          case ${k}: cur = map_${typeName}_D${k}_to_D${k - 1}(cur as any); break;`,
        );
      }
      lines.push(`          default: break;`);
      lines.push(`        }`);
      lines.push(`      }`);
  lines.push(`      return __pruneUndefined(cur) as any;`);
      slugCases.push(
        `    case ${JSON.stringify(slug)}: {\n${lines.join("\n")}\n    }`,
      );
    }
    out.push(
      `\nexport function projectDepth<TSlug extends DepthCollectionSlug, TFromDepth extends Depth, TToDepth extends Depth>(doc: DepthQuery<TSlug, TFromDepth>, slug: TSlug, from: TFromDepth, to: TToDepth): DepthQuery<TSlug, TToDepth> {\n` +
        `  if (Number(to) > Number(from)) throw new Error("Can't project depth from a lower to a higher level");\n` +
        `  if (Number(from) === Number(to)) return doc as DepthQuery<TSlug, TToDepth>;\n` +
        `  switch (slug) {\n${slugCases.join("\n")}\n` +
        `    default: return doc as any;\n  }\n}\n`,
    );
  }
  return out.join("\n");
};
