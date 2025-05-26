// 1) Build a tuple of length N (for “arbitrary” numeric depth)
type BuildArray<
	N extends number,
	Arr extends unknown[] = [],
> = Arr["length"] extends N ? Arr : BuildArray<N, [unknown, ...Arr]>;

// 2) Compute D - 1 by dropping the first element of the tuple
type Prev<D extends number> = BuildArray<D> extends [unknown, ...infer Rest]
	? Rest["length"]
	: never;

// 3) At depth 0: collapse any (string | object) → string
type AtZero<T> = {
	[K in keyof T]: // Handle (string | object)[] | null | undefined
	T[K] extends (string | object)[] | null | undefined
	? Exclude<T[K], object[]> extends never // is it a pure object[]?
	? T[K] // leave as-is if pure object[]
	:
	| string[]
	| (null extends T[K] ? null : never)
	| (undefined extends T[K] ? undefined : never)
	: // Handle string | object | null | undefined
	T[K] extends string | object | null | undefined
	? Exclude<T[K], object> extends never // is it a pure object?
	? T[K] // leave as-is if pure object
	:
	| string
	| (null extends T[K] ? null : never)
	| (undefined extends T[K] ? undefined : never)
	: T[K];
};

// 4) Main recursive DeepQuery<T, D>
/**
 * DeepQuery<T, D> is a utility type that recursively queries an object type `T` to a specified depth `D`.
 *
 * Work with the following types:
 * - `string | object`
 * - `string | object | null`
 * - `string | object | undefined`
 * - `string | object | null | undefined`
 * - `(string | object)[]`
 * - `(string | object)[]) | null`
 * - `(string | object)[]) | undefined`
 * - `(string | object)[]) | null | undefined`
 * Makes sure to your ID fields are always strings.
 *
 * @example
 * ```ts
 * type Base = { obj: string };
 *
 * // Depth = 0
 * type Level0 = DeepQuery<Base, 0>;
 * // → { obj: string }
 *
 * // Depth = 1
 * type Level1 = DeepQuery<Base, 1>;
 * // → { obj: { obj: string } }
 *
 * // Depth = 5
 * type Level5 = DeepQuery<Base, 5>;
 * // → { obj:
 * //      { obj:
 * //        { obj:
 * //          { obj:
 * //            { obj:
 * //              { obj:
 * //                { obj: string }
 * //              }
 * //            }
 * //          }
 * //        }
 * //      }
 * //    }
 * ```
 */
export type DeepQuery<T, D extends number = 0> = D extends 0
	? // If depth is 0, collapse any (string | object) to string
	T extends string | object
	? AtZero<T>
	: T
	: // If depth is greater than 0, recurse into the object
	{
		[K in keyof T]: // Handle (string | object)[] | null | undefined
		T[K] extends (string | object)[] | null | undefined
		?
		| (Extract<T[K], unknown[]> extends infer Arr
			? Arr extends unknown[]
			? Exclude<Arr[number], string> extends object
			? (
				| DeepQuery<Exclude<Arr[number], string>, Prev<D>>
				| (null extends Arr[number] ? null : never)
				| (undefined extends Arr[number] ? undefined : never)
			)[]
			: Arr
			: never
			: never)
		| (null extends T[K] ? null : never)
		| (undefined extends T[K] ? undefined : never)
		: // Handle (string | object)[] | null
		T[K] extends (string | object)[] | null
		?
		| (Extract<T[K], unknown[]> extends infer Arr
			? Arr extends unknown[]
			? Exclude<Arr[number], string> extends object
			? (
				| DeepQuery<Exclude<Arr[number], string>, Prev<D>>
				| (null extends Arr[number] ? null : never)
				| (undefined extends Arr[number] ? undefined : never)
			)[]
			: Arr
			: never
			: never)
		| (null extends T[K] ? null : never)
		: // Handle (string | object)[] | undefined
		T[K] extends (string | object)[] | undefined
		?
		| (Extract<T[K], unknown[]> extends infer Arr
			? Arr extends unknown[]
			? Exclude<Arr[number], string> extends object
			? (
				| DeepQuery<Exclude<Arr[number], string>, Prev<D>>
				| (null extends Arr[number] ? null : never)
				| (undefined extends Arr[number]
					? undefined
					: never)
			)[]
			: Arr
			: never
			: never)
		| (undefined extends T[K] ? undefined : never)
		: // Handle (string | object)[]
		T[K] extends (string | object)[]
		? Exclude<T[K][number], string> extends object
		? (
			| DeepQuery<Exclude<T[K][number], string>, Prev<D>>
			| (null extends T[K][number] ? null : never)
			| (undefined extends T[K][number] ? undefined : never)
		)[]
		: T[K]
		: // Handle string | object | null | undefined
		T[K] extends string | object | null | undefined
		? Exclude<T[K], string | null | undefined> extends object
		?
		| DeepQuery<
			Exclude<T[K], string | null | undefined>,
			Prev<D>
		>
		| (null extends T[K] ? null : never)
		| (undefined extends T[K] ? undefined : never)
		: T[K]
		: // Handle string | object | null
		T[K] extends string | object | null
		? Exclude<T[K], string | null> extends object
		?
		| DeepQuery<Exclude<T[K], string | null>, Prev<D>>
		| (null extends T[K] ? null : never)
		: T[K]
		: // Handle string | object | undefined
		T[K] extends string | object | undefined
		? Exclude<T[K], string | undefined> extends object
		?
		| DeepQuery<
			Exclude<T[K], string | undefined>,
			Prev<D>
		>
		| (null extends T[K] ? null : never)
		| (undefined extends T[K] ? undefined : never)
		: T[K]
		: // Handle string | object
		T[K] extends string | object
		? Exclude<T[K], string> extends object
		?
		| DeepQuery<Exclude<T[K], string>, Prev<D>>
		| (null extends T[K] ? null : never)
		| (undefined extends T[K] ? undefined : never)
		: T[K]
		: // pure objects also recurse
		T[K] extends object
		? DeepQuery<T[K], Prev<D>>
		: T[K];
	};
