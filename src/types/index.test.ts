import { test, expect } from "vitest";
import XT from "./xt_types";
import { z } from "zod";
import RserveClient from "../index";
import {
  ObjectWithAttributes,
  objectWithAttributes,
  WithAttributes,
} from "./helpers";

// set global WebSocket
global.WebSocket = require("ws");

type Expect<T extends true> = T;
type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y
  ? 1
  : 2
  ? true
  : false;

type Unify<T> = {} & {
  [K in keyof T]: T[K] extends object ? Unify<T[K]> : T[K];
};

type RArray<
  T,
  L extends string,
  A extends {} | undefined = undefined
> = A extends {}
  ? ObjectWithAttributes<T, L, A>
  : T extends number | string | boolean
  ? T
  : ObjectWithAttributes<T, L, any>;

type BoolArray<
  T extends boolean | boolean[] | undefined = undefined,
  A extends {} | undefined = undefined
> = T extends undefined
  ? RArray<boolean, "bool_array", A> | RArray<boolean[], "bool_array", A>
  : RArray<T, "bool_array", A>;

// type IntArray<T = number | Int32Array, A = undefined> = RArray<
//   T,
//   "int_array",
//   A
// >;
// type NumArray<T = number | Float64Array, A = undefined> = RArray<
//   T,
//   "double_array",
//   A
// >;
// type StringArray<T = string | string[], A = undefined> = RArray<
//   T,
//   "string_array",
//   A
// >;
// type FactorArray<
//   L extends [string, ...string[]] | string[] = string[],
//   A = {}
// > = Unify<
//   RArray<
//     string[],
//     "int_array",
//     Unify<
//       A & {
//         levels: {
//           data: L;
//           r_type: "string_array";
//           r_attributes?: unknown;
//         };
//         class: {
//           data: "factor";
//           r_type: "string_array";
//           r_attributes?: unknown;
//         };
//       }
//     >
//   > & {
//     levels: L;
//   }
// >;

test("Boolean types", async () => {
  const R = await RserveClient.create({
    host: "http://127.0.0.1:8881",
  });

  const bool1 = XT.boolean();
  const bool2 = XT.boolean(1);
  const bool3 = XT.boolean(3);
  const bool4 = XT.boolean({
    class: XT.string(1),
  });
  const bool5 = XT.boolean({ class: XT.string(1) });
  const bool6 = XT.boolean({ class: XT.string(1) });

  type T1 = z.infer<typeof bool1>;
  type T2 = z.infer<typeof bool2>;
  type T3 = z.infer<typeof bool3>;
  type T4 = z.infer<typeof bool4>;
  type T5 = z.infer<typeof bool5>;
  type T6 = z.infer<typeof bool6>;

  type B1 = BoolArray;

  type tests = [
    Expect<Equal<T1, BoolArray>>
    // Expect<Equal<T2, boolean>>,
    // Expect<Equal<T3, BoolArray>>
    // Expect<
    //   Equal<
    //     T4,
    //     BoolArray<
    //       {
    //         class: XT.string();
    //       }
    //     >
    //   >
    // >,
    // Expect<
    //   Equal<
    //     T5,
    //     BoolArray<
    //       boolean[],
    //       {
    //         class: StringArray<string>;
    //       }
    //     >
    //   >
    // >,
    // Expect<
    //   Equal<
    //     T6,
    //     BoolArray<
    //       boolean[],
    //       {
    //         class: StringArray<string>;
    //       }
    //     >
    //   >
    // >
  ];

  const r_bool1 = await R.eval("TRUE", bool1);
  expect(r_bool1).toBe(true);

  const r_bool2 = await R.eval("TRUE", bool2);
  expect(r_bool2).toBe(true);

  const r_bool3 = await R.eval("c(TRUE, TRUE, FALSE)", bool3);
  expect(r_bool3).toEqual(
    objectWithAttributes([true, true, false], "bool_array")
  );

  const r_bool4 = await R.eval("structure(TRUE, class = 'mybool')", bool4);
  expect(r_bool4).toEqual(
    objectWithAttributes([true], "bool_array", { class: "mybool" })
  );
  expect(r_bool4.r_attributes.class).toBe("mybool");

  const r_bool5 = await R.eval("structure(TRUE, class = 'mybool')", bool5);
  expect(r_bool5).toEqual(
    objectWithAttributes([true], "bool_array", { class: "mybool" })
  );
  expect(r_bool5.r_attributes.class).toBe("mybool");

  const r_bool6 = await R.eval(
    "structure(c(TRUE, FALSE, TRUE), class = 'mybool')",
    bool6
  );
  expect(r_bool6).toEqual(
    objectWithAttributes([true, false, true], "bool_array", { class: "mybool" })
  );
  expect(r_bool6.r_attributes.class).toBe("mybool");
});

