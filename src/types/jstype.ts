// define an INPUT TYPE that is a JAVASCRIPT FUNCTIONS with ARGUMENTS and RETURN VALUE

import { callbackify } from "util";
import { z } from "zod";

type Flatten<T extends any[]> = {
  [K in keyof T]: T[K] extends any[] ? T[K][0] : T[K];
};
type InferArray<T> = T extends [infer U, ...infer H]
  ? Flatten<[U extends z.ZodTypeAny ? z.infer<U> : U, InferArray<H>]>
  : unknown;

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
  // type RArgs = InferArray<TArgs>;
  // type RResult = z.infer<TResult>;

  // type Args = [...RArgs, ];

  return z
    .function()
    .args(...[..._input, z.function().args(z.any(), _output ?? z.undefined())]);
  // .returns(z.promise(_output ?? z.void()));
  // .transform(
  //   (f) =>
  //     callbackify(f) as (
  //       ...args: {
  //         [K in keyof TArgs]: z.infer<TArgs[K]>;
  //       } & {
  //         callback: (err: any, data?: z.infer<TResult>) => void;
  //       }
  //     ) => void
  // );

  //     promisify(f) as (
  //   ...args: {
  //     [K in keyof TArgs]: z.infer<TArgs[K]>;
  //   }
  // ) => Promise<z.infer<TRes>>

  // const f =
  //   (f: (...args: RArgs) => Promise<RResult>) =>
  //   (...args: [...RArgs, (err: any, res?: RResult) => void]) => {
  //     const k = args.pop() as (err: any, res?: RResult) => void;
  //     if (typeof k !== "function") throw new Error("Bad callback");
  //     const rest = args.filter((a) => typeof a !== "function") as RArgs;
  //     f.apply(null, rest).then(
  //       (res) => k(null, res),
  //       (err) => k(err)
  //     );
  //   };

  // const cb = z.function().args(z.any(), _output ?? z.void());
  // return z.function().args(...[..._input, cb]);

  // .returns(z.promise(_output ?? z.void()))
  // .transform((x) => callbackify(x) as unknown as CB);
}

export default _js_function;
