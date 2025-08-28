import type { AccessArgs } from "payload";
import type { Where } from "./where";

/**
 * This result is calculated on the server
 * and then sent to the client allowing the dashboard to show accessible data and actions.
 *
 * `TData` is the type of the collection being accessed.
 * `D` is the maximum depth of the type check. Default is 5.
 * 
 * If the result is `true`, the user has access.
 * If the result is an object, it is interpreted as a MongoDB query.
 *
 * @example `{ createdBy: { equals: id } }`
 *
 * @example `{ tenant: { in: tenantIds } }`
 *
 * @see https://payloadcms.com/docs/access-control/overview
 */
export type AccessResult<TData, D extends number = 5> = boolean | Where<TData, D>;

/**
 * Access function runs on the server
 * and is sent to the client allowing the dashboard to show accessible data and actions.
 *  
 * `TData` is the type of the collection being accessed.
 * 
 * @see https://payloadcms.com/docs/access-control/overview
 */
export type Access<TData> = (args: AccessArgs<TData>) => AccessResult<TData> | Promise<AccessResult<TData>>;
