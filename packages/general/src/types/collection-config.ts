import type {
	CollectionSlug,
	CollectionConfig as PayloadCollectionConfig,
	PayloadRequest,
	TypedCollection,
} from "payload";
import type { Access } from "./access";

export interface CollectionConfig<
	TSlug extends CollectionSlug,
	TCollection = TypedCollection[TSlug],
> extends Omit<PayloadCollectionConfig<TSlug>, "access"> {
	/**
	 * Access control
	 */
	access?: {
		admin?: ({
			req,
		}: {
			req: PayloadRequest;
		}) => boolean | Promise<boolean>;
		create?: Access<TCollection>;
		delete?: Access<TCollection>;
		read?: Access<TCollection>;
		readVersions?: Access<TCollection>;
		unlock?: Access<TCollection>;
		update?: Access<TCollection>;
	};
}
