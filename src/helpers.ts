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
  (...args: any[]) =>
    new Promise((resolve, reject) =>
      func(...args, (err: Error, result: any) =>
        err ? reject(err) : resolve(result)
      )
    );

export { as_vector, promisify };
