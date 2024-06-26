import { z } from "zod";

export const sexp = <
  TType extends string,
  TValue extends z.ZodTypeAny,
  TAttr extends z.ZodTypeAny,
  TJson extends z.ZodTypeAny
>(
  type: TType,
  value: TValue,
  attributes: TAttr,
  json: TJson
) => {
  return z.object({
    type: z.literal("sexp"),
    value: z.object({
      type: z.literal(type),
      value,
      attributes: z.optional(attributes),
      json: z.function().returns(json),
    }),
  });
};

// type WithType<V, T extends string> = V & { r_type: T };

export const numeric = (attr?: z.ZodTypeAny) =>
  sexp(
    "double_array",
    z.instanceof(Float64Array),
    attr ?? z.any(),
    z.union([
      z.number(),
      z
        .instanceof(Float64Array)
        .and(
          z.object({ r_type: z.literal("double_array"), r_attributes: z.any() })
        ),
    ])
  );

export const integer = (attr?: z.ZodTypeAny) =>
  sexp(
    "int_array",
    z.instanceof(Int32Array),
    attr ?? z.any(),
    z.union([
      z.number(),
      z.instanceof(Int32Array).and(
        z.object({
          r_type: z.literal("int_array"),
          r_attributes: z.any(),
        })
      ),
    ])
  );

export const character = (attr?: z.ZodTypeAny) =>
  sexp(
    "string_array",
    z.array(z.string()),
    attr ?? z.any(),
    z.union([
      z.string(),
      z
        .object({
          data: z.array(z.string()),
          r_type: z.literal("string_array"),
          r_attributes: z.any(),
        })
        .transform((x) => {
          const r: any = x.data;
          r.r_type = x.r_type;
          r.r_attributes = x.r_attributes;
          return r as string[] & { r_type: "string_array"; r_attributes: any };
        }),
    ])
  );
