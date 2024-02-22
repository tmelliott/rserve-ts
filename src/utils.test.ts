import { describe, expect, it } from "vitest";
import { isTypedArray } from "./utils";
import Rsrv from "./Rsrv";

describe("TypeArray", () => {
  it("should return if the type is a typed array", () => {
    expect(isTypedArray(new Int8Array(1))).toBe(true);
  });
});

// describe("type_id", () => {
//   it("should return the type id of the value", () => {
//     expect(type_id(null)).toBe(Rsrv.XT_NULL);
//     expect(type_id(undefined)).toBe(Rsrv.XT_NULL);
//     expect(type_id(true)).toBe(Rsrv.XT_ARRAY_BOOL);
//     expect(type_id(1)).toBe(Rsrv.XT_ARRAY_DOUBLE);
//     expect(type_id("")).toBe(Rsrv.XT_ARRAY_STR);
//     expect(type_id(new Int8Array(1))).toBe(Rsrv.XT_ARRAY_DOUBLE);
//     expect(type_id(new ArrayBuffer(1))).toBe(Rsrv.XT_RAW);
//     expect(type_id([""])).toBe(Rsrv.XT_ARRAY_STR);
//     expect(type_id([true])).toBe(Rsrv.XT_ARRAY_BOOL);
//     expect(type_id([])).toBe(Rsrv.XT_VECTOR);
//     expect(type_id(() => {})).toBe(Rsrv.XT_ARRAY_STR | Rsrv.XT_HAS_ATTR);
//     expect(type_id({})).toBe(Rsrv.XT_VECTOR | Rsrv.XT_HAS_ATTR);
//   });
// });
