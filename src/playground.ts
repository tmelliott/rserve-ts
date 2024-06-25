import { z } from "zod";
import RserveClient from "./index";
import { integer, numeric } from "./types";
import { RInt32Array } from "./Rserve";
const R = RserveClient.create({
  host: "http://127.0.0.1:8081",
  on_connect: () => run_tests(),
});

const myarray: Int32Array & {
  r_type: "int_array";
} = new Int32Array([1, 2, 3]) as Int32Array & {
  r_type: "int_array";
};
myarray.r_type = "int_array";

// type V = RVector<
//   number,
//   [
//     {
//       value: {
//         name: "names";
//         value: {
//           type: "string";
//           value: ["one", "two", "three"];
//         };
//       };
//     }
//   ]
// >;

type KnownCharacter<T extends string[]> = {
  type: "character_array";
  value: T;
  attributes: undefined;
};
let levels: KnownCharacter<["one", "two"]>;
// levels.value

type Factor<T extends string[] = string[]> = T;
type X1 = Factor<["one", "two", "three"]>;
type X2 = Factor;

// an TRObject
type TRObject =
  | {
      type: "sexp";
      value: TRObject;
    }
  | {
      type: string;
      value: any;
      attributes: any;
      json: () => any;
    };

const run_tests = async () => {
  console.log("Connected to R");
  console.log(R.is_running());

  console.log("\n\n----");
  const mean = await R.eval("1L", integer());
  console.log("Mean ...");
  console.log(mean);
  console.log(mean.json());

  const range = await R.eval("range(1:5)", integer());
  console.log("Range ...");
  console.log(range);
  console.log(range.json());

  const xrand = await R.eval("rnorm(5)", numeric());
  console.log("Random ...");
  console.log(xrand);
  console.log(xrand.json());

  const tbl = await R.eval("table(iris$Species)");
  console.log("Table ...");
  console.log(tbl);
  console.log((tbl as any).json());
  // console.log((tbl as any).json().r_attributes);

  // the json method returns the type of value with attributes

  // const tbl2 = await R.eval(
  //   "table(iris$Species)",
  //   integer({
  //     dimnames: list({
  //       "": character(["setosa", "versicolor", "virginica"]),
  //     }),
  //   })
  // );
  // console.log("Table 2...");
  // console.log(tbl2);
  // console.log(tbl2.json());
  // const tblx = tbl2.json();

  // const iris2 = await R.eval("iris");
  // // @ts-ignore
  // console.log(iris2.value.json());

  // const iris = await R.eval(
  //   "iris",
  //   rtypes.dataframe({
  //     "Sepal.Length": rtypes.numeric(),
  //     "Sepal.Width": rtypes.numeric(),
  //     "Petal.Length": rtypes.numeric(),
  //     "Petal.Width": rtypes.numeric(),
  //     Species: rtypes.factor(["setosa", "versicolor", "virginica"]),
  //   })
  // );

  // const mu = await R.value(z.number()).eval("mean(1:5)");
  // const numeric = z.number();
  // const mu = await R.eval(
  //   "mean(1:5)",
  //   z.object({
  //     type: z.literal("sexp"),
  //     value: z.object({
  //       type: z.literal("double_array"),
  //       value: z.instanceof(Float64Array),
  //       attributes: z.undefined(),
  //       json: z.function().returns(z.number()),
  //     }),
  //   })
  // );

  // const x = await R.eval<any>("mean(1:5)");
  // const x = await R.eval<any>("iris$Species[1:3]");
  // console.log(x);
  // console.log(x.value.attributes.value);
  // console.log(x.value.json());

  // const x = await R.eval<RClos<any, any>>("function(a, b) { 'hello world' }");
  // console.log(x);
  // console.log(x.value.value);
  // console.log(x.value.value.formals.value);

  process.exit(0);

  // const x = await R.eval<number>("1 + 1");

  // const oc = await R.ocap<{
  //   add: (a: number, b: number) => Promise<number>;
  // }>();
  // const z = await oc.add(1, 2);
  // console.log(z);
};
