import { z } from "zod";

export type Attributes = any; // tagged_list, when we get there

export const typeWithAttributes = <
  Z extends z.ZodTypeAny,
  R extends string,
  A extends Attributes
>(
  ztype: Z,
  rtype: R,
  attr?: A
) => {
  return z.custom<z.infer<Z> & { r_type: R; r_attributes: A }>((data) => {
    if (typeof data === "object" && data.hasOwnProperty("r_type")) {
      return data.r_type === rtype;
    }
    return false;
  });
};

const withAttributes = <T, RType extends string, Attr extends Attributes>(
  type: z.ZodType<T>,
  r_type: RType,
  attributes?: Attr
) => {
  return z.custom<T & { r_type: RType; r_attributes: Attr }>((data) => {
    if (
      typeof data === "object" &&
      data.hasOwnProperty("r_type") &&
      data.r_type === r_type &&
      (attributes === undefined || data.hasOwnProperty("r_attributes"))
    ) {
      return true;
    }
    return false;
  });
};
export type WithAttributes<
  T,
  RType extends string,
  Attr extends Attributes = Attributes
> = z.ZodType<T & { r_type: RType; r_attributes: Attr }>;

export const object = <
  TSingular extends z.ZodTypeAny,
  TPlural extends z.ZodTypeAny,
  TString extends string
>(
  singular: TSingular,
  plural: TPlural,
  type: TString
) => {
  function fun(): TSingular | WithAttributes<z.infer<typeof plural>, TString>;
  function fun<N extends 1>(n: N): TSingular;
  function fun<N extends Exclude<number, 1>>(
    n: N
  ): WithAttributes<z.infer<typeof plural>, TString>;
  function fun<A extends Attributes>(
    a: A
  ): WithAttributes<z.infer<typeof plural>, TString, A>;
  function fun(x?: number | Attributes) {
    if (x === undefined) {
      return z.union([singular, plural]);
    }
    if (typeof x === "number") {
      return x === 1 ? singular : withAttributes(plural, type);
    }
    return withAttributes(plural, type, x);
  }
  return fun;
};

export const objectWithAttributes = <T, S extends string, A extends {}>(
  x: T,
  type: S,
  attr?: A
): T & { r_type: S; r_attributes: A } => {
  const res = x as any;
  res.r_type = type;
  res.r_attributes = attr;
  return res;
};