// test("Integer types", async () => {
//   const R = await RserveClient.create({
//     host: "http://127.0.0.1:8881",
//   });

//   const int1 = integer();
//   const int2 = integer(1);
//   const int3 = integer(3);
//   const int4 = integer({ class: character(1) });
//   const int5 = integer(1, { class: character(1) });
//   const int6 = integer(3, { class: character(1) });

//   type T1 = z.infer<typeof int1>;
//   type T2 = z.infer<typeof int2>;
//   type T3 = z.infer<typeof int3>;
//   type T4 = z.infer<typeof int4>;
//   type T5 = z.infer<typeof int5>;
//   type T6 = z.infer<typeof int6>;

//   type tests = [
//     Expect<Equal<T1, IntArray>>,
//     Expect<Equal<T2, IntArray<number>>>,
//     Expect<Equal<T3, IntArray<Int32Array>>>,
//     Expect<
//       Equal<
//         T4,
//         IntArray<
//           Int32Array,
//           {
//             class: StringArray<string>;
//           }
//         >
//       >
//     >,
//     Expect<
//       Equal<
//         T5,
//         IntArray<
//           Int32Array,
//           {
//             class: StringArray<string>;
//           }
//         >
//       >
//     >,
//     Expect<
//       Equal<
//         T6,
//         IntArray<
//           Int32Array,
//           {
//             class: StringArray<string>;
//           }
//         >
//       >
//     >
//   ];

//   const { data: r_int1 } = await R.eval("1L", int1);
//   expect(r_int1).toBe(1);

//   const { data: r_int2 } = await R.eval("1L", int2);
//   expect(r_int2).toBe(1);

//   const { data: r_int3 } = await R.eval("1:3", int3);
//   expect(r_int3).toEqual(new Int32Array([1, 2, 3]));

//   const r_int4 = await R.eval("structure(1:3, class = 'myclass')", int4);
//   expect(r_int4.data).toEqual(new Int32Array([1, 2, 3]));
//   expect(r_int4.r_attributes.class.data).toBe("myclass");

//   const r_int5 = await R.eval("structure(1L, class = 'myclass')", int5);
//   expect(r_int5.data).toEqual(new Int32Array([1]));
//   expect(r_int5.r_attributes.class.data).toBe("myclass");

//   const r_int6 = await R.eval("structure(1:3, class = 'myclass')", int6);
//   expect(r_int6.data).toEqual(new Int32Array([1, 2, 3]));
//   expect(r_int6.r_attributes.class.data).toBe("myclass");
// });

// test("Numeric types", async () => {
//   const R = await RserveClient.create({
//     host: "http://127.0.0.1:8881",
//   });

//   const num1 = numeric();
//   const num2 = numeric(1);
//   const num3 = numeric(3);
//   const num4 = numeric({ class: character(1) });
//   const num5 = numeric(1, { class: character(1) });
//   const num6 = numeric(3, { class: character(1) });

//   type T1 = z.infer<typeof num1>;
//   type T2 = z.infer<typeof num2>;
//   type T3 = z.infer<typeof num3>;
//   type T4 = z.infer<typeof num4>;
//   type T5 = z.infer<typeof num5>;
//   type T6 = z.infer<typeof num6>;

