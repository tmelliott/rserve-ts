import { z } from "zod";

export const sexp = <T extends z.ZodTypeAny>(json: T) => {
  return z.object({
    type: z.literal("sexp"),
    value: z.object({
      json: z.function().returns(json),
    }),
  });
};

const integerWithAttr = <T extends z.ZodTypeAny>(attr: T) =>
  z.union([
    z.number(),
    z
      .object({
        data: z.instanceof(Int32Array),
        r_type: z.literal("int_array"),
        r_attributes: attr,
      })
      .transform((x) => {
        const r: number[] & {
          r_type: "int_array";
          r_attributes: T extends z.ZodUndefined ? undefined : z.infer<T>;
        } = x.data as any;
        r.r_type = x.r_type;
        r.r_attributes = x.r_attributes as any;
        return r;
      }),
  ]);

type IntegerWithAttr<T extends z.ZodTypeAny> = ReturnType<
  typeof integerWithAttr<T>
>;
function integer(): IntegerWithAttr<z.ZodUnknown>;
function integer<T extends z.ZodRawShape>(
  attr: T
): IntegerWithAttr<z.ZodObject<T, "strip">>;
function integer(attr?: z.ZodRawShape) {
  if (attr) return integerWithAttr(z.object(attr));
  return integerWithAttr(z.unknown());
}

const numericWithAttr = <T extends z.ZodTypeAny>(attr: T) =>
  z.union([
    z.number(),
    z
      .object({
        data: z.instanceof(Float64Array),
        r_type: z.literal("double_array"),
        r_attributes: attr,
      })
      .transform((x) => {
        const r: number[] & {
          r_type: "double_array";
          r_attributes: T extends z.ZodUndefined ? undefined : z.infer<T>;
        } = x.data as any;
        r.r_type = x.r_type;
        r.r_attributes = x.r_attributes as any;
        return r;
      }),
  ]);
type NumericWithAttr<T extends z.ZodTypeAny> = ReturnType<
  typeof numericWithAttr<T>
>;
function numeric(): NumericWithAttr<z.ZodUnknown>;
function numeric<T extends z.ZodRawShape>(
  attr: T
): NumericWithAttr<z.ZodObject<T, "strip">>;
function numeric(attr?: z.ZodRawShape) {
  if (attr) return numericWithAttr(z.object(attr));
  return numericWithAttr(z.unknown());
}

const characterWithAttr = <T extends z.ZodTypeAny>(attr: T) =>
  z.union([
    z.string(),
    z
      .object({
        data: z.array(z.string()),
        r_type: z.literal("string_array"),
        r_attributes: attr,
      })
      .transform((x) => {
        const r: string[] & {
          r_type: "string_array";
          r_attributes: T extends z.ZodUndefined ? undefined : z.infer<T>;
        } = x.data as any;
        r.r_type = x.r_type;
        r.r_attributes = x.r_attributes as any;
        return r;
      }),
  ]);
type CharacterWithAttr<T extends z.ZodTypeAny> = ReturnType<
  typeof characterWithAttr<T>
>;
function character(): CharacterWithAttr<z.ZodUnknown>;
function character<T extends z.ZodRawShape>(
  attr: T
): CharacterWithAttr<z.ZodObject<T, "strip">>;
function character(attr?: z.ZodRawShape) {
  if (attr) return characterWithAttr(z.object(attr));
  return characterWithAttr(z.unknown());
}

export { integer, numeric, character };
