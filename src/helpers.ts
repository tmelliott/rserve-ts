import { z } from "zod";
import Robj from "./types";

function as_vector(x: number[]): Float64Array;
function as_vector(x: string[]): string[] & { r_type: "string_array" };
function as_vector(x: string[] | number[]) {
  if (typeof x[0] === "number") {
    return new Float64Array(x as number[]);
  }
  const res: string[] & { r_type: "string_array" } = x as any;
  res.r_type = "string_array";
  return res;
}

const promisify =
  (func: Function) =>
  (...args: any[]) =>
    new Promise((resolve, reject) =>
      func(...args, (err: Error, result: any) =>
        err ? reject(err) : resolve(result)
      )
    );

// type ObjectWithDim = {
//   r_attributes: {
//     dim: number | z.infer<ReturnType<typeof Robj.integer>>;
//   };
// };

// const hasDim = (x: unknown): x is ObjectWithDim => {
//   if (!x) return false;
//   if (typeof x !== "object") return false;

//   if (x.hasOwnProperty("r_attributes")) {
//     return (x as ObjectWithDim).r_attributes.dim == undefined;
//   }
//   return false;
// };

// function to_array(x: ObjectWithDim) {
//   const d = x.r_attributes.dim;
//   if (typeof d === "number") {
//     return x.map(v => v);
//   }
// }

export { as_vector, promisify };
