import { z } from "zod";
import * as R from "../../src/types";
import { callbackify } from "util";

export const ocapFuns = {
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
