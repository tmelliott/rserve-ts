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
      console.log("-- checking object: ");
      console.log(data);
      if (data.r_type !== rtype) return false;
      if (attr) {
        // console.log("Checking attributes");
        if (!data.hasOwnProperty("r_attributes")) return false;
        // map over attributes keys
        let attrOk = false;
        Object.fromEntries(
          Object.keys(attr).map((k) => attr[k].parse(data.r_attributes[k]))
        );
      }
      // now check the object itself
      let obj: z.infer<Z>;
      if (Array.isArray(data)) {
        // console.log("Checking array: ");
        obj = ztype.parse(data);
      } else {
        // console.log("Checking object: ");
        const { r_type, r_attributes, ...d } = data;
        // console.log(d);
        obj = ztype.parse(d);
      }
      // console.log(obj);
      return true;
    } else {
      // console.log("-- checking non-object: ");
    }

    return false;
  });
};

export type UnifyOne<T> = {} & {
  [K in keyof T]: T[K];
};
export type Unify<T> = {} & {
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
  function fun<N extends 1>(n: N): TSingular;
  function fun<N extends Exclude<number, 1>>(
    n: N
  ): WithAttributes<z.infer<typeof plural>, TString>;
  function fun<A extends Attributes>(
    a: A
  ): WithAttributes<z.infer<typeof plural>, TString, A>;
  function fun(): TSingular | WithAttributes<z.infer<typeof plural>, TString>;
  function fun(x?: number | Attributes) {
    if (x === undefined) {
      return z.union([singular, withAttributes(plural, type)]);
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
  if (attr) {
    res.r_attributes = attr;
  }
  return res;
};

export function clearAttrs<
  const T extends { r_type?: string; r_attributes?: any; levels?: any }
>(x: T) {
  const res = JSON.parse(JSON.stringify(x));
  if (typeof res !== "object") return res;
  if (res.hasOwnProperty("r_type")) delete res.r_type;
  if (res.hasOwnProperty("r_attributes")) delete res.r_attributes;
  if (res.hasOwnProperty("levels")) delete res.levels;
  return res as Exclude<T, "r_type" | "r_attributes" | "levels">;
}
