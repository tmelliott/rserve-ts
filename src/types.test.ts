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

test("Numeric types", async () => {
  const R = await RserveClient.create({
    host: "http://127.0.0.1:8081",
  });

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
        NumArray<{
          class: string;
        }>
      >
    >,
    Expect<
      Equal<
        T5,
        NumArray<{
          class: string;
        }>
      >
    >,
    Expect<
      Equal<
        T6,
        NumArray<{
          class: string;
        }>
      >
    >
  ];

  const r_num1 = await R.eval("1", num1);
  expect(r_num1).toBe(1);

  const r_num2 = await R.eval("1", num2);
  expect(r_num2).toBe(1);

  const r_num3 = await R.eval("c(1, 2, 3)", num3);
  const r_num3_result: NumArray = new Float64Array([1, 2, 3]) as any;
  r_num3_result.r_type = "double_array";
  r_num3_result.r_attributes = undefined;
  expect(r_num3).toEqual(r_num3_result);

  const r_num4 = await R.eval("structure(c(1, 2, 3), class = 'myclass')", num4);
  const r_num4_result: NumArray = new Float64Array([1, 2, 3]) as any;
  r_num4_result.r_type = "double_array";
  r_num4_result.r_attributes = {
    class: "myclass",
  };
  expect(r_num4).toEqual(r_num4_result);

  const r_num5 = await R.eval("structure(1, class = 'myclass')", num5);
  const r_num5_result: NumArray = new Float64Array([1]) as any;
  r_num5_result.r_type = "double_array";
  r_num5_result.r_attributes = {
    class: "myclass",
  };
  expect(r_num5).toEqual(r_num5_result);

  const r_num6 = await R.eval("structure(c(1, 2, 3), class = 'myclass')", num6);
  const r_num6_result: NumArray = new Float64Array([1, 2, 3]) as any;
  r_num6_result.r_type = "double_array";
  r_num6_result.r_attributes = {
    class: "myclass",
  };
  expect(r_num6).toEqual(r_num6_result);
});

test("Character types", async () => {
  const R = await RserveClient.create({
    host: "http://127.0.0.1:8081",
  });

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
        CharArray<{
          class: string;
        }>
      >
    >,
    Expect<
      Equal<
        T5,
        CharArray<{
          class: string;
        }>
      >
    >,
    Expect<
      Equal<
        T6,
        CharArray<{
          class: string;
        }>
      >
    >
  ];

  const r_char1 = await R.eval("'hello'", char1);
  expect(r_char1).toBe("hello");

  const r_char2 = await R.eval("'hello'", char2);
  expect(r_char2).toBe("hello");

  const r_char3 = await R.eval("c('hello', 'world', 'foo')", char3);
  const r_char3_result: CharArray = ["hello", "world", "foo"] as any;
  r_char3_result.r_type = "string_array";
  r_char3_result.r_attributes = undefined;
  expect(r_char3).toEqual(r_char3_result);

  const r_char4 = await R.eval("structure('hello', class = 'myclass')", char4);
  const r_char4_result: CharArray = ["hello"] as any;
  r_char4_result.r_type = "string_array";
  r_char4_result.r_attributes = {
    class: "myclass",
  };
  expect(r_char4).toEqual(r_char4_result);

  const r_char5 = await R.eval("structure('hello', class = 'myclass')", char5);
  const r_char5_result: CharArray = ["hello"] as any;
  r_char5_result.r_type = "string_array";
  r_char5_result.r_attributes = {
    class: "myclass",
  };
  expect(r_char5).toEqual(r_char5_result);

  const r_char6 = await R.eval(
    "structure(c('hello', 'world', 'foo'), class = 'myclass')",
    char6
  );
  const r_char6_result: CharArray = ["hello", "world", "foo"] as any;
  r_char6_result.r_type = "string_array";
  r_char6_result.r_attributes = {
    class: "myclass",
  };
  expect(r_char6).toEqual(r_char6_result);
});

test("Factor types", async () => {
  const R = await RserveClient.create({
    host: "http://127.0.0.1:8081",
  });

  type FactorArray<
    L extends [string, ...string[]] | string[] = string[],
    A = unknown
  > = string[] & {
    levels: L;
    r_type: "int_array";
    r_attributes: A;
  };

  const factor1 = R.factor();
  const factor2 = R.factor(["a", "b", "c"]);
  const factor3 = R.factor(["a", "b", "c"], { class: z.string() });
  const factor4 = R.factor(undefined, { class: z.string() });

  type T1 = z.infer<typeof factor1>;
  type T2 = z.infer<typeof factor2>;
  type T3 = z.infer<typeof factor3>;
  type T4 = z.infer<typeof factor4>;

  type tests = [
    Expect<Equal<T1, FactorArray>>,
    Expect<Equal<T2, FactorArray<["a", "b", "c"]>>>,
    Expect<Equal<T3, FactorArray<["a", "b", "c"], { class: string }>>>,
    Expect<Equal<T4, FactorArray<string[], { class: string }>>>
  ];

  const r_factor1 = await R.eval("factor(c('a', 'b', 'c'))", factor1);
  const r_factor1_result: FactorArray = ["a", "b", "c"] as any;
  r_factor1_result.levels = ["a", "b", "c"] as ["a", "b", "c"];
  r_factor1_result.r_type = "int_array";
  r_factor1_result.r_attributes = undefined;
  r_factor1.r_attributes = undefined;
  expect(r_factor1).toEqual(r_factor1_result);

  const r_factor2 = await R.eval("factor(c('a', 'b', 'c'))", factor2);
  const r_factor2_result: FactorArray = ["a", "b", "c"] as any;
  r_factor2_result.levels = ["a", "b", "c"] as ["a", "b", "c"];
  r_factor2_result.r_type = "int_array";
  r_factor2_result.r_attributes = undefined;
  r_factor2.r_attributes = undefined;
  expect(r_factor2).toEqual(r_factor2_result);

  const r_factor3 = await R.eval("factor(c('a', 'b', 'c'))", factor3);
  const r_factor3_result: FactorArray = ["a", "b", "c"] as any;
  r_factor3_result.levels = ["a", "b", "c"] as ["a", "b", "c"];
  r_factor3_result.r_type = "int_array";
  r_factor3_result.r_attributes = {
    class: "factor",
  };
  r_factor3.r_attributes = {
    class: "factor",
  };
  expect(r_factor3).toEqual(r_factor3_result);

  const r_factor4 = await R.eval("factor(c('a', 'b', 'c'))", factor4);
  const r_factor4_result: FactorArray = ["a", "b", "c"] as any;
  r_factor4_result.levels = ["a", "b", "c"] as ["a", "b", "c"];
  r_factor4_result.r_type = "int_array";
  r_factor4_result.r_attributes = {
    class: "factor",
  };
  r_factor4.r_attributes = {
    class: "factor",
  };
  expect(r_factor4).toEqual(r_factor4_result);
});
