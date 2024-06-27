import { test, expect, expectTypeOf } from "vitest";
import { integer, numeric } from "./types";
import { z } from "zod";

export type Expect<T extends true> = T;
export type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <
  T
>() => T extends Y ? 1 : 2
  ? true
  : false;

test("Integer types", () => {
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
        | number
        | IntArray<{
            class: string;
          }>
      >
    >,
    Expect<Equal<T5, number>>,
    Expect<
      Equal<
        T6,
        IntArray<{
          class: string;
        }>
      >
    >
  ];
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
