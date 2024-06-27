import { test, expect, expectTypeOf } from "vitest";
import { boolean, character, integer, numeric } from "./types";
import { z } from "zod";
import RserveClient from "./index";

export type Expect<T extends true> = T;
export type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <
  T
>() => T extends Y ? 1 : 2
  ? true
  : false;

test("Boolean types", async () => {
  const R = await RserveClient.create({
    host: "http://127.0.0.1:8081",
  });

  type BoolArray<A = unknown> = boolean[] & {
    r_type: "bool_array";
    r_attributes: A;
  };
  const bool1 = boolean();
  const bool2 = boolean(1);
  const bool3 = boolean(3);
  const bool4 = boolean({ class: z.string() });
  const bool5 = boolean(1, { class: z.string() });
  const bool6 = boolean(3, { class: z.string() });

  type T1 = z.infer<typeof bool1>;
  type T2 = z.infer<typeof bool2>;
  type T3 = z.infer<typeof bool3>;
  type T4 = z.infer<typeof bool4>;
  type T5 = z.infer<typeof bool5>;
  type T6 = z.infer<typeof bool6>;

  type tests = [
    Expect<Equal<T1, boolean | BoolArray>>,
    Expect<Equal<T2, boolean>>,
    Expect<Equal<T3, BoolArray>>,
    Expect<
      Equal<
        T4,
        BoolArray<{
          class: string;
        }>
      >
    >,
    Expect<
      Equal<
        T5,
        BoolArray<{
          class: string;
        }>
      >
    >,
    Expect<
      Equal<
        T6,
        BoolArray<{
          class: string;
        }>
      >
    >
  ];

  const r_bool1 = await R.eval("TRUE", bool1);
  expect(r_bool1).toBe(true);

  const r_bool2 = await R.eval("TRUE", bool2);
  expect(r_bool2).toBe(true);

  const r_bool3 = await R.eval("c(TRUE, TRUE, FALSE)", bool3);
  const r_bool3_result: BoolArray = [true, true, false] as any;
  r_bool3_result.r_type = "bool_array";
  r_bool3_result.r_attributes = undefined;
  expect(r_bool3).toEqual(r_bool3_result);

  const r_bool4 = await R.eval("structure(TRUE, class = 'mybool')", bool4);
  const r_bool4_result: BoolArray = [true] as any;
  r_bool4_result.r_type = "bool_array";
  r_bool4_result.r_attributes = {
    class: "mybool",
  };
  expect(r_bool4).toEqual(r_bool4_result);

  const r_bool5 = await R.eval("structure(TRUE, class = 'mybool')", bool5);
  const r_bool5_result: BoolArray = [true] as any;
  r_bool5_result.r_type = "bool_array";
  r_bool5_result.r_attributes = {
    class: "mybool",
  };
  expect(r_bool5).toEqual(r_bool5_result);

  const r_bool6 = await R.eval(
    "structure(c(TRUE, FALSE, TRUE), class = 'mybool')",
    bool6
  );
  const r_bool6_result: BoolArray = [true, false, true] as any;
  r_bool6_result.r_type = "bool_array";
  r_bool6_result.r_attributes = {
    class: "mybool",
  };
  expect(r_bool6).toEqual(r_bool6_result);
});