//   type tests = [
//     Expect<Equal<T1, NumArray>>,
//     Expect<Equal<T2, NumArray<number>>>,
//     Expect<Equal<T3, NumArray<Float64Array>>>,
//     Expect<
//       Equal<
//         T4,
//         NumArray<
//           Float64Array,
//           {
//             class: StringArray<string>;
//           }
//         >
//       >
//     >,
//     Expect<
//       Equal<
//         T5,
//         NumArray<
//           Float64Array,
//           {
//             class: StringArray<string>;
//           }
//         >
//       >
//     >,
//     Expect<
//       Equal<
//         T6,
//         NumArray<
//           Float64Array,
//           {
//             class: StringArray<string>;
//           }
//         >
//       >
//     >
//   ];

//   const { data: r_num1 } = await R.eval("1", num1);
//   expect(r_num1).toBe(1);

//   const { data: r_num2 } = await R.eval("1", num2);
//   expect(r_num2).toBe(1);

//   const { data: r_num3 } = await R.eval("c(1, 2, 3)", num3);
//   expect(r_num3).toEqual(new Float64Array([1, 2, 3]));

//   const r_num4 = await R.eval("structure(c(1, 2, 3), class = 'myclass')", num4);
//   expect(r_num4.data).toEqual(new Float64Array([1, 2, 3]));
//   expect(r_num4.r_attributes.class.data).toBe("myclass");

//   const r_num5 = await R.eval("structure(1, class = 'myclass')", num5);
//   expect(r_num5.data).toEqual(new Float64Array([1]));
//   expect(r_num5.r_attributes.class.data).toBe("myclass");

//   const r_num6 = await R.eval("structure(c(1, 2, 3), class = 'myclass')", num6);
//   expect(r_num6.data).toEqual(new Float64Array([1, 2, 3]));
//   expect(r_num6.r_attributes.class.data).toBe("myclass");
// });

// test("Character types", async () => {
//   const R = await RserveClient.create({
//     host: "http://127.0.0.1:8881",
//   });

//   const char1 = character();
//   const char2 = character(1);
//   const char3 = character(3);
//   const char4 = character({ class: character(1) });
//   const char5 = character(1, { class: character(1) });
//   const char6 = character(3, { class: character(1) });
//   const char7 = character(["a", "b", "c"]);

//   type T1 = z.infer<typeof char1>;
//   type T2 = z.infer<typeof char2>;
//   type T3 = z.infer<typeof char3>;
//   type T4 = z.infer<typeof char4>;
//   type T5 = z.infer<typeof char5>;
//   type T6 = z.infer<typeof char6>;
//   type T7 = z.infer<typeof char7>;

//   type tests = [
//     Expect<Equal<T1, StringArray>>,
//     Expect<Equal<T2, StringArray<string>>>,
//     Expect<Equal<T3, StringArray<string[]>>>,
//     Expect<
//       Equal<
//         T4,
//         StringArray<
//           string[],
//           {
//             class: StringArray<string>;
//           }
//         >
//       >
//     >,
//     Expect<
//       Equal<
//         T5,
//         StringArray<
//           string[],
//           {
//             class: StringArray<string>;
//           }
//         >
//       >
//     >,
//     Expect<
//       Equal<
//         T6,
//         StringArray<
//           string[],
//           {
//             class: StringArray<string>;
//           }
//         >
//       >
//     >,
//     Expect<
//       Equal<
//         T7,
//         {
//           data: ["a", "b", "c"];
//           r_type: "string_array";
//           r_attributes?: unknown;
//         }
//       >
//     >
//   ];

//   const { data: r_char1 } = await R.eval("'hello'", char1);
//   expect(r_char1).toBe("hello");

//   const { data: r_char2 } = await R.eval("'hello'", char2);
//   expect(r_char2).toBe("hello");

//   const { data: r_char3 } = await R.eval("c('hello', 'world', 'foo')", char3);
//   expect(r_char3).toEqual(["hello", "world", "foo"]);

