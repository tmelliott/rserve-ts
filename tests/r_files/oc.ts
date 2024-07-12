import { z } from "zod";
import * as R from "../../src/types";

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
  tfail: z.function().returns(z.promise(z.unknown())),
  t1: z.function(z.tuple([z.number()])).returns(z.promise(R.numeric(1))),
  t2: z.function(z.tuple([z.number()])).returns(z.promise(R.numeric(1))),
  t3: z
    .function(
      z.tuple([
        z.function(
          z.tuple([z.number(), z.function(z.tuple([z.any(), z.number()]))])
        ),
      ])
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
