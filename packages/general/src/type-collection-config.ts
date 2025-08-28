import type { CollectionSlug } from "payload";
import type { CollectionConfig } from "./types";

/**
 * Creates a typed collection config.
 *
 * @param config - The configuration for the collection.
 * @returns A collection config with the specified slug and provided configuration.
 */
export const createTypedCollectionConfig = <TSlug extends CollectionSlug>(
	config: Omit<CollectionConfig<TSlug>, "slug"> & {
		slug: TSlug;
	},
): CollectionConfig<TSlug> => {
	return config;
};
