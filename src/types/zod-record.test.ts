import { describe, expect, it } from "vitest";
import { z } from "zod";
import Robj from "./index";
import { isZodRecordSchema } from "./zod-record";

describe("isZodRecordSchema", () => {
  it("recognizes z.record", () => {
    expect(isZodRecordSchema(z.record(z.string(), z.number()))).toBe(true);
  });

  it("rejects non-records", () => {
    expect(isZodRecordSchema(z.string())).toBe(false);
    expect(isZodRecordSchema(null)).toBe(false);
  });
});

describe("Robj.list + z.record (cross-module Zod)", () => {
  it("treats ZodRecord by _def.typeName so list() is not z.object(record)", () => {
    const rec = z.record(z.string(), z.number());
    const before = rec instanceof z.ZodRecord;
    Object.setPrototypeOf(rec, Object.getPrototypeOf(z.number()));
    expect(rec instanceof z.ZodRecord).toBe(false);
    expect(isZodRecordSchema(rec)).toBe(true);

    const listSchema = Robj.list(rec);
    const parsed = listSchema.safeParse({
      r_type: "vector",
      r_attributes: { names: ["a", "b"] },
      a: 1,
      b: 2,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toEqual({ a: 1, b: 2 });
    }

    Object.setPrototypeOf(rec, (z.ZodRecord.prototype as object));
    expect(rec instanceof z.ZodRecord).toBe(before);
  });
});
