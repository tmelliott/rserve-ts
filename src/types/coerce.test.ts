import { describe, expect, it } from "vitest";
import Robj from "./index";

// These tests verify that length-1 scalar values from R are coerced to arrays
// when the schema expects an array type (e.g., character(0L), integer(0L)).
// R serialises length-1 vectors as plain scalars; without coercion the zod
// validation would fail.

describe("character array coercion", () => {
  const schema = Robj.character(0);

  it("coerces a plain string to a single-element array", () => {
    const result = schema.parse("hello") as any;
    expect(Array.isArray(result)).toBe(true);
    expect(Array.from(result)).toEqual(["hello"]);
    expect(result.r_type).toBe("string_array");
  });

  it("passes a string array through unchanged", () => {
    const arr = Object.assign(["hello", "world"], { r_type: "string_array" });
    const result = schema.parse(arr) as any;
    expect(Array.from(result)).toEqual(["hello", "world"]);
    expect(result.r_type).toBe("string_array");
  });

  it("still accepts a plain string for character(1)", () => {
    const singular = Robj.character(1);
    expect(singular.parse("hello")).toBe("hello");
  });

  it("does not coerce for the no-args union form", () => {
    const union = Robj.character();
    expect(union.parse("hello")).toBe("hello");
  });
});

describe("integer array coercion", () => {
  const schema = Robj.integer(0);

  it("coerces a plain number to a single-element Int32Array", () => {
    const result = schema.parse(42) as any;
    expect(result).toBeInstanceOf(Int32Array);
    expect(result[0]).toBe(42);
  });

  it("preserves r_type on the coerced array", () => {
    const result = schema.parse(5) as any;
    expect(result.r_type).toBe("int_array");
  });

  it("passes an Int32Array through unchanged", () => {
    const arr = Object.assign(new Int32Array([1, 2, 3]), { r_type: "int_array" });
    const result = schema.parse(arr) as any;
    expect(result).toBeInstanceOf(Int32Array);
    expect(Array.from(result)).toEqual([1, 2, 3]);
  });

  it("still accepts a plain number for integer(1)", () => {
    const singular = Robj.integer(1);
    expect(singular.parse(7)).toBe(7);
  });
});

describe("numeric array coercion", () => {
  const schema = Robj.numeric(0);

  it("coerces a plain number to a single-element Float64Array", () => {
    const result = schema.parse(3.14) as any;
    expect(result).toBeInstanceOf(Float64Array);
    expect(result[0]).toBeCloseTo(3.14);
  });

  it("preserves r_type on the coerced array", () => {
    const result = schema.parse(1.5) as any;
    expect(result.r_type).toBe("double_array");
  });

  it("passes a Float64Array through unchanged", () => {
    const arr = Object.assign(new Float64Array([1.1, 2.2]), { r_type: "double_array" });
    const result = schema.parse(arr) as any;
    expect(result).toBeInstanceOf(Float64Array);
    expect(Array.from(result)).toEqual([1.1, 2.2]);
  });

  it("still accepts a plain number for numeric(1)", () => {
    const singular = Robj.numeric(1);
    expect(singular.parse(9.9)).toBe(9.9);
  });
});

describe("logical array coercion", () => {
  const schema = Robj.logical(0);

  it("coerces a plain boolean to a single-element array", () => {
    const result = schema.parse(true) as any;
    expect(Array.isArray(result)).toBe(true);
    expect(Array.from(result)).toEqual([true]);
    expect(result.r_type).toBe("bool_array");
  });

  it("passes a boolean array through unchanged", () => {
    const arr = Object.assign([true, false, true], { r_type: "bool_array" });
    const result = schema.parse(arr) as any;
    expect(Array.from(result)).toEqual([true, false, true]);
    expect(result.r_type).toBe("bool_array");
  });

  it("still accepts a plain boolean for logical(1)", () => {
    const singular = Robj.logical(1);
    expect(singular.parse(true)).toBe(true);
  });
});

describe("coercion in vector schema attributes", () => {
  it("coerces a plain string in a named vector's attribute field", () => {
    const schema = Robj.vector({
      labels: Robj.character(0),
    });

    const data = {
      labels: "only-one",
      r_type: "vector",
      r_attributes: { names: ["labels"] },
    };

    const result = schema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(Array.from(result.data.labels as any)).toEqual(["only-one"]);
    }
  });

  it("coerces a plain number in a named vector's numeric field", () => {
    const schema = Robj.vector({
      count: Robj.integer(0),
    });

    const data = {
      count: 1,
      r_type: "vector",
      r_attributes: { names: ["count"] },
    };

    const result = schema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data.count as any)[0]).toBe(1);
    }
  });
});
