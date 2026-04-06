import type { z } from "zod";

/**
 * `instanceof z.ZodRecord` fails when the schema was built with a different
 * physical Zod module than rserve-ts (duplicate dependency / bundling). That
 * incorrectly routes `Robj.list(z.record(...))` to `z.object(record)`, which
 * throws at parse time (ZodObject expects a raw shape, not a ZodRecord).
 */
export function isZodRecordSchema(
  schema: unknown
): schema is z.ZodRecord<z.ZodString, z.ZodTypeAny> {
  if (typeof schema !== "object" || schema === null) return false;
  const def = (schema as { _def?: { typeName?: string } })._def;
  return def?.typeName === "ZodRecord";
}
