import type {
	BulkOperationResult,
	SelectFromCollectionSlug,
} from "node_modules/payload/dist/collections/config/types";
import type { Options as CountOptions } from "node_modules/payload/dist/collections/operations/local/count";
import type { Options as CreateOptions } from "node_modules/payload/dist/collections/operations/local/create";
import type { ManyOptions as DeleteManyOptions } from "node_modules/payload/dist/collections/operations/local/delete";
import type { Options as FindOptions } from "node_modules/payload/dist/collections/operations/local/find";
import type { Options as FindByIDOptions } from "node_modules/payload/dist/collections/operations/local/findByID";
import type { ManyOptions as UpdateManyOptions } from "node_modules/payload/dist/collections/operations/local/update";
import type {
	CollectionSlug,
	SelectType,
	TransformCollectionWithSelect,
} from "payload";
import type {
	DeepQuery,
	Sort,
	Where,
} from "@/types";

export type TypedTransformCollectionWithSelect<
	TSlug extends CollectionSlug,
	TSelect extends SelectFromCollectionSlug<TSlug>,
	TDepth extends number,
> = DeepQuery<TransformCollectionWithSelect<TSlug, TSelect>, TDepth>;

export interface TypedCreateOptions<
	TSlug extends CollectionSlug,
	TSelect extends SelectFromCollectionSlug<TSlug>,
	TDepth extends number,
> extends Omit<CreateOptions<TSlug, TSelect>, "depth"> {
	depth?: TDepth;
}

export interface TypedCountOptions<
	TSlug extends CollectionSlug,
	TSelect extends SelectFromCollectionSlug<TSlug>,
> extends Omit<CountOptions<TSlug>, "where"> {
	where?: Where<TransformCollectionWithSelect<TSlug, TSelect>>;
}

export interface TypedFindOptions<
	TSlug extends CollectionSlug,
	TSelect extends SelectFromCollectionSlug<TSlug>,
	TDepth extends number,
> extends Omit<FindOptions<TSlug, TSelect>, "where" | "sort" | "depth"> {
	where?: Where<TransformCollectionWithSelect<TSlug, TSelect>, TDepth>;
	sort?: Sort<TransformCollectionWithSelect<TSlug, TSelect>, TDepth>;
	depth?: TDepth;
}

export interface TypedFindByIDOptions<
	TSlug extends CollectionSlug,
	TDisableErrors extends boolean,
	TSelect extends SelectFromCollectionSlug<TSlug>,
	TDepth extends number,
> extends Omit<FindByIDOptions<TSlug, TDisableErrors, TSelect>, "depth"> {
	depth?: TDepth;
}

export interface TypedUpdateManyOptions<
	TSlug extends CollectionSlug,
	TSelect extends SelectFromCollectionSlug<TSlug>,
	TDepth extends number,
> extends Omit<UpdateManyOptions<TSlug, TSelect>, "where" | "depth"> {
	where?: Where<TransformCollectionWithSelect<TSlug, TSelect>, TDepth>;
	depth?: TDepth;
}

export interface TypedDeleteManyOptions<
	TSlug extends CollectionSlug,
	TSelect extends SelectFromCollectionSlug<TSlug>,
	TDepth extends number,
> extends Omit<DeleteManyOptions<TSlug, TSelect>, "where" | "depth"> {
	where?: Where<TransformCollectionWithSelect<TSlug, TSelect>, TDepth>;
	depth?: TDepth;
}

export interface TypedBulkOperationResult<
	TSlug extends CollectionSlug,
	TSelect extends SelectType,
	TDepth extends number,
> extends Omit<BulkOperationResult<TSlug, TSelect>, "docs"> {
	docs: DeepQuery<TransformCollectionWithSelect<TSlug, TSelect>, TDepth>[];
}
