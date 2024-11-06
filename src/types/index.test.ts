import { test, expect } from "vitest";
import XT from ".";
import { z } from "zod";
import RserveClient from "../index";
import {
  clearAttrs,
  ObjectWithAttributes,
  objectWithAttributes,
  UnifyOne,
} from "./helpers";

// set global WebSocket
global.WebSocket = require("ws");

type Expect<T extends true> = T;
type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y
  ? 1
  : 2
  ? true
  : false;

type RArray<
  T,
  L extends string,
  A extends {} | undefined = undefined
> = A extends {}
  ? ObjectWithAttributes<T, L, A>
  : T extends number | string | boolean
  ? T
  : ObjectWithAttributes<T, L, undefined>;

type BoolArray<
  T extends boolean | boolean[] | undefined = undefined,
  A extends {} | undefined = undefined
> = T extends undefined
  ? RArray<boolean, "bool_array", A> | RArray<boolean[], "bool_array", A>
  : RArray<T, "bool_array", A>;

type IntArray<
  T extends number | Int32Array | undefined = undefined,
  A extends {} | undefined = undefined
> = T extends undefined
  ? RArray<number, "int_array", A> | RArray<Int32Array, "int_array", A>
  : RArray<T, "int_array", A>;

type NumArray<
  T extends number | Float64Array | undefined = undefined,
  A extends {} | undefined = undefined
> = T extends undefined
  ? RArray<number, "double_array", A> | RArray<Float64Array, "double_array", A>
  : RArray<T, "double_array", A>;

type StringArray<
  T extends string | string[] | undefined = undefined,
  A extends {} | undefined = undefined
> = T extends undefined
  ? RArray<string, "string_array", A> | RArray<string[], "string_array", A>
  : RArray<T, "string_array", A>;

type ArrayToUnion<T extends any[]> = T[number];

type FactorArray<
  L extends [string, ...string[]] | string[] = string[],
  A = {}
> = ArrayToUnion<L>[] & {
  levels: ArrayToUnion<L>[] & {
    r_type: "string_array";
  };
  r_type: "int_array";
  r_attributes: UnifyOne<
    {
      levels: ArrayToUnion<L>[] & { r_type: "string_array" };
      class: "factor";
    } & A & {
        [K in string]: any;
      }
  >;
};

