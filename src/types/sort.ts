import type { MaxDepth, ObjectPaths } from "./object-path";

/**
 * Sort<Obj, D> is a utility type that defines the valid sort keys for objects of type `Obj` up to a specified depth `D`.
 * It supports both ascending and descending sort orders, as well as arrays of sort keys.
 *
 * - `ObjectPaths<Obj, D>`: Allows sorting by any valid object path up to depth `D`.
 * - `-${ObjectPaths<Obj, D>}`: Allows descending sort by prefixing the path with a minus sign.
 * - Arrays: Allows specifying multiple sort keys in order of precedence.
 *
 * @template Obj - The object type to generate sort keys for.
 * @template D - The maximum depth for nested object paths (defaults to MaxDepth).
 *
 * @example
 * type User = {
 *   name: string;
 *   profile: {
 *     age: number;
 *   };
 * };
 *
 * // Single sort key (ascending)
 * const sort1: Sort<User> = "name";
 *
 * // Single sort key (descending)
 * const sort2: Sort<User> = "-profile.age";
 *
 * // Multiple sort keys
 * const sort3: Sort<User> = ["name", "-profile.age"];
 */
export type Sort<Obj, D extends number = MaxDepth> =
	| ObjectPaths<Obj, D>
	// TODO: Fix: Type instantiation is excessively deep and possibly infinite.ts(2589)
	// @ts-expect-error - Pending fix
	| `-${ObjectPaths<Obj, D>}`
	| ObjectPaths<Obj, D>[]
	| `-${ObjectPaths<Obj, D>}`[];
