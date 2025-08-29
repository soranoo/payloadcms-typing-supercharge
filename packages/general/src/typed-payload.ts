import type { SelectFromCollectionSlug } from "node_modules/payload/dist/collections/config/types";
import type { ByIDOptions as DeleteByIDOptions } from "node_modules/payload/dist/collections/operations/local/delete";
import type { ByIDOptions as UpdateByIDOptions } from "node_modules/payload/dist/collections/operations/local/update";
import type {
	ApplyDisableErrors,
	BasePayload,
	CollectionSlug,
	PaginatedDocs,
	Payload,
} from "payload";
import type { Depth } from "./types";
import type { DefaultQueryMaxDepth } from "./types/object-path";
import type {
	TypedBulkOperationResult,
	TypedCountOptions,
	TypedCreateOptions,
	TypedDeleteManyOptions,
	TypedFindByIDOptions,
	TypedFindOptions,
	TypedTransformCollectionWithSelect,
	TypedUpdateByIDOptions,
	TypedUpdateManyOptions,
} from "./types/typeds";

const defaultReturnMaxDepth = 1;
/**
 * @description Default maximum depth for query operation results.
 */
type DefaultReturnMaxDepth = typeof defaultReturnMaxDepth;

export class TypedPayload {
	constructor(
		public readonly payload: BasePayload,
		public overrideAccess = false,
	) {}

	/**
	 * @description Create a typed payload instance
	 * @param payload - payload instance
	 * @param options - options
	 * @param options.overrideAccess - whether to override access, defaults to false
	 * @returns typed payload instance
	 */
	static createTypedPayload(
		payload: BasePayload,
		options: {
			overrideAccess?: boolean;
		} = { overrideAccess: false },
	): TypedPayload {
		return new TypedPayload(payload, options.overrideAccess);
	}

	/**
	 * @description Performs create operation
	 * @param options
	 * @returns created document
	 */
	async create<
		TSlug extends CollectionSlug,
		TSelect extends SelectFromCollectionSlug<TSlug>,
		TReturnDepth extends Depth,
	>({
		collection,
		depth = defaultReturnMaxDepth as TReturnDepth,
		overrideAccess = this.overrideAccess,
		...options
	}: TypedCreateOptions<TSlug, TSelect, TReturnDepth>): Promise<
		TypedTransformCollectionWithSelect<TSlug, TReturnDepth>
	> {
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		return (await this.payload.create({
			depth,
			collection,
			overrideAccess,
			...options,
		})) as any;
	}

	/**
	 * @description Performs count operation
	 * @param options
	 * @returns count of documents satisfying query
	 */
	async count<
		TSlug extends CollectionSlug,
		TSelect extends SelectFromCollectionSlug<TSlug>,
		TQueryDepth extends Depth = DefaultQueryMaxDepth,
	>({
		collection,
		overrideAccess = this.overrideAccess,
		...options
	}: TypedCountOptions<TSlug, TSelect, TQueryDepth>): ReturnType<
		Payload["count"]
	> {
		return await this.payload.count({ collection, overrideAccess, ...options });
	}

	/**
	 * @description Find documents with criteria
	 * @param options
	 * @returns documents satisfying query
	 */
	async find<
		TSlug extends CollectionSlug,
		TSelect extends SelectFromCollectionSlug<TSlug>,
		TReturnDepth extends Depth = DefaultReturnMaxDepth,
		TQueryDepth extends Depth = DefaultQueryMaxDepth,
	>({
		collection,
		depth = defaultReturnMaxDepth as TReturnDepth,
		overrideAccess = this.overrideAccess,
		...options
	}: TypedFindOptions<TSlug, TSelect, TReturnDepth, TQueryDepth>): Promise<
		PaginatedDocs<TypedTransformCollectionWithSelect<TSlug, TReturnDepth>>
	> {
		// @ts-expect-error - ignore default type error because of "where"
		return await this.payload.find({
			depth,
			collection,
			overrideAccess,
			...options,
		});
	}

