/**
 * Stub of the depth.ts
 *
 * It will be replaced by the generated depth types.
 */

import type { CollectionSlug } from "payload";

export type Depth = 0 | 1 | 2;

export type DepthQuery<Name extends CollectionSlug, D extends Depth> = {
	0: never;
	1: never;
	2: never;
}[D];
