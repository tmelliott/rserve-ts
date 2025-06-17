// define an INPUT TYPE that is a JAVASCRIPT FUNCTIONS with ARGUMENTS and RETURN VALUE

import { z } from "zod";

type Flatten<T extends any[]> = {
  [K in keyof T]: T[K] extends any[] ? T[K][0] : T[K];
};

type WithoutRest<T> = T extends [infer U, ...infer H]
  ? Flatten<[U, WithoutRest<H>]>
  : unknown;

type X = WithoutRest<[z.ZodNumber, z.ZodString, ...unknown[]]>;

/* Define a type that accepts a PROMISE-style function,
 * and returns a CALLBACK style function, with typed args ...
 */
function _js_function<
  TArgs extends [z.ZodTypeAny, ...z.ZodTypeAny[]],
  TResult extends z.ZodTypeAny = z.ZodVoid
>(_input: TArgs, _output?: TResult) {
  return z
    .function()
    .args(...[..._input, z.function().args(z.any(), _output ?? z.undefined())]);
}

export default _js_function;