	/**
	 * @description Find document by ID
	 * @param options
	 * @returns document with specified ID
	 */
	async findByID<
		TSlug extends CollectionSlug,
		TDisableErrors extends boolean,
		TSelect extends SelectFromCollectionSlug<TSlug>,
		TReturnDepth extends Depth,
	>({
		collection,
		overrideAccess = this.overrideAccess,
		depth = defaultReturnMaxDepth as TReturnDepth,
		...options
	}: TypedFindByIDOptions<
		TSlug,
		TDisableErrors,
		TSelect,
		TReturnDepth
	>): Promise<
		ApplyDisableErrors<
			TypedTransformCollectionWithSelect<TSlug, TReturnDepth>,
			TDisableErrors
		>
	> {
		return (await this.payload.findByID({
			depth,
			collection,
			overrideAccess,
			...options,
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		})) as any;
	}

	/**
	 * @description Update one or more documents
	 * @param options
	 * @returns Updated document(s)
	 */
	async update<
		// bulk
		TSlug extends CollectionSlug,
		TSelect extends SelectFromCollectionSlug<TSlug>,
		TReturnDepth extends Depth = DefaultReturnMaxDepth,
		TQueryDepth extends Depth = DefaultQueryMaxDepth,
	>(
		options: TypedUpdateManyOptions<TSlug, TSelect, TReturnDepth, TQueryDepth>,
	): Promise<TypedBulkOperationResult<TSlug, TSelect, TReturnDepth>>;
	async update<
		// by ID
		TSlug extends CollectionSlug,
		TSelect extends SelectFromCollectionSlug<TSlug>,
		TReturnDepth extends Depth = DefaultReturnMaxDepth,
	>(
		options: TypedUpdateByIDOptions<TSlug, TSelect, TReturnDepth>,
	): Promise<TypedTransformCollectionWithSelect<TSlug, TReturnDepth>>;
	async update<
		TSlug extends CollectionSlug,
		TSelect extends SelectFromCollectionSlug<TSlug>,
		TReturnDepth extends Depth = DefaultReturnMaxDepth,
	>({
		collection,
		overrideAccess = this.overrideAccess,
		depth = defaultReturnMaxDepth as TReturnDepth,
		...options
	}:
		| TypedUpdateManyOptions<TSlug, TSelect, TReturnDepth>
		| UpdateByIDOptions<TSlug, TSelect, TReturnDepth>) {
		// @ts-expect-error - ignore default type error because of "where"
		// biome-ignore lint/suspicious/noExplicitAny: ignore default typing
		return (await this.payload.update({
			depth,
			collection,
			overrideAccess,
			...options,
		})) as any;
	}

	/**
	 * @description Delete one or more documents
	 * @param options
	 * @returns Deleted document(s)
	 */
	async delete<
		// bulk
		TSlug extends CollectionSlug,
		TSelect extends SelectFromCollectionSlug<TSlug>,
		TReturnDepth extends Depth = DefaultReturnMaxDepth,
		TQueryDepth extends Depth = DefaultQueryMaxDepth,
	>(
		options: TypedDeleteManyOptions<TSlug, TSelect, TReturnDepth, TQueryDepth>,
	): Promise<TypedBulkOperationResult<TSlug, TSelect, TReturnDepth>>;
	async delete<
		// by ID
		TSlug extends CollectionSlug,
		TSelect extends SelectFromCollectionSlug<TSlug>,
		TReturnDepth extends Depth = DefaultReturnMaxDepth,
	>(
		options: DeleteByIDOptions<TSlug, TSelect>,
	): Promise<TypedTransformCollectionWithSelect<TSlug, TReturnDepth>>;
	async delete<
		TSlug extends CollectionSlug,
		TSelect extends SelectFromCollectionSlug<TSlug>,
		TReturnDepth extends Depth = DefaultReturnMaxDepth,
	>({
		collection,
		overrideAccess = this.overrideAccess,
		depth = defaultReturnMaxDepth as TReturnDepth,
		...options
	}:
		| TypedDeleteManyOptions<TSlug, TSelect, TReturnDepth>
		| DeleteByIDOptions<TSlug, TSelect>) {
		// @ts-expect-error - ignore default type error because of "where"
		// biome-ignore lint/suspicious/noExplicitAny: ignore default typing
		return (await this.payload.delete({
			depth,
			collection,
			overrideAccess,
			...options,
		})) as any;
	}
}
