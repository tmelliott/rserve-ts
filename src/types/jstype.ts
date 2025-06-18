// define an INPUT TYPE that is a JAVASCRIPT FUNCTIONS with ARGUMENTS and RETURN VALUE

import { z } from "zod";

function _js_function<
  TArgs extends [z.ZodTypeAny, ...z.ZodTypeAny[]],
  TResult extends z.ZodTypeAny = z.ZodUndefined
>(_input: TArgs, _output?: TResult) {
  return z
    .function()
    .args(
      ...[
        ..._input,
        z
          .function()
          .args(z.any(), z.optional(_output ?? z.undefined()))
          .returns(z.void()),
      ]
    )
    .returns(z.void());
}

export default _js_function;
