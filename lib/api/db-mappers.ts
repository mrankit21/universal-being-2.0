/** Converts lean Mongoose documents (with `_id`, `createdAt`/`updatedAt` as
 * Dates) into the exact `Trip`/`Destination` TS shapes components expect
 * (`id` as string, timestamps as ISO strings) — the one seam between
 * Mongoose's document shape and the frontend type contract. */
export function toEntity<
  T extends { _id?: unknown; __v?: unknown; createdAt?: unknown; updatedAt?: unknown }
>(
  doc: T
): Omit<T, "_id" | "__v" | "createdAt" | "updatedAt"> & {
  id: string;
  createdAt?: string;
  updatedAt?: string;
} {
  const { _id, __v, createdAt, updatedAt, ...rest } = doc;
  void __v;
  return {
    ...rest,
    id: String(_id),
    createdAt: createdAt ? new Date(createdAt as string | number | Date).toISOString() : undefined,
    updatedAt: updatedAt ? new Date(updatedAt as string | number | Date).toISOString() : undefined,
  } as Omit<T, "_id" | "__v" | "createdAt" | "updatedAt"> & {
    id: string;
    createdAt?: string;
    updatedAt?: string;
  };
}