test("Boolean types", async () => {
  const R = await RserveClient.create({
    host: "http://127.0.0.1:8881",
  });

  const bool1 = XT.logical();
  const bool2 = XT.logical(1);
  const bool3 = XT.logical(3);
  const bool4 = XT.logical({
    class: XT.character(1),
  });

  type T1 = z.infer<typeof bool1>;
  type T2 = z.infer<typeof bool2>;
  type T3 = z.infer<typeof bool3>;
  type T4 = z.infer<typeof bool4>;

  type B1 = BoolArray;
  type B2 = BoolArray<boolean>;
  type B3 = BoolArray<boolean[]>;
  type B4 = BoolArray<
    boolean[],
    {
      class: StringArray<string>;
    }
  >;
  type B5 = BoolArray<
    boolean[],
    {
      class: StringArray<string>;
    }
  >;
  type B6 = BoolArray<
    boolean[],
    {
      class: StringArray<string>;
    }
  >;

  type tests = [
    Expect<Equal<T1, B1>>,
    Expect<Equal<T2, B2>>,
    Expect<Equal<T3, B3>>,
    Expect<Equal<T4, B4>>
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

  const r_bool5 = await R.eval("structure(TRUE, class = 'mybool')", bool4);
  expect(r_bool5).toEqual(
    objectWithAttributes([true], "bool_array", { class: "mybool" })
  );
  expect(r_bool5.r_attributes.class).toBe("mybool");

  const r_bool6 = await R.eval(
    "structure(c(TRUE, FALSE, TRUE), class = 'mybool')",
    bool4
  );
  expect(r_bool6).toEqual(
    objectWithAttributes([true, false, true], "bool_array", { class: "mybool" })
  );
  expect(r_bool6.r_attributes.class).toBe("mybool");
});

test("Integer types", async () => {
  const R = await RserveClient.create({
    host: "http://127.0.0.1:8881",
  });

  const int1 = XT.integer();
  const int2 = XT.integer(1);
  const int3 = XT.integer(3);
  const int4 = XT.integer({ class: XT.character(1) });

  type T1 = z.infer<typeof int1>;
  type T2 = z.infer<typeof int2>;
  type T3 = z.infer<typeof int3>;
  type T4 = z.infer<typeof int4>;

  type tests = [
    Expect<Equal<T1, IntArray>>,
    Expect<Equal<T2, IntArray<number>>>,
    Expect<Equal<T3, IntArray<Int32Array>>>,
    Expect<
      Equal<
        T4,
        IntArray<
          Int32Array,
          {
            class: StringArray<string>;
          }
        >
      >
    >
  ];

  const r_int1 = await R.eval("1L", int1);
  expect(r_int1).toBe(1);

  const r_int2 = await R.eval("1L", int2);
  expect(r_int2).toBe(1);

  const r_int3 = await R.eval("1:3", int3);
  expect(r_int3).toEqual(
    objectWithAttributes(new Int32Array([1, 2, 3]), "int_array")
  );

  const r_int4 = await R.eval("structure(1:3, class = 'myclass')", int4);
  expect(r_int4).toEqual(
    objectWithAttributes(new Int32Array([1, 2, 3]), "int_array", {
      class: "myclass",
    })
  );
  expect(r_int4.r_attributes.class).toBe("myclass");

  const r_int5 = await R.eval("structure(1L, class = 'myclass')", int4);
  expect(r_int5).toEqual(
    objectWithAttributes(new Int32Array([1]), "int_array", {
      class: "myclass",
    })
  );
  expect(r_int5.r_attributes.class).toBe("myclass");

  const r_int6 = await R.eval("structure(1:3, class = 'myclass')", int4);
  expect(r_int6).toEqual(
    objectWithAttributes(new Int32Array([1, 2, 3]), "int_array", {
      class: "myclass",
    })
  );
  expect(r_int6.r_attributes.class).toBe("myclass");
});

test("Numeric types", async () => {
  const R = await RserveClient.create({
    host: "http://127.0.0.1:8881",
  });

  const num1 = XT.numeric();
  const num2 = XT.numeric(1);
  const num3 = XT.numeric(3);
  const num4 = XT.numeric({ class: XT.character(1) });

  type T1 = z.infer<typeof num1>;
  type T2 = z.infer<typeof num2>;
  type T3 = z.infer<typeof num3>;
  type T4 = z.infer<typeof num4>;

  type tests = [
    Expect<Equal<T1, NumArray>>,
    Expect<Equal<T2, NumArray<number>>>,
    Expect<Equal<T3, NumArray<Float64Array>>>,
    Expect<
      Equal<
        T4,
        NumArray<
          Float64Array,
          {
            class: StringArray<string>;
          }
        >
      >
    >
  ];

  const r_num1 = await R.eval("1", num1);
  expect(r_num1).toBe(1);

  const r_num2 = await R.eval("1", num2);
  expect(r_num2).toBe(1);

  const r_num3 = await R.eval("c(1, 2, 3)", num3);
  expect(r_num3).toEqual(
    objectWithAttributes(new Float64Array([1, 2, 3]), "double_array")
  );

  const r_num4 = await R.eval("structure(c(1, 2, 3), class = 'myclass')", num4);
  expect(r_num4).toEqual(
    objectWithAttributes(new Float64Array([1, 2, 3]), "double_array", {
      class: "myclass",
    })
  );
  expect(r_num4.r_attributes.class).toBe("myclass");

  const r_num5 = await R.eval("structure(1, class = 'myclass')", num4);
  expect(r_num5).toEqual(
    objectWithAttributes(new Float64Array([1]), "double_array", {
      class: "myclass",
    })
  );
  expect(r_num5.r_attributes.class).toBe("myclass");

  const r_num6 = await R.eval("structure(c(1, 2, 3), class = 'myclass')", num4);
  expect(r_num6).toEqual(
    objectWithAttributes(new Float64Array([1, 2, 3]), "double_array", {
      class: "myclass",
    })
  );
  expect(r_num6.r_attributes.class).toBe("myclass");
});

test("Character types", async () => {
  const R = await RserveClient.create({
    host: "http://127.0.0.1:8881",
  });

  const char1 = XT.character();
  const char2 = XT.character(1);
  const char3 = XT.character(3);
  const char4 = XT.character({ class: XT.character(1) });
  // I don't think this is of much - if you know the data before hand, you don't need R to send it to you...!
  // const char5 = XT.character(["a", "b", "c"]);

  type T1 = z.infer<typeof char1>;
  type T2 = z.infer<typeof char2>;
  type T3 = z.infer<typeof char3>;
  type T4 = z.infer<typeof char4>;
  // type T5 = z.infer<typeof char5>;

  type tests = [
    Expect<Equal<T1, StringArray>>,
    Expect<Equal<T2, StringArray<string>>>,
    Expect<Equal<T3, StringArray<string[]>>>,
    Expect<
      Equal<
        T4,
        StringArray<
          string[],
          {
            class: StringArray<string>;
          }
        >
      >
    >
    // Expect<
    //   Equal<
    //     T5,
    //     {
    //       data: ["a", "b", "c"];
    //       r_type: "string_array";
    //       r_attributes?: unknown;
    //     }
    //   >
    // >
  ];

  const r_char1 = await R.eval("'hello'", char1);
  expect(r_char1).toBe("hello");

  const r_char2 = await R.eval("'hello'", char2);
  expect(r_char2).toBe("hello");

  const r_char3 = await R.eval("c('hello', 'world', 'foo')", char3);
  expect(r_char3).toEqual(
    objectWithAttributes(["hello", "world", "foo"], "string_array")
  );

  const r_char4 = await R.eval("structure('hello', class = 'myclass')", char4);
  expect(r_char4).toEqual(
    objectWithAttributes(["hello"], "string_array", { class: "myclass" })
  );
  expect(r_char4.r_attributes.class).toBe("myclass");

  const r_char5 = await R.eval("structure('hello', class = 'myclass')", char4);
  expect(r_char5).toEqual(
    objectWithAttributes(["hello"], "string_array", { class: "myclass" })
  );
  expect(r_char5.r_attributes.class).toBe("myclass");

  const r_char6 = await R.eval(
    "structure(c('hello', 'world', 'foo'), class = 'myclass')",
    char4
  );
  expect(r_char6).toEqual(
    objectWithAttributes(["hello", "world", "foo"], "string_array", {
      class: "myclass",
    })
  );
  expect(r_char6.r_attributes.class).toBe("myclass");
});

test("Factor types", async () => {
  const R = await RserveClient.create({
    host: "http://127.0.0.1:8881",
  });

  const factor1 = XT.factor();
  const factor2 = XT.factor(["a", "b", "c"]);
  const factor3 = XT.factor(["a", "b", "c"], { someattr: XT.character(1) });
  const factor4 = XT.factor({ someattr: XT.character(1) });

  type T1 = z.infer<typeof factor1>;
  type T2 = z.infer<typeof factor2>;
  type T3 = z.infer<typeof factor3>;
  type T4 = z.infer<typeof factor4>;

  type F1 = FactorArray;
  type F2 = FactorArray<["a", "b", "c"]>;
  type F3 = FactorArray<["a", "b", "c"], { someattr: StringArray<string> }>;
  type F4 = FactorArray<string[], { someattr: StringArray<string> }>;

  type tests = [
    Expect<Equal<T1, F1>>,
    Expect<Equal<T2, F2>>,
    Expect<Equal<T3, F3>>,
    Expect<Equal<T4, F4>>
  ];

  const r_factor1 = await R.eval("factor(c('a', 'b', 'c'))", factor1);
  expect(clearAttrs(r_factor1)).toEqual(["a", "b", "c"]);
  expect(clearAttrs(r_factor1.levels)).toEqual(["a", "b", "c"]);

  const r_factor2 = await R.eval("factor(c('a', 'b', 'c'))", factor2);
  expect(clearAttrs(r_factor2)).toEqual(["a", "b", "c"]);
  expect(clearAttrs(r_factor2.levels)).toEqual(["a", "b", "c"]);

  const r_factor3 = await R.eval(
    "structure(factor(c('a', 'b', 'c')), someattr = 'foo')",
    factor3
  );
  expect(clearAttrs(r_factor3)).toEqual(["a", "b", "c"]);
  expect(clearAttrs(r_factor3.levels)).toEqual(["a", "b", "c"]);
  expect(r_factor3.r_attributes.someattr).toBe("foo");

  const r_factor4 = await R.eval(
    "structure(factor(c('a', 'b', 'c')), someattr = 'foo')",
    factor4
  );
  expect(clearAttrs(r_factor4)).toEqual(["a", "b", "c"]);
  expect(clearAttrs(r_factor4.levels)).toEqual(["a", "b", "c"]);
  expect(r_factor4.r_attributes.someattr).toBe("foo");
});

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

test("List types", async () => {
  const R = await RserveClient.create({
    host: "http://127.0.0.1:8881",
  });

  const list1 = XT.vector();
  const list2 = XT.vector({ x: XT.numeric(1), y: XT.factor(["one", "two"]) });
  const list3 = XT.vector([XT.numeric(5), XT.factor(["one", "two"])]);

  type List1 = z.infer<typeof list1>;
  type List2 = z.infer<typeof list2>;
  type List3 = z.infer<typeof list3>;

  type L0 = any[] & {
    r_type: "vector";
    r_attributes: {
      [x: string]: any;
    };
  };
  type L1 = Record<string, any> & {
    r_type: "vector";
    r_attributes: {
      names: string | string[];
    } & Record<string, any>;
  };
  type L2 = {
    x: NumArray<number>;
    y: FactorArray<["one", "two"]>;
    r_type: "vector";
    r_attributes: {
      names: StringArray<string[]>;
    } & Record<string, any>;
  };
  type L3 = [NumArray<Float64Array>, FactorArray<["one", "two"]>] & {
    r_type: "vector";
    r_attributes: {
      [x: string]: any;
    };
  };

  type tests = [
    Expect<Equal<List1, L1 | L0>>,
    Expect<Equal<List2["r_attributes"], L2["r_attributes"]>>,
    Expect<Equal<List3, L3>>
  ];

  const isNamed = (x: unknown): x is L1 => {
    if (!x) return false;
    if (typeof x !== "object") return false;

    if (x.hasOwnProperty("r_attributes")) {
      return (x as L1).r_attributes.names != undefined;
    }
    return false;
  };

  const r_list1 = await R.eval(
    "list(x = 5.3, y = factor(c('one', 'two')))",
    list1
  );
  if (!isNamed(r_list1)) throw new Error("not named");
  expect(r_list1.x).toEqual(5.3);
  expect(clearAttrs(r_list1.y)).toEqual(["one", "two"]);

  const r_list2 = await R.eval(
    "list(x = 5.3, y = factor(c('one', 'two')))",
    list2
  );
  expect(r_list2.x).toEqual(5.3);
  expect(clearAttrs(r_list2.y)).toEqual(["one", "two"]);
  expect(clearAttrs(r_list2.r_attributes.names)).toEqual(["x", "y"]);

  const r_list3 = await R.eval("list(1:5/2, factor(c('one', 'two')))", list3);
  console.log(r_list3[0]);
  expect(r_list3[0]).toEqual(
    objectWithAttributes(
      new Float64Array([0.5, 1, 1.5, 2, 2.5]),
      "double_array"
    )
  );

  expect(clearAttrs(r_list3[1])).toEqual(["one", "two"]);
});
