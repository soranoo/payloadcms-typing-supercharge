import type {
	SelectFromCollectionSlug,
} from "node_modules/payload/dist/collections/config/types";
import type {
	ByIDOptions as DeleteByIDOptions,
} from "node_modules/payload/dist/collections/operations/local/delete";
import type {
	ByIDOptions as UpdateByIDOptions,
} from "node_modules/payload/dist/collections/operations/local/update";
import type {
	ApplyDisableErrors,
	BasePayload,
	CollectionSlug,
	PaginatedDocs,
	Payload,
} from "payload";
import type {
	TypedBulkOperationResult,
	TypedCountOptions,
	TypedCreateOptions,
	TypedDeleteManyOptions,
	TypedFindByIDOptions,
	TypedFindOptions,
	TypedTransformCollectionWithSelect,
	TypedUpdateManyOptions
} from "./types/typeds";

export class TypedPayload {
	constructor(private readonly payload: BasePayload) { }

	/**
	 * @description Create a typed payload instance
	 * @param payload - payload instance
	 * @returns typed payload instance
	 */
	static createTypedPayload(payload: BasePayload): TypedPayload {
		return new TypedPayload(payload);
	}

	/**
	 * @description Returns the normal payload instance
	 * @returns payload instance
	 */
	public get getPayload(): BasePayload {
		return this.payload as BasePayload;
	}

	/**
	 * @description Performs create operation
	 * @param options
	 * @returns created document
	 */
	async create<
		TSlug extends CollectionSlug,
		TSelect extends SelectFromCollectionSlug<TSlug>,
		TDepth extends number = 1,
	>({
		depth = 1 as TDepth,
		collection,
		...options
	}: TypedCreateOptions<TSlug, TSelect, TDepth>): Promise<
		TypedTransformCollectionWithSelect<TSlug, TSelect, TDepth>
	> {
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		return (await this.payload.create({ depth, collection, ...options })) as any;
	}

	/**
	 * @description Performs count operation
	 * @param options
	 * @returns count of documents satisfying query
	 */
	async count<
		TSlug extends CollectionSlug,
		TSelect extends SelectFromCollectionSlug<TSlug>,
	>({
		collection,
		...options
	}: TypedCountOptions<TSlug, TSelect>): ReturnType<Payload["count"]> {
		return await this.payload.count({ collection, ...options });
	}

	/**
	 * @description Find documents with criteria
	 * @param options
	 * @returns documents satisfying query
	 */
	async find<
		TSlug extends CollectionSlug,
		TSelect extends SelectFromCollectionSlug<TSlug>,
		TDepth extends number = 1,
	>({
		depth = 1 as TDepth,
		collection,
		...options
	}: TypedFindOptions<TSlug, TSelect, TDepth>): Promise<
		PaginatedDocs<
			TypedTransformCollectionWithSelect<TSlug, TSelect, TDepth>
		>
	> {
		// @ts-expect-error - ignore default type error because of "where"
		return await this.payload.find({
			depth,
			collection,
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
		TDepth extends number = 1,
	>({
		depth = 1 as TDepth,
		collection,
		...options
	}: TypedFindByIDOptions<TSlug, TDisableErrors, TSelect, TDepth>): Promise<
		ApplyDisableErrors<
			TypedTransformCollectionWithSelect<TSlug, TSelect, TDepth>,
			TDisableErrors
		>
	> {
		return (await this.payload.findByID({
			depth,
			collection,
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
		TDepth extends number = 1,
	>(
		options: TypedUpdateManyOptions<TSlug, TSelect, TDepth>,
	): Promise<TypedBulkOperationResult<
		TSlug,
		TSelect,
		TDepth
	>
	>;
	async update<
		// by ID
		TSlug extends CollectionSlug,
		TSelect extends SelectFromCollectionSlug<TSlug>,
		TDepth extends number = 1,
	>(
		options: UpdateByIDOptions<TSlug, TSelect>,
	): Promise<TypedTransformCollectionWithSelect<TSlug, TSelect, TDepth>>;
	async update<
		TSlug extends CollectionSlug,
		TSelect extends SelectFromCollectionSlug<TSlug>,
		TDepth extends number = 1,
	>({
		depth = 1 as TDepth,
		collection,
		...options
	}: (TypedUpdateManyOptions<TSlug, TSelect, TDepth> | UpdateByIDOptions<TSlug, TSelect>)) {
		// @ts-expect-error - ignore default type error because of "where"
		// biome-ignore lint/suspicious/noExplicitAny: ignore default typing
		return await this.payload.update({ depth, collection, ...options }) as any;
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
		TDepth extends number = 1,
	>(
		options: TypedDeleteManyOptions<TSlug, TSelect, TDepth>,
	): Promise<TypedBulkOperationResult<TSlug, TSelect, TDepth>>;
	async delete<
		// by ID
		TSlug extends CollectionSlug,
		TSelect extends SelectFromCollectionSlug<TSlug>,
		TDepth extends number = 1,
	>(
		options: DeleteByIDOptions<TSlug, TSelect>,
	): Promise<TypedTransformCollectionWithSelect<TSlug, TSelect, TDepth>>;
	async delete<
		TSlug extends CollectionSlug,
		TSelect extends SelectFromCollectionSlug<TSlug>,
		TDepth extends number = 1,
	>({
		depth = 1 as TDepth,
		collection,
		...options
	}: (TypedDeleteManyOptions<TSlug, TSelect, TDepth> | DeleteByIDOptions<TSlug, TSelect>)) {
		// @ts-expect-error - ignore default type error because of "where"
		// biome-ignore lint/suspicious/noExplicitAny: ignore default typing
		return await this.payload.delete({ depth, collection, ...options }) as any;
	}
}