//   const r_char4 = await R.eval("structure('hello', class = 'myclass')", char4);
//   expect(r_char4.data).toEqual(["hello"]);
//   expect(r_char4.r_attributes.class.data).toBe("myclass");

//   const r_char5 = await R.eval("structure('hello', class = 'myclass')", char5);
//   expect(r_char5.data).toEqual(["hello"]);
//   expect(r_char5.r_attributes.class.data).toBe("myclass");

//   const r_char6 = await R.eval(
//     "structure(c('hello', 'world', 'foo'), class = 'myclass')",
//     char6
//   );
//   expect(r_char6.data).toEqual(["hello", "world", "foo"]);
//   expect(r_char6.r_attributes.class.data).toBe("myclass");
// });

// test("Factor types", async () => {
//   const R = await RserveClient.create({
//     host: "http://127.0.0.1:8881",
//   });

//   const factor1 = R.factor();
//   const factor2 = R.factor(["a", "b", "c"]);
//   const factor3 = R.factor(["a", "b", "c"], { someattr: character(1) });
//   const factor4 = R.factor(undefined, { someattr: character(1) });

//   type T1 = Unify<z.infer<typeof factor1>>;
//   type T2 = Unify<z.infer<typeof factor2>>;
//   type T3 = Unify<z.infer<typeof factor3>>;
//   type T4 = Unify<z.infer<typeof factor4>>;

//   type tests = [
//     Expect<Equal<T1, FactorArray>>,
//     Expect<Equal<T2, FactorArray<["a", "b", "c"]>>>,
//     Expect<
//       Equal<T3, FactorArray<["a", "b", "c"], { someattr: StringArray<string> }>>
//     >,
//     Expect<Equal<T4, FactorArray<string[], { someattr: StringArray<string> }>>>
//   ];

//   const r_factor1 = await R.eval("factor(c('a', 'b', 'c'))", factor1);
//   expect(r_factor1.data).toEqual(["a", "b", "c"]);
//   expect(r_factor1.levels).toEqual(["a", "b", "c"]);

//   const r_factor2 = await R.eval("factor(c('a', 'b', 'c'))", factor2);
//   expect(r_factor2.data).toEqual(["a", "b", "c"]);
//   expect(r_factor2.levels).toEqual(["a", "b", "c"]);

//   const r_factor3 = await R.eval(
//     "structure(factor(c('a', 'b', 'c')), someattr = 'foo')",
//     factor3
//   );
//   expect(r_factor3.data).toEqual(["a", "b", "c"]);
//   expect(r_factor3.levels).toEqual(["a", "b", "c"]);
//   expect(r_factor3.r_attributes.someattr.data).toBe("foo");

//   const r_factor4 = await R.eval(
//     "structure(factor(c('a', 'b', 'c')), someattr = 'foo')",
//     factor4
//   );
//   expect(r_factor4.data).toEqual(["a", "b", "c"]);
//   expect(r_factor4.levels).toEqual(["a", "b", "c"]);
//   expect(r_factor4.r_attributes.someattr.data).toBe("foo");
// });

// test("Table types", async () => {
//   const R = await RserveClient.create({
//     host: "http://127.0.0.1:8881",
//   });

//   const tab1 = R.table([3]);
//   const tab2 = R.table([3, 2]);
//   const tab3 = R.table(1); // a 1D table with unknown dimensions
//   const tab4 = R.table(3); // a 3D table with unknown dimensions

//   type Tab1 = z.infer<typeof tab1>;
//   type Tab2 = z.infer<typeof tab2>;
//   type Tab3 = z.infer<typeof tab3>;
//   type Tab4 = z.infer<typeof tab4>;

