/**
 * NonNullableObject<T> is a utility type that recursively removes all `null` and `undefined` types from an object.
 *
 * @example
 * ```ts
 * type Example = {
 *   a: string | null;
 *   b?: number;
 *   c: {
 *     d: string | undefined;
 *     e: null | {
 *       f: number;
 *     };
 *   };
 * };
 *
 * type Result = NonNullableObject<Example>;
 * // Result:
 * // {
 * //   a: string;
 * //   c: {
 * //     d: string;
 * //     e: {
 * //       f: number;
 * //     };
 * //   };
 * // }
 * ```
 */
export type NonNullableObject<T> = T extends object
	? {
			[P in keyof T]-?: NonNullableObject<NonNullable<T[P]>>;
		}
	: never;
