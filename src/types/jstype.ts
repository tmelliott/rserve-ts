// define an INPUT TYPE that is a JAVASCRIPT FUNCTIONS with ARGUMENTS and RETURN VALUE

import { callbackify } from "util";
import { z } from "zod";

function _js_function<TArgs extends [z.ZodTypeAny, ...z.ZodTypeAny[]] | []>(
  ...args: TArgs
) {
  return (
    z
      .function()
      .args(z.tuple(args))
      // TODO: does it have to return void?
      .returns(z.promise(z.void()))
      .transform((f) => callbackify(f))
  );
}

export default _js_function;
