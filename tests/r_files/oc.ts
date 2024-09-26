import { z } from "zod";
import * as R from "../../src/types";
import { callbackify } from "util";

export const ocapFuns = {
  add: z
    .function(z.tuple([z.number(), z.number()]))
    .returns(z.promise(R.numeric(1))),
  newItem: z.function(z.tuple([z.string(), z.number()])).returns(
    z.promise(
      R.list({
        name: R.character(1),
        price: R.numeric(1),
        codes: R.numeric(5),
      })
    )
  ),
  randomNumbers: z.function().returns(z.promise(R.numeric(10))),
  // randomNumbers: R.ocap([], R.numeric(10)),
  iris: z.function().returns(z.promise(z.any())),
  rng: z.function().returns(
    z.promise(
      R.list({
        rnorm: R.ocap([z.number()], R.numeric()),
        runif: R.ocap([z.number()], R.numeric()),
        flip: R.ocap([], R.integer(1)),
      })
    )
  ),
  longjob: z
    .function()
    .args(
      z
        .function()
        .args(z.number())
        .returns(z.promise(z.void()))
        .transform((f) => callbackify(f))
    )
    .returns(z.promise(R.logical(1))),
  tfail: z.function().returns(z.promise(z.unknown())),
  t1: z.function(z.tuple([z.number()])).returns(z.promise(R.numeric(1))),
  t2: z.function(z.tuple([z.number()])).returns(z.promise(R.numeric(1))),
  t3: z
    .function()
    .args(
      z
        .function()
        .args(z.number())
        .returns(z.promise(z.number()))
        .transform((f) => callbackify(f))
    )
    .returns(z.promise(R.logical(1))),
  t4: z.function(z.tuple([z.number()])).returns(z.promise(R.numeric(1))),
  t5: z
    .function(z.tuple([z.function(z.tuple([z.number()])).returns(z.number())]))
    .returns(z.promise(z.null())),
  t6: z
    .function(z.tuple([z.number()]))
    .returns(
      z.promise(
        R.list([
          z.object({ data: z.function(z.tuple([z.number()])) }),
          R.numeric(1),
        ])
      )
    ),
};