test("Integer types", async () => {
  const R = await RserveClient.create({
    host: "http://127.0.0.1:8081",
  });

  type IntArray<A = unknown> = number[] & {
    r_type: "int_array";
    r_attributes: A;
  };
  const int1 = integer();
  const int2 = integer(1);
  const int3 = integer(3);
  const int4 = integer({ class: z.string() });
  const int5 = integer(1, { class: z.string() });
  const int6 = integer(3, { class: z.string() });

  type T1 = z.infer<typeof int1>;
  type T2 = z.infer<typeof int2>;
  type T3 = z.infer<typeof int3>;
  type T4 = z.infer<typeof int4>;
  type T5 = z.infer<typeof int5>;
  type T6 = z.infer<typeof int6>;

  type tests = [
    Expect<Equal<T1, number | IntArray>>,
    Expect<Equal<T2, number>>,
    Expect<Equal<T3, IntArray>>,
    Expect<
      Equal<
        T4,
        IntArray<{
          class: string;
        }>
      >
    >,
    Expect<
      Equal<
        T5,
        IntArray<{
          class: string;
        }>
      >
    >,
    Expect<
      Equal<
        T6,
        IntArray<{
          class: string;
        }>
      >
    >
  ];

  const r_int1 = await R.eval("1L", int1);
  expect(r_int1).toBe(1);

  const r_int2 = await R.eval("1L", int2);
  expect(r_int2).toBe(1);

  const r_int3 = await R.eval("1:3", int3);
  const r_int3_result: IntArray = new Int32Array([1, 2, 3]) as any;
  r_int3_result.r_type = "int_array";
  r_int3_result.r_attributes = undefined;
  expect(r_int3).toEqual(r_int3_result);

  const r_int4 = await R.eval("structure(1:3, class = 'myclass')", int4);
  const r_int4_result: IntArray = new Int32Array([1, 2, 3]) as any;
  r_int4_result.r_type = "int_array";
  r_int4_result.r_attributes = {
    class: "myclass",
  };
  expect(r_int4).toEqual(r_int4_result);

  const r_int5 = await R.eval("structure(1L, class = 'myclass')", int5);
  const r_int5_result: IntArray = new Int32Array([1]) as any;
  r_int5_result.r_type = "int_array";
  r_int5_result.r_attributes = {
    class: "myclass",
  };
  expect(r_int5).toEqual(r_int5_result);

  const r_int6 = await R.eval("structure(1:3, class = 'myclass')", int6);
  const r_int6_result: IntArray = new Int32Array([1, 2, 3]) as any;
  r_int6_result.r_type = "int_array";
  r_int6_result.r_attributes = {
    class: "myclass",
  };
  expect(r_int6).toEqual(r_int6_result);
});

test("Numeric types", () => {
  type NumArray<A = unknown> = number[] & {
    r_type: "double_array";
    r_attributes: A;
  };
  const num1 = numeric();
  const num2 = numeric(1);
  const num3 = numeric(3);
  const num4 = numeric({ class: z.string() });
  const num5 = numeric(1, { class: z.string() });
  const num6 = numeric(3, { class: z.string() });

  type T1 = z.infer<typeof num1>;
  type T2 = z.infer<typeof num2>;
  type T3 = z.infer<typeof num3>;
  type T4 = z.infer<typeof num4>;
  type T5 = z.infer<typeof num5>;
  type T6 = z.infer<typeof num6>;

  type tests = [
    Expect<Equal<T1, number | NumArray>>,
    Expect<Equal<T2, number>>,
    Expect<Equal<T3, NumArray>>,
    Expect<
      Equal<
        T4,
        | number
        | NumArray<{
            class: string;
          }>
      >
    >,
    Expect<Equal<T5, number>>,
    Expect<
      Equal<
        T6,
        NumArray<{
          class: string;
        }>
      >
    >
  ];
});

test("Character types", () => {
  type CharArray<A = unknown> = string[] & {
    r_type: "string_array";
    r_attributes: A;
  };
  const char1 = character();
  const char2 = character(1);
  const char3 = character(3);
  const char4 = character({ class: z.string() });
  const char5 = character(1, { class: z.string() });
  const char6 = character(3, { class: z.string() });

  type T1 = z.infer<typeof char1>;
  type T2 = z.infer<typeof char2>;
  type T3 = z.infer<typeof char3>;
  type T4 = z.infer<typeof char4>;
  type T5 = z.infer<typeof char5>;
  type T6 = z.infer<typeof char6>;

  type tests = [
    Expect<Equal<T1, string | CharArray>>,
    Expect<Equal<T2, string>>,
    Expect<Equal<T3, CharArray>>,
    Expect<
      Equal<
        T4,
        | string
        | CharArray<{
            class: string;
          }>
      >
    >,
    Expect<Equal<T5, string>>,
    Expect<
      Equal<
        T6,
        CharArray<{
          class: string;
        }>
      >
    >
  ];
});
