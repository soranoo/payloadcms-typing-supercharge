import { getProp, qualifiedNameToString, type NodeLike } from "./ast-utils.ts";

/**
 * Property analysis utilities
 *
 * This module analyzes interface declarations to produce a compact report of
 * properties that are noteworthy for payload schemas:
 * - optional ("?")
 * - can be null
 * - can be undefined (explicit TSUndefinedKeyword)
 * - reference other types (TSTypeReference) via their fully qualified names
 */

export interface PropertyReport {
  name: string;
  optional: boolean;
  containsNull: boolean;
  containsUndefinedKeyword: boolean;
  referencedTypes: string[];
}

export interface InterfaceReport {
  interfaceName: string;
  properties: PropertyReport[];
}

/**
 * Traverse a type node to collect null/undefined flags and referenced types.
 */
const collectTypeInfo = (node: NodeLike | null | undefined): {
  containsNull: boolean;
  containsUndefinedKeyword: boolean;
  referencedTypes: Set<string>;
} => {
  const info = {
    containsNull: false,
    containsUndefinedKeyword: false,
    referencedTypes: new Set<string>(),
  };
  if (!node) return info;

  const visit = (n: NodeLike | null | undefined) => {
    if (!n || typeof n !== "object") return;
    switch (n.type) {
      case "TSNullKeyword":
        info.containsNull = true;
        return;
      case "TSUndefinedKeyword":
        info.containsUndefinedKeyword = true;
        return;
      case "TSTypeReference": {
        const name = qualifiedNameToString((n as { typeName?: NodeLike }).typeName);
        if (name) info.referencedTypes.add(name);
        const targs = (n as { typeArguments?: { params?: NodeLike[] } }).typeArguments;
        if (targs?.params) for (const p of targs.params) visit(p);
        return;
      }
      case "TSArrayType":
        visit((n as { elementType?: NodeLike }).elementType);
        return;
      case "TSParenthesizedType":
        visit((n as { typeAnnotation?: NodeLike }).typeAnnotation);
        return;
      case "TSUnionType":
      case "TSIntersectionType":
        for (const t of ((n as { types?: NodeLike[] }).types) ?? []) visit(t);
        return;
      case "TSTypeOperator":
        visit((n as { typeAnnotation?: NodeLike }).typeAnnotation);
        return;
      case "TSTypeLiteral": {
        for (const m of ((n as { members?: NodeLike[] }).members) ?? []) {
          if ((m as NodeLike).type === "TSPropertySignature") {
            const ann = (m as { typeAnnotation?: { typeAnnotation?: NodeLike } }).typeAnnotation?.typeAnnotation;
            visit(ann);
          } else {
            const ta = (m as { typeAnnotation?: { typeAnnotation?: NodeLike } }).typeAnnotation?.typeAnnotation;
            if (ta) visit(ta);
          }
        }
        return;
      }
      case "TSTupleType":
        for (const e of ((n as { elementTypes?: NodeLike[] }).elementTypes) ?? []) visit(e);
        return;
      case "TSIndexedAccessType":
        visit((n as { objectType?: NodeLike }).objectType);
        visit((n as { indexType?: NodeLike }).indexType);
        return;
      default: {
        for (const k of Object.keys(n)) {
          const v = (n as Record<string, unknown>)[k];
          if (v && typeof v === "object") {
            if (Array.isArray(v)) for (const it of v) visit(it);
            else visit(v as NodeLike);
          }
        }
      }
    }
  };

  visit(node);
  return info;
}

export const generateInterfacePropertyReport = (program: unknown): InterfaceReport[] => {
  const interfaces: InterfaceReport[] = [];
  const bodyUnknown = (program as { body?: unknown } | undefined)?.body;
  const stmts: NodeLike[] = Array.isArray(bodyUnknown) ? (bodyUnknown as NodeLike[]) : [];

  for (const stmt of stmts) {
    let ifaceDecl: NodeLike | null = null;
    const stmtType = getProp<string>(stmt, "type");
    if (stmtType === "TSInterfaceDeclaration") ifaceDecl = stmt;
    else if (stmtType === "ExportNamedDeclaration") {
      const decl = getProp<NodeLike>(stmt, "declaration");
      if (getProp<string>(decl, "type") === "TSInterfaceDeclaration") ifaceDecl = decl ?? null;
    }
    if (!ifaceDecl) continue;

    const idNode = getProp<NodeLike>(ifaceDecl, "id");
    const name = getProp<string>(idNode, "name") ?? "<anonymous>";
    const props: PropertyReport[] = [];

    const bodyNode = getProp<NodeLike>(ifaceDecl, "body");
    const members = getProp<NodeLike[]>(bodyNode, "body") ?? [];
    for (const member of members) {
      if (getProp<string>(member, "type") !== "TSPropertySignature") continue;
      const keyNode = getProp<NodeLike>(member, "key");
      const key = getProp<string>(keyNode, "name") ?? (getProp<string>(keyNode, "value") ?? "<computed>");
      const optional = Boolean(getProp<boolean>(member, "optional"));
      const typeAnnotation = getProp<NodeLike>(member, "typeAnnotation");
      const typeNode = getProp<NodeLike>(typeAnnotation, "typeAnnotation");
      const info = collectTypeInfo(typeNode);

      const matches = optional || info.containsNull || info.containsUndefinedKeyword || info.referencedTypes.size > 0;
      if (!matches) continue;

      props.push({
        name: String(key),
        optional,
        containsNull: info.containsNull,
        containsUndefinedKeyword: info.containsUndefinedKeyword,
        referencedTypes: Array.from(info.referencedTypes).sort(),
      });
    }
    interfaces.push({ interfaceName: name, properties: props });
  }
  return interfaces;
}
