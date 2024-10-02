import { z } from "zod";
import * as R from "../../src/types";
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
  print_input: R.ocap([z.any()], R.character(1)),
  add: R.ocap([z.number(), z.number()], R.numeric(1)),
  newItem: R.ocap(
    [z.string(), z.number()],
    R.list({
      name: R.character(1),
      price: R.numeric(1),
      codes: R.numeric(5),
    })
  ),
  randomNumbers: R.ocap([], R.numeric(10)),
  sample_num: R.ocap([z.instanceof(Float64Array)], R.numeric(1)),
  sample_char: R.ocap([stringArray], R.character(1)),
  // TODO: dataframe output
  iris: R.ocap([], z.any()),
  rng: R.ocap(
    [],
    R.list({
      rnorm: R.ocap([z.number()], R.numeric()),
      runif: R.ocap([z.number()], R.numeric()),
      flip: R.ocap([], R.integer(1)),
    })
  ),
  longjob: R.ocap(
    [
      // TODO: create fn type for this
      z
        .function()
        .args(z.number())
        .returns(z.promise(z.void()))
        .transform((f) => callbackify(f)),
    ],
    R.logical(1)
  ),
  tfail: R.ocap([z.number()], z.unknown()),
  t1: R.ocap([z.number()], R.numeric(1)),
  t2: R.ocap([z.number()], R.numeric(1)),
  t3: R.ocap(
    [
      z
        .function()
        .args(z.number())
        .returns(z.promise(z.number()))
        .transform((f) => callbackify(f)),
    ],
    R.logical(1)
  ),
  t4: R.ocap([z.number()], R.numeric(1)),
  t5: R.ocap([z.function(z.tuple([z.number()])).returns(z.number())], z.null()),
  t6: R.ocap(
    [z.number()],
    R.list([
      z.object({ data: z.function(z.tuple([z.number()])) }),
      R.numeric(1),
    ])
  ),
};
