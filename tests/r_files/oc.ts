import { z } from "zod";
import Robj, * as R from "../../src/types";
import { callbackify } from "util";

// const sampleSchema = [
//   z.function(z.tuple([z.number().array()]), z.number()),
//   z.function(z.tuple([z.string().array()]), z.string()),
//   z.function(z.tuple([z.boolean().array()]), z.boolean()),
// ];

// function sample(x: number[]): number;
// function sample(x: string[]): string;
// function sample(x: boolean[]): boolean;
// function sample(x: unknown) {
//   if (!Array.isArray(x)) {
//     throw new Error("Invalid input");
//   }
//   const x0 = x[0];
//   if (typeof x0 === "number") {
//     return sampleSchema[0].parse(x0);
//   }
//   if (typeof x0 === "string") {
//     return sampleSchema[1].parse(x0);
//   }
//   if (typeof x0 === "boolean") {
//     return sampleSchema[2].parse(x0);
//   }
//   throw new Error("Invalid input");
// }

// // const sampleFun = sampleSchema.parse(sample);
// const num = sample([1, 2, 3]);
// num / 2;

const stringArray = z.custom<string[] & { r_type: "string_array" }>((data) => {
  if (
    typeof data === "object" &&
    data.hasOwnProperty("r_type") &&
    data.r_type === "string_array" &&
    Array.isArray(data) &&
    typeof data[0] == "string"
  ) {
    return true;
  }
  return false;
});

export const ocapFuns = {
  print_input: Robj.ocap([z.any()], Robj.character(1)),
  add: Robj.ocap([z.number(), z.number()], Robj.numeric(1)),
  newItem: Robj.ocap(
    [z.string(), z.number()],
    Robj.vector({
      name: Robj.character(1),
      price: Robj.numeric(1),
      codes: Robj.numeric(5),
    })
  ),
  randomNumbers: Robj.ocap([], Robj.numeric(10)),
  sample_num: Robj.ocap([z.instanceof(Float64Array)], Robj.numeric(1)),
  sample_char: Robj.ocap([stringArray], Robj.character(1)),
  // TODO: dataframe output
  iris: Robj.ocap(
    [],
    z.any()
    // Robj.vector({
    //   "Sepal.Length": Robj.double(0),
    //   "Sepal.Width": Robj.double(0),
    //   "Petal.Length": Robj.double(0),
    //   "Petal.Width": Robj.double(0),
    //   Species: Robj.factor(["setosa", "versicolor", "virginica"]),
    // })
  ),
  car_lm: Robj.ocap(
    [
      z.enum([
        "mpg",
        "cyl",
        "disp",
        "hp",
        "drat",
        "wt",
        "qsec",
        "vs",
        "am",
        "gear",
        "carb",
      ]),
      z.enum([
        "mpg",
        "cyl",
        "disp",
        "hp",
        "drat",
        "wt",
        "qsec",
        "vs",
        "am",
        "gear",
        "carb",
      ]),
    ],
    Robj.vector({
      coef: Robj.ocap([], Robj.vector(z.record(z.string(), z.number()))),
      rsq: Robj.ocap([], Robj.numeric(1)),
    })
  ),
  rng: Robj.ocap(
    [],
    Robj.vector({
      rnorm: Robj.ocap([z.number()], Robj.numeric()),
      runif: Robj.ocap([z.number()], Robj.numeric()),
      flip: Robj.ocap([], Robj.integer(1)),
    })
  ),
  longjob: Robj.ocap(
    [
      // TODO: create fn type for this
      z
        .function()
        .args(z.number())
        .returns(z.promise(z.void()))
        .transform((f) => callbackify(f)),
    ],
    Robj.logical(1)
  ),
  tfail: Robj.ocap([z.number()], z.unknown()),
  t1: Robj.ocap([z.number()], Robj.numeric(1)),
  t2: Robj.ocap([z.number()], Robj.numeric(1)),
  t3: Robj.ocap(
    [
      z
        .function()
        .args(z.number())
        .returns(z.promise(z.number()))
        .transform((f) => callbackify(f)),
    ],
    Robj.logical(1)
  ),
  t4: Robj.ocap([z.number()], Robj.numeric(1)),
  t5: Robj.ocap(
    [z.function(z.tuple([z.number()])).returns(z.number())],
    z.null()
  ),
  t6: Robj.ocap(
    [z.number()],
    Robj.vector([z.function(z.tuple([z.number()])), Robj.numeric(1)])
  ),
};