//   type tests = [
//     Expect<
//       Equal<
//         Tab1,
//         {
//           data: Int32Array;
//           r_type: "int_array";
//           r_attributes: {
//             dim: {
//               data: 3;
//               r_type: "int_array";
//               r_attributes?: unknown;
//             };
//             dimnames: {
//               data: Record<string, StringArray>;
//             };
//           };
//         }
//       >
//     >,
//     Expect<
//       Equal<
//         Tab2,
//         {
//           data: Int32Array;
//           r_type: "int_array";
//           r_attributes: {
//             dim: {
//               data: [3, 2];
//               r_type: "int_array";
//               r_attributes?: unknown;
//             };
//             dimnames: {
//               data: Record<string, StringArray>;
//             };
//           };
//         }
//       >
//     >,
//     Expect<
//       Equal<
//         Tab3,
//         {
//           data: Int32Array;
//           r_type: "int_array";
//           r_attributes: {
//             dim: {
//               data: number;
//               r_type: "int_array";
//               r_attributes?: unknown;
//             };
//             dimnames: {
//               data: Record<string, StringArray>;
//             };
//           };
//         }
//       >
//     >,
//     Expect<
//       Equal<
//         Tab4,
//         {
//           data: Int32Array;
//           r_type: "int_array";
//           r_attributes: {
//             dim: {
//               data: [number, number, number];
//               r_type: "int_array";
//               r_attributes?: unknown;
//             };
//             dimnames: {
//               data: Record<string, StringArray>;
//             };
//           };
//         }
//       >
//     >
//   ];

//   const r_tab1 = await R.eval("table(iris$Species)", tab1);
//   expect(r_tab1.data).toEqual(new Int32Array([50, 50, 50]));
//   expect(r_tab1.r_attributes.dim.data).toBe(3);

//   const r_tab2 = await R.eval("table(iris$Species, rep(1:2, each = 75))", tab2);
//   expect(r_tab2.data).toEqual(new Int32Array([50, 25, 0, 0, 25, 50]));
//   expect(r_tab2.r_attributes.dim.data).toEqual([3, 2]);
// });

// test("List types", async () => {
//   const R = await RserveClient.create({
//     host: "http://127.0.0.1:8881",
//   });

//   const list1 = R.list();
//   const list2 = R.list({ x: R.numeric(1), y: R.factor(["one", "two"]) });
//   const list3 = R.list([R.numeric(5), R.factor(["one", "two"])]);

//   type List1 = z.infer<typeof list1>;
//   type List2 = z.infer<typeof list2>;
//   type List3 = z.infer<typeof list3>;

//   type List1X = List1["data"];

//   type tests = [
//     Expect<
//       Equal<
//         List1,
//         {
//           data: Record<string, RTypes>;
//           r_type: "vector";
//           r_attributes: {
//             [x: string]: any;
//             names?: unknown;
//           };
//         }
//       >
//     >,
//     Expect<
//       Equal<
//         List2,
//         {
//           data: {
//             x: NumArray<number>;
//             y: FactorArray<["one", "two"]>;
//           };
//           r_type: "vector";
//           r_attributes: {
//             [x: string]: any;
//             names?: unknown;
//           };
//         }
//       >
//     >,
//     Expect<
//       Equal<
//         List3,
//         {
//           data: [NumArray<Float64Array>, FactorArray<["one", "two"]>];
//           r_type: "vector";
//           r_attributes: {
//             [x: string]: any;
//           };
//         }
//       >
//     >
//   ];

//   const r_list1 = await R.eval(
//     "list(x = 5.3, y = factor(c('one', 'two')))",
//     list1
//   );
//   expect(r_list1.data.x.data).toEqual(5.3);
//   expect(r_list1.data.y.data).toEqual(["one", "two"]);

//   const r_list2 = await R.eval(
//     "list(x = 5.3, y = factor(c('one', 'two')))",
//     list2
//   );
//   expect(r_list2.data.x.data).toEqual(5.3);
//   expect(r_list2.data.y.data).toEqual(["one", "two"]);
//   // if (r_list2.r_attributes.names)
//   //   expect(r_list2.r_attributes.names.data).toEqual(["x", "y"]);

//   const r_list3 = await R.eval("list(1:5/2, factor(c('one', 'two')))", list3);
//   expect(r_list3.data[0].data).toEqual(new Float64Array([0.5, 1, 1.5, 2, 2.5]));
//   expect(r_list3.data[1].data).toEqual(["one", "two"]);
// });
