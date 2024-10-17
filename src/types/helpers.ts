import { z } from "zod";

export type Attributes = z.ZodRawShape; // tagged_list, when we get there

export const typeWithAttributes = <
  Z extends z.ZodTypeAny,
  R extends string,
  A extends Attributes
>(
  ztype: Z,
  rtype: R,
  attr?: A
) => {
  return z.custom<
    z.infer<Z> & { r_type: R; r_attributes: z.infer<z.ZodObject<A>> }
  >((data) => {
    if (typeof data === "object" && data.hasOwnProperty("r_type")) {
      return data.r_type === rtype;
    }
    return false;
  });
};

type Unify<T> = {} & {
  [K in keyof T]: T[K] extends object ? Unify<T[K]> : T[K];
};

const withAttributes = <T, RType extends string, Attr extends Attributes>(
  type: z.ZodType<T>,
  r_type: RType,
  attributes?: Attr
) => {
  return z.custom<
    T & {
      r_type: RType;
      r_attributes: Unify<
        z.infer<z.ZodObject<Attr>> & {
          [K in string]: any;
        }
      >;
    }
  >((data) => {
    if (
      typeof data === "object" &&
      data.hasOwnProperty("r_type") &&
      data.r_type === r_type &&
      (attributes === undefined || data.hasOwnProperty("r_attributes"))
    ) {
      if (attributes === undefined) {
        return true;
      }
      const attr = z.object(attributes).safeParse(data.r_attributes);
      return attr.success;
    }
    return false;
  });
};
export type WithAttributes<
  T,
  RType extends string,
  Attr extends Attributes = Attributes
> = z.ZodType<
  T & {
    r_type: RType;
    r_attributes: Unify<
      z.infer<z.ZodObject<Attr>> & {
        [K in string]: any;
      }
    >;
  }
>;

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

export type ObjectWithAttributes<
  T,
  S extends string,
  A extends {} | undefined = undefined
> = T & {
  r_type: S;
  r_attributes: A extends undefined
    ? {
        [K in string]: any;
      }
    : Unify<
        (A extends z.ZodRawShape ? z.infer<z.ZodObject<A>> : A) & {
          [K in string]: any;
        }
      >;
};
export const objectWithAttributes = <
  T,
  S extends string,
  A extends {} | undefined = undefined
>(
  x: T,
  type: S,
  attr?: A
): ObjectWithAttributes<T, S, A> => {
  const res = x as any;
  res.r_type = type;
  res.r_attributes = attr;
  return res;
};
