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

export { as_vector };
