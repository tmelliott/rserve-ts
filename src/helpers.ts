import { rtsDebug } from "./debug";
import { RServeError } from "./types";

function isNumArray(array: unknown[]): array is number[] {
  return typeof array[0] === "number";
}

function as_vector(x: number[]): Float64Array<ArrayBuffer>;
function as_vector(x: string[]): string[] & { r_type: "string_array" };
function as_vector(x: string[] | number[]) {
  if (isNumArray(x)) {
    return new Float64Array(x);
  }
  const res: string[] & { r_type: "string_array" } = x as any;
  res.r_type = "string_array";
  return res;
}

const promisify =
  (func: Function) =>
  (...args: any[]) => {
    rtsDebug("call", "OCAP call with", args.length, "args");
    return new Promise((resolve, reject) =>
      func(...args, (err: Error, result: any) => {
        if (err) {
          rtsDebug("call", "OCAP error:", err);
          reject(err);
        } else {
          rtsDebug("call", "OCAP result:", typeof result);
          resolve(result);
        }
      })
    );
  };

export { as_vector, promisify };

export function isRServeError(x: unknown): x is RServeError {
  return (
    typeof x === "object" &&
    Array.isArray(x) &&
    x.length === 2 &&
    typeof x[0] === "string" &&
    typeof x[1] === "number"
  );
}

export function cb<A extends any[], R>(fn: (...args: A) => Promise<R> | R) {
  return function (
    ...args: [...A, callback: (err: any, data?: R) => void]
  ): void {
    const c = args.pop() as (err: any, data?: R) => void;
    const a: A = args as any;

    Promise.resolve(fn(...a))
      .then((data) => c(null, data))
      .catch((err) => c(err));
  };
}
