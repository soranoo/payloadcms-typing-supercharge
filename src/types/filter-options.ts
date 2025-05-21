import type { FilterOptionsProps } from "payload";
import type { Where } from "./where";

export type FilterOptionsFunc<TData> = (options: FilterOptionsProps<TData>) => boolean | Promise<boolean | Where<TData>> | Where<TData>;
export type FilterOptions<TData> = ((options: FilterOptionsProps<TData>) => boolean | Promise<boolean | Where<TData>> | Where<TData>) | null | Where<TData>;
