// 1) Depth utilities, with Prev clamped to 0
type BuildArray<
	N extends number,
	Arr extends unknown[] = [],
> = Arr["length"] extends N ? Arr : BuildArray<N, [unknown, ...Arr]>;

type Prev<D extends number> = D extends 0
	? 0
	: BuildArray<D> extends [unknown, ...infer Rest]
		? Rest["length"]
		: never;

// 2) MaxDepth default
export type MaxDepth = 5;

// 3) ObjectPaths<T, D, P>
//    - always emit the immediate key
//    - recurse only when D > 0 and the type is a non-string object
export type ObjectPaths<
	T,
	D extends number = MaxDepth,
	P extends string = "",
> = T extends object
	? {
			[K in keyof T & (string | number)]:
				| `${P}${K}`
				| (
					D extends 0
						? never
						: Exclude<T[K], string> extends Array<infer U>
							? ObjectPaths<Exclude<U, string>, Prev<D>, `${P}${K}.`>
							: Exclude<T[K], string> extends object
								? ObjectPaths<Exclude<T[K], string>, Prev<D>, `${P}${K}.`>
								: never
				);
		}[keyof T & (string | number)]
	: never;
