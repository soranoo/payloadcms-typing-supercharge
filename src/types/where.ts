import type { WhereField } from "payload";
import type { MaxDepth, ObjectPaths } from "./object-path";
import type { NonNullableObject } from "./non-nullable-object";

/**
 * Where<Obj, D> is a utility type that builds a query structure for filtering objects of type `Obj` to a specified depth `D`.
 * It allows for complex queries with nested fields and boolean combinators.
 * D = 0 means “only top-level keys,” and D = 1 means “top-level plus one dot,” etc.
 *
 * @example
 * ```ts
 * type Profile = {
 *  bio: string;
 *  subProfile: Profile;
 * };
 *
 * type User = {
 * 	name: string;
 *  age: number;
 *  profile: Profile[];
 * };
 *
 * const query: Where<User, 1> = {
 *  name: { // Valid: depth 0
 * 		equals: "Alice",
 * 	},
 *  "profile.bio": { // Valid: depth 1
 * 		equals: "Loves coding",
 * 	},
 *  "profile.subProfile.bio": { // Error: depth limit exceeded
 * 		equals: "Loves coding",
 * 	},
 * }
 * ```
 */
// TODO: Fix the "Type instantiation is excessively deep and possibly infinite.ts(2589)"
// @ts-expect-error - Pending fix
export type Where<Obj, D extends number = MaxDepth> = {
	[P in ObjectPaths<NonNullableObject<Obj>, D>]?: WhereField;
} & {
	and?: Where<Obj, D>[];
	or?: Where<Obj, D>[];
};
