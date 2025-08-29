import type {
	BulkOperationResult,
	SelectFromCollectionSlug,
} from "node_modules/payload/dist/collections/config/types";
import type { Options as CountOptions } from "node_modules/payload/dist/collections/operations/local/count";
import type { Options as CreateOptions } from "node_modules/payload/dist/collections/operations/local/create";
import type { ManyOptions as DeleteManyOptions } from "node_modules/payload/dist/collections/operations/local/delete";
import type { Options as FindOptions } from "node_modules/payload/dist/collections/operations/local/find";
import type { Options as FindByIDOptions } from "node_modules/payload/dist/collections/operations/local/findByID";
import type {
	ByIDOptions as UpdateFindByIDOptions,
	ManyOptions as UpdateManyOptions,
} from "node_modules/payload/dist/collections/operations/local/update";
import type {
	CollectionSlug,
	SelectType,
	TransformCollectionWithSelect,
} from "payload";
import type { Sort, Where } from ".";
import type { Depth, DepthQuery } from "./depth";
import type { DefaultQueryMaxDepth } from "./object-path";

export type TypedTransformCollectionWithSelect<
	TSlug extends CollectionSlug,
	TDepth extends Depth,
> = DepthQuery<TSlug, TDepth>;

export interface TypedCreateOptions<
	TSlug extends CollectionSlug,
	TSelect extends SelectFromCollectionSlug<TSlug>,
	TDepth extends Depth,
> extends Omit<CreateOptions<TSlug, TSelect>, "collection" | "depth"> {
	collection: TSlug;
	depth?: TDepth;
}

export interface TypedCountOptions<
	TSlug extends CollectionSlug,
	TSelect extends SelectFromCollectionSlug<TSlug>,
	TQueryDepth extends Depth = DefaultQueryMaxDepth,
> extends Omit<CountOptions<TSlug>, "collection" | "where"> {
	collection: TSlug;
	where?: Where<TransformCollectionWithSelect<TSlug, TSelect>, TQueryDepth>;
}

export interface TypedFindOptions<
	TSlug extends CollectionSlug,
	TSelect extends SelectFromCollectionSlug<TSlug>,
	TDepth extends Depth,
	TQueryDepth extends Depth = DefaultQueryMaxDepth,
> extends Omit<
		FindOptions<TSlug, TSelect>,
		"collection" | "where" | "sort" | "depth"
	> {
	collection: TSlug;
	where?: Where<TransformCollectionWithSelect<TSlug, TSelect>, TQueryDepth>;
	sort?: Sort<TransformCollectionWithSelect<TSlug, TSelect>, TQueryDepth>;
	depth?: TDepth;
}

export interface TypedFindByIDOptions<
	TSlug extends CollectionSlug,
	TDisableErrors extends boolean,
	TSelect extends SelectFromCollectionSlug<TSlug>,
	TDepth extends Depth,
> extends Omit<
		FindByIDOptions<TSlug, TDisableErrors, TSelect>,
		"collection" | "depth"
	> {
	collection: TSlug;
	depth?: TDepth;
}

export interface TypedUpdateManyOptions<
	TSlug extends CollectionSlug,
	TSelect extends SelectFromCollectionSlug<TSlug>,
	TDepth extends Depth,
	TQueryDepth extends Depth = DefaultQueryMaxDepth,
> extends Omit<
		UpdateManyOptions<TSlug, TSelect>,
		"collection" | "where" | "depth" | "sort"
	> {
	collection: TSlug;
	where?: Where<TransformCollectionWithSelect<TSlug, TSelect>, TQueryDepth>;
	sort?: Sort<TransformCollectionWithSelect<TSlug, TSelect>, TQueryDepth>;
	depth?: TDepth;
}

export interface TypedUpdateByIDOptions<
	TSlug extends CollectionSlug,
	TSelect extends SelectFromCollectionSlug<TSlug>,
	TDepth extends Depth,
> extends Omit<UpdateFindByIDOptions<TSlug, TSelect>, "collection" | "depth"> {
	collection: TSlug;
	depth?: TDepth;
}

export interface TypedDeleteManyOptions<
	TSlug extends CollectionSlug,
	TSelect extends SelectFromCollectionSlug<TSlug>,
	TDepth extends Depth,
	TQueryDepth extends Depth = DefaultQueryMaxDepth,
> extends Omit<
		DeleteManyOptions<TSlug, TSelect>,
		"collection" | "where" | "depth"
	> {
	collection: TSlug;
	where?: Where<TransformCollectionWithSelect<TSlug, TSelect>, TQueryDepth>;
	depth?: TDepth;
}

export interface TypedBulkOperationResult<
	TSlug extends CollectionSlug,
	TSelect extends SelectType,
	TDepth extends Depth,
> extends Omit<BulkOperationResult<TSlug, TSelect>, "docs"> {
	docs: DepthQuery<TSlug, TDepth>[];
}
