// Shared AST utilities and lightweight shapes
export type NodeLike = { type?: string } & Record<string, unknown>;

export const getProp = <T = unknown>(
  obj: unknown,
  key: string,
): T | undefined => {
  if (obj && typeof obj === "object") {
    return (obj as Record<string, unknown>)[key] as T;
  }
  return undefined;
};

export const qualifiedNameToString = (
  qn: NodeLike | undefined | null,
): string => {
  // Handles Identifier or TSQualifiedName recursively
  if (!qn) return "";
  if (qn.type === "Identifier") return (qn as { name?: string }).name ?? "";
  if (qn.type === "TSQualifiedName") {
    const left = qualifiedNameToString((qn as { left?: NodeLike }).left);
    const right = qualifiedNameToString((qn as { right?: NodeLike }).right);
    return left && right ? `${left}.${right}` : right || left;
  }
  return "";
};
